import { z } from 'zod'
import { THUMB_RE } from './content'

export const WEBSITES = ['klinik', 'bekam', 'aqur'] as const
export type Website = (typeof WEBSITES)[number]
export const WEBSITE_LABEL: Record<Website, string> = { klinik: 'Klinik', bekam: 'Bekam', aqur: 'Aqur' }

/** Satu baris peringkat: nama halaman atau domain, dan jumlah kunjungan. */
export interface WebRow { name: string; count: number }

/** Laporan Website satu minggu laporan per website: gambar, visitor, view, Top Page, Top Article, Top Referrer. */
export interface WebReport {
  web_id: string
  site: Website
  period_start: string
  period_end: string
  images: string[]
  visitors: number
  views: number
  pages: WebRow[]
  articles: WebRow[]
  referrers: WebRow[]
  created_at: string
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
const rows = z.array(z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong').max(200),
  count: z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif').max(1e9),
})).max(50, 'Maksimal 50 baris').default([])
const total = z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif').max(1e9).default(0)
export const webInputSchema = z.object({
  site: z.enum(WEBSITES),
  period_start: isoDate,
  period_end: isoDate,
  images: z.array(z.string().regex(THUMB_RE, 'Nama file gambar tidak valid')).max(20, 'Maksimal 20 gambar').default([]),
  visitors: total,
  views: total,
  pages: rows,
  articles: rows,
  referrers: rows,
})
export type WebInput = z.input<typeof webInputSchema>
