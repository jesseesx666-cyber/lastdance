import { DEF, METRIC_KEYS, type MetricKey, type Report, type ReportStatus } from '../shared/metrics'
import { WEBSITES, type WebReport, type WebRow } from '../shared/website'
import type { Reservation } from '../shared/reservation'
import type { SummaryKind } from '../shared/summary'
import type { MapsReport } from '../shared/maps'
import type { User } from '../shared/users'
import { toAccount, toAudience, toPlatform, type AuditEntry, type Data, type DataBackend } from './store'

/** Antarmuka minimal ke MySQL/MariaDB (diisi mysql2 di `connectMySql`, atau tiruan di tes). */
export interface Sql {
  query(sql: string, values?: unknown[]): Promise<Record<string, unknown>[]>
  /** Semua perintah di dalam fn berjalan dalam satu transaksi; gagal = dibatalkan seluruhnya. */
  transaction<T>(fn: (q: Sql['query']) => Promise<T>): Promise<T>
}

type Row = Record<string, unknown>
const s = (v: unknown) => (v == null ? '' : String(v))
const n = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? 0 : Number(v))
const nn = (v: unknown) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v))
/** ISO ('2026-11-05T16:59:38.143Z') <-> DATETIME(3) UTC ('2026-11-05 16:59:38.143'). */
const toDt = (iso: string) => {
  const d = new Date(iso)
  return (Number.isNaN(d.getTime()) ? new Date() : d).toISOString().replace('T', ' ').replace('Z', '')
}
const fromDt = (v: unknown) => (v ? s(v).replace(' ', 'T').replace(/Z?$/, 'Z') : '')
const day = (v: unknown) => s(v).slice(0, 10)
const json = (v: unknown) => JSON.stringify(v)
const list = (v: unknown): string[] => {
  try {
    const j: unknown = JSON.parse(s(v) || '[]')
    return Array.isArray(j) ? j.map(String).filter(Boolean) : []
  } catch {
    return []
  }
}
const rows = (v: unknown): WebRow[] => {
  try {
    const j: unknown = JSON.parse(s(v) || '[]')
    return Array.isArray(j) ? j.map((x) => ({ name: String(x?.name ?? ''), count: Number(x?.count) || 0 })).filter((x) => x.name) : []
  } catch {
    return []
  }
}

/** Satu tabel: kolom (urutan = urutan nilai di `out`), jumlah kolom kunci di depan, dan konversi dari/ke model. */
interface Table<M> {
  name: string
  cols: string[]
  keys: number
  pick: (d: Data) => M[]
  out: (m: M) => unknown[]
  into: (d: Data, rows: Row[]) => void
}
const table = <M>(t: Table<M>) => t as Table<unknown>

// Urutan penting: induk sebelum anak (reports sebelum metrics) untuk simpan; dibalik untuk hapus.
export const TABLES: Table<unknown>[] = [
  table<User>({
    name: 'users', cols: ['user_id', 'username', 'role', 'password_hash', 'created_at'], keys: 1,
    pick: (d) => d.users,
    out: (u) => [u.user_id, u.username, u.role, u.password_hash, toDt(u.created_at)],
    into: (d, r) => void (d.users = r.map((x) => ({ user_id: s(x.user_id), username: s(x.username), role: x.role === 'admin' ? 'admin' : 'user', password_hash: s(x.password_hash), created_at: fromDt(x.created_at) }))),
  }),
  table<Report>({
    name: 'reports', cols: ['report_id', 'account', 'platform', 'period_start', 'period_end', 'recorded_at', 'notes', 'status', 'audience', 'snapshot_date'], keys: 1,
    pick: (d) => d.reports,
    out: (r) => [r.report_id, r.account, r.platform, r.period_start, r.period_end, r.recorded_at, r.notes, r.status, json(r.audience), r.snapshot_date || null],
    into: (d, r) => void (d.reports = r.map((x) => ({
      report_id: s(x.report_id), account: toAccount(s(x.account)), platform: toPlatform(s(x.platform)),
      period_start: day(x.period_start), period_end: day(x.period_end), recorded_at: day(x.recorded_at), notes: s(x.notes),
      status: (s(x.status) || 'valid') as ReportStatus, audience: toAudience(s(x.audience)), snapshot_date: x.snapshot_date ? day(x.snapshot_date) : null,
      metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, null])) as Record<MetricKey, number | null>,
    }))),
  }),
  table<[string, MetricKey, number | null]>({
    name: 'metrics', cols: ['report_id', 'metric_key', 'value'], keys: 2,
    pick: (d) => d.reports.flatMap((r) => METRIC_KEYS.map((k) => [r.report_id, k, r.metrics[k]] as [string, MetricKey, number | null])),
    out: (m) => m,
    into: (d, r) => {
      const by = new Map(d.reports.map((x) => [x.report_id, x]))
      for (const x of r) {
        const rep = by.get(s(x.report_id))
        const key = s(x.metric_key) as MetricKey
        if (rep && DEF[key]) rep.metrics[key] = nn(x.value)
      }
    },
  }),
  table<[string, string]>({
    name: 'settings', cols: ['setting_key', 'value'], keys: 1,
    pick: (d) => Object.entries(d.settings),
    out: (m) => m,
    into: (d, r) => void (d.settings = Object.fromEntries(r.map((x) => [s(x.setting_key), s(x.value)]))),
  }),
  table<AuditEntry>({
    name: 'audit_log', cols: ['change_id', 'report_id', 'changed_at', 'action', 'before_json', 'after_json'], keys: 1,
    pick: (d) => d.audit,
    out: (a) => [a.change_id, a.report_id || null, toDt(a.changed_at), a.action, a.before_json, a.after_json],
    into: (d, r) => void (d.audit = r.map((x) => ({ change_id: s(x.change_id), report_id: s(x.report_id), changed_at: fromDt(x.changed_at), action: s(x.action) as AuditEntry['action'], before_json: s(x.before_json), after_json: s(x.after_json) }))),
  }),
  table<Data['contents'][number]>({
    name: 'contents', cols: ['content_id', 'account', 'platform', 'section', 'url', 'thumbnail', 'title', 'views', 'likes', 'interactions', 'period_start', 'period_end'], keys: 1,
    pick: (d) => d.contents,
    out: (c) => [c.content_id, c.account, c.platform, c.section, c.url, c.thumbnail, c.title, c.views, c.likes, c.interactions, c.period_start, c.period_end],
    into: (d, r) => void (d.contents = r.map((x) => ({ content_id: s(x.content_id), account: toAccount(s(x.account)), platform: toPlatform(s(x.platform)), section: x.section === 'endorsement' ? 'endorsement' : 'top', url: s(x.url), thumbnail: s(x.thumbnail), title: s(x.title), views: n(x.views), likes: n(x.likes), interactions: n(x.interactions), period_start: day(x.period_start), period_end: day(x.period_end) }))),
  }),
  table<Data['summary'][number]>({
    name: 'summary', cols: ['item_id', 'kind', 'text', 'period_start', 'period_end', 'created_at'], keys: 1,
    pick: (d) => d.summary,
    out: (i) => [i.item_id, i.kind, i.text, i.period_start, i.period_end, toDt(i.created_at)],
    into: (d, r) => void (d.summary = r.map((x) => ({ item_id: s(x.item_id), kind: s(x.kind) as SummaryKind, text: s(x.text), period_start: day(x.period_start), period_end: day(x.period_end), created_at: fromDt(x.created_at) }))),
  }),
  table<Data['activities'][number]>({
    name: 'activities', cols: ['activity_id', 'name', 'date_text', 'note', 'period_start', 'period_end', 'created_at'], keys: 1,
    pick: (d) => d.activities,
    out: (a) => [a.activity_id, a.name, a.date_text, a.note, a.period_start, a.period_end, toDt(a.created_at)],
    into: (d, r) => void (d.activities = r.map((x) => ({ activity_id: s(x.activity_id), name: s(x.name), date_text: s(x.date_text), note: s(x.note), period_start: day(x.period_start), period_end: day(x.period_end), created_at: fromDt(x.created_at) }))),
  }),
  table<Data['influencers'][number]>({
    name: 'influencers', cols: ['influencer_id', 'name', 'handle', 'followers', 'note', 'created_at'], keys: 1,
    pick: (d) => d.influencers,
    out: (i) => [i.influencer_id, i.name, i.handle, i.followers, i.note, toDt(i.created_at)],
    into: (d, r) => void (d.influencers = r.map((x) => ({ influencer_id: s(x.influencer_id), name: s(x.name), handle: s(x.handle), followers: nn(x.followers), note: s(x.note), created_at: fromDt(x.created_at) }))),
  }),
  table<Data['ads'][number]>({
    name: 'ads', cols: ['ad_id', 'account', 'image', 'created_at'], keys: 1,
    pick: (d) => d.ads,
    out: (a) => [a.ad_id, a.account, a.image, toDt(a.created_at)],
    into: (d, r) => void (d.ads = r.map((x) => ({ ad_id: s(x.ad_id), account: s(x.account), image: s(x.image), created_at: fromDt(x.created_at) }))),
  }),
  table<Reservation>({
    name: 'reservations', cols: ['reservation_id', 'kind', 'name', 'count', 'period_start', 'period_end', 'created_at'], keys: 1,
    pick: (d) => d.reservations,
    out: (v) => [v.reservation_id, v.kind, v.name, v.count, v.period_start, v.period_end, toDt(v.created_at)],
    into: (d, r) => void (d.reservations = r.map((x) => ({ reservation_id: s(x.reservation_id), kind: x.kind === 'treatment' ? 'treatment' : 'branch', name: s(x.name), count: n(x.count), period_start: day(x.period_start), period_end: day(x.period_end), created_at: fromDt(x.created_at) }))),
  }),
  table<MapsReport>({
    name: 'maps', cols: ['map_id', 'account', 'period_start', 'period_end', 'images', 's1', 's2', 's3', 's4', 's5', 'created_at'], keys: 1,
    pick: (d) => d.maps,
    out: (m) => [m.map_id, m.account, m.period_start, m.period_end, json(m.images), m.s1, m.s2, m.s3, m.s4, m.s5, toDt(m.created_at)],
    into: (d, r) => void (d.maps = r.map((x) => ({ map_id: s(x.map_id), account: x.account === 'bekam' ? 'bekam' : 'klinik', period_start: day(x.period_start), period_end: day(x.period_end), images: list(x.images), s1: n(x.s1), s2: n(x.s2), s3: n(x.s3), s4: n(x.s4), s5: n(x.s5), created_at: fromDt(x.created_at) }))),
  }),
  table<WebReport>({
    name: 'website', cols: ['web_id', 'site', 'period_start', 'period_end', 'images', 'visitors', 'views', 'pages', 'articles', 'referrers', 'created_at'], keys: 1,
    pick: (d) => d.web,
    out: (w) => [w.web_id, w.site, w.period_start, w.period_end, json(w.images), w.visitors, w.views, json(w.pages), json(w.articles), json(w.referrers), toDt(w.created_at)],
    into: (d, r) => void (d.web = r.map((x) => ({ web_id: s(x.web_id), site: ((WEBSITES as readonly string[]).includes(s(x.site)) ? s(x.site) : 'klinik') as WebReport['site'], period_start: day(x.period_start), period_end: day(x.period_end), images: list(x.images), visitors: n(x.visitors), views: n(x.views), pages: rows(x.pages), articles: rows(x.articles), referrers: rows(x.referrers), created_at: fromDt(x.created_at) }))),
  }),
  table<Data['wa'][number]>({
    name: 'whatsapp', cols: ['wa_id', 'period_start', 'period_end', 'chats_in', 'saved_contacts', 'sw_views', 'uploaded_contacts', 'top_chats', 'reservations', 'unavailable', 'images', 'created_at'], keys: 1,
    pick: (d) => d.wa,
    out: (w) => [w.wa_id, w.period_start, w.period_end, w.chats_in, w.saved_contacts, w.sw_views, w.uploaded_contacts, json(w.top_chats), json(w.reservations), json(w.unavailable), json(w.images), toDt(w.created_at)],
    into: (d, r) => void (d.wa = r.map((x) => ({ wa_id: s(x.wa_id), period_start: day(x.period_start), period_end: day(x.period_end), chats_in: n(x.chats_in), saved_contacts: n(x.saved_contacts), sw_views: n(x.sw_views), uploaded_contacts: n(x.uploaded_contacts), top_chats: rows(x.top_chats), reservations: rows(x.reservations), unavailable: rows(x.unavailable), images: list(x.images), created_at: fromDt(x.created_at) }))),
  }),
]

const q = (name: string) => `\`${name}\``
const chunk = <T>(a: T[], size = 400) => Array.from({ length: Math.ceil(a.length / size) }, (_, i) => a.slice(i * size, (i + 1) * size))

/** Penyimpanan MySQL/MariaDB dengan skema database/lastdance.sql. Hanya baris yang berubah ditulis (dibandingkan dengan hasil baca terakhir). */
export function createSqlBackend(db: Sql): DataBackend {
  let sent = new Map<string, Map<string, string>>() // tabel -> kunci baris -> isi baris (JSON)
  const keyOf = (t: { keys: number }, row: unknown[]) => JSON.stringify(row.slice(0, t.keys))
  const snapshot = (d: Data) => new Map(TABLES.map((t) => [t.name, new Map(t.pick(d).map((m) => { const row = t.out(m); return [keyOf(t, row), JSON.stringify(row)] as const }))]))

  return {
    label: 'MySQL',
    async load() {
      const d = { reports: [], settings: {}, audit: [], contents: [], users: [], summary: [], activities: [], influencers: [], ads: [], reservations: [], maps: [], web: [], wa: [] } as Data
      for (const t of TABLES) t.into(d, await db.query(`SELECT * FROM ${q(t.name)}`))
      if (!d.reports.length && !d.users.length) return null // database baru/kosong
      sent = snapshot(d)
      return d
    },
    async save(d) {
      const now = snapshot(d)
      await db.transaction(async (run) => {
        for (const t of [...TABLES].reverse()) { // hapus anak dulu
          const old = sent.get(t.name) ?? new Map<string, string>()
          const gone = [...old.keys()].filter((k) => !now.get(t.name)!.has(k)).map((k) => JSON.parse(k) as unknown[])
          for (const part of chunk(gone))
            await run(t.keys === 1 ? `DELETE FROM ${q(t.name)} WHERE ${q(t.cols[0])} IN (?)` : `DELETE FROM ${q(t.name)} WHERE (${t.cols.slice(0, t.keys).map(q).join(',')}) IN (?)`, [t.keys === 1 ? part.map((p) => p[0]) : part])
        }
        for (const t of TABLES) {
          const old = sent.get(t.name) ?? new Map<string, string>()
          const changed = t.pick(d).map((m) => t.out(m)).filter((row) => old.get(keyOf(t, row)) !== JSON.stringify(row))
          const upd = t.cols.slice(t.keys).map((c) => `${q(c)}=VALUES(${q(c)})`)
          for (const part of chunk(changed))
            await run(`INSERT INTO ${q(t.name)} (${t.cols.map(q).join(',')}) VALUES ? ON DUPLICATE KEY UPDATE ${upd.length ? upd.join(',') : `${q(t.cols[0])}=${q(t.cols[0])}`}`, [part])
        }
      })
      sent = now
    },
  }
}

/** Sambungan nyata lewat mysql2. `url` seperti mysql://user:sandi@host:3306/lastdance (tambahkan ?ssl={"rejectUnauthorized":true} bila host mewajibkan SSL). */
export async function connectMySql(url: string): Promise<Sql> {
  const mysql = (await import('mysql2/promise')).default
  const pool = mysql.createPool({ uri: url, dateStrings: true, timezone: 'Z', connectionLimit: 3, charset: 'utf8mb4' })
  const exec = (c: { query: (sql: string, v?: unknown[]) => Promise<unknown> }) => async (sql: string, values?: unknown[]) => {
    const [r] = (await c.query(sql, values)) as [Record<string, unknown>[]]
    return r
  }
  return {
    query: exec(pool),
    async transaction(fn) {
      const c = await pool.getConnection()
      try {
        await c.beginTransaction()
        const out = await fn(exec(c))
        await c.commit()
        return out
      } catch (e) {
        await c.rollback().catch(() => {})
        throw e
      } finally {
        c.release()
      }
    },
  }
}
