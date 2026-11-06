import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { emptyAudience } from '../shared/audience'
import { createSqlBackend, TABLES, type Sql } from './mysql'
import { createStore } from './store'

type Row = Record<string, unknown>

/** MySQL tiruan: menyimpan baris per tabel dan memahami hanya bentuk perintah yang dipakai createSqlBackend. */
const fakeDb = () => {
  const tables = new Map<string, Map<string, Row>>()
  const log: string[] = []
  const tbl = (name: string) => tables.get(name) ?? tables.set(name, new Map()).get(name)!
  const keys = (name: string) => TABLES.find((t) => t.name === name)!.keys
  const query: Sql['query'] = async (sql, values = []) => {
    log.push(sql)
    let m: RegExpExecArray | null
    if ((m = /^SELECT \* FROM `(\w+)`/.exec(sql))) return [...tbl(m[1]).values()].map((r) => ({ ...r }))
    if ((m = /^INSERT INTO `(\w+)` \((.*?)\) VALUES \?/.exec(sql))) {
      const cols = m[2].split(',').map((c) => c.replaceAll('`', ''))
      for (const row of values[0] as unknown[][]) tbl(m[1]).set(JSON.stringify(row.slice(0, keys(m[1]))), Object.fromEntries(cols.map((c, i) => [c, row[i]])))
      return []
    }
    if ((m = /^DELETE FROM `(\w+)` WHERE/.exec(sql))) {
      const k = keys(m[1])
      for (const key of values[0] as unknown[]) {
        const id = JSON.stringify(k === 1 ? [key] : key)
        tbl(m[1]).delete(id)
        if (m[1] === 'reports') for (const [mk, r] of tbl('metrics')) if (r.report_id === (key as string)) tbl('metrics').delete(mk) // ON DELETE CASCADE
      }
      return []
    }
    throw new Error(`perintah tak dikenal: ${sql}`)
  }
  const sql: Sql = { query, transaction: (fn) => fn(query) }
  return { sql, tables, log }
}

/** Baca database/lastdance.sql (hasil mysqldump asli) ke tabel tiruan: nama kolom dari CREATE TABLE, nilai dari INSERT. */
function loadDump(db: ReturnType<typeof fakeDb>) {
  const text = fs.readFileSync(path.join(import.meta.dirname, '..', 'database', 'lastdance.sql'), 'utf8')
  const cols = new Map<string, string[]>()
  for (const m of text.matchAll(/CREATE TABLE `(\w+)` \(([\s\S]*?)\) ENGINE/g)) cols.set(m[1], [...m[2].matchAll(/^\s+`(\w+)` /gm)].map((c) => c[1]))
  const esc: Record<string, string> = { n: '\n', r: '\r', t: '\t', '0': '\0', Z: '\x1a' }
  for (const m of text.matchAll(/INSERT INTO `(\w+)` VALUES\n([\s\S]*?);\n/g)) {
    const name = m[1]
    const body = m[2]
    let i = 0
    const rows: unknown[][] = []
    while (i < body.length) {
      if (body[i] !== '(') { i++; continue }
      i++
      const row: unknown[] = []
      for (;;) {
        if (body[i] === "'") {
          let v = ''
          i++
          while (body[i] !== "'" || body[i + 1] === "'") {
            if (body[i] === '\\') { v += esc[body[i + 1]] ?? body[i + 1]; i += 2 }
            else if (body[i] === "'") { v += "'"; i += 2 }
            else v += body[i++]
          }
          i++
          row.push(v)
        } else {
          const e = body.slice(i).search(/[,)]/)
          const tok = body.slice(i, i + e)
          row.push(tok === 'NULL' ? null : Number(tok))
          i += e
        }
        if (body[i] === ',') { i++; continue }
        i++ // ')'
        break
      }
      rows.push(row)
    }
    const c = cols.get(name)!
    const k = TABLES.find((t) => t.name === name)!.keys
    const t = db.tables.get(name) ?? db.tables.set(name, new Map()).get(name)!
    for (const r of rows) t.set(JSON.stringify(r.slice(0, k)), Object.fromEntries(c.map((n, j) => [n, r[j]])))
  }
}
const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'iga-sql-'))

describe('MySQL sebagai database', () => {
  it('membaca database/lastdance.sql asli dengan lengkap', async () => {
    const db = fakeDb()
    loadDump(db)
    const d = await createStore(dir(), undefined, undefined, createSqlBackend(db.sql)).read()
    expect([d.users.length, d.reports.length, d.contents.length, d.ads.length, d.reservations.length, d.maps.length, d.web.length, d.wa.length, d.audit.length]).toEqual([5, 24, 15, 23, 13, 2, 3, 1, 83])
    expect(d.users.map((u) => u.username).sort()).toEqual(['abim', 'billa', 'jessee', 'kin', 'simar'])
    const r = d.reports.find((x) => x.report_id === '0aed47de-a092-4fa1-86ed-c32645ac7a4b')!
    expect(r).toMatchObject({ account: 'homecare', platform: 'instagram', period_start: '2026-10-22', period_end: '2026-10-28', recorded_at: '2026-10-29', snapshot_date: '2026-10-29' })
    expect(r.metrics.budget).toBe(50000)
    expect(r.metrics.comments).toBeNull()
    expect(r.audience.cities[0]).toEqual({ name: 'Bandar Lampung', pct: 47.5 })
    expect(d.settings.account_name).toBe('Jessee')
    expect(d.reports.reduce((t, x) => t + Object.values(x.metrics).filter((v) => v != null).length, 0)).toBeGreaterThan(100)
    expect(d.web.find((w) => w.site === 'klinik')!.pages.length).toBeGreaterThan(0)
  })

  it('menulis balik tanpa mengubah data: tidak ada perintah tulis', async () => {
    const db = fakeDb()
    loadDump(db)
    const store = createStore(dir(), undefined, undefined, createSqlBackend(db.sql))
    await store.mutate(() => {})
    expect(db.log.filter((l) => /^(INSERT|DELETE)/.test(l))).toEqual([])
  })

  it('hanya baris yang berubah yang ditulis; hapus laporan ikut menghapus metriknya', async () => {
    const db = fakeDb()
    loadDump(db)
    const store = createStore(dir(), undefined, undefined, createSqlBackend(db.sql))
    const id = '0aed47de-a092-4fa1-86ed-c32645ac7a4b'
    await store.mutate((d) => { d.reports.find((r) => r.report_id === id)!.notes = 'catatan baru' })
    expect(db.log.filter((l) => /^INSERT/.test(l)).map((l) => /INTO `(\w+)`/.exec(l)![1])).toEqual(['reports'])
    expect(db.tables.get('reports')!.get(JSON.stringify([id]))!.notes).toBe('catatan baru')
    const before = db.tables.get('metrics')!.size
    await store.mutate((d) => { d.reports = d.reports.filter((r) => r.report_id !== id) })
    expect(db.tables.get('reports')!.size).toBe(23)
    expect(db.tables.get('metrics')!.size).toBe(before - 30)
  })

  it('database kosong: data baru tersimpan lalu terbaca oleh instance lain', async () => {
    const db = fakeDb()
    const a = createStore(dir(), undefined, undefined, createSqlBackend(db.sql))
    await a.mutate((d) => {
      d.users.push({ user_id: 'u1', username: 'admin', role: 'admin', password_hash: 'h', created_at: '2026-11-05T10:00:00.123Z' })
      d.reports.push({ report_id: 'r1', account: 'klinik', platform: 'tiktok', period_start: '2026-10-22', period_end: '2026-10-28', recorded_at: '2026-10-29', notes: 'x', status: 'valid', audience: emptyAudience(), snapshot_date: '2026-10-29', metrics: { views: 5, followers: 9 } } as never)
      d.settings.account_name = 'Tes'
    })
    const back = await createStore(dir(), undefined, undefined, createSqlBackend(db.sql)).read()
    expect(back.users[0]).toMatchObject({ username: 'admin', role: 'admin', created_at: '2026-11-05T10:00:00.123Z' })
    expect(back.reports[0]).toMatchObject({ platform: 'tiktok', snapshot_date: '2026-10-29' })
    expect(back.reports[0].metrics.views).toBe(5)
    expect(back.reports[0].metrics.followers).toBe(9)
    expect(back.settings.account_name).toBe('Tes')
  })
})
