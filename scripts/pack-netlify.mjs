// Membuat folder netlify-deploy/ yang siap di-drag ke Netlify (tanpa GitHub): situs statis + fungsi API yang sudah di-bundle.
import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'

const root = path.join(import.meta.dirname, '..')
const out = path.join(root, 'netlify-deploy')
// Gambar lama (data/thumbs) dibundel ke fungsi agar langsung tampil tanpa unggah manual.
const thumbs = path.join(root, 'data', 'thumbs')
const seed = fs.existsSync(thumbs) ? Object.fromEntries(fs.readdirSync(thumbs).map((f) => [f, fs.readFileSync(path.join(thumbs, f)).toString('base64')])) : {}
fs.writeFileSync(path.join(root, 'netlify', 'seed-thumbs.json'), JSON.stringify(seed))
fs.rmSync(out, { recursive: true, force: true })
fs.cpSync(path.join(root, 'dist'), out, { recursive: true })
await build({ entryPoints: [path.join(root, 'netlify/functions/api.ts')], bundle: true, platform: 'node', format: 'cjs', target: 'node20', outfile: path.join(out, 'netlify/functions/api.js') })
fs.writeFileSync(path.join(out, 'netlify.toml'), `[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`)
console.log('Siap: ' + out)
