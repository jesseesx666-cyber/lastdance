import { emptyAudience } from '../shared/audience'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { createStore } from './store'

/** Apps Script palsu: menyimpan sheet di memori, seperti Code.gs (token wajib, tulis = ganti seluruh sheet). */
const fakeScript = () => {
  const sheets: Record<string, unknown[][]> = {}
  const fetchFn = (async (_u: unknown, init: { body: string }) => {
    const req = JSON.parse(init.body)
    const reply = (o: unknown) => new Response(JSON.stringify(o))
    if (req.token !== 'rahasia') return reply({ error: 'Token salah.' })
    if (req.action === 'read') return reply({ sheets: structuredClone(sheets) })
    Object.assign(sheets, structuredClone(req.sheets))
    return reply({ ok: true, counts: Object.fromEntries(Object.entries(req.sheets as Record<string, unknown[]>).map(([n, r]) => [n, r.length])) })
  }) as unknown as typeof fetch
  return { sheets, fetchFn }
}
const report = { account: 'homecare', audience: emptyAudience(), period_start: '2026-10-22', period_end: '2026-10-28', recorded_at: '2026-10-29', notes: '=1+1', status: 'valid', snapshot_date: '2026-10-29' }

describe('Google Sheets sebagai database', () => {
  const dir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'iga-sheet-'))

  it('menulis dan membaca kembali lewat sheet', async () => {
    const { sheets, fetchFn } = fakeScript()
    const store = createStore(dir(), { url: 'x', token: 'rahasia', fetch: fetchFn })
    await store.read() // sheet kosong -> terisi header
    expect(sheets.Reports[0][0]).toBe('report_id')
    await store.mutate((d) => void d.reports.push({ ...report, report_id: 'r1', metrics: { views: 5 } } as never))
    expect(sheets.Reports).toHaveLength(2)
    // instance baru (server dihidupkan ulang) membaca data yang sama dari sheet
    const again = createStore(dir(), { url: 'x', token: 'rahasia', fetch: fetchFn })
    const [r] = (await again.read()).reports
    expect(r).toMatchObject({ report_id: 'r1', notes: '=1+1', recorded_at: '2026-10-29' })
    expect(r.metrics.views).toBe(5)
  })

  it('akun, ringkasan, kegiatan, dan platform ikut tersimpan di sheet', async () => {
    const { sheets, fetchFn } = fakeScript()
    const store = createStore(dir(), { url: 'x', token: 'rahasia', fetch: fetchFn })
    await store.mutate((d) => {
      d.users.push({ user_id: 'u1', username: 'admin', role: 'admin', password_hash: 'h', created_at: 't' })
      d.summary.push({ item_id: 's1', kind: 'achievement', text: 'ok', period_start: '2026-10-01', period_end: '2026-10-31', created_at: 't' } as never)
      d.activities.push({ activity_id: 'a1', name: 'k', date_text: '1', note: '', period_start: '2026-10-01', period_end: '2026-10-31', created_at: 't' })
      d.reports.push({ ...report, report_id: 'r1', platform: 'youtube', metrics: { views: 5 } } as never)
    })
    expect(Object.keys(sheets)).toEqual(expect.arrayContaining(['Users', 'Summary', 'Activities']))
    const back = await createStore(dir(), { url: 'x', token: 'rahasia', fetch: fetchFn }).read()
    expect([back.users.length, back.summary.length, back.activities.length, back.reports[0].platform]).toEqual([1, 1, 1, 'youtube'])
  })

  it('influencer, iklan, reservasi, Maps, Website, dan WhatsApp ikut tersimpan di sheet', async () => {
    const { sheets, fetchFn } = fakeScript()
    const store = createStore(dir(), { url: 'x', token: 'rahasia', fetch: fetchFn })
    const rows = [{ name: 'Beranda', count: 7 }]
    await store.mutate((d) => {
      d.reports.push({ ...report, report_id: 'r1', metrics: { views: 5 } } as never)
      d.influencers.push({ influencer_id: 'i1', name: 'A', handle: '@a', followers: 10, note: '', created_at: 't' })
      d.ads.push({ ad_id: 'ad1', account: 'bekam', image: 'x.png', created_at: 't' })
      d.reservations.push({ reservation_id: 'rv1', kind: 'branch', name: 'Rajabasa', count: 4, period_start: '2026-10-22', period_end: '2026-10-28', created_at: 't' })
      d.maps.push({ map_id: 'm1', account: 'bekam', period_start: '2026-10-22', period_end: '2026-10-28', images: ['a.png', 'b.png'], s1: 1, s2: 2, s3: 3, s4: 4, s5: 5, created_at: 't' })
      d.web.push({ web_id: 'w1', site: 'aqur', period_start: '2026-10-22', period_end: '2026-10-28', images: ['c.png'], visitors: 50, views: 90, pages: rows, articles: rows, referrers: rows, created_at: 't' })
      d.wa.push({ wa_id: 'wa1', period_start: '2026-10-22', period_end: '2026-10-28', chats_in: 1, saved_contacts: 2, sw_views: 3, uploaded_contacts: 4, top_chats: rows, reservations: rows, unavailable: rows, images: ['d.png'], created_at: 't' })
    })
    expect(Object.keys(sheets)).toEqual(expect.arrayContaining(['Influencers', 'Ads', 'Reservations', 'Maps', 'Website', 'WhatsApp']))
    const back = await createStore(dir(), { url: 'x', token: 'rahasia', fetch: fetchFn }).read()
    expect(back.influencers[0]).toMatchObject({ name: 'A', followers: 10 })
    expect(back.ads[0]).toMatchObject({ account: 'bekam', image: 'x.png' })
    expect(back.reservations[0]).toMatchObject({ name: 'Rajabasa', count: 4 })
    expect(back.maps[0]).toMatchObject({ account: 'bekam', images: ['a.png', 'b.png'], s5: 5 })
    expect(back.web[0]).toMatchObject({ site: 'aqur', visitors: 50, views: 90, pages: rows, articles: rows, referrers: rows })
    expect(back.wa[0]).toMatchObject({ chats_in: 1, uploaded_contacts: 4, top_chats: rows, reservations: rows, unavailable: rows, images: ['d.png'] })
  })

  it('hanya sheet yang berubah yang dikirim ke Google Sheets', async () => {
    const { sheets, fetchFn } = fakeScript()
    const sentNames: string[][] = []
    const spy = (async (u: unknown, init: { body: string }) => {
      const req = JSON.parse(init.body)
      if (req.action === 'write') sentNames.push(Object.keys(req.sheets))
      return fetchFn(u as never, init as never)
    }) as unknown as typeof fetch
    const store = createStore(dir(), { url: 'x', token: 'rahasia', fetch: spy })
    await store.read()
    sentNames.length = 0
    await store.mutate((d) => void d.users.push({ user_id: 'u1', username: 'a', role: 'user', password_hash: 'h', created_at: 't' }))
    expect(sentNames).toEqual([['Users']])
    expect(sheets.Users).toHaveLength(2)
  })

  it('gambar bisa disimpan di penyimpanan pengganti disk (Netlify Blobs)', async () => {
    const mem = new Map<string, Buffer>()
    const store = createStore(dir(), undefined, { set: async (k, d) => void mem.set(k, d), get: async (k) => mem.get(k) ?? null, delete: async (k) => void mem.delete(k) })
    const name = '182b1ba7-f7a8-4664-bf40-34eb9c3301c6.png'
    await store.saveThumb(name, Readable.from([Buffer.from('abc')]), 10)
    expect(await store.thumbExists(name)).toBe(true)
    expect((await store.readThumb(name))?.toString()).toBe('abc')
    await store.deleteThumb(name)
    expect(await store.thumbExists(name)).toBe(false)
    await expect(store.saveThumb(name, Readable.from([Buffer.alloc(11)]), 10)).rejects.toThrow(/melebihi/)
  })

  it('token salah ditolak dengan pesan jelas', async () => {
    const { fetchFn } = fakeScript()
    const store = createStore(dir(), { url: 'x', token: 'salah', fetch: fetchFn })
    await expect(store.read()).rejects.toThrow(/Token salah/)
  })

  it('sheet kosong mengimpor workbook lokal yang sudah ada', async () => {
    const d = dir()
    const local = createStore(d)
    await local.mutate((x) => void x.reports.push({ ...report, report_id: 'lama', metrics: { views: 9 } } as never))
    const { sheets, fetchFn } = fakeScript()
    const store = createStore(d, { url: 'x', token: 'rahasia', fetch: fetchFn })
    expect((await store.read()).reports.map((r) => r.report_id)).toEqual(['lama'])
    expect(sheets.Reports).toHaveLength(2)
  })
})
