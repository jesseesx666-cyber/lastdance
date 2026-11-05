import { connectLambda, getStore } from '@netlify/blobs'
import serverless from 'serverless-http'
import seed from '../seed-thumbs.json'
import { createApp } from '../../server/app'
import { createMysqlPool, createMysqlStore } from '../../server/mysql'
import { createStore } from '../../server/store'

const { SHEET_URL, SHEET_TOKEN, SESSION_SECRET, DATABASE_URL, DATABASE_SSL } = process.env
if (!SESSION_SECRET) throw new Error('Isi environment variable SESSION_SECRET di Netlify.')
if (!DATABASE_URL && (!SHEET_URL || !SHEET_TOKEN))
  throw new Error('Isi DATABASE_URL (MySQL), atau SHEET_URL + SHEET_TOKEN untuk mode Google Sheets.')

const images = () => getStore('thumbs') // dibuat saat dipakai: konfigurasi Blobs baru tersedia dalam permintaan
const blobs = {
  set: async (k: string, d: Buffer) => void (await images().set(k, d as unknown as ArrayBuffer)),
  // Gambar lama ikut terbundel di seed-thumbs.json (dari data/thumbs); gambar baru ada di Blobs.
  get: async (k: string) => {
    const b = await Promise.resolve().then(() => images().get(k, { type: 'arrayBuffer' })).catch(() => null)
    const old = (seed as Record<string, string>)[k]
    return b ? Buffer.from(b) : old ? Buffer.from(old, 'base64') : null
  },
  delete: (k: string) => images().delete(k),
}

// MySQL bila DATABASE_URL diisi; Google Sheets tetap didukung sebagai cadangan.
const store = DATABASE_URL
  ? createMysqlStore(createMysqlPool(DATABASE_URL, DATABASE_SSL === '1'), { dir: '/tmp/data', blobs })
  : createStore('/tmp/data', { url: SHEET_URL!, token: SHEET_TOKEN! }, blobs)

const run = serverless(createApp(store, undefined, SESSION_SECRET, true), { binary: ['image/*', 'application/octet-stream', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] }) // tanpa ini gambar/xlsx dikirim sebagai teks dan rusak

// Netlify mengirim jalur /.netlify/functions/api/...; aplikasi memakai /api/....
export const handler = (event: { path: string }, ctx: object) => {
  if ((event as { blobs?: string }).blobs) connectLambda(event as never) // fungsi gaya Lambda: Blobs baru terkonfigurasi setelah ini
  return run({ ...event, path: '/api' + event.path.replace(/^(\/\.netlify\/functions\/api)?(\/api)?/, '') }, ctx)
}
