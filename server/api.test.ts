import fs from 'node:fs'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import { createStore } from './store'

let dir: string
let server: http.Server
let base: string
let port: number

const boot = async () => {
  const store = createStore(dir)
  await store.read()
  server = createApp(store).listen(0, '127.0.0.1')
  await new Promise((r) => server.once('listening', r))
  port = (server.address() as AddressInfo).port
  base = `http://127.0.0.1:${port}/api`
}
const stop = () => new Promise((r) => server.close(r))
const call = (p: string, method = 'GET', body?: unknown) =>
  fetch(base + p, { method, headers: { 'content-type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })

const metrics = { views: 100, reach: 50, profile_visits: 10, external_link_taps: 2, interactions: 5, followers: 1000, likes: null, comments: null, shares: null, saves: null }
const input = (start: string, end: string, over: Record<string, unknown> = {}) => ({
  period_start: start, period_end: end, recorded_at: end, notes: 'tes', snapshot_date: end, metrics, ...over,
})

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iga-'))
  await boot()
})
afterEach(async () => {
  await stop()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('API', () => {
  it('CRUD dan data tetap ada setelah restart', async () => {
    const created = await (await call('/reports', 'POST', input('2026-10-01', '2026-10-31'))).json()
    expect(created.report.status).toBe('valid')
    await stop()
    await boot() // simulasi aplikasi dimulai ulang
    const list = await (await call('/reports')).json()
    expect(list).toHaveLength(1)
    expect(list[0].metrics.likes).toBeNull() // kosong tetap null, bukan nol
    expect(list[0].metrics.views).toBe(100)

    const upd = await call(`/reports/${list[0].report_id}`, 'PUT', input('2026-10-01', '2026-10-31', { notes: 'baru' }))
    expect(upd.status).toBe(200)
    expect((await (await call('/reports')).json())[0].notes).toBe('baru')
    expect((await call(`/reports/${list[0].report_id}`, 'DELETE')).status).toBe(204)
    expect(await (await call('/reports')).json()).toHaveLength(0)
    const audit = await (await call('/audit')).json()
    expect(audit.map((a: { action: string }) => a.action).sort()).toEqual(['create', 'delete', 'update'])
  })

  it('metrik Meta Ads: desimal tersimpan, boleh dikosongkan', async () => {
    const withMeta = input('2026-10-22', '2026-10-28', {
      metrics: { ...metrics, reach: null, lead: 12, cost_per_result: 41666.67, budget: 1000000, amount_spent: 500000.5, impressions: 9000 },
    })
    expect((await call('/reports', 'POST', withMeta)).status).toBe(201)
    const [r] = await (await call('/reports')).json()
    expect(r.metrics).toMatchObject({ lead: 12, cost_per_result: 41666.67, amount_spent: 500000.5, reach: null })
    expect((await call('/reports', 'POST', input('2026-10-15', '2026-10-21'))).status).toBe(201) // tanpa kolom Meta
    const bad = input('2026-10-01', '2026-10-07', { metrics: { ...metrics, lead: 1.5 } })
    expect((await call('/reports', 'POST', bad)).status).toBe(400) // lead harus bulat
  })

  it('konten: CRUD, tetap ada setelah restart, hanya link http(s)', async () => {
    const c = { url: 'https://www.instagram.com/reel/abc/', title: 'Reel A', views: 1000, likes: 80, interactions: 120, period_start: '2026-10-22', period_end: '2026-10-28' }
    const created = await (await call('/contents', 'POST', c)).json()
    expect(created.content_id).toBeTruthy()
    await stop()
    await boot() // restart
    const list = await (await call('/contents')).json()
    expect(list).toEqual([created])
    const upd = await call(`/contents/${created.content_id}`, 'PUT', { ...c, views: 2000 })
    expect(upd.status).toBe(200)
    expect((await (await call('/contents')).json())[0].views).toBe(2000)
    expect((await call('/contents', 'POST', { ...c, url: 'javascript:alert(1)' })).status).toBe(400)
    expect((await call('/contents', 'POST', { ...c, url: 'tidak-valid' })).status).toBe(400)
    expect((await call('/contents', 'POST', { ...c, views: -1 })).status).toBe(400)
    expect((await call(`/contents/${created.content_id}`, 'DELETE')).status).toBe(204)
    expect((await call(`/contents/${created.content_id}`, 'DELETE')).status).toBe(404)
  })

  const upload = (bytes: Buffer, type = 'image/png') => fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': type }, body: bytes as unknown as BodyInit })
  const onDisk = (f: string) => fs.existsSync(path.join(dir, 'thumbs', f))
  const c0 = { url: 'https://www.instagram.com/p/abc/', title: 'Dengan sampul', views: 10, likes: 2, interactions: 3, period_start: '2026-10-22', period_end: '2026-10-28' }

  it('gambar sampul: unggah, tampil, tautkan, ganti, dan file dibersihkan', async () => {
    const { file } = await (await upload(Buffer.alloc(1000, 7))).json()
    expect(file).toMatch(/\.png$/)
    expect(onDisk(file)).toBe(true)

    const got = await fetch(`${base}/thumbs/${file}`)
    expect(got.status).toBe(200)
    expect(got.headers.get('content-type')).toContain('image/png')
    expect(got.headers.get('x-content-type-options')).toBe('nosniff')
    expect((await got.arrayBuffer()).byteLength).toBe(1000)

    const made = await call('/contents', 'POST', { ...c0, thumbnail: file })
    expect(made.status).toBe(201)
    const { content_id } = await made.json()

    const { file: file2 } = await (await upload(Buffer.alloc(500, 1), 'image/jpeg')).json()
    expect((await call(`/contents/${content_id}`, 'PUT', { ...c0, thumbnail: file2 })).status).toBe(200)
    expect(onDisk(file)).toBe(false) // file lama dibersihkan saat diganti
    expect(onDisk(file2)).toBe(true)

    expect((await call(`/contents/${content_id}`, 'DELETE')).status).toBe(204)
    expect(onDisk(file2)).toBe(false) // dan saat konten dihapus
  })

  it('unggah dan konten ditolak bila tidak valid', async () => {
    expect((await upload(Buffer.alloc(10), 'text/plain')).status).toBe(415)
    expect((await upload(Buffer.alloc(10), 'video/mp4')).status).toBe(415) // video tidak lagi diterima
    expect((await upload(Buffer.alloc(10), 'image/svg+xml')).status).toBe(415) // SVG bisa memuat skrip
    expect((await upload(Buffer.alloc(0))).status).toBe(400)
    const big = await new Promise<number>((resolve) => {
      const r = http.request({ host: '127.0.0.1', port, path: '/api/thumbs', method: 'POST', headers: { 'content-type': 'image/png', 'content-length': String(6 * 1024 * 1024) } }, (res) => {
        resolve(res.statusCode!)
        r.destroy()
      })
      r.on('error', () => {})
      r.flushHeaders()
    })
    expect(big).toBe(413)
    expect((await call('/contents', 'POST', { ...c0, url: '' })).status).toBe(400) // link wajib
    expect((await call('/contents', 'POST', { ...c0, thumbnail: 'tidak-ada.png' })).status).toBe(400) // file tidak ada di disk
    expect((await call('/contents', 'POST', { ...c0, thumbnail: '../../data/x.png' })).status).toBe(400) // nama berbahaya
    expect((await fetch(`${base}/thumbs/..%2F..%2Fpackage.json`)).status).toBe(404)
  })

  it('akun: laporan, analitik, dan ekspor terpisah; tumpang tindih hanya dalam akun yang sama', async () => {
    const week = (account: string, views: number) => ({ ...input('2026-10-22', '2026-10-28'), account, metrics: { ...metrics, views } })
    const home = await (await call('/reports', 'POST', input('2026-10-22', '2026-10-28'))).json() // tanpa account = Homecare
    expect(home.report.account).toBe('homecare')
    const klinik = await (await call('/reports', 'POST', week('klinik', 777))).json()
    expect(klinik.warnings).toHaveLength(0) // periode sama tetapi akun beda: bukan tumpang tindih
    expect(klinik.report.status).toBe('valid')
    const again = await (await call('/reports', 'POST', week('klinik', 5))).json()
    expect(again.warnings).toHaveLength(1) // dalam akun yang sama tetap ditandai

    const views = async (q: string) => (await (await call(`/analytics?granularity=week&anchor=2026-10-29${q}`)).json()).metrics.views.current
    expect(await views('')).toMatchObject({ value: 100, status: 'ok' }) // default = Homecare
    expect(await views('&account=homecare')).toMatchObject({ value: 100 })
    expect(await views('&account=aqur')).toMatchObject({ value: null, status: 'no_data' }) // akun lain kosong

    expect((await call('/analytics?granularity=week&anchor=2026-10-29&account=xyz')).status).toBe(400)
    expect((await call('/reports', 'POST', week('xyz', 1))).status).toBe(400)

    const csv = await (await call('/export?format=csv&account=klinik')).text()
    expect(csv).toContain('account')
    expect(csv.split('\r\n').length).toBe(3) // header + 2 laporan Klinik
    expect(csv).not.toContain(home.report.report_id)
  })

  it('konten membawa akun; data lama tanpa kolom akun dibaca sebagai Homecare', async () => {
    const mk = (account?: string) => ({ ...c0, ...(account ? { account } : {}), url: 'https://www.instagram.com/p/xyz/' })
    await call('/contents', 'POST', mk('bekam'))
    await call('/contents', 'POST', mk())
    await call('/reports', 'POST', { ...input('2026-10-22', '2026-10-28'), account: 'academy' })
    expect((await (await call('/contents')).json()).map((c: { account: string }) => c.account).sort()).toEqual(['bekam', 'homecare'])

    // Simulasikan workbook dari sebelum fitur akun: hapus kolom "account" dari sheet Reports dan Contents.
    const ExcelJS = (await import('exceljs')).default
    const file = path.join(dir, 'instagram_analytics.xlsx')
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(file)
    wb.getWorksheet('Reports')!.spliceColumns(7, 1)
    wb.getWorksheet('Contents')!.spliceColumns(10, 1)
    await wb.xlsx.writeFile(file)
    expect((await (await call('/reports')).json()).map((r: { account: string }) => r.account)).toEqual(['homecare'])
    expect((await (await call('/contents')).json()).every((c: { account: string }) => c.account === 'homecare')).toBe(true)
  })

  it('audience: tersimpan di Excel, tampil di analitik, gambar pertumbuhan dibersihkan saat diganti atau dihapus', async () => {
    const png = (n: number) => fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': 'image/png' }, body: Buffer.alloc(n, 3) as unknown as BodyInit }).then((r) => r.json())
    const { file: img1 } = await png(300)
    const audience = {
      gender: { women: 78.5, men: 21.5 },
      age: { '13-17': 0.5, '18-24': 11.3, '25-34': 32.6, '35-44': 33.6, '45-54': 14.1, '55-64': 6.9, '65+': 0.9 },
      cities: [{ name: 'Bandar Lampung', pct: 47.5 }, { name: 'Jakarta', pct: 6.1 }],
      growth_image: img1,
    }
    const created = await call('/reports', 'POST', { ...input('2026-10-22', '2026-10-28'), audience })
    expect(created.status).toBe(201)
    const { report } = await created.json()

    await stop()
    await boot() // restart: data audience harus tetap ada dari Excel
    const [back] = await (await call('/reports')).json()
    expect(back.audience).toEqual({ ...audience, post_images: [], search_share: null, search_terms: [] })

    const a = await (await call('/analytics?granularity=week&anchor=2026-10-29')).json()
    expect(a.audience).toMatchObject({ recorded_at: '2026-10-28', data: { gender: { women: 78.5 }, cities: [{ name: 'Bandar Lampung' }, { name: 'Jakarta' }] } })

    const { file: img2 } = await png(200)
    expect((await call(`/reports/${report.report_id}`, 'PUT', { ...input('2026-10-22', '2026-10-28'), audience: { ...audience, growth_image: img2 } })).status).toBe(200)
    expect(onDisk(img1)).toBe(false) // gambar lama dibersihkan saat diganti
    expect(onDisk(img2)).toBe(true)
    expect((await call(`/reports/${report.report_id}`, 'DELETE')).status).toBe(204)
    expect(onDisk(img2)).toBe(false) // dan saat laporan dihapus
  })

  it('audience: kolom countries dari data lama diabaikan (lokasi hanya kota)', async () => {
    const r = await call('/reports', 'POST', { ...input('2026-10-22', '2026-10-28'), audience: { cities: [{ name: 'Jakarta', pct: 6.1 }], countries: [{ name: 'Indonesia', pct: 90 }] } })
    expect(r.status).toBe(201)
    const { audience } = (await r.json()).report
    expect(audience.cities).toEqual([{ name: 'Jakarta', pct: 6.1 }])
    expect(audience).not.toHaveProperty('countries')
  })

  it('audience: laporan tanpa audience, nilai tidak valid, dan gambar yang tidak ada ditolak', async () => {
    const plain = await (await call('/reports', 'POST', input('2026-10-22', '2026-10-28'))).json()
    expect(plain.report.audience.gender).toEqual({ women: null, men: null }) // kosong, bukan 0
    expect(plain.report.audience.cities).toEqual([])
    expect((await (await call('/analytics?granularity=week&anchor=2026-10-29')).json()).audience).toBeNull()
    const bad = (audience: unknown) => call('/reports', 'POST', { ...input('2026-10-15', '2026-10-21'), audience })
    expect((await bad({ gender: { women: 120, men: 0 } })).status).toBe(400) // lebih dari 100%
    expect((await bad({ cities: [{ name: '', pct: 5 }] })).status).toBe(400) // nama kosong
    expect((await bad({ growth_image: 'tidak-ada.png' })).status).toBe(400) // file tidak ada di disk
    expect((await bad({ growth_image: '../../x.png' })).status).toBe(400) // nama berbahaya
  })

  it('workbook lama tanpa sheet Contents tetap terbaca', async () => {
    await call('/reports', 'POST', input('2026-10-22', '2026-10-28'))
    const file = path.join(dir, 'instagram_analytics.xlsx')
    const ExcelJS = (await import('exceljs')).default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.readFile(file)
    wb.removeWorksheet(wb.getWorksheet('Contents')!.id)
    await wb.xlsx.writeFile(file)
    expect(await (await call('/contents')).json()).toEqual([])
    expect(await (await call('/reports')).json()).toHaveLength(1)
  })

  it('menolak input tidak valid', async () => {
    const bad = input('2026-10-31', '2026-10-01', { metrics: { ...metrics, views: -5 } })
    const r = await call('/reports', 'POST', bad)
    expect(r.status).toBe(400)
    const paths = (await r.json()).issues.map((i: { path: string[] }) => i.path.join('.'))
    expect(paths).toContain('period_end')
    expect(paths).toContain('metrics.views')
  })

  it('platform: terpisah per akun dan platform; kombinasi tak valid ditolak', async () => {
    const week = (account: string, platform: string | undefined, views: number) => ({ ...input('2026-10-22', '2026-10-28'), account, ...(platform ? { platform } : {}), metrics: { ...metrics, views } })
    expect((await call('/reports', 'POST', week('homecare', 'facebook', 1))).status).toBe(400) // Homecare hanya Instagram
    expect((await call('/reports', 'POST', week('bekam', 'threads', 1))).status).toBe(400)
    const ig = await (await call('/reports', 'POST', week('klinik', undefined, 100))).json() // tanpa platform = Instagram
    expect(ig.report.platform).toBe('instagram')
    const fb = await (await call('/reports', 'POST', week('klinik', 'facebook', 700))).json()
    expect(fb.warnings).toHaveLength(0) // periode sama, platform beda: bukan tumpang tindih
    const views = async (p: string) => (await (await call(`/analytics?granularity=week&anchor=2026-10-29&account=klinik${p}`)).json()).metrics.views.current
    expect(await views('')).toMatchObject({ value: 100 })
    expect(await views('&platform=facebook')).toMatchObject({ value: 700 })
    expect(await views('&platform=youtube')).toMatchObject({ value: null, status: 'no_data' })
    expect((await call('/analytics?granularity=week&anchor=2026-10-29&platform=xyz')).status).toBe(400)
    // Metrik Instagram boleh dikosongkan (cicil); platform lain wajib follower.
    const onlyFollowers = { ...input('2026-10-29', '2026-11-04'), account: 'klinik', platform: 'facebook', snapshot_date: '2026-11-05', recorded_at: '2026-11-05', metrics: { followers: 321 } }
    expect((await call('/reports', 'POST', onlyFollowers)).status).toBe(201)
    expect((await call('/reports', 'POST', { ...onlyFollowers, platform: 'instagram', account: 'bekam', period_start: '2026-11-05', period_end: '2026-11-11' })).status).toBe(201) // Instagram boleh dicicil: metrik kosong diterima
    expect((await call('/reports', 'POST', { ...onlyFollowers, snapshot_date: null, metrics: { views: 5 } })).status).toBe(400) // Facebook wajib follower
    const c = { account: 'klinik', platform: 'tiktok', url: 'https://www.tiktok.com/@a/video/1', views: 1, likes: 1, interactions: 1, period_start: '2026-10-22', period_end: '2026-10-28' }
    expect((await call('/contents', 'POST', c)).status).toBe(201)
    expect((await call('/contents', 'POST', { ...c, account: 'bekam', platform: 'youtube' })).status).toBe(400)
  })

  it('Threads: beberapa foto postingan tersimpan; gambar yang dilepas atau laporan yang dihapus ikut dibersihkan', async () => {
    const png = (n: number) => fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': 'image/png' }, body: Buffer.alloc(n, 3) as unknown as BodyInit }).then((r) => r.json())
    const { file: a1 } = await png(100)
    const { file: a2 } = await png(120)
    const body = (post_images: string[]) => ({ ...input('2026-10-22', '2026-10-28'), account: 'klinik', platform: 'threads', audience: { post_images }, metrics: { views: 10, viewers: 5, profile_visits: 2, followers: 90 } })
    const { report } = await (await call('/reports', 'POST', body([a1, a2]))).json()
    expect((await call(`/thumbs/${a1}`)).status).toBe(200)
    expect((await call('/reports', 'POST', body(Array(7).fill(a1)))).status).toBe(400) // maksimal 6
    expect((await call('/reports', 'POST', body(['tidak-ada.png']))).status).toBe(400)
    expect((await call(`/reports/${report.report_id}`, 'PUT', body([a2]))).status).toBe(200)
    expect((await call(`/thumbs/${a1}`)).status).toBe(404) // dilepas
    const api = await (await call('/analytics?granularity=week&anchor=2026-10-29&account=klinik&platform=threads')).json()
    expect(api.audience.data.post_images).toEqual([a2])
    expect((await call(`/reports/${report.report_id}`, 'DELETE')).status).toBe(204)
    expect((await call(`/thumbs/${a2}`)).status).toBe(404)
  })

  it('iklan aktif: gambar per akun; file hilang ditolak; hapus ikut membersihkan gambar', async () => {
    const png = await (await fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': 'image/png' }, body: new Uint8Array([137, 80, 78, 71, 1, 2, 3, 4]) })).json()
    expect((await call('/ads', 'POST', { account: 'bekam', image: 'tidak-ada.png' })).status).toBe(400)
    expect((await call('/ads', 'POST', { account: 'xyz', image: png.file })).status).toBe(400)
    const ad = await (await call('/ads', 'POST', { account: 'bekam', image: png.file })).json()
    expect(await (await call('/ads?account=bekam')).json()).toHaveLength(1)
    expect(await (await call('/ads?account=klinik')).json()).toEqual([])
    expect((await call(`/ads/${ad.ad_id}`, 'DELETE')).status).toBe(204)
    expect((await call(`/thumbs/${png.file}`)).status).toBe(404)
  })

  it('Laporan Website: satu data per periode dan website, gambar dibersihkan', async () => {
    const png = (await (await fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': 'image/png' }, body: new Uint8Array([137, 80, 78, 71, 9, 9, 9]) })).json()).file as string
    const w = { site: 'aqur', period_start: '2026-10-22', period_end: '2026-10-28', images: [png], visitors: 500, views: 900, articles: [{ name: 'Artikel A', count: 40 }], pages: [{ name: '/home', count: 120 }], referrers: [{ name: 'google.com', count: 80 }] }
    expect((await call('/web', 'PUT', { ...w, site: 'xyz' })).status).toBe(400)
    expect((await call('/web', 'PUT', { ...w, pages: [{ name: '', count: 1 }] })).status).toBe(400)
    expect((await call('/web', 'PUT', { ...w, images: ['tidak-ada.png'] })).status).toBe(400)
    const first = await (await call('/web', 'PUT', w)).json()
    const again = await (await call('/web', 'PUT', { ...w, images: [], pages: [{ name: '/home', count: 130 }] })).json()
    expect(again.web_id).toBe(first.web_id)
    expect(await (await call('/web')).json()).toMatchObject([{ site: 'aqur', visitors: 500, views: 900, articles: [{ name: 'Artikel A', count: 40 }], pages: [{ name: '/home', count: 130 }], referrers: [{ name: 'google.com', count: 80 }] }])
    expect((await call(`/thumbs/${png}`)).status).toBe(404)
    expect((await call(`/web/${first.web_id}`, 'DELETE')).status).toBe(204)
  })

  it('Laporan WhatsApp: satu data per periode, maksimal 5 baris top, gambar dibersihkan', async () => {
    const png = (await (await fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': 'image/png' }, body: new Uint8Array([137, 80, 78, 71, 7, 7, 7]) })).json()).file as string
    const w = { period_start: '2026-10-22', period_end: '2026-10-28', chats_in: 120, saved_contacts: 30, sw_views: 400, uploaded_contacts: 12, top_chats: [{ name: 'Bekam', count: 20 }], reservations: [{ name: 'Kosasih Medika Rajabasa', count: 9 }], unavailable: [{ name: 'Dokter X', count: 3 }], images: [png] }
    const six = Array.from({ length: 6 }, (_, i) => ({ name: 'n' + i, count: i }))
    expect((await call('/whatsapp', 'PUT', { ...w, top_chats: six })).status).toBe(400)
    expect((await call('/whatsapp', 'PUT', { ...w, unavailable: six })).status).toBe(400)
    expect((await call('/whatsapp', 'PUT', { ...w, chats_in: -1 })).status).toBe(400)
    expect((await call('/whatsapp', 'PUT', { ...w, images: ['tidak-ada.png'] })).status).toBe(400)
    const first = await (await call('/whatsapp', 'PUT', w)).json()
    const again = await (await call('/whatsapp', 'PUT', { ...w, images: [], chats_in: 150 })).json()
    expect(again.wa_id).toBe(first.wa_id)
    expect(await (await call('/whatsapp')).json()).toMatchObject([{ chats_in: 150, saved_contacts: 30, sw_views: 400, uploaded_contacts: 12, top_chats: [{ name: 'Bekam', count: 20 }], reservations: [{ name: 'Kosasih Medika Rajabasa', count: 9 }], unavailable: [{ name: 'Dokter X', count: 3 }] }])
    expect((await call(`/thumbs/${png}`)).status).toBe(404)
    expect((await call(`/whatsapp/${first.wa_id}`, 'DELETE')).status).toBe(204)
  })

  it('Laporan Google Maps: satu data per periode, gambar lama dibersihkan; rencana minggu depan; ENDORSMENT hanya Klinik', async () => {
    const up = async () => (await (await fetch(base + '/thumbs', { method: 'POST', headers: { 'content-type': 'image/png' }, body: new Uint8Array([137, 80, 78, 71, Math.random() * 255]) })).json()).file as string
    const [a, b] = [await up(), await up()]
    const m = { period_start: '2026-10-22', period_end: '2026-10-28', images: [a], s1: 1, s2: 2, s3: 3, s4: 4, s5: 5 }
    expect((await call('/maps', 'PUT', { ...m, s3: -1 })).status).toBe(400)
    expect((await call('/maps', 'PUT', { ...m, images: ['tidak-ada.png'] })).status).toBe(400)
    const first = await (await call('/maps', 'PUT', m)).json()
    const again = await (await call('/maps', 'PUT', { ...m, images: [b, a], s5: 9 })).json()
    const other = await (await call('/maps', 'PUT', { ...m, account: 'bekam', images: [] })).json()
    expect(other.map_id).not.toBe(first.map_id) // akun lain = data terpisah
    expect((await call('/maps', 'PUT', { ...m, account: 'aqur' })).status).toBe(400)
    expect((await call(`/maps/${other.map_id}`, 'DELETE')).status).toBe(204)
    expect(again.map_id).toBe(first.map_id) // periode sama = ganti, bukan dobel
    expect(await (await call('/maps')).json()).toMatchObject([{ s5: 9, images: [b, a] }])
    expect((await call(`/maps/${first.map_id}`, 'DELETE')).status).toBe(204)
    expect((await call(`/thumbs/${a}`)).status).toBe(404)
    expect((await call(`/thumbs/${b}`)).status).toBe(404)

    expect((await call('/summary', 'POST', { kind: 'minggu_depan', text: 'Live Giveaway', period_start: m.period_start, period_end: m.period_end })).status).toBe(201)
    const content = { account: 'bekam', platform: 'instagram', section: 'endorsement', url: 'https://www.instagram.com/p/abc/', views: 1, likes: 1, interactions: 1, period_start: m.period_start, period_end: m.period_end }
    expect((await call('/contents', 'POST', content)).status).toBe(400)
    expect((await call('/contents', 'POST', { ...content, account: 'klinik' })).status).toBe(201)
  })

  it('reservasi: irisan per periode; validasi; ubah dan hapus', async () => {
    const r = { kind: 'branch', name: 'Tirtayasa', count: 63, period_start: '2026-10-22', period_end: '2026-10-28' }
    expect((await call('/reservations', 'POST', { ...r, kind: 'lain' })).status).toBe(400)
    expect((await call('/reservations', 'POST', { ...r, count: -1 })).status).toBe(400)
    expect((await call('/reservations', 'POST', { ...r, count: 1.5 })).status).toBe(400)
    const made = await (await call('/reservations', 'POST', r)).json()
    expect((await call(`/reservations/${made.reservation_id}`, 'PUT', { ...r, count: 70 })).status).toBe(200)
    expect(await (await call('/reservations')).json()).toMatchObject([{ name: 'Tirtayasa', count: 70, kind: 'branch' }])
    expect((await call(`/reservations/${made.reservation_id}`, 'DELETE')).status).toBe(204)
    expect((await call(`/reservations/${made.reservation_id}`, 'DELETE')).status).toBe(404)
  })

  it('influencer: tambah, ubah, hapus, tetap ada setelah restart; validasi', async () => {
    expect((await call('/influencers', 'POST', { name: ' ' })).status).toBe(400)
    expect((await call('/influencers', 'POST', { name: 'Dr. Ani', followers: -1 })).status).toBe(400)
    const made = await (await call('/influencers', 'POST', { name: 'Dr. Ani', handle: '@ani', followers: 1200 })).json()
    expect((await call(`/influencers/${made.influencer_id}`, 'PUT', { name: 'Dr. Ani', followers: null, note: 'aktif' })).status).toBe(200)
    expect(await (await call('/influencers')).json()).toMatchObject([{ name: 'Dr. Ani', followers: null, note: 'aktif' }])
    expect((await call('/influencers/tidak-ada', 'DELETE')).status).toBe(404)
    expect((await call(`/influencers/${made.influencer_id}`, 'DELETE')).status).toBe(204)
    expect(await (await call('/influencers')).json()).toEqual([])
  })

  it('YouTube: waktu tonton desimal dan subscriber tersimpan serta dianalisis', async () => {
    const wk = (start: string, end: string, rec: string, hours: number, subs: number) => ({ ...input(start, end), recorded_at: rec, snapshot_date: rec, account: 'klinik', platform: 'youtube', metrics: { views: 100, watch_hours: hours, followers: subs } })
    expect((await call('/reports', 'POST', wk('2026-10-15', '2026-10-21', '2026-10-22', 10.5, 1000))).status).toBe(201)
    expect((await call('/reports', 'POST', wk('2026-10-22', '2026-10-28', '2026-10-29', 12.25, 1040))).status).toBe(201)
    const a = await (await call('/analytics?granularity=week&anchor=2026-10-29&account=klinik&platform=youtube')).json()
    expect(a.metrics.watch_hours.current.value).toBe(12.25)
    expect(a.metrics.watch_hours).toMatchObject({ gap: 1.75 })
    expect(a.followers.growth).toBe(40)
    // Audience YouTube: gender, umur, proporsi dan kata kunci penelusuran
    const aud = { gender: { women: 45.3, men: 54.7 }, age: { '25-34': 38.5 }, search_share: 58.3, search_terms: [{ name: 'asam urat', pct: 4.7 }, { name: 'gejala asam urat', pct: 3.7 }] }
    expect((await call('/reports', 'POST', { ...wk('2026-10-29', '2026-11-04', '2026-11-05', 5, 1100), audience: aud })).status).toBe(201)
    const b = await (await call('/analytics?granularity=week&anchor=2026-11-05&account=klinik&platform=youtube')).json()
    expect(b.audience.data).toMatchObject({ search_share: 58.3, gender: { women: 45.3 } })
    expect(b.audience.data.search_terms.map((t: { name: string }) => t.name)).toEqual(['asam urat', 'gejala asam urat'])
    expect((await call('/reports', 'POST', { ...wk('2026-11-05', '2026-11-11', '2026-11-12', 5, 1100), audience: { search_terms: [{ name: '', pct: 1 }] } })).status).toBe(400)
  })

  it('konten: kelompok Top 3 dan Endorsement terpisah, bertahan setelah restart', async () => {
    const c = { url: 'https://www.instagram.com/reel/abc/', views: 5, likes: 1, interactions: 2, period_start: '2026-10-22', period_end: '2026-10-28' }
    expect((await (await call('/contents', 'POST', c)).json()).section).toBe('top') // tanpa section = Top 3
    expect((await call('/contents', 'POST', { ...c, account: 'klinik', section: 'endorsement', views: 9 })).status).toBe(201)
    expect((await call('/contents', 'POST', { ...c, section: 'lain' })).status).toBe(400)
    await stop()
    await boot()
    const rows = await (await call('/contents')).json()
    expect(rows.map((r: { section: string; views: number }) => [r.section, r.views]).sort()).toEqual([['endorsement', 9], ['top', 5]])
  })

  it('TikTok: reward desimal dan pengikut neto boleh negatif', async () => {
    const wk = (start: string, end: string, rec: string, net: number, reward: number) => ({ ...input(start, end), recorded_at: rec, snapshot_date: rec, account: 'bekam', platform: 'tiktok', metrics: { views: 33800, profile_visits: 500, likes: 808, comments: 35, shares: 60, reward, net_followers: net, followers: 2773 } })
    expect((await call('/reports', 'POST', wk('2026-10-15', '2026-10-21', '2026-10-22', 18, 0))).status).toBe(201)
    expect((await call('/reports', 'POST', wk('2026-10-22', '2026-10-28', '2026-10-29', 24, 1.5))).status).toBe(201)
    expect((await call('/reports', 'POST', wk('2026-10-29', '2026-11-04', '2026-11-05', -7, 0))).status).toBe(201) // negatif sah
    expect((await call('/reports', 'POST', { ...wk('2026-11-05', '2026-11-11', '2026-11-12', 1, 0), metrics: { followers: 1, likes: -1 } })).status).toBe(400) // metrik lain tetap tak boleh negatif
    const a = await (await call('/analytics?granularity=week&anchor=2026-10-29&account=bekam&platform=tiktok')).json()
    expect(a.metrics.net_followers).toMatchObject({ gap: 6 })
    expect(a.metrics.reward.current.value).toBe(1.5)
  })

  it('menandai periode tumpang tindih', async () => {
    await call('/reports', 'POST', input('2026-10-01', '2026-10-31'))
    const r = await (await call('/reports', 'POST', input('2026-10-15', '2026-11-14'))).json()
    expect(r.warnings).toHaveLength(1)
    expect(r.report.status).toBe('needs_review')
  })


  it('workbook rusak: error jelas, file tidak ditimpa', async () => {
    const file = path.join(dir, 'instagram_analytics.xlsx')
    fs.writeFileSync(file, 'bukan excel')
    const r = await call('/reports', 'POST', input('2026-10-01', '2026-10-31'))
    expect(r.status).toBe(422)
    expect(fs.readFileSync(file, 'utf8')).toBe('bukan excel')
  })

  it('ekspor CSV dan analitik', async () => {
    await call('/reports', 'POST', input('2026-10-01', '2026-10-31'))
    const csv = await (await call('/export?format=csv')).text()
    expect(csv).toContain('period_start')
    expect(csv).toContain('2026-10-31')
    const a = await (await call('/analytics?granularity=month&anchor=2026-10-10')).json()
    expect(a.metrics.views.current).toEqual({ value: 100, status: 'ok' })
    expect((await call('/analytics?granularity=month')).status).toBe(400)
  })

  it('menolak Host non-localhost', async () => {
    const status = await new Promise<number>((resolve) => {
      http.get({ host: '127.0.0.1', port, path: '/api/health', headers: { host: 'evil.example' } }, (res) => resolve(res.statusCode!))
    })
    expect(status).toBe(403)
  })
})
