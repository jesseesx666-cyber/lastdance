/**
 * Penyimpanan berbasis SQL (MySQL 8 / MariaDB) sebagai pengganti Google Sheets.
 *
 * Bentuk data di memori tetap sama seperti sebelumnya (`Data` + `Report`), jadi seluruh
 * rute API, analitik, dan halaman tidak perlu diubah: hanya lapisan penyimpanan ini
 * yang membaca/menulis ke tabel SQL.
 *
 * Semua penulisan berjalan dalam satu transaksi dengan kunci `GET_LOCK`, sehingga dua
 * proses yang menyimpan bersamaan tidak saling menimpa (masalah utama Google Sheets).
 */
import mysql, { type Pool, type PoolConnection } from 'mysql2/promise'
import ExcelJS from 'exceljs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { audienceSchema, emptyAudience } from '../shared/audience'
import { METRIC_KEYS, type MetricKey, type Report, type ReportStatus } from '../shared/metrics'
import { DEFAULT_ACCOUNT, type AccountId } from '../shared/accounts'
import { DEFAULT_PLATFORM, type PlatformId } from '../shared/platforms'
import { HEADERS, StoreError, createThumbs, emptyData, toSheets, type Data, type ThumbBackend } from './store'

type Row = Record<string, unknown>

interface TableDef {
  name: string
  pk: string
  cols: string[]
  /** Kolom JSON: nilainya di-JSON.stringify saat menulis, di-parse saat membaca. */
  json?: string[]
  get: (d: Data) => unknown[]
}

const TABLES: TableDef[] = [
  { name: 'users', pk: 'user_id', cols: ['user_id', 'username', 'role', 'password_hash', 'created_at'], get: (d) => d.users },
  {
    name: 'settings', pk: 'setting_key', cols: ['setting_key', 'value'],
    get: (d) => Object.entries(d.settings).map(([setting_key, value]) => ({ setting_key, value })),
  },
  {
    name: 'reports', pk: 'report_id',
    cols: ['report_id', 'account', 'platform', 'period_start', 'period_end', 'recorded_at', 'notes', 'status', 'audience', 'snapshot_date'],
    json: ['audience'],
    get: (d) => d.reports,
  },
  {
    name: 'metrics', pk: 'metric_key', cols: ['report_id', 'metric_key', 'value'],
    get: (d) => d.reports.flatMap((r) => METRIC_KEYS.map((k) => ({ report_id: r.report_id, metric_key: k, value: r.metrics[k] }))),
  },
  {
    name: 'contents', pk: 'content_id',
    cols: ['content_id', 'account', 'platform', 'section', 'url', 'thumbnail', 'title', 'views', 'likes', 'interactions', 'period_start', 'period_end'],
    get: (d) => d.contents,
  },
  { name: 'summary', pk: 'item_id', cols: ['item_id', 'kind', 'text', 'period_start', 'period_end', 'created_at'], get: (d) => d.summary },
  { name: 'activities', pk: 'activity_id', cols: ['activity_id', 'name', 'date_text', 'note', 'period_start', 'period_end', 'created_at'], get: (d) => d.activities },
  { name: 'influencers', pk: 'influencer_id', cols: ['influencer_id', 'name', 'handle', 'followers', 'note', 'created_at'], get: (d) => d.influencers },
  { name: 'ads', pk: 'ad_id', cols: ['ad_id', 'account', 'image', 'created_at'], get: (d) => d.ads },
  { name: 'reservations', pk: 'reservation_id', cols: ['reservation_id', 'kind', 'name', 'count', 'period_start', 'period_end', 'created_at'], get: (d) => d.reservations },
  { name: 'maps', pk: 'map_id', cols: ['map_id', 'account', 'period_start', 'period_end', 'images', 's1', 's2', 's3', 's4', 's5', 'created_at'], json: ['images'], get: (d) => d.maps },
  {
    name: 'website', pk: 'web_id',
    cols: ['web_id', 'site', 'period_start', 'period_end', 'images', 'visitors', 'views', 'pages', 'articles', 'referrers', 'created_at'],
    json: ['images', 'pages', 'articles', 'referrers'],
    get: (d) => d.web,
  },
  {
    name: 'whatsapp', pk: 'wa_id',
    cols: ['wa_id', 'period_start', 'period_end', 'chats_in', 'saved_contacts', 'sw_views', 'uploaded_contacts', 'top_chats', 'reservations', 'unavailable', 'images', 'created_at'],
    json: ['top_chats', 'reservations', 'unavailable', 'images'],
    get: (d) => d.wa,
  },
  { name: 'audit_log', pk: 'change_id', cols: ['change_id', 'report_id', 'changed_at', 'action', 'before_json', 'after_json'], get: (d) => d.audit },
]

/** Kunci baris untuk diff: metrics memakai (report_id, metric_key). */
const rowKey = (t: TableDef, row: unknown) =>
  t.pk === 'metric_key'
    ? `${(row as Row).report_id}|${(row as Row).metric_key}`
    : String((row as Row)[t.pk])

const asJson = (v: unknown): unknown => {
  if (typeof v !== 'string') return v
  try {
    return JSON.parse(v)
  } catch {
    return null
  }
}
/** DATETIME MySQL ('2026-11-05 09:50:40.714') -> ISO yang dipakai aplikasi. */
const toIso = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2} /.test(v) ? v.replace(' ', 'T') + 'Z' : v)
const isoOrNull = (v: unknown) => (v == null || v === '' ? null : toIso(v))

/** ISO ('2026-11-04T02:00:29.641Z') -> format DATETIME MySQL ('2026-11-04 02:00:29.641'). */
const toMysqlTs = (v: unknown) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v) ? v.replace('T', ' ').replace(/\.?Z$/, '') : v

function valuesFor(t: TableDef, row: Row): unknown[] {
  return t.cols.map((c) => {
    const v = row[c]
    if (v === undefined) return null
    if (t.json?.includes(c)) return v == null ? null : JSON.stringify(v)
    return toMysqlTs(v)
  })
}

function toReport(r: Row): Report {
  const parsed = audienceSchema.safeParse(asJson(r.audience))
  return {
    report_id: String(r.report_id),
    account: String(r.account ?? DEFAULT_ACCOUNT) as AccountId,
    platform: String(r.platform ?? DEFAULT_PLATFORM) as PlatformId,
    period_start: String(r.period_start),
    period_end: String(r.period_end),
    recorded_at: String(r.recorded_at),
    notes: String(r.notes ?? ''),
    status: String(r.status ?? 'valid') as ReportStatus,
    audience: parsed.success ? parsed.data : emptyAudience(),
    metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, null])) as Record<MetricKey, number | null>,
    snapshot_date: r.snapshot_date ? String(r.snapshot_date) : null,
  }
}

type Queryable = Pick<PoolConnection, 'query'>

const rows = async <T = Row>(q: Queryable, sql: string, params: unknown[] = []): Promise<T[]> => {
  const [result] = await q.query(sql, params)
  return result as T[]
}

/** Baca seluruh isi database menjadi `Data` + sidik baris (untuk diff saat menyimpan). */
async function loadData(q: Queryable): Promise<{ data: Data; base: Map<string, Map<string, string>> }> {
  const data = emptyData()
  const base = new Map<string, Map<string, string>>()

  const users = await rows(q, 'SELECT user_id, username, role, password_hash, created_at FROM users ORDER BY created_at')
  data.users = users.map((r) => ({
    user_id: String(r.user_id), username: String(r.username),
    role: r.role === 'admin' ? 'admin' : 'user',
    password_hash: String(r.password_hash), created_at: String(toIso(r.created_at)),
  }))

  const settings = await rows(q, 'SELECT setting_key, value FROM settings ORDER BY setting_key')
  data.settings = Object.fromEntries(settings.map((r) => [String(r.setting_key), String(r.value)]))

  const reports = await rows(q, 'SELECT * FROM reports ORDER BY period_start')
  data.reports = reports.map(toReport)
  const byId = new Map(data.reports.map((r) => [r.report_id, r]))

  const metrics = await rows(q, 'SELECT report_id, metric_key, value FROM metrics')
  for (const r of metrics) {
    const rep = byId.get(String(r.report_id))
    const key = String(r.metric_key)
    if (rep && (METRIC_KEYS as readonly string[]).includes(key))
      rep.metrics[key as MetricKey] = r.value == null ? null : Number(r.value)
  }

  const contents = await rows(q, 'SELECT * FROM contents ORDER BY period_start')
  data.contents = contents.map((r) => ({
    content_id: String(r.content_id), account: String(r.account) as Data['contents'][number]['account'],
    platform: String(r.platform) as Data['contents'][number]['platform'],
    section: r.section === 'endorsement' ? 'endorsement' : 'top',
    url: String(r.url), thumbnail: String(r.thumbnail), title: String(r.title),
    views: Number(r.views), likes: Number(r.likes), interactions: Number(r.interactions),
    period_start: String(r.period_start), period_end: String(r.period_end),
  }))

  data.summary = (await rows(q, 'SELECT * FROM summary ORDER BY period_start')).map((r) => ({
    item_id: String(r.item_id), kind: r.kind as Data['summary'][number]['kind'], text: String(r.text),
    period_start: String(r.period_start), period_end: String(r.period_end), created_at: String(toIso(r.created_at)),
  }))

  data.activities = (await rows(q, 'SELECT * FROM activities ORDER BY period_start')).map((r) => ({
    activity_id: String(r.activity_id), name: String(r.name), date_text: String(r.date_text), note: String(r.note),
    period_start: String(r.period_start), period_end: String(r.period_end), created_at: String(toIso(r.created_at)),
  }))

  data.influencers = (await rows(q, 'SELECT * FROM influencers ORDER BY created_at')).map((r) => ({
    influencer_id: String(r.influencer_id), name: String(r.name), handle: String(r.handle),
    followers: r.followers == null ? null : Number(r.followers), note: String(r.note),
    created_at: String(toIso(r.created_at)),
  }))

  data.ads = (await rows(q, 'SELECT * FROM ads ORDER BY created_at')).map((r) => ({
    ad_id: String(r.ad_id), account: String(r.account), image: String(r.image), created_at: String(toIso(r.created_at)),
  }))

  data.reservations = (await rows(q, 'SELECT * FROM reservations ORDER BY period_start')).map((r) => ({
    reservation_id: String(r.reservation_id), kind: r.kind as Data['reservations'][number]['kind'],
    name: String(r.name), count: Number(r.count),
    period_start: String(r.period_start), period_end: String(r.period_end), created_at: String(toIso(r.created_at)),
  }))

  data.maps = (await rows(q, 'SELECT * FROM maps ORDER BY period_start')).map((r) => ({
    map_id: String(r.map_id), account: r.account as Data['maps'][number]['account'],
    period_start: String(r.period_start), period_end: String(r.period_end),
    images: (asJson(r.images) ?? []) as string[],
    s1: Number(r.s1), s2: Number(r.s2), s3: Number(r.s3), s4: Number(r.s4), s5: Number(r.s5),
    created_at: String(toIso(r.created_at)),
  }))

  data.web = (await rows(q, 'SELECT * FROM website ORDER BY period_start')).map((r) => ({
    web_id: String(r.web_id), site: r.site as Data['web'][number]['site'],
    period_start: String(r.period_start), period_end: String(r.period_end),
    images: (asJson(r.images) ?? []) as string[],
    visitors: Number(r.visitors), views: Number(r.views),
    pages: (asJson(r.pages) ?? []) as Data['web'][number]['pages'],
    articles: (asJson(r.articles) ?? []) as Data['web'][number]['articles'],
    referrers: (asJson(r.referrers) ?? []) as Data['web'][number]['referrers'],
    created_at: String(toIso(r.created_at)),
  }))

  data.wa = (await rows(q, 'SELECT * FROM whatsapp ORDER BY period_start')).map((r) => ({
    wa_id: String(r.wa_id), period_start: String(r.period_start), period_end: String(r.period_end),
    chats_in: Number(r.chats_in), saved_contacts: Number(r.saved_contacts), sw_views: Number(r.sw_views),
    uploaded_contacts: Number(r.uploaded_contacts),
    top_chats: (asJson(r.top_chats) ?? []) as Data['wa'][number]['top_chats'],
    reservations: (asJson(r.reservations) ?? []) as Data['wa'][number]['reservations'],
    unavailable: (asJson(r.unavailable) ?? []) as Data['wa'][number]['unavailable'],
    images: (asJson(r.images) ?? []) as string[],
    created_at: String(toIso(r.created_at)),
  }))

  data.audit = (await rows(q, 'SELECT * FROM audit_log ORDER BY changed_at')).map((r) => ({
    change_id: String(r.change_id), report_id: r.report_id == null ? '' : String(r.report_id),
    changed_at: String(toIso(r.changed_at)), action: r.action as Data['audit'][number]['action'],
    before_json: String(r.before_json), after_json: String(r.after_json),
  }))

  for (const t of TABLES) {
    const m = new Map<string, string>()
    for (const row of t.get(data)) m.set(rowKey(t, row), JSON.stringify(valuesFor(t, row as Row)))
    base.set(t.name, m)
  }
  return { data, base }
}

/** Tulis hanya baris yang baru/berubah, dan hapus baris yang sudah tidak ada di `Data`. */
async function persist(q: Queryable, data: Data, base: Map<string, Map<string, string>>): Promise<void> {
  for (const t of TABLES) {
    const all = t.get(data) as Row[]
    const before = base.get(t.name) ?? new Map<string, string>()
    const seen = new Set<string>()

    const changed: Row[] = []
    for (const row of all) {
      const key = rowKey(t, row)
      seen.add(key)
      if (before.get(key) !== JSON.stringify(valuesFor(t, row))) changed.push(row)
    }

    if (changed.length) {
      const sets = t.cols
        .filter((c) => !(t.pk === 'metric_key' ? c === 'report_id' || c === 'metric_key' : c === t.pk))
        .map((c) => `${c} = VALUES(${c})`)
        .join(', ')
      for (let i = 0; i < changed.length; i += 200) {
        const chunk = changed.slice(i, i + 200)
        const params: unknown[] = []
        const tuples = chunk.map((row) => {
          params.push(...valuesFor(t, row))
          return `(${t.cols.map(() => '?').join(', ')})`
        })
        await q.query(
          `INSERT INTO ${t.name} (${t.cols.join(', ')}) VALUES ${tuples.join(', ')}
           ON DUPLICATE KEY UPDATE ${sets}`,
          params,
        )
      }
    }

    const gone = [...before.keys()].filter((k) => !seen.has(k))
    if (gone.length) {
      for (let i = 0; i < gone.length; i += 200) {
        const chunk = gone.slice(i, i + 200)
        if (t.pk === 'metric_key') {
          const pairs = chunk.map((k) => k.split('|'))
          const cond = pairs.map(() => '(report_id = ? AND metric_key = ?)').join(' OR ')
          await q.query(`DELETE FROM metrics WHERE ${cond}`, pairs.flat())
        } else {
          await q.query(`DELETE FROM ${t.name} WHERE ${t.pk} IN (${chunk.map(() => '?').join(', ')})`, chunk)
        }
      }
    }
  }
}

export interface MysqlOptions {
  /** Folder untuk gambar & file export (dipakai bila thumbnail tidak memakai backend lain). */
  dir?: string
  blobs?: ThumbBackend
  ssl?: boolean
}

/** Ubah DATABASE_URL (mysql://user:pass@host:3306/db) menjadi opsi koneksi mysql2. */
export function mysqlConfig(url: string, ssl = false) {
  const u = new URL(url)
  if (!/^mysql2?:/.test(u.protocol)) throw new Error('DATABASE_URL harus diawali mysql://')
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: decodeURIComponent(u.pathname.replace(/^\//, '')),
    charset: 'utf8mb4',
    // Tanggal dibiarkan sebagai teks agar tidak bergeser zona waktu.
    dateStrings: true as const,
    supportBigNumbers: true,
    bigNumberStrings: false,
    timezone: 'Z',
    connectionLimit: 10,
    ssl: ssl || /^(true|required|1)$/i.test(u.searchParams.get('ssl') ?? '') ? { rejectUnauthorized: false } : undefined,
  }
}

export function createMysqlPool(url: string, ssl = false): Pool {
  return mysql.createPool(mysqlConfig(url, ssl))
}

export function createMysqlStore(pool: Pool, opts: Omit<MysqlOptions, 'ssl'> = {}) {
  const dir = opts.dir ?? path.join(process.cwd(), 'data')
  const thumbs = createThumbs(dir, opts.blobs)
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
    const p = queue.then(fn)
    queue = p.catch(() => {})
    return p
  }

  const TTL = 5_000
  let cache: { at: number; data: Data } | null = null

  const read = async (): Promise<Data> => {
    if (!cache || Date.now() - cache.at > TTL) {
      const { data } = await loadData(pool)
      cache = { at: Date.now(), data }
    }
    return structuredClone(cache.data)
  }

  return {
    file: 'MySQL',
    read,

    /** Baca-ubah-tulis dalam satu transaksi; GET_LOCK mencegah dua penulisan bersamaan. */
    mutate<T>(fn: (d: Data) => T): Promise<T> {
      return serial(async () => {
        const conn = await pool.getConnection()
        try {
          const [lock] = await conn.query('SELECT GET_LOCK(?, ?) AS ok', ['lastdance_store', 10])
          if (!(lock as { ok: number | null }[])[0]?.ok) throw new StoreError('Database sedang sibuk, coba lagi.', 503)
          await conn.beginTransaction()
          const { data, base } = await loadData(conn)
          const result = fn(data)
          await persist(conn, data, base)
          await conn.commit()
          cache = null
          return result
        } catch (e) {
          await conn.rollback().catch(() => {})
          if (e instanceof StoreError) throw e
          throw new StoreError(`Gagal menyimpan ke database: ${(e as Error)?.message ?? e}`)
        } finally {
          await conn.query('SELECT RELEASE_LOCK(?)', ['lastdance_store']).catch(() => {})
          conn.release()
        }
      })
    },

    /** File .xlsx berisi seluruh data (format sama dengan workbook lama) untuk diunduh. */
    async exportFile() {
      const { data } = await loadData(pool)
      const wb = new ExcelJS.Workbook()
      const sheetRows = toSheets(data)
      for (const name of Object.keys(HEADERS) as (keyof typeof HEADERS)[]) {
        const ws = wb.addWorksheet(name)
        ws.addRow([...HEADERS[name]]).font = { bold: true }
        sheetRows[name].forEach((r) => ws.addRow(r as unknown[]))
        ws.columns.forEach((c) => (c.width = 20))
      }
      await fs.mkdir(dir, { recursive: true })
      const out = path.join(dir, 'export_mysql.xlsx')
      await wb.xlsx.writeFile(out)
      return out
    },

    ...thumbs,
  }
}

export type MysqlStore = ReturnType<typeof createMysqlStore>

/** Dipakai skrip impor: tulis seluruh `Data` (upsert + hapus baris yang tidak ada). */
export async function writeAll(pool: Pool, data: Data): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await persist(conn, data, new Map())
    await conn.commit()
  } catch (e) {
    await conn.rollback().catch(() => {})
    throw e
  } finally {
    conn.release()
  }
}
