import crypto from 'node:crypto'
import { promisify } from 'node:util'
import express from 'express'
import { loginSchema, newUserSchema, passwordSchema, type PublicUser, type Role, type User } from '../shared/users'
import { StoreError, type Store } from './store'

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
const COOKIE = 'ig_session'
const SESSION_SECONDS = 12 * 3600

export async function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16)
  return `scrypt$${salt.toString('base64')}$${(await scrypt(pw, salt, 32)).toString('base64')}`
}
export async function verifyPassword(pw: string, stored: string) {
  const [, salt, hash] = stored.split('$')
  if (!salt || !hash) return false
  const a = Buffer.from(hash, 'base64')
  return crypto.timingSafeEqual(a, await scrypt(pw, Buffer.from(salt, 'base64'), a.length))
}

const sign = (payload: string, secret: string) => crypto.createHmac('sha256', secret).update(payload).digest('base64url')
const makeToken = (uid: string, secret: string) => {
  const p = Buffer.from(JSON.stringify({ u: uid, e: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url')
  return `${p}.${sign(p, secret)}`
}
function readToken(token: string, secret: string): string | null {
  const [p, sig] = token.split('.')
  if (!p || !sig) return null
  const want = Buffer.from(sign(p, secret))
  const got = Buffer.from(sig)
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null
  try {
    const { u, e } = JSON.parse(Buffer.from(p, 'base64url').toString())
    return typeof u === 'string' && e > Date.now() / 1000 ? u : null
  } catch {
    return null
  }
}
const cookieOf = (header: string | undefined) => header?.split(';').map((s) => s.trim()).find((s) => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) ?? ''
const pub = ({ password_hash: _h, ...u }: User): PublicUser => u

/** Pengguna biasa boleh: input insight (laporan/konten baru), melihat dashboard dan halaman Laporan. Mengubah Laporan dan halaman lain khusus super admin. */
const USER_ALLOWED: [string, RegExp][] = [
  ['GET', /^\/(reports|contents|analytics|health|influencers|ads|reservations|summary|activities|maps|web|whatsapp)$/],
  ['POST', /^\/(reports|contents|thumbs|ads|influencers|reservations)$/],
  ['POST', /^\/reports\/[^/]+\/continue$/], // lanjut mengisi laporan yang ada: hanya isian kosong yang terisi
  ['GET', /^\/thumbs\/[^/]+$/],
  ['DELETE', /^\/thumbs\/[^/]+$/], // pembersihan unggahan yatim saat simpan gagal
]
const allowed = (role: Role, method: string, path: string) => role === 'admin' || USER_ALLOWED.some(([m, re]) => m === method && re.test(path))

declare module 'express-serve-static-core' {
  interface Request { user?: User }
}

export function createAuth(store: Store, secret: string) {
  const wrap = (fn: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
  const fails = new Map<string, { n: number; until: number }>() // cegah tebak password: 5 gagal = kunci 1 menit
  const router = express.Router()

  const startSession = (req: express.Request, res: express.Response, uid: string) => {
    const https = req.secure || req.headers['x-forwarded-proto'] === 'https'
    res.setHeader('Set-Cookie', `${COOKIE}=${makeToken(uid, secret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${https ? '; Secure' : ''}`)
  }
  const current = async (req: express.Request) => {
    const uid = readToken(cookieOf(req.headers.cookie), secret)
    return uid ? (await store.read()).users.find((u) => u.user_id === uid) : undefined
  }

  router.get('/auth/state', wrap(async (req, res) => {
    const d = await store.read()
    const user = await current(req)
    res.json({ needsSetup: d.users.length === 0, user: user ? pub(user) : null })
  }))

  router.post('/auth/setup', wrap(async (req, res) => {
    const p = newUserSchema.omit({ role: true }).safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const user: User = { user_id: crypto.randomUUID(), username: p.data.username, role: 'admin', password_hash: await hashPassword(p.data.password), created_at: new Date().toISOString() }
    await store.mutate((d) => {
      if (d.users.length) throw new StoreError('Super admin sudah dibuat.', 409)
      d.users.push(user)
    })
    startSession(req, res, user.user_id)
    res.status(201).json({ user: pub(user) })
  }))

  router.post('/auth/login', wrap(async (req, res) => {
    const p = loginSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: 'Username dan password wajib diisi.' })
    const f = fails.get(p.data.username)
    if (f && f.until > Date.now()) throw new StoreError('Terlalu banyak percobaan gagal. Coba lagi sekitar satu menit.', 429)
    const user = (await store.read()).users.find((u) => u.username === p.data.username)
    // Hash dicek juga untuk username tak dikenal agar waktu respons tidak membocorkan keberadaan akun.
    const ok = await verifyPassword(p.data.password, user?.password_hash ?? 'scrypt$AAAA$AAAA').catch(() => false)
    if (!user || !ok) {
      const n = (f?.n ?? 0) + 1
      fails.set(p.data.username, { n, until: n >= 5 ? Date.now() + 60_000 : 0 })
      throw new StoreError('Username atau password salah.', 401)
    }
    fails.delete(p.data.username)
    startSession(req, res, user.user_id)
    res.json({ user: pub(user) })
  }))

  router.post('/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`)
    res.status(204).end()
  })

  /** Semua rute selain /auth/* butuh login; peran pengguna dibatasi daftar USER_ALLOWED (default tolak). */
  const gate = wrap(async (req, res, next) => {
    if (req.path.startsWith('/auth/') || req.path === '/health') return next() // health tanpa login & tanpa membaca database: murah dan cepat
    const user = await current(req)
    if (!user) return void res.status(401).json({ error: 'Silakan login terlebih dahulu.' })
    if (!allowed(user.role, req.method, req.path)) return void res.status(403).json({ error: 'Anda tidak memiliki akses ke fitur ini.' })
    req.user = user
    next()
  })

  // Kelola akun (super admin saja; dijaga oleh gate karena tidak ada di USER_ALLOWED).
  router.get('/users', wrap(async (_req, res) => res.json((await store.read()).users.map(pub))))
  router.post('/users', wrap(async (req, res) => {
    const p = newUserSchema.safeParse(req.body)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const user: User = { user_id: crypto.randomUUID(), username: p.data.username, role: p.data.role, password_hash: await hashPassword(p.data.password), created_at: new Date().toISOString() }
    await store.mutate((d) => {
      if (d.users.some((u) => u.username === user.username)) throw new StoreError('Username sudah dipakai.', 409)
      d.users.push(user)
    })
    res.status(201).json(pub(user))
  }))
  router.put('/users/:id/password', wrap(async (req, res) => {
    const p = passwordSchema.safeParse(req.body?.password)
    if (!p.success) return void res.status(400).json({ error: p.error.issues[0].message })
    const hash = await hashPassword(p.data)
    await store.mutate((d) => {
      const u = d.users.find((x) => x.user_id === req.params.id)
      if (!u) throw new StoreError('Pengguna tidak ditemukan.', 404)
      u.password_hash = hash
    })
    res.status(204).end()
  }))
  router.delete('/users/:id', wrap(async (req, res) => {
    await store.mutate((d) => {
      const i = d.users.findIndex((x) => x.user_id === req.params.id)
      if (i < 0) throw new StoreError('Pengguna tidak ditemukan.', 404)
      if (d.users[i].role === 'admin' && d.users.filter((u) => u.role === 'admin').length === 1) throw new StoreError('Super admin terakhir tidak boleh dihapus.', 400)
      d.users.splice(i, 1)
    })
    res.status(204).end()
  }))

  return { gate, router }
}
