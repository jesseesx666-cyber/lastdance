/**
 * Terapkan db/schema.sql ke database MySQL tujuan.
 * Pakai: DATABASE_URL=mysql://user:pass@host:3306/lastdance npm run db:setup
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import mysql from 'mysql2/promise'
import { mysqlConfig } from '../server/mysql'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diisi. Contoh: mysql://user:pass@host:3306/lastdance')
  process.exit(1)
}

const sql = await fs.readFile(path.join(import.meta.dirname, '..', 'db', 'schema.sql'), 'utf8')
const conn = await mysql.createConnection({ ...mysqlConfig(url, process.env.DATABASE_SSL === '1'), multipleStatements: true })
try {
  await conn.query(sql)
  const [rows] = await conn.query('SHOW TABLES')
  console.log('Skema diterapkan. Tabel:', (rows as Record<string, string>[]).map((r) => Object.values(r)[0]).join(', '))
} catch (e) {
  console.error('Gagal menerapkan skema:', (e as Error).message)
  process.exitCode = 1
} finally {
  await conn.end()
}
