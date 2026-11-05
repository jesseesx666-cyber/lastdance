import ExcelJS from 'exceljs'
import express, { type ErrorRequestHandler } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { METRIC_KEYS, type Report } from '../shared/metrics'
import { isAccount, type AccountId } from '../shared/accounts'
import { DEFAULT_PLATFORM, isPlatform, type PlatformId } from '../shared/platforms'
import { contentInputSchema, THUMB_RE, type Content } from '../shared/content'
import { findOverlaps } from '../shared/overlap'
import { activityInputSchema, type Activity } from '../shared/activity'
import { adInputSchema, type Ad } from '../shared/ad'
import { mapsInputSchema, type MapsReport } from '../shared/maps'
import { waInputSchema, type WaReport } from '../shared/whatsapp'
import { webInputSchema, type WebReport } from '../shared/website'
import { reservationInputSchema, type Reservation } from '../shared/reservation'
import { influencerInputSchema, type Influencer } from '../shared/influencer'
import { summaryInputSchema, type SummaryItem } from '../shared/summary'
import { reportInputSchema, type ReportInput } from '../shared/schema'
import { createAuth } from './auth'
import { analyze, type Granularity } from './analytics'
import { StoreError, type Store } from './store'

const MAX_THUMB = 5 * 1024 * 1024
const THUMB_TYPES: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }
const GRANULARITIES = ['day', 'week', 'month', 'year', 'custom']
const isDate = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
/** Parameter ?account= (default Homecare, data awal sistem); nilai tak dikenal ditolak. */
const accountParam = (v: unknown): AccountId => {
  if (v === undefined) return 'homecare'
  if (!isAccount(v)) throw new StoreError('Akun tidak valid.', 400)
  return v
}
/** Parameter ?platform= (default Instagram); nilai tak dikenal ditolak. */
const platformParam = (v: unknown): PlatformId => {
  if (v === undefined) return DEFAULT_PLATFORM
  if (!isPlatform(v)) throw new StoreError('Platform tidak valid.', 400)
  return v
}
/** Semua file gambar yang dimiliki sebuah laporan. */
/** Lanjutkan input: isian yang sudah terisi tidak diubah; hanya yang masih kosong yang diisi dari masukan baru. Periode, akun, platform, dan status tetap. */
function fillMissing(before: Report, inp: ReportInput): Report {
  const metrics = Object.fromEntries(METRIC_KEYS.map((k) => [k, before.metrics[k] ?? inp.metrics[k] ?? null])) as Report['metrics']
  const a = before.audience, b = inp.audience
  const audience: Report['audience'] = {
    gender: { women: a.gender.women ?? b.gender.women, men: a.gender.men ?? b.gender.men },
    age: Object.fromEntries(Object.keys(a.age).map((k) => [k, a.age[k as keyof typeof a.age] ?? b.age[k as keyof typeof b.age]])) as Report['audience']['age'],
    cities: a.cities.length ? a.cities : b.cities,
    growth_image: a.growth_image || b.growth_image,
    post_images: [...a.post_images, ...b.post_images.filter((x) => !a.post_images.includes(x))].slice(0, 6),
    search_share: a.search_share ?? b.search_share,
    search_terms: a.search_terms.length ? a.search_terms : b.search_terms,
  }
  return { ...before, metrics, audience, notes: before.notes || inp.notes, snapshot_date: metrics.followers == null ? null : before.snapshot_date ?? inp.snapshot_date ?? null }
}
const thumbsOf = (a: Report['audience']) => [a.growth_image, ...a.post_images].filter(Boolean)
const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const COLS = ['report_id', 'period_start', 'period_end', 'recorded_at', 'status', 'account', 'platform', 'snapshot_date', ...METRIC_KEYS, 'notes']
const flat = (r: Report) => [r.report_id, r.period_start, r.period_end, r.recorded_at, r.status, r.account, r.platform, r.snapshot_date, ...METRIC_KEYS.map((k) => r.metrics[k]), r.notes]

/** `secret` mengaktifkan login dan peran (index.ts selalu mengisinya); tanpa secret API terbuka, hanya untuk tes. */
export function createApp(store: Store, webDir?: string, secret?: string, anyHost = false) {
  const app = express()
  app.disable('x-powered-by')
  app.use(express.json({ limit: '1mb' }))

  // Cegah DNS-rebinding: API hanya melayani Host localhost.
  app.use((req, res, next) => {
    if (!anyHost && !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(req.headers.host ?? '')) return void res.status(403).json({ error: 'Host tidak diizinkan.' })
    next()
  })

  const api = express.Router()
  if (secret) {
    const auth = createAuth(store, secret)
    api.use(auth.gate)
    api.use(auth.router)
  }
  const requireThumb = async (name: string) => {
    if (name && !(await store.thumbExists(name))) throw new StoreError('File gambar tidak ditemukan; unggah ulang.', 400)
  }
  const wrap = (fn: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

  api.get('/health', wrap(async (_req, res) => res.json({ ok: true, file: store.file })))

  api.get('/reports', wrap(async (_req, res) => res.json((await store.read()).reports)))

  api.post('/reports', wrap(async (req, res) => {
    const p = reportInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: 'Input tidak valid.', issues: p.error.issues })
    for (const t of thumbsOf(p.data.audience)) await requireThumb(t)
    const { metrics, snapshot_date, status, ...rest } = p.data
    const result = await store.mutate((d) => {
      const report: Report = {
        ...rest, report_id: crypto.randomUUID(), metrics, snapshot_date: metrics.followers == null ? null : snapshot_date,
        status: findOverlaps({ ...rest, metrics, snapshot_date }, d.reports).length ? 'needs_review' : (status ?? 'valid'),
      }
      const warnings = findOverlaps(report, d.reports)
      d.reports.push(report)
      d.audit.push({ change_id: crypto.randomUUID(), report_id: report.report_id, changed_at: new Date().toISOString(), action: 'create', before_json: '', after_json: JSON.stringify(report) })
      return { report, warnings }
    })
    res.status(201).json(result)
  }))

  api.put('/reports/:id', wrap(async (req, res) => {
    const p = reportInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: 'Input tidak valid.', issues: p.error.issues })
    for (const t of thumbsOf(p.data.audience)) await requireThumb(t)
    const result = await store.mutate((d) => {
      const i = d.reports.findIndex((r) => r.report_id === req.params.id)
      if (i < 0) throw new StoreError('Laporan tidak ditemukan.', 404)
      const before = d.reports[i]
      const { metrics, snapshot_date, status, ...rest } = p.data
      const report: Report = { ...rest, report_id: before.report_id, metrics, snapshot_date: metrics.followers == null ? null : snapshot_date, status: status ?? before.status }
      d.reports[i] = report
      d.audit.push({ change_id: crypto.randomUUID(), report_id: report.report_id, changed_at: new Date().toISOString(), action: 'update', before_json: JSON.stringify(before), after_json: JSON.stringify(report) })
      return { report, warnings: findOverlaps(report, d.reports), prevImages: thumbsOf(before.audience) }
    })
    // Gambar lama dibersihkan bila diganti atau dihapus.
    const kept = thumbsOf(result.report.audience)
    for (const t of result.prevImages) if (!kept.includes(t)) await store.deleteThumb(t)
    res.json({ report: result.report, warnings: result.warnings })
  }))

  // Lanjutkan input laporan yang sudah tersimpan sebagian (boleh pengguna biasa): hanya mengisi yang kosong.
  api.post('/reports/:id/continue', wrap(async (req, res) => {
    const p = reportInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: 'Input tidak valid.', issues: p.error.issues })
    for (const t of thumbsOf(p.data.audience)) await requireThumb(t)
    const result = await store.mutate((d) => {
      const i = d.reports.findIndex((r) => r.report_id === req.params.id)
      if (i < 0) throw new StoreError('Laporan tidak ditemukan.', 404)
      const before = d.reports[i]
      const report = fillMissing(before, p.data)
      d.reports[i] = report
      d.audit.push({ change_id: crypto.randomUUID(), report_id: report.report_id, changed_at: new Date().toISOString(), action: 'update', before_json: JSON.stringify(before), after_json: JSON.stringify(report) })
      return { report, warnings: findOverlaps(report, d.reports), before }
    })
    // Unggahan baru yang tidak terpakai (karena kolomnya sudah terisi) dibersihkan.
    const used = thumbsOf(result.report.audience), old = thumbsOf(result.before.audience)
    for (const t of thumbsOf(p.data.audience)) if (!used.includes(t) && !old.includes(t)) await store.deleteThumb(t)
    res.json({ report: result.report, warnings: result.warnings })
  }))

  api.delete('/reports/:id', wrap(async (req, res) => {
    const gone = await store.mutate((d) => {
      const i = d.reports.findIndex((r) => r.report_id === req.params.id)
      if (i < 0) throw new StoreError('Laporan tidak ditemukan.', 404)
      const [before] = d.reports.splice(i, 1)
      d.audit.push({ change_id: crypto.randomUUID(), report_id: before.report_id, changed_at: new Date().toISOString(), action: 'delete', before_json: JSON.stringify(before), after_json: '' })
      return before
    })
    for (const t of thumbsOf(gone.audience)) await store.deleteThumb(t)
    res.status(204).end()
  }))

  // Ringkasan Eksekutif (khusus super admin; dijaga gate login).
  api.get('/summary', wrap(async (_req, res) => res.json((await store.read()).summary)))
  api.post('/summary', wrap(async (req, res) => {
    const p = summaryInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item: SummaryItem = { item_id: crypto.randomUUID(), created_at: new Date().toISOString(), ...p.data }
    await store.mutate((d) => void d.summary.push(item))
    res.status(201).json(item)
  }))
  api.put('/summary/:id', wrap(async (req, res) => {
    const p = summaryInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item = await store.mutate((d) => {
      const i = d.summary.findIndex((x) => x.item_id === req.params.id)
      if (i < 0) throw new StoreError('Poin tidak ditemukan.', 404)
      return (d.summary[i] = { ...d.summary[i], ...p.data })
    })
    res.json(item)
  }))
  api.delete('/summary/:id', wrap(async (req, res) => {
    await store.mutate((d) => {
      const i = d.summary.findIndex((x) => x.item_id === req.params.id)
      if (i < 0) throw new StoreError('Poin tidak ditemukan.', 404)
      d.summary.splice(i, 1)
    })
    res.status(204).end()
  }))

  // Rincian Kegiatan (khusus super admin).
  api.get('/activities', wrap(async (_req, res) => res.json((await store.read()).activities)))
  api.post('/activities', wrap(async (req, res) => {
    const p = activityInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item: Activity = { activity_id: crypto.randomUUID(), created_at: new Date().toISOString(), ...p.data }
    await store.mutate((d) => void d.activities.push(item))
    res.status(201).json(item)
  }))
  api.put('/activities/:id', wrap(async (req, res) => {
    const p = activityInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item = await store.mutate((d) => {
      const i = d.activities.findIndex((x) => x.activity_id === req.params.id)
      if (i < 0) throw new StoreError('Kegiatan tidak ditemukan.', 404)
      return (d.activities[i] = { ...d.activities[i], ...p.data })
    })
    res.json(item)
  }))
  api.delete('/activities/:id', wrap(async (req, res) => {
    await store.mutate((d) => {
      const i = d.activities.findIndex((x) => x.activity_id === req.params.id)
      if (i < 0) throw new StoreError('Kegiatan tidak ditemukan.', 404)
      d.activities.splice(i, 1)
    })
    res.status(204).end()
  }))

  // Daftar influencer klinik: semua peran boleh melihat (dashboard), hanya super admin yang mengubah.
  api.get('/influencers', wrap(async (_req, res) => res.json((await store.read()).influencers)))
  api.post('/influencers', wrap(async (req, res) => {
    const p = influencerInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item: Influencer = { influencer_id: crypto.randomUUID(), created_at: new Date().toISOString(), ...p.data }
    await store.mutate((d) => void d.influencers.push(item))
    res.status(201).json(item)
  }))
  api.put('/influencers/:id', wrap(async (req, res) => {
    const p = influencerInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item = await store.mutate((d) => {
      const i = d.influencers.findIndex((x) => x.influencer_id === req.params.id)
      if (i < 0) throw new StoreError('Influencer tidak ditemukan.', 404)
      return (d.influencers[i] = { ...d.influencers[i], ...p.data })
    })
    res.json(item)
  }))
  api.delete('/influencers/:id', wrap(async (req, res) => {
    await store.mutate((d) => {
      const i = d.influencers.findIndex((x) => x.influencer_id === req.params.id)
      if (i < 0) throw new StoreError('Influencer tidak ditemukan.', 404)
      d.influencers.splice(i, 1)
    })
    res.status(204).end()
  }))

  // Laporan Google Maps (khusus super admin, tab Laporan): satu data per periode dan akun; PUT = tambah atau ganti.
  api.get('/maps', wrap(async (_req, res) => res.json((await store.read()).maps)))
  api.put('/maps', wrap(async (req, res) => {
    const p = mapsInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    for (const f of p.data.images) await requireThumb(f)
    const { item, prev } = await store.mutate((d) => {
      const i = d.maps.findIndex((x) => x.account === p.data.account && x.period_start === p.data.period_start && x.period_end === p.data.period_end)
      const prev = i >= 0 ? d.maps[i].images : []
      const item: MapsReport = { map_id: i >= 0 ? d.maps[i].map_id : crypto.randomUUID(), created_at: i >= 0 ? d.maps[i].created_at : new Date().toISOString(), ...p.data }
      if (i >= 0) d.maps[i] = item
      else d.maps.push(item)
      return { item, prev }
    })
    for (const f of prev.filter((x) => !item.images.includes(x))) await store.deleteThumb(f)
    res.json(item)
  }))
  api.delete('/maps/:id', wrap(async (req, res) => {
    const gone = await store.mutate((d) => {
      const i = d.maps.findIndex((x) => x.map_id === req.params.id)
      if (i < 0) throw new StoreError('Laporan Google Maps tidak ditemukan.', 404)
      return d.maps.splice(i, 1)[0]
    })
    for (const f of gone.images) await store.deleteThumb(f)
    res.status(204).end()
  }))

  // Laporan Website (khusus super admin, tab Laporan): satu data per periode dan website; PUT = tambah atau ganti.
  api.get('/web', wrap(async (_req, res) => res.json((await store.read()).web)))
  api.put('/web', wrap(async (req, res) => {
    const p = webInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    for (const f of p.data.images) await requireThumb(f)
    const { item, prev } = await store.mutate((d) => {
      const i = d.web.findIndex((x) => x.site === p.data.site && x.period_start === p.data.period_start && x.period_end === p.data.period_end)
      const prev = i >= 0 ? d.web[i].images : []
      const item: WebReport = { web_id: i >= 0 ? d.web[i].web_id : crypto.randomUUID(), created_at: i >= 0 ? d.web[i].created_at : new Date().toISOString(), ...p.data }
      if (i >= 0) d.web[i] = item
      else d.web.push(item)
      return { item, prev }
    })
    for (const f of prev.filter((x) => !item.images.includes(x))) await store.deleteThumb(f)
    res.json(item)
  }))
  api.delete('/web/:id', wrap(async (req, res) => {
    const gone = await store.mutate((d) => {
      const i = d.web.findIndex((x) => x.web_id === req.params.id)
      if (i < 0) throw new StoreError('Laporan Website tidak ditemukan.', 404)
      return d.web.splice(i, 1)[0]
    })
    for (const f of gone.images) await store.deleteThumb(f)
    res.status(204).end()
  }))

  // Laporan WhatsApp (khusus super admin, tab Laporan): satu data per periode; PUT = tambah atau ganti.
  api.get('/whatsapp', wrap(async (_req, res) => res.json((await store.read()).wa)))
  api.put('/whatsapp', wrap(async (req, res) => {
    const p = waInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    for (const f of p.data.images) await requireThumb(f)
    const { item, prev } = await store.mutate((d) => {
      const i = d.wa.findIndex((x) => x.period_start === p.data.period_start && x.period_end === p.data.period_end)
      const prev = i >= 0 ? d.wa[i].images : []
      const item: WaReport = { wa_id: i >= 0 ? d.wa[i].wa_id : crypto.randomUUID(), created_at: i >= 0 ? d.wa[i].created_at : new Date().toISOString(), ...p.data }
      if (i >= 0) d.wa[i] = item
      else d.wa.push(item)
      return { item, prev }
    })
    for (const f of prev.filter((x) => !item.images.includes(x))) await store.deleteThumb(f)
    res.json(item)
  }))
  api.delete('/whatsapp/:id', wrap(async (req, res) => {
    const gone = await store.mutate((d) => {
      const i = d.wa.findIndex((x) => x.wa_id === req.params.id)
      if (i < 0) throw new StoreError('Laporan WhatsApp tidak ditemukan.', 404)
      return d.wa.splice(i, 1)[0]
    })
    for (const f of gone.images) await store.deleteThumb(f)
    res.status(204).end()
  }))

  // Reservasi Bekam: pengguna boleh melihat dan menambah; ubah/hapus khusus super admin.
  api.get('/reservations', wrap(async (_req, res) => res.json((await store.read()).reservations)))
  api.post('/reservations', wrap(async (req, res) => {
    const p = reservationInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item: Reservation = { reservation_id: crypto.randomUUID(), created_at: new Date().toISOString(), ...p.data }
    await store.mutate((d) => void d.reservations.push(item))
    res.status(201).json(item)
  }))
  api.put('/reservations/:id', wrap(async (req, res) => {
    const p = reservationInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const item = await store.mutate((d) => {
      const i = d.reservations.findIndex((x) => x.reservation_id === req.params.id)
      if (i < 0) throw new StoreError('Data reservasi tidak ditemukan.', 404)
      return (d.reservations[i] = { ...d.reservations[i], ...p.data })
    })
    res.json(item)
  }))
  api.delete('/reservations/:id', wrap(async (req, res) => {
    await store.mutate((d) => {
      const i = d.reservations.findIndex((x) => x.reservation_id === req.params.id)
      if (i < 0) throw new StoreError('Data reservasi tidak ditemukan.', 404)
      d.reservations.splice(i, 1)
    })
    res.status(204).end()
  }))

  // Iklan Aktif: gambar per akun. Semua peran boleh melihat, hanya super admin yang menambah/menghapus.
  api.get('/ads', wrap(async (req, res) => {
    const ads = (await store.read()).ads
    res.json(typeof req.query.account === 'string' ? ads.filter((a) => a.account === req.query.account) : ads)
  }))
  api.post('/ads', wrap(async (req, res) => {
    const p = adInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    await requireThumb(p.data.image)
    const item: Ad = { ad_id: crypto.randomUUID(), created_at: new Date().toISOString(), ...p.data }
    await store.mutate((d) => void d.ads.push(item))
    res.status(201).json(item)
  }))
  api.delete('/ads/:id', wrap(async (req, res) => {
    const gone = await store.mutate((d) => {
      const i = d.ads.findIndex((x) => x.ad_id === req.params.id)
      if (i < 0) throw new StoreError('Iklan tidak ditemukan.', 404)
      return d.ads.splice(i, 1)[0]
    })
    await store.deleteThumb(gone.image)
    res.status(204).end()
  }))

  api.get('/contents', wrap(async (_req, res) => res.json((await store.read()).contents)))

  api.post('/contents', wrap(async (req, res) => {
    const p = contentInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: 'Input tidak valid.', issues: p.error.issues })
    if (p.data.thumbnail && !(await store.thumbExists(p.data.thumbnail))) throw new StoreError('File gambar tidak ditemukan; unggah ulang.', 400)
    const content: Content = { content_id: crypto.randomUUID(), ...p.data }
    await store.mutate((d) => void d.contents.push(content))
    res.status(201).json(content)
  }))

  api.put('/contents/:id', wrap(async (req, res) => {
    const p = contentInputSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: 'Input tidak valid.', issues: p.error.issues })
    const content: Content = { content_id: String(req.params.id), ...p.data }
    if (content.thumbnail && !(await store.thumbExists(content.thumbnail))) throw new StoreError('File gambar tidak ditemukan; unggah ulang.', 400)
    const old = await store.mutate((d) => {
      const i = d.contents.findIndex((c) => c.content_id === content.content_id)
      if (i < 0) throw new StoreError('Konten tidak ditemukan.', 404)
      const prev = d.contents[i].thumbnail
      d.contents[i] = content
      return prev
    })
    if (old && old !== content.thumbnail) await store.deleteThumb(old)
    res.json(content)
  }))

  api.delete('/contents/:id', wrap(async (req, res) => {
    const [gone] = await store.mutate((d) => {
      const i = d.contents.findIndex((c) => c.content_id === req.params.id)
      if (i < 0) throw new StoreError('Konten tidak ditemukan.', 404)
      return d.contents.splice(i, 1)
    })
    if (gone.thumbnail) await store.deleteThumb(gone.thumbnail)
    res.status(204).end()
  }))

  // Unggah gambar sampul: badan permintaan = isi file mentah (streaming), jenis dari Content-Type.
  api.post('/thumbs', wrap(async (req, res) => {
    const ext = THUMB_TYPES[String(req.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()]
    if (!ext) throw new StoreError('Format gambar harus JPG, PNG, atau WebP.', 415)
    const len = Number(req.headers['content-length'] ?? 0)
    if (!len) throw new StoreError('Isi file kosong.', 400)
    if (len > MAX_THUMB) throw new StoreError(`Ukuran gambar maksimal ${MAX_THUMB / 1024 / 1024} MB.`, 413)
    const file = `${crypto.randomUUID()}${ext}`
    await store.saveThumb(file, req, MAX_THUMB)
    res.status(201).json({ file })
  }))
  api.get('/thumbs/:file', wrap(async (req, res) => {
    const file = String(req.params.file)
    if (!THUMB_RE.test(file)) throw new StoreError('File tidak ditemukan.', 404)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const img = await store.readThumb(file)
    if (!img) throw new StoreError('File tidak ditemukan.', 404)
    res.type(path.extname(file)).send(img)
  }))
  api.delete('/thumbs/:file', wrap(async (req, res) => {
    await store.deleteThumb(String(req.params.file))
    res.status(204).end()
  }))

  api.get('/analytics', wrap(async (req, res) => {
    const g = String(req.query.granularity ?? 'month')
    if (!GRANULARITIES.includes(g)) throw new StoreError('Granularitas tidak valid.', 400)
    const { anchor, from, to } = req.query
    if (g === 'custom') {
      if (!isDate(from) || !isDate(to) || from > to) throw new StoreError('Rentang tanggal tidak valid.', 400)
    } else if (!isDate(anchor)) throw new StoreError('Parameter anchor (yyyy-MM-dd) wajib.', 400)
    const account = accountParam(req.query.account)
    const platform = platformParam(req.query.platform)
    const reports = (await store.read()).reports.filter((r) => r.account === account && r.platform === platform)
    res.json(analyze(reports, g as Granularity, String(anchor ?? from), g === 'custom' ? { from: from as string, to: to as string } : undefined))
  }))

  api.get('/settings', wrap(async (_req, res) => res.json({ settings: (await store.read()).settings, file: store.file })))
  api.put('/settings', wrap(async (req, res) => {
    const b = req.body as Record<string, unknown>
    const clean = (v: unknown) => String(v ?? '').slice(0, 100)
    await store.mutate((d) => {
      d.settings.account_name = clean(b?.account_name)
      d.settings.instagram_handle = clean(b?.instagram_handle)
    })
    res.json({ ok: true })
  }))
  api.get('/audit', wrap(async (_req, res) => res.json((await store.read()).audit.slice(-100).reverse())))


  api.get('/export', wrap(async (req, res) => {
    const { format, from, to } = req.query
    let { reports } = await store.read()
    if (req.query.account !== undefined) {
      const account = accountParam(req.query.account)
      reports = reports.filter((r) => r.account === account)
    }
    if (isDate(from)) reports = reports.filter((r) => r.recorded_at >= from)
    if (isDate(to)) reports = reports.filter((r) => r.recorded_at <= to)
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="instagram_reports.csv"')
      return void res.send('﻿' + [COLS, ...reports.map(flat)].map((r) => r.map(csvCell).join(',')).join('\r\n'))
    }
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Rekap')
      ws.addRow(COLS).font = { bold: true }
      reports.forEach((r) => ws.addRow(flat(r)))
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      res.setHeader('Content-Disposition', 'attachment; filename="instagram_reports.xlsx"')
      return void res.send(Buffer.from(await wb.xlsx.writeBuffer()))
    }
    throw new StoreError('format harus csv atau xlsx.', 400)
  }))
  api.get('/export/workbook', wrap(async (_req, res) => {
    await store.read()
    res.download(await store.exportFile())
  }))

  app.use('/api', api)
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan.' }))

  if (webDir && fs.existsSync(webDir)) {
    app.use(express.static(webDir))
    app.get('*', (_req, res) => res.sendFile(path.join(webDir, 'index.html')))
  }

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof StoreError) return void res.status(err.status).json({ error: err.message })
    if (err?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'JSON tidak valid.' })
    console.error(err)
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' })
  }
  app.use(onError)
  return app
}
