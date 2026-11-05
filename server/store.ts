import ExcelJS from 'exceljs'
import { createWriteStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Transform, type Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { DEFAULT_PLATFORM, isPlatform, type PlatformId } from '../shared/platforms'
import { ACCOUNT_IDS, DEFAULT_ACCOUNT, type AccountId } from '../shared/accounts'
import { audienceSchema, emptyAudience, hasAudience, type Audience } from '../shared/audience'
import { THUMB_RE, type Content } from '../shared/content'
import type { Activity } from '../shared/activity'
import type { Influencer } from '../shared/influencer'
import type { Ad } from '../shared/ad'
import type { Reservation } from '../shared/reservation'
import type { MapsReport } from '../shared/maps'
import type { WaReport } from '../shared/whatsapp'
import { WEBSITES, type WebReport, type WebRow } from '../shared/website'
import type { SummaryItem, SummaryKind } from '../shared/summary'
import type { User } from '../shared/users'
import { DEF, METRIC_KEYS, type MetricKey, type Report, type ReportStatus } from '../shared/metrics'

export interface AuditEntry {
  change_id: string
  report_id: string
  changed_at: string
  action: 'create' | 'update' | 'delete'
  before_json: string
  after_json: string
}

export interface Data {
  reports: Report[]
  settings: Record<string, string>
  audit: AuditEntry[]
  contents: Content[]
  users: User[]
  summary: SummaryItem[]
  activities: Activity[]
  influencers: Influencer[]
  ads: Ad[]
  reservations: Reservation[]
  maps: MapsReport[]
  web: WebReport[]
  wa: WaReport[]
}

export class StoreError extends Error {
  constructor(message: string, public status = 500) {
    super(message)
  }
}

const FILE_NAME = 'instagram_analytics.xlsx'

export const HEADERS = {
  Reports: ['report_id', 'period_start', 'period_end', 'recorded_at', 'notes', 'status', 'account', 'audience_json', 'platform'],
  Metrics: ['report_id', 'metric_key', 'metric_type', 'value', 'unit', 'snapshot_date'],
  Settings: ['key', 'value', 'updated_at'],
  AuditLog: ['change_id', 'report_id', 'changed_at', 'action', 'before_json', 'after_json'],
  Users: ['user_id', 'username', 'role', 'password_hash', 'created_at'],
  Summary: ['item_id', 'kind', 'text', 'period_start', 'period_end', 'created_at'],
  Activities: ['activity_id', 'name', 'date_text', 'note', 'period_start', 'period_end', 'created_at'],
  Influencers: ['influencer_id', 'name', 'handle', 'followers', 'note', 'created_at'],
  Maps: ['map_id', 'period_start', 'period_end', 'image', 'star1', 'star2', 'star3', 'star4', 'star5', 'created_at', 'account'],
  Website: ['web_id', 'site', 'period_start', 'period_end', 'images', 'top_pages', 'top_referrers', 'created_at', 'visitors', 'views', 'top_articles'],
  WhatsApp: ['wa_id', 'period_start', 'period_end', 'chats_in', 'saved_contacts', 'sw_views', 'uploaded_contacts', 'top_chats', 'reservations', 'unavailable', 'images', 'created_at'],
  Reservations: ['reservation_id', 'kind', 'name', 'count', 'period_start', 'period_end', 'created_at'],
  Ads: ['ad_id', 'account', 'image', 'created_at'],
  Contents: ['content_id', 'url', 'title', 'views', 'likes', 'interactions', 'period_start', 'period_end', 'thumbnail', 'account', 'platform', 'section'],
} as const

const cellText = (v: ExcelJS.CellValue): string => {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  if (typeof v === 'object') return String('result' in v ? v.result ?? '' : 'text' in v ? v.text : '')
  return String(v)
}
/** Kolom akun kosong/tak dikenal (workbook dari sebelum multi-akun) = Homecare. */
/** Kolom platform kosong/tak dikenal (data sebelum ada pilihan platform) = Instagram. */
const toPlatform = (v: string): PlatformId => (isPlatform(v) ? v : DEFAULT_PLATFORM)
const toAccount = (v: string): AccountId => ((ACCOUNT_IDS as readonly string[]).includes(v) ? (v as AccountId) : DEFAULT_ACCOUNT)
/** Workbook lama tanpa kolom audience, atau JSON rusak = audiens kosong (data lain tetap terbaca). */
const toAudience = (t: string): Audience => {
  if (!t) return emptyAudience()
  try {
    const p = audienceSchema.safeParse(JSON.parse(t))
    return p.success ? p.data : emptyAudience()
  } catch {
    return emptyAudience()
  }
}
const cellNum = (v: ExcelJS.CellValue): number | null => {
  const t = cellText(v).trim()
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

const friendly = (e: unknown): StoreError => {
  if (e instanceof StoreError) return e
  const code = (e as NodeJS.ErrnoException)?.code
  if (code === 'EBUSY' || code === 'EPERM' || code === 'EACCES')
    return new StoreError('File Excel sedang dibuka atau terkunci. Tutup file di Excel lalu coba lagi.', 423)
  if (code === 'ENOSPC') return new StoreError('Ruang disk tidak cukup untuk menyimpan data.', 507)
  if (code === 'ENOENT') return new StoreError('File workbook tidak ditemukan.', 404)
  return new StoreError(`Gagal mengakses workbook: ${(e as Error)?.message ?? e}`)
}


type Cell = ExcelJS.CellValue
export const emptyData = (): Data => ({ reports: [], settings: { account_name: '', instagram_handle: '' }, audit: [], contents: [], users: [], summary: [], activities: [], influencers: [], ads: [], reservations: [], maps: [], web: [], wa: [] })

/** Baris data (tanpa header) per sheet -> Data. Dipakai untuk workbook lokal maupun Google Sheets. */
export function fromSheets(rows: (name: string) => Cell[][]): Data {
    const reports = new Map<string, Report>()
    for (const r of rows('Reports')) {
      const id = cellText(r[0])
      if (!id) continue
      reports.set(id, {
        report_id: id,
        period_start: cellText(r[1]),
        period_end: cellText(r[2]),
        recorded_at: cellText(r[3]).slice(0, 10),
        notes: cellText(r[4]),
        status: (cellText(r[5]) || 'valid') as ReportStatus,
        account: toAccount(cellText(r[6])),
        platform: toPlatform(cellText(r[8])),
        audience: toAudience(cellText(r[7])),
        metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, null])) as Record<MetricKey, number | null>,
        snapshot_date: null,
      })
    }
    for (const r of rows('Metrics')) {
      const rep = reports.get(cellText(r[0]))
      const key = cellText(r[1]) as MetricKey
      if (!rep || !DEF[key]) continue
      rep.metrics[key] = cellNum(r[3])
      if (key === 'followers') rep.snapshot_date = cellText(r[5]) || null
    }
    const settings: Record<string, string> = {}
    for (const r of rows('Settings')) if (cellText(r[0])) settings[cellText(r[0])] = cellText(r[1])
    const audit = rows('AuditLog')
      .filter((r) => cellText(r[0]))
      .map((r) => ({
        change_id: cellText(r[0]), report_id: cellText(r[1]), changed_at: cellText(r[2]),
        action: cellText(r[3]) as AuditEntry['action'], before_json: cellText(r[4]), after_json: cellText(r[5]),
      }))
    const contents = rows('Contents')
      .filter((r) => cellText(r[0]))
      .map((r) => ({
        content_id: cellText(r[0]), url: cellText(r[1]), title: cellText(r[2]),
        views: cellNum(r[3]) ?? 0, likes: cellNum(r[4]) ?? 0, interactions: cellNum(r[5]) ?? 0,
        period_start: cellText(r[6]), period_end: cellText(r[7]), thumbnail: cellText(r[8]), account: toAccount(cellText(r[9])), platform: toPlatform(cellText(r[10])), section: (cellText(r[11]) === 'endorsement' ? 'endorsement' : 'top') as 'top' | 'endorsement',
      }))
    const users = rows('Users')
      .filter((r) => cellText(r[0]) && cellText(r[1]))
      .map((r) => ({ user_id: cellText(r[0]), username: cellText(r[1]), role: (cellText(r[2]) === 'admin' ? 'admin' : 'user') as User['role'], password_hash: cellText(r[3]), created_at: cellText(r[4]) }))
    const summary = rows('Summary')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ item_id: cellText(r[0]), kind: cellText(r[1]) as SummaryKind, text: cellText(r[2]), period_start: cellText(r[3]), period_end: cellText(r[4]), created_at: cellText(r[5]) }))
    const activities = rows('Activities')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ activity_id: cellText(r[0]), name: cellText(r[1]), date_text: cellText(r[2]), note: cellText(r[3]), period_start: cellText(r[4]), period_end: cellText(r[5]), created_at: cellText(r[6]) }))
    const influencers = rows('Influencers')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ influencer_id: cellText(r[0]), name: cellText(r[1]), handle: cellText(r[2]), followers: cellNum(r[3]), note: cellText(r[4]), created_at: cellText(r[5]) }))
    const ads = rows('Ads')
      .filter((r) => cellText(r[0]) && cellText(r[2]))
      .map((r) => ({ ad_id: cellText(r[0]), account: toAccount(cellText(r[1])), image: cellText(r[2]), created_at: cellText(r[3]) }))
    const reservations = rows('Reservations')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ reservation_id: cellText(r[0]), kind: (cellText(r[1]) === 'treatment' ? 'treatment' : 'branch') as Reservation['kind'], name: cellText(r[2]), count: cellNum(r[3]) ?? 0, period_start: cellText(r[4]), period_end: cellText(r[5]), created_at: cellText(r[6]) }))
    const maps = rows('Maps')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ map_id: cellText(r[0]), period_start: cellText(r[1]), period_end: cellText(r[2]), images: cellText(r[3]).split(",").filter(Boolean), s1: cellNum(r[4]) ?? 0, s2: cellNum(r[5]) ?? 0, s3: cellNum(r[6]) ?? 0, s4: cellNum(r[7]) ?? 0, s5: cellNum(r[8]) ?? 0, created_at: cellText(r[9]), account: (cellText(r[10]) === 'bekam' ? 'bekam' : 'klinik') as MapsReport['account'] }))
    const webRows = (v: ExcelJS.CellValue): WebRow[] => {
      try {
        const j: unknown = JSON.parse(cellText(v) || '[]')
        return Array.isArray(j) ? j.map((x) => ({ name: String(x?.name ?? ''), count: Number(x?.count) || 0 })).filter((x) => x.name) : []
      } catch {
        return []
      }
    }
    const web = rows('Website')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ web_id: cellText(r[0]), site: ((WEBSITES as readonly string[]).includes(cellText(r[1])) ? cellText(r[1]) : 'klinik') as WebReport['site'], period_start: cellText(r[2]), period_end: cellText(r[3]), images: cellText(r[4]).split(',').filter(Boolean), pages: webRows(r[5]), referrers: webRows(r[6]), created_at: cellText(r[7]), visitors: cellNum(r[8]) ?? 0, views: cellNum(r[9]) ?? 0, articles: webRows(r[10]) }))
    const wa = rows('WhatsApp')
      .filter((r) => cellText(r[0]))
      .map((r) => ({ wa_id: cellText(r[0]), period_start: cellText(r[1]), period_end: cellText(r[2]), chats_in: cellNum(r[3]) ?? 0, saved_contacts: cellNum(r[4]) ?? 0, sw_views: cellNum(r[5]) ?? 0, uploaded_contacts: cellNum(r[6]) ?? 0, top_chats: webRows(r[7]), reservations: webRows(r[8]), unavailable: webRows(r[9]), images: cellText(r[10]).split(',').filter(Boolean), created_at: cellText(r[11]) }))
    return { reports: [...reports.values()], settings, audit, contents, users, summary, activities, influencers, ads, reservations, maps, web, wa }
}

/** Data -> baris per sheet (tanpa header). */
export function toSheets(data: Data): Record<keyof typeof HEADERS, unknown[][]> {
  const now = new Date().toISOString()
  return {
    Reports: data.reports.map((r) => [r.report_id, r.period_start, r.period_end, r.recorded_at, r.notes, r.status, r.account, hasAudience(r.audience) ? JSON.stringify(r.audience) : '', r.platform]),
    Metrics: data.reports.flatMap((r) =>
      METRIC_KEYS.map((k) => [r.report_id, k, DEF[k].type, r.metrics[k], DEF[k].currency ? 'currency' : DEF[k].percent ? 'percent' : 'count', k === 'followers' ? r.snapshot_date : null]),
    ),
    Settings: Object.entries(data.settings).map(([k, v]) => [k, v, now]),
    AuditLog: data.audit.map((a) => [a.change_id, a.report_id, a.changed_at, a.action, a.before_json, a.after_json]),
    Users: data.users.map((u) => [u.user_id, u.username, u.role, u.password_hash, u.created_at]),
    Summary: data.summary.map((i) => [i.item_id, i.kind, i.text, i.period_start, i.period_end, i.created_at]),
    Activities: data.activities.map((a) => [a.activity_id, a.name, a.date_text, a.note, a.period_start, a.period_end, a.created_at]),
    Influencers: data.influencers.map((i) => [i.influencer_id, i.name, i.handle, i.followers, i.note, i.created_at]),
    Maps: data.maps.map((m) => [m.map_id, m.period_start, m.period_end, m.images.join(","), m.s1, m.s2, m.s3, m.s4, m.s5, m.created_at, m.account]),
    Website: data.web.map((w) => [w.web_id, w.site, w.period_start, w.period_end, w.images.join(','), JSON.stringify(w.pages), JSON.stringify(w.referrers), w.created_at, w.visitors, w.views, JSON.stringify(w.articles)]),
    WhatsApp: data.wa.map((w) => [w.wa_id, w.period_start, w.period_end, w.chats_in, w.saved_contacts, w.sw_views, w.uploaded_contacts, JSON.stringify(w.top_chats), JSON.stringify(w.reservations), JSON.stringify(w.unavailable), w.images.join(','), w.created_at]),
    Reservations: data.reservations.map((r) => [r.reservation_id, r.kind, r.name, r.count, r.period_start, r.period_end, r.created_at]),
    Ads: data.ads.map((a) => [a.ad_id, a.account, a.image, a.created_at]),
    Contents: data.contents.map((c) => [c.content_id, c.url, c.title, c.views, c.likes, c.interactions, c.period_start, c.period_end, c.thumbnail, c.account, c.platform, c.section]),
  }
}

export interface Remote { url: string; token: string; fetch?: typeof fetch }
/** Penyimpanan gambar pengganti folder thumbs (mis. Netlify Blobs), untuk hosting tanpa disk tetap. */
export interface ThumbBackend { set(key: string, data: Buffer): Promise<void>; get(key: string): Promise<Buffer | null>; delete(key: string): Promise<void> }

export function createStore(dir: string, remote?: Remote, blobs?: ThumbBackend) {
  const localFile = path.join(dir, FILE_NAME)
  const file = remote ? 'Google Sheets' : localFile
  const thumbDir = path.join(dir, 'thumbs')
  let queue: Promise<unknown> = Promise.resolve()
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const p = queue.then(fn)
    queue = p.catch(() => {})
    return p
  }

  async function parse(p: string): Promise<Data> {
    const wb = new ExcelJS.Workbook()
    try {
      await wb.xlsx.readFile(p)
    } catch (e) {
      if ((e as NodeJS.ErrnoException)?.code) throw friendly(e)
      throw new StoreError('Workbook rusak atau bukan file Excel yang valid.', 422)
    }
    for (const name of Object.keys(HEADERS).filter((n) => n !== 'Contents' && n !== 'Users' && n !== 'Summary' && n !== 'Activities' && n !== 'Influencers' && n !== 'Ads' && n !== 'Reservations' && n !== 'Maps' && n !== 'Website' && n !== 'WhatsApp'))
      if (!wb.getWorksheet(name)) throw new StoreError(`Workbook tidak valid: sheet "${name}" tidak ada.`, 422)
    return fromSheets((name) => {
      const out: ExcelJS.CellValue[][] = []
      wb.getWorksheet(name)?.eachRow((row, i) => {
        if (i > 1) out.push(HEADERS[name as keyof typeof HEADERS].map((_, c) => row.getCell(c + 1).value))
      })
      return out
    })
  }

  async function build(data: Data, p: string) {
    const wb = new ExcelJS.Workbook()
    const rows = toSheets(data)
    for (const name of Object.keys(HEADERS) as (keyof typeof HEADERS)[]) {
      const ws = wb.addWorksheet(name)
      ws.addRow([...HEADERS[name]]).font = { bold: true }
      rows[name].forEach((r) => ws.addRow(r))
      ws.columns.forEach((c) => (c.width = 20))
    }
    await wb.xlsx.writeFile(p)
  }

  /** Tulis ke file sementara, validasi dengan membacanya kembali, lalu ganti file utama. */
  async function write(data: Data) {
    const tmp = `${localFile}.tmp`
    try {
      await build(data, tmp)
      const check = await parse(tmp)
      if (check.reports.length !== data.reports.length || check.contents.length !== data.contents.length || check.users.length !== data.users.length) throw new StoreError('Validasi hasil tulis gagal; file utama tidak diubah.')
      await fs.rename(tmp, localFile)
    } catch (e) {
      await fs.rm(tmp, { force: true }).catch(() => {})
      throw friendly(e)
    }
  }

  async function readLocal(): Promise<Data> {
    try {
      await fs.access(localFile)
    } catch {
      await fs.mkdir(dir, { recursive: true })
      const empty = emptyData()
      await write(empty) // tanpa serial(): read() juga dipanggil dari dalam mutate()
      return empty
    }
    return parse(localFile)
  }

  // --- Google Sheets lewat Apps Script web app (lihat apps-script/Code.gs); semua permintaan POST berisi token. ---
  async function call(body: Record<string, unknown>): Promise<{ sheets?: Record<string, Cell[][]>; counts?: Record<string, number> }> {
    let r: Response
    try {
      r = await (remote!.fetch ?? fetch)(remote!.url, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ token: remote!.token, ...body }) })
    } catch {
      throw new StoreError('Tidak dapat menghubungi Google Sheets. Periksa koneksi internet dan SHEET_URL.', 502)
    }
    const j = (await r.json().catch(() => null)) as ({ error?: string; sheets?: Record<string, Cell[][]>; counts?: Record<string, number> }) | null
    if (!r.ok || !j || j.error) throw new StoreError(`Google Sheets: ${j?.error ?? `respons tidak valid (${r.status}). Pastikan web app Apps Script di-deploy untuk "Anyone".`}`, 502)
    return j!
  }
  async function readRemote(): Promise<Data> {
    const { sheets = {} } = await call({ action: 'read' })
    if (!sheets.Reports?.length) {
      // Sheet masih kosong: impor workbook lokal bila ada, kalau tidak mulai dari data kosong.
      const first = await fs.access(localFile).then(() => parse(localFile), () => emptyData())
      await writeRemote(first)
      return first
    }
    const data = fromSheets((name) => (sheets[name] ?? []).slice(1))
    sent = snapshot(data)
    return data
  }
  // Isi tiap sheet terakhir yang diketahui sama dengan Google Sheets; hanya sheet yang berubah yang dikirim (lebih cepat, aman untuk batas waktu hosting).
  let sent: Record<string, string> = {}
  // Settings diberi stempel waktu saat diserialisasi, jadi yang dibandingkan hanya key/value:
  // tanpa ini sheet Settings dianggap berubah di setiap penyimpanan (dan tes jadi bergantung waktu).
  const snapshot = (data: Data) =>
    Object.fromEntries(Object.entries(toSheets(data)).map(([n, r]) => [
      n,
      JSON.stringify(n === 'Settings' ? (r as unknown[][]).map(([k, v]) => [k, v]) : r),
    ]))
  async function writeRemote(data: Data) {
    const rows = toSheets(data)
    const now = snapshot(data)
    const sheets = Object.fromEntries(Object.entries(rows).filter(([n]) => now[n] !== sent[n]).map(([n, r]) => [n, [[...HEADERS[n as keyof typeof HEADERS]], ...r]]))
    if (!Object.keys(sheets).length) return
    const { counts } = await call({ action: 'write', sheets })
    for (const [n, r] of Object.entries(sheets)) if (counts?.[n] !== r.length) throw new StoreError('Google Sheets: validasi hasil tulis gagal.', 502)
    sent = { ...sent, ...Object.fromEntries(Object.keys(sheets).map((n) => [n, now[n]])) }
  }

  // Pembacaan dashboard di-cache singkat agar tidak memukul Apps Script di setiap permintaan; mutate selalu membaca ulang.
  const TTL = 10_000
  let cache: { at: number; data: Data } | null = null
  let inflight: Promise<unknown> | null = null
  const load = () => (remote ? readRemote() : readLocal())
  const persist = (d: Data) => (remote ? writeRemote(d) : write(d))
  const thumbs = createThumbs(dir, blobs)
  async function read(): Promise<Data> {
    if (!remote) return readLocal()
    if (!cache || Date.now() - cache.at > TTL) {
      // Permintaan bersamaan berbagi satu pembacaan, supaya Apps Script tidak kebanjiran.
      inflight ??= readRemote().then((data) => (cache = { at: Date.now(), data }), (e) => { throw e }).finally(() => { inflight = null })
      await inflight
    }
    return structuredClone(cache!.data)
  }

  return {
    file,
    read,
    /** Baca-ubah-tulis berurutan. */
    mutate<T>(fn: (d: Data) => T): Promise<T> {
      return serial(async () => {
        const data = await load()
        const result = fn(data)
        cache = null
        await persist(data)
        return result
      })
    },
    /** File .xlsx untuk diunduh; dari Google Sheets dibuat sesaat dari data terbaru. */
    async exportFile() {
      if (!remote) return (await readLocal(), localFile)
      await fs.mkdir(dir, { recursive: true })
      const out = path.join(dir, 'export_google_sheets.xlsx')
      await build(await load(), out)
      return out
    },
    ...thumbs,
  }
}

/** Penyimpanan gambar (disk lokal atau backend lain seperti Netlify Blobs), dipakai bersama oleh store mana pun. */
export function createThumbs(dir: string, blobs?: ThumbBackend) {
  const thumbDir = path.join(dir, 'thumbs')
  return {
    thumbDir,
    /** Simpan unggahan gambar sampul (streaming) dengan batas ukuran; file sebagian dihapus bila gagal. */
    async saveThumb(name: string, src: Readable, max: number) {
      if (!THUMB_RE.test(name)) throw new StoreError('Nama file tidak valid.', 400)
      if (blobs) {
        const parts: Buffer[] = []
        let n = 0
        for await (const c of src) {
          n += (c as Buffer).length
          if (n > max) throw new StoreError('Ukuran gambar melebihi batas.', 413)
          parts.push(c as Buffer)
        }
        return blobs.set(name, Buffer.concat(parts))
      }
      await fs.mkdir(thumbDir, { recursive: true })
      const dest = path.join(thumbDir, name)
      let bytes = 0
      const guard = new Transform({
        transform(chunk, _enc, cb) {
          bytes += chunk.length
          bytes > max ? cb(new StoreError('Ukuran gambar melebihi batas.', 413)) : cb(null, chunk)
        },
      })
      try {
        await pipeline(src, guard, createWriteStream(dest))
      } catch (e) {
        await fs.rm(dest, { force: true })
        throw friendly(e)
      }
    },
    thumbExists: (name: string) => THUMB_RE.test(name) && (blobs ? blobs.get(name).then((b) => !!b) : fs.access(path.join(thumbDir, name)).then(() => true, () => false)),
    readThumb: async (name: string) => THUMB_RE.test(name) ? (blobs ? blobs.get(name) : fs.readFile(path.join(thumbDir, name)).catch(() => null)) : null,
    deleteThumb: async (name: string) => {
      if (!THUMB_RE.test(name)) return
      if (blobs) await blobs.delete(name)
      else await fs.rm(path.join(thumbDir, name), { force: true })
    },
  }
}

export type Store = ReturnType<typeof createStore>
