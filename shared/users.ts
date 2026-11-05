import { z } from 'zod'

export type Role = 'admin' | 'user'
export const ROLE_LABEL: Record<Role, string> = { admin: 'Super admin', user: 'Pengguna' }

/** Akun tersimpan; password_hash tidak pernah dikirim ke browser. */
export interface User {
  user_id: string
  username: string
  role: Role
  password_hash: string
  created_at: string
}
export type PublicUser = Omit<User, 'password_hash'>

export const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,30}$/, 'Username 3–30 karakter: huruf, angka, titik, strip, garis bawah')
export const passwordSchema = z.string().min(4, 'Password minimal 4 karakter').max(100, 'Password maksimal 100 karakter')
export const loginSchema = z.object({ username: z.string().trim().toLowerCase(), password: z.string() })
export const newUserSchema = z.object({ username: usernameSchema, password: passwordSchema, role: z.enum(['admin', 'user']).default('user') })
