import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createApp } from './app'
import { connectMySql, createSqlBackend } from './mysql'
import { createStore } from './store'

const root = path.resolve(import.meta.dirname, '..')
// .env sederhana (KEY=nilai) agar token Google Sheets tidak perlu diketik di terminal.
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile))
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
const { SHEET_URL, SHEET_TOKEN, DATABASE_URL } = process.env
const dataDir = process.env.DATA_DIR ?? path.join(root, 'data')
// DATABASE_URL (MySQL/MariaDB) didahulukan; tanpa itu: Google Sheets (SHEET_URL + SHEET_TOKEN); tanpa keduanya: file Excel lokal.
const db = DATABASE_URL ? createSqlBackend(await connectMySql(DATABASE_URL)) : undefined
const store = createStore(dataDir, !db && SHEET_URL && SHEET_TOKEN ? { url: SHEET_URL, token: SHEET_TOKEN } : undefined, undefined, db)
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
// Default hanya loopback (lokal). Di VPS di belakang nginx: HOST=127.0.0.1 tetap, tambah ALLOW_ANY_HOST=1 agar nama domain diterima.
const host = process.env.HOST ?? '127.0.0.1'
createApp(store, path.join(root, 'dist'), secret, process.env.ALLOW_ANY_HOST === '1').listen(port, host, () => {
  console.log(`Instagram Analytics Dashboard: http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`)
  console.log(`Database: ${store.file}`)
})
