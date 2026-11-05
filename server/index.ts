import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createApp } from './app'
import { createStore } from './store'

const root = path.resolve(import.meta.dirname, '..')
// .env sederhana (KEY=nilai) agar token Google Sheets tidak perlu diketik di terminal.
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile))
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
const { SHEET_URL, SHEET_TOKEN } = process.env
const dataDir = process.env.DATA_DIR ?? path.join(root, 'data')
const store = createStore(dataDir, SHEET_URL && SHEET_TOKEN ? { url: SHEET_URL, token: SHEET_TOKEN } : undefined)
await store.read() // buat workbook awal bila belum ada

// Kunci penanda sesi login: dari SESSION_SECRET, atau dibuat sekali dan disimpan di folder data.
const secretFile = path.join(dataDir, '.session_secret')
const secret = process.env.SESSION_SECRET ?? (fs.existsSync(secretFile) ? fs.readFileSync(secretFile, 'utf8').trim() : (() => {
  const s = crypto.randomBytes(32).toString('hex')
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(secretFile, s, { mode: 0o600 })
  return s
})())

const port = Number(process.env.PORT ?? 3001)
// Hanya loopback: API tidak terbuka ke jaringan.
createApp(store, path.join(root, 'dist'), secret).listen(port, '127.0.0.1', () => {
  console.log(`Instagram Analytics Dashboard: http://localhost:${port}`)
  console.log(`Database: ${store.file}`)
})
