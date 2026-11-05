import { connectLambda, getStore } from '@netlify/blobs'
import serverless from 'serverless-http'
import seed from '../seed-thumbs.json'
import { createApp } from '../../server/app'
import { createStore } from '../../server/store'

const { SHEET_URL, SHEET_TOKEN, SESSION_SECRET } = process.env
if (!SHEET_URL || !SHEET_TOKEN || !SESSION_SECRET) throw new Error('Isi environment variable SHEET_URL, SHEET_TOKEN, dan SESSION_SECRET di Netlify.')

const images = () => getStore('thumbs') // dibuat saat dipakai: konfigurasi Blobs baru tersedia dalam permintaan
const store = createStore('/tmp/data', { url: SHEET_URL, token: SHEET_TOKEN }, {
  set: async (k, d) => void (await images().set(k, d as unknown as ArrayBuffer)),
  // Gambar lama ikut terbundel di seed-thumbs.json (dari data/thumbs); gambar baru ada di Blobs.
  get: async (k) => {
    const b = await Promise.resolve().then(() => images().get(k, { type: 'arrayBuffer' })).catch(() => null)
    const old = (seed as Record<string, string>)[k]
    return b ? Buffer.from(b) : old ? Buffer.from(old, 'base64') : null
  },
  delete: (k) => images().delete(k),
})
const run = serverless(createApp(store, undefined, SESSION_SECRET, true), { binary: ['image/*', 'application/octet-stream', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] }) // tanpa ini gambar/xlsx dikirim sebagai teks dan rusak

// Netlify mengirim jalur /.netlify/functions/api/...; aplikasi memakai /api/....
export const handler = (event: { path: string }, ctx: object) => {
  if ((event as { blobs?: string }).blobs) connectLambda(event as never) // fungsi gaya Lambda: Blobs baru terkonfigurasi setelah ini
  return run({ ...event, path: '/api' + event.path.replace(/^(\/\.netlify\/functions\/api)?(\/api)?/, '') }, ctx)
}
