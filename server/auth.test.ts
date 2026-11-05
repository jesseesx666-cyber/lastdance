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

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'iga-auth-'))
  server = createApp(createStore(dir), undefined, 'rahasia-tes').listen(0, '127.0.0.1')
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
})
afterEach(async () => {
  await new Promise((r) => server.close(r))
  fs.rmSync(dir, { recursive: true, force: true })
})

/** Klien kecil dengan cookie sesi sendiri. */
const client = () => {
  let cookie = ''
  return async (p: string, method = 'GET', body?: unknown) => {
    const r = await fetch(base + p, { method, headers: { 'content-type': 'application/json', cookie }, body: body ? JSON.stringify(body) : undefined })
    const set = r.headers.get('set-cookie')
    if (set) cookie = set.split(';')[0]
    return r
  }
}
const metrics = { views: 1, reach: 1, profile_visits: 1, external_link_taps: 1, interactions: 1, followers: null }
const report = { period_start: '2026-10-22', period_end: '2026-10-28', recorded_at: '2026-10-29', metrics }

describe('login dan peran', () => {
  it('belum login: semua ditolak; setup hanya sekali', async () => {
    const c = client()
    expect((await c('/reports')).status).toBe(401)
    expect(await (await c('/auth/state')).json()).toMatchObject({ needsSetup: true, user: null })
    expect((await c('/auth/setup', 'POST', { username: 'admin', password: 'abc' })).status).toBe(400)
    expect((await c('/auth/setup', 'POST', { username: 'Admin', password: 'password-kuat' })).status).toBe(201)
    expect((await client()('/auth/setup', 'POST', { username: 'lain', password: 'password-kuat' })).status).toBe(409)
    expect((await c('/reports')).status).toBe(200)
  })

  it('pengguna biasa: input, dashboard, dan Laporan (hanya lihat); super admin: semua', async () => {
    const admin = client()
    await admin('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })
    expect((await admin('/users', 'POST', { username: 'budi', password: 'password-budi', role: 'user' })).status).toBe(201)
    expect((await admin('/users', 'POST', { username: 'BUDI', password: 'password-budi' })).status).toBe(409)

    const u = client()
    expect((await u('/auth/login', 'POST', { username: 'budi', password: 'salah-salah' })).status).toBe(401)
    expect((await u('/auth/login', 'POST', { username: 'budi', password: 'password-budi' })).status).toBe(200)
    const created = await (await u('/reports', 'POST', report)).json()
    expect(created.report.report_id).toBeTruthy()
    expect((await u('/analytics?granularity=week&anchor=2026-10-29')).status).toBe(200)
    expect((await u('/contents')).status).toBe(200)
    expect((await u('/influencers', 'POST', { name: 'Dr. Ani', followers: 1200 })).status).toBe(201) // pengguna boleh menambah (Input Insights)
    expect((await u('/ads', 'POST', { account: 'bekam', image: 'tidak-ada.png' })).status).toBe(400) // lolos gerbang peran, ditolak validasi
    expect((await (await u('/influencers')).json())[0]).toMatchObject({ name: 'Dr. Ani', followers: 1200 }) // pengguna boleh melihat
    for (const [p, m] of [['/ads/x', 'DELETE'], ['/influencers/x', 'PUT'], ['/influencers/x', 'DELETE'],['/users', 'GET'], ['/settings', 'GET'], ['/audit', 'GET'], ['/export/workbook', 'GET'], [`/reports/${created.report.report_id}`, 'DELETE'], [`/reports/${created.report.report_id}`, 'PUT'], ['/contents/x', 'DELETE'], ['/users', 'POST'], ['/summary', 'POST'], ['/activities', 'POST'], ['/maps', 'PUT'], ['/web', 'PUT'], ['/whatsapp', 'PUT'], ['/maps/x', 'DELETE'], ['/web/x', 'DELETE'], ['/whatsapp/x', 'DELETE']] as const)
      expect((await u(p, m, m === 'GET' ? undefined : {})).status, `${m} ${p}`).toBe(403)

    for (const p of ['/summary', '/activities', '/maps', '/web', '/whatsapp']) expect((await u(p)).status, `GET ${p}`).toBe(200) // Laporan: pengguna boleh melihat
    expect((await admin(`/reports/${created.report.report_id}`, 'DELETE')).status).toBe(204)
    expect((await admin('/settings')).status).toBe(200)
  })

  it('pengguna biasa bisa melanjutkan laporan: hanya isian kosong yang terisi, nilai lama aman', async () => {
    const admin = client()
    await admin('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })
    await admin('/users', 'POST', { username: 'budi', password: 'password-budi', role: 'user' })
    const u = client()
    await u('/auth/login', 'POST', { username: 'budi', password: 'password-budi' })
    const { report: r } = await (await u('/reports', 'POST', { ...report, metrics: { ...metrics, views: 100, followers: null, patients: null }, notes: 'awal' })).json()
    const next = { ...report, snapshot_date: '2026-10-29', period_start: '2020-01-01', period_end: '2020-01-07', notes: 'baru', metrics: { ...metrics, views: 999, patients: 7, followers: 50 } }
    const res = await u(`/reports/${r.report_id}/continue`, 'POST', next)
    expect(res.status).toBe(200)
    const got = (await res.json()).report
    expect(got.metrics).toMatchObject({ views: 100, patients: 7, followers: 50 }) // views lama tetap, yang kosong terisi
    expect(got).toMatchObject({ notes: 'awal', period_start: report.period_start, period_end: report.period_end, report_id: r.report_id })
    expect((await u('/reports/tidak-ada/continue', 'POST', report)).status).toBe(404)
  })

  it('ringkasan eksekutif: super admin tambah, ubah, hapus; validasi teks', async () => {
    const a = client()
    await a('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })
    const body = { kind: 'capaian', text: '148 konten tercapai', period_start: '2026-10-22', period_end: '2026-10-28' }
    expect((await a('/summary', 'POST', { ...body, text: '  ' })).status).toBe(400)
    expect((await a('/summary', 'POST', { ...body, kind: 'lain' })).status).toBe(400)
    const item = await (await a('/summary', 'POST', body)).json()
    expect((await a(`/summary/${item.item_id}`, 'PUT', { ...body, text: 'diubah' })).status).toBe(200)
    expect((await (await a('/summary')).json())[0]).toMatchObject({ text: 'diubah', kind: 'capaian' })
    expect((await a(`/summary/${item.item_id}`, 'DELETE')).status).toBe(204)
    expect((await a(`/summary/${item.item_id}`, 'DELETE')).status).toBe(404)
  })

  it('rincian kegiatan: tambah, ubah, hapus; kegiatan wajib diisi', async () => {
    const a = client()
    await a('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })
    const body = { name: 'Konten Youtube: Afirmasi Positif', date_text: '22-28/10/2026', note: 'Uploaded', period_start: '2026-10-22', period_end: '2026-10-28' }
    expect((await a('/activities', 'POST', { ...body, name: ' ' })).status).toBe(400)
    const item = await (await a('/activities', 'POST', body)).json()
    expect((await a(`/activities/${item.activity_id}`, 'PUT', { ...body, note: 'Done' })).status).toBe(200)
    expect((await (await a('/activities')).json())[0]).toMatchObject({ note: 'Done', date_text: '22-28/10/2026' })
    expect((await a(`/activities/${item.activity_id}`, 'DELETE')).status).toBe(204)
    expect((await a(`/activities/${item.activity_id}`, 'DELETE')).status).toBe(404)
  })

  it('akun dihapus langsung kehilangan akses; super admin terakhir tidak bisa dihapus', async () => {
    const admin = client()
    const { user } = await (await admin('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })).json()
    const made = await (await admin('/users', 'POST', { username: 'budi', password: 'password-budi' })).json()
    const u = client()
    await u('/auth/login', 'POST', { username: 'budi', password: 'password-budi' })
    expect((await admin(`/users/${made.user_id}`, 'DELETE')).status).toBe(204)
    expect((await u('/reports')).status).toBe(401)
    expect((await admin(`/users/${user.user_id}`, 'DELETE')).status).toBe(400)
  })

  it('ganti password; hash tidak bocor; logout menghapus sesi; token palsu ditolak', async () => {
    const admin = client()
    await admin('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })
    const made = await (await admin('/users', 'POST', { username: 'budi', password: 'password-budi' })).json()
    expect(JSON.stringify(await (await admin('/users')).json())).not.toContain('password_hash')
    expect((await admin(`/users/${made.user_id}/password`, 'PUT', { password: 'baru-sekali-ya' })).status).toBe(204)
    const u = client()
    expect((await u('/auth/login', 'POST', { username: 'budi', password: 'password-budi' })).status).toBe(401)
    expect((await u('/auth/login', 'POST', { username: 'budi', password: 'baru-sekali-ya' })).status).toBe(200)
    await u('/auth/logout', 'POST')
    const forged = await fetch(base + '/reports', { headers: { cookie: 'ig_session=eyJ1IjoieCIsImUiOjk5OTk5OTk5OTl9.palsu' } })
    expect(forged.status).toBe(401)
  })

  it('5 percobaan gagal mengunci login sementara', async () => {
    const c = client()
    await c('/auth/setup', 'POST', { username: 'admin', password: 'password-kuat' })
    const t = client()
    for (let i = 0; i < 5; i++) expect((await t('/auth/login', 'POST', { username: 'admin', password: 'salah-salah' })).status).toBe(401)
    expect((await t('/auth/login', 'POST', { username: 'admin', password: 'password-kuat' })).status).toBe(429)
  })
})
