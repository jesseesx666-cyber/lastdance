// Salin gambar lokal (data/thumbs) ke Netlify Blobs. Pakai: NETLIFY_SITE_ID=... NETLIFY_TOKEN=... node scripts/upload-thumbs.mjs
import { getStore } from '@netlify/blobs'
import fs from 'node:fs'
import path from 'node:path'

const { NETLIFY_SITE_ID: siteID, NETLIFY_TOKEN: token } = process.env
if (!siteID || !token) throw new Error('Isi NETLIFY_SITE_ID dan NETLIFY_TOKEN.')
const store = getStore({ name: 'thumbs', siteID, token })
const dir = path.join(import.meta.dirname, '..', 'data', 'thumbs')
for (const f of fs.readdirSync(dir)) {
  await store.set(f, fs.readFileSync(path.join(dir, f)))
  console.log('terunggah', f)
}
