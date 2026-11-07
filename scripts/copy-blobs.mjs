// Menyalin semua gambar dari satu situs Netlify ke situs lain (nama file dipertahankan), plus gambar lama di data/thumbs.
// Pakai (Netlify token dibuat di User settings > Applications > Personal access tokens; Site ID di Site configuration):
//   NETLIFY_TOKEN=xxxx node scripts/copy-blobs.mjs <SITE_ID_SUMBER> <SITE_ID_TUJUAN>
// Tidak ada yang dihapus; gambar bernama sama di tujuan ditimpa dengan isi yang sama.
import fs from 'node:fs'
import path from 'node:path'
import { getStore } from '@netlify/blobs'

const [src, dst] = process.argv.slice(2)
const token = process.env.NETLIFY_TOKEN
if (!src || !dst || !token) {
  console.error('Pakai: NETLIFY_TOKEN=... node scripts/copy-blobs.mjs <SITE_ID_SUMBER> <SITE_ID_TUJUAN>')
  process.exit(1)
}
const from = getStore({ name: 'thumbs', siteID: src, token })
const to = getStore({ name: 'thumbs', siteID: dst, token })

let ok = 0, fail = 0
const put = async (key, data) => {
  try { await to.set(key, data); ok++ } catch (e) { fail++; console.error(`Gagal ${key}: ${e.message}`) }
}

for await (const page of from.list({ paginate: true }))
  for (const { key } of page.blobs) {
    const data = await from.get(key, { type: 'arrayBuffer' })
    if (data) await put(key, data)
    else console.error(`Kosong: ${key}`)
  }
console.log(`Dari situs sumber: ${ok} gambar disalin.`)

// Gambar lama yang dulu ikut terbundel di fungsi (dari data/thumbs di komputer ini).
const local = path.resolve(import.meta.dirname, '..', 'data', 'thumbs')
let extra = 0
if (fs.existsSync(local))
  for (const f of fs.readdirSync(local)) {
    const before = ok
    const b = fs.readFileSync(path.join(local, f))
    await put(f, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))
    if (ok > before) extra++
  }
console.log(`Dari data/thumbs lokal: ${extra} gambar.`)
console.log(`Selesai: ${ok} berhasil, ${fail} gagal.`)
