import { connectLambda, getStore } from '@netlify/blobs'
import serverless from 'serverless-http'
import { createApp } from '../../server/app'
import { connectMySql, createSqlBackend } from '../../server/mysql'
import { createStore } from '../../server/store'

const { SHEET_URL, SHEET_TOKEN, SESSION_SECRET, DATABASE_URL } = process.env
if (!SESSION_SECRET || (!DATABASE_URL && (!SHEET_URL || !SHEET_TOKEN))) throw new Error('Isi environment variable SESSION_SECRET dan DATABASE_URL (MySQL), atau SHEET_URL + SHEET_TOKEN (Google Sheets) di Netlify.')

// File ini dibuat oleh `npm run pack:netlify` (tidak ada di repo); bila tidak ada, gambar hanya dari Blobs.
let seed: Record<string, string> = {}
try { seed = require('../seed-thumbs.json') } catch { /* tidak ada seed */ }

const images = () => getStore('thumbs') // dibuat saat dipakai: konfigurasi Blobs baru tersedia dalam permintaan
// Koneksi MySQL dibuat saat dipakai pertama kali (top-level await tidak tersedia di bundel cjs).
let sqlPromise: ReturnType<typeof connectMySql> | undefined
const lazySql = (): ReturnType<typeof connectMySql> => (sqlPromise ??= connectMySql(DATABASE_URL!))
const db = DATABASE_URL ? createSqlBackend({ query: async (s, v) => (await lazySql()).query(s, v), transaction: async (fn) => (await lazySql()).transaction(fn) }) : undefined
const store = createStore('/tmp/data', db ? undefined : { url: SHEET_URL!, token: SHEET_TOKEN! }, {
  set: async (k, d) => void (await images().set(k, d as unknown as ArrayBuffer)),
  // Gambar lama ikut terbundel di seed-thumbs.json (dari data/thumbs); gambar baru ada di Blobs.
  get: async (k) => {
    const b = await Promise.resolve().then(() => images().get(k, { type: 'arrayBuffer' })).catch(() => null)
    const old = seed[k]
    return b ? Buffer.from(b) : old ? Buffer.from(old, 'base64') : null
  },
  delete: (k) => images().delete(k),
}, db)
const run = serverless(createApp(store, undefined, SESSION_SECRET, true), { binary: ['image/*', 'application/octet-stream', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] }) // tanpa ini gambar/xlsx dikirim sebagai teks dan rusak

// Netlify mengirim jalur /.netlify/functions/api/...; aplikasi memakai /api/....
export const handler = (event: { path: string }, ctx: object) => {
  if ((event as { blobs?: string }).blobs) connectLambda(event as never) // fungsi gaya Lambda: Blobs baru terkonfigurasi setelah ini
  return run({ ...event, path: '/api' + event.path.replace(/^(\/\.netlify\/functions\/api)?(\/api)?/, '') }, ctx)
}
