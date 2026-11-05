/**
 * Impor data dari Google Sheets (atau file .xlsx hasil ekspornya) ke MySQL.
 *
 * Contoh:
 *   DATABASE_URL=mysql://user:pass@host/lastdance npm run db:import -- "https://docs.google.com/spreadsheets/d/<ID>/edit"
 *   DATABASE_URL=mysql://user:pass@host/lastdance npm run db:import -- ./data/instagram_analytics.xlsx
 *
 * Default: tabel dikosongkan dulu (migrasi bersih). Tambahkan --append untuk menambah tanpa menghapus.
 */
import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { HEADERS, fromSheets, type Data } from '../server/store'
import { createMysqlPool, createMysqlStore, writeAll } from '../server/mysql'

const url = process.env.DATABASE_URL
const args = process.argv.slice(2)
const append = args.includes('--append')
const source = args.find((a) => !a.startsWith('--'))
if (!url || !source) {
  console.error('Pemakaian: DATABASE_URL=mysql://... npm run db:import -- <url-google-sheets | file.xlsx> [--append]')
  process.exit(1)
}

const TABLES = ['metrics', 'reports', 'contents', 'summary', 'activities', 'influencers', 'ads', 'reservations', 'maps', 'website', 'whatsapp', 'audit_log', 'settings', 'users']

async function localFile(): Promise<{ file: string; cleanup: boolean }> {
  if (!/^https?:/i.test(source)) return { file: source, cleanup: false }
  const m = /spreadsheets\/d\/([\w-]+)/.exec(source)
  if (!m) throw new Error('URL Google Sheets tidak dikenali.')
  const dl = `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=xlsx`
  console.log('Mengunduh', dl)
  const res = await fetch(dl, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Gagal mengunduh spreadsheet (HTTP ${res.status}). Pastikan akses "Anyone with the link".`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.subarray(0, 2).toString() !== 'PK') throw new Error('Berkas yang diunduh bukan .xlsx (mungkin perlu login).')
  const file = path.join(os.tmpdir(), `lastdance-import-${Date.now()}.xlsx`)
  await fs.writeFile(file, buf)
  return { file, cleanup: true }
}

const { file, cleanup } = await localFile()
const wb = new ExcelJS.Workbook()
await wb.xlsx.readFile(file)

const missing = Object.keys(HEADERS).filter((n) => !wb.getWorksheet(n))
if (missing.length) {
  console.error('Sheet berikut tidak ada di sumber:', missing.join(', '))
  if (cleanup) await fs.rm(file, { force: true })
  process.exit(1)
}

const cell = (v: ExcelJS.CellValue) => (v == null ? '' : v)
const rowsOf = (name: string) => {
  const ws = wb.getWorksheet(name)!
  const out: ExcelJS.CellValue[][] = []
  ws.eachRow((row, i) => {
    if (i > 1) out.push(HEADERS[name as keyof typeof HEADERS].map((_, c) => cell(row.getCell(c + 1).value)))
  })
  return out
}
const data = fromSheets(rowsOf)

// Laporan dengan akun+platform+periode sama: sumber angka ganda, dilaporkan (tidak dihapus otomatis).
const dupes = new Map<string, number>()
for (const r of data.reports) {
  if (r.status === 'archived') continue
  const k = `${r.account}/${r.platform}/${r.period_start}..${r.period_end}`
  dupes.set(k, (dupes.get(k) ?? 0) + 1)
}

const pool = createMysqlPool(url, process.env.DATABASE_SSL === '1')

/** Ringkasan perubahan: apa yang baru, berubah, dan hilang dari sumber. */
const COLLECTIONS: [string, (d: unknown) => unknown[], string][] = [
  ['reports', (d) => (d as { reports: unknown[] }).reports, 'report_id'],
  ['contents', (d) => (d as { contents: unknown[] }).contents, 'content_id'],
  ['ads', (d) => (d as { ads: unknown[] }).ads, 'ad_id'],
  ['reservations', (d) => (d as { reservations: unknown[] }).reservations, 'reservation_id'],
  ['maps', (d) => (d as { maps: unknown[] }).maps, 'map_id'],
  ['website', (d) => (d as { web: unknown[] }).web, 'web_id'],
  ['whatsapp', (d) => (d as { wa: unknown[] }).wa, 'wa_id'],
  ['audit_log', (d) => (d as { audit: unknown[] }).audit, 'change_id'],
  ['users', (d) => (d as { users: unknown[] }).users, 'user_id'],
  ['summary', (d) => (d as { summary: unknown[] }).summary, 'item_id'],
  ['activities', (d) => (d as { activities: unknown[] }).activities, 'activity_id'],
  ['influencers', (d) => (d as { influencers: unknown[] }).influencers, 'influencer_id'],
]

/** JSON dengan urutan kunci tetap: urutan kunci objek tidak boleh dianggap "data berubah". */
const canon = (v: unknown) =>
  JSON.stringify(v, (_k, val) =>
    val && typeof val === 'object' && !Array.isArray(val)
      ? Object.fromEntries(Object.entries(val as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : val,
  )

function diff(before: Data, after: Data) {
  const lines: string[] = []
  for (const [name, pick, pk] of COLLECTIONS) {
    const old = new Map(pick(before).map((r) => [String((r as Record<string, unknown>)[pk]), canon(r)]))
    const now = new Map(pick(after).map((r) => [String((r as Record<string, unknown>)[pk]), canon(r)]))
    const added = [...now.keys()].filter((k) => !old.has(k)).length
    const changed = [...now.keys()].filter((k) => old.has(k) && old.get(k) !== now.get(k)).length
    const removed = [...old.keys()].filter((k) => !now.has(k)).length
    if (added || changed || removed) lines.push(`  ${name.padEnd(13)} +${added} baru · ${changed} berubah · ${removed} hilang`)
  }
  return lines
}

try {
  if (!append) {
    const conn = await pool.getConnection()
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS = 0')
      for (const t of TABLES) await conn.query(`TRUNCATE TABLE ${t}`)
      await conn.query('SET FOREIGN_KEY_CHECKS = 1')
    } finally {
      conn.release()
    }
    console.log('Tabel dikosongkan (mode migrasi).')
  }
  // Mode --append: baca kondisi sekarang dulu supaya bisa melaporkan apa yang berubah.
  const before = append ? await createMysqlStore(pool, { dir: '/tmp/lastdance-import' }).read() : null
  await writeAll(pool, data)

  for (const t of TABLES) {
    const [r] = await pool.query(`SELECT COUNT(*) AS n FROM ${t}`)
    console.log(`  ${t.padEnd(14)} ${String((r as { n: number }[])[0].n).padStart(6)} baris`)
  }
  const [m] = await pool.query('SELECT COUNT(value) AS terisi, COUNT(*) AS total FROM metrics')
  const mm = (m as { terisi: number; total: number }[])[0]
  console.log(`  metrik terisi  ${mm.terisi}/${mm.total}`)

  if (before) {
    const changes = diff(before, data)
    console.log(changes.length ? '\nPerubahan dari sumber:' : '\nTidak ada perubahan: database sudah sama dengan spreadsheet.')
    for (const line of changes) console.log(line)
  }

  const dup = [...dupes].filter(([, n]) => n > 1)
  if (dup.length) {
    console.log('\nPerhatian — laporan dobel (akun/platform/periode sama):')
    for (const [k, n] of dup) console.log(`  ${k} → ${n} laporan`)
  }
  console.log('\nImpor selesai.')
} catch (e) {
  console.error('Impor gagal:', (e as Error).message)
  process.exitCode = 1
} finally {
  await pool.end()
  if (cleanup) await fs.rm(file, { force: true })
}
