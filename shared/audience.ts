import { z } from 'zod'
import { THUMB_RE } from './content'

/** Pita usia seperti di Instagram Insights → Audience. */
export const AGE_BANDS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'] as const
export type AgeBand = (typeof AGE_BANDS)[number]

export interface LocationRow {
  name: string
  pct: number
}

/** Data audiens satu laporan. Lokasi hanya per kota (Cities); kolom countries dari data lama diabaikan. Semua persentase 0–100; kosong = tidak diisi (bukan 0). */
export interface Audience {
  gender: { women: number | null; men: number | null }
  age: Record<AgeBand, number | null>
  cities: LocationRow[]
  /** Screenshot grafik pertumbuhan (file di folder data/thumbs); '' bila belum diunggah. */
  growth_image: string
  /** Screenshot insight beberapa postingan (Threads), maksimal 6; nama file di folder data/thumbs. */
  post_images: string[]
  /** YouTube: proporsi traffic dari penelusuran YouTube (%) dan kata kunci penelusuran teratas. */
  search_share: number | null
  search_terms: LocationRow[]
}

export const emptyAudience = (): Audience => ({
  gender: { women: null, men: null },
  age: Object.fromEntries(AGE_BANDS.map((b) => [b, null])) as Record<AgeBand, number | null>,
  cities: [],
  growth_image: '',
  post_images: [],
  search_share: null,
  search_terms: [],
})

export const hasAudience = (a: Audience) =>
  a.gender.women != null || a.gender.men != null || AGE_BANDS.some((b) => a.age[b] != null) || a.cities.length > 0 || a.growth_image !== '' || a.post_images.length > 0 || a.search_share != null || a.search_terms.length > 0

const pct = z.number({ invalid_type_error: 'Harus angka' }).min(0, 'Tidak boleh negatif').max(100, 'Maksimal 100%')
const optPct = pct.nullable().default(null)
const row = z.object({ name: z.string().trim().min(1, 'Nama wajib diisi').max(60, 'Maksimal 60 karakter'), pct })

export const audienceSchema = z
  .object({
    gender: z.object({ women: optPct, men: optPct }).default({ women: null, men: null }),
    age: z.object(Object.fromEntries(AGE_BANDS.map((b) => [b, optPct])) as Record<AgeBand, typeof optPct>).default(() => emptyAudience().age),
    cities: z.array(row).max(10, 'Maksimal 10 baris').default([]),
    growth_image: z.string().regex(THUMB_RE, 'Nama file gambar tidak valid').or(z.literal('')).default(''),
    search_share: optPct,
    search_terms: z.array(row).max(10, 'Maksimal 10 baris').default([]),
    post_images: z.array(z.string().regex(THUMB_RE, 'Nama file gambar tidak valid')).max(6, 'Maksimal 6 gambar').default([]),
  })
  .default(() => emptyAudience())
