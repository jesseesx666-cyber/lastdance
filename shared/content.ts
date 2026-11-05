import { z } from 'zod'
import { DEFAULT_PLATFORM, PLATFORM_IDS, platformAllowed, type PlatformId } from './platforms'
import { ACCOUNT_IDS, DEFAULT_ACCOUNT, type AccountId } from './accounts'

/** Satu video/konten: link Instagram dan angka manual, dengan gambar sampul opsional untuk menutupi embed yang gagal. */
export interface Content {
  content_id: string
  account: AccountId
  platform: PlatformId
  /** Kelompok tampil: Top 3 Content atau Endorsement (daftar konten terpisah, bentuk sama). */
  section: ContentSection
  url: string
  /** Nama file gambar sampul di folder data/thumbs ('' bila tidak ada). */
  thumbnail: string
  title: string
  views: number
  likes: number
  interactions: number
  period_start: string
  period_end: string
}

/** Nama file gambar yang dibuat server: uuid + ekstensi gambar yang diizinkan (mencegah path traversal). SVG sengaja tidak diizinkan. */
export const THUMB_RE = /^[\w-]+\.(jpg|png|webp)$/i

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
const count = z
  .number({ invalid_type_error: 'Wajib diisi', required_error: 'Wajib diisi' })
  .int('Harus bilangan bulat')
  .nonnegative('Tidak boleh negatif')

// Hanya http(s): new URL() juga menerima "javascript:..." yang berbahaya sebagai href.
const httpUrl = (u: string) => {
  if (!/^https?:\/\//i.test(u)) return false
  try {
    new URL(u)
    return true
  } catch {
    return false
  }
}

export type ContentSection = 'top' | 'endorsement'

export const contentInputSchema = z
  .object({
    account: z.enum(ACCOUNT_IDS).default(DEFAULT_ACCOUNT),
    platform: z.enum(PLATFORM_IDS).default(DEFAULT_PLATFORM),
    section: z.enum(['top', 'endorsement']).default('top'),
    url: z.string().trim().min(1, 'Wajib diisi').max(500, 'Maksimal 500 karakter').refine(httpUrl, 'Link tidak valid, harus diawali http:// atau https://'),
    thumbnail: z.string().regex(THUMB_RE, 'Nama file gambar tidak valid').or(z.literal('')).default(''),
    title: z.string().trim().max(120, 'Maksimal 120 karakter').default(''),
    views: count,
    likes: count,
    interactions: count,
    period_start: isoDate,
    period_end: isoDate,
  })
  .refine((c) => c.period_start <= c.period_end, { path: ['period_end'], message: 'Tanggal akhir tidak boleh sebelum tanggal mulai' })
  .refine((c) => platformAllowed(c.account, c.platform), { path: ['platform'], message: 'Platform ini tidak dipakai oleh akun tersebut' })
  .refine((c) => c.section !== 'endorsement' || c.account === 'klinik', { path: ['section'], message: 'ENDORSMENT hanya untuk akun Klinik' })

export type ContentInput = z.infer<typeof contentInputSchema>
