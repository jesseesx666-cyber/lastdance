import { z } from 'zod'
import { THUMB_RE } from './content'

export const MAPS_ACCOUNTS = ['klinik', 'bekam'] as const
export type MapsAccount = (typeof MAPS_ACCOUNTS)[number]

/** Laporan Google Maps satu minggu laporan per akun (Klinik atau Bekam): beberapa gambar dan jumlah ulasan per bintang. */
export interface MapsReport {
  map_id: string
  account: MapsAccount
  period_start: string
  period_end: string
  images: string[]
  s1: number
  s2: number
  s3: number
  s4: number
  s5: number
  created_at: string
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
const stars = z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif').max(1e6)
export const mapsInputSchema = z.object({
  account: z.enum(MAPS_ACCOUNTS).default('klinik'),
  period_start: isoDate,
  period_end: isoDate,
  images: z.array(z.string().regex(THUMB_RE, 'Nama file gambar tidak valid')).max(20, 'Maksimal 20 gambar').default([]),
  s1: stars,
  s2: stars,
  s3: stars,
  s4: stars,
  s5: stars,
})
export type MapsInput = z.input<typeof mapsInputSchema>
