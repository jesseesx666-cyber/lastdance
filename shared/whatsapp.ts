import { z } from 'zod'
import { THUMB_RE } from './content'
import type { WebRow } from './website'

/** Laporan WhatsApp satu minggu laporan: angka chat, daftar peringkat, reservasi per cabang, dan gambar. */
export interface WaReport {
  wa_id: string
  period_start: string
  period_end: string
  chats_in: number
  saved_contacts: number
  sw_views: number
  uploaded_contacts: number
  top_chats: WebRow[]
  reservations: WebRow[]
  unavailable: WebRow[]
  images: string[]
  created_at: string
}

export const WA_TOP_MAX = 5

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
const total = z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif').max(1e9).default(0)
const rows = (max: number) => z.array(z.object({
  name: z.string().trim().min(1, 'Nama tidak boleh kosong').max(200),
  count: z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif').max(1e9),
})).max(max, `Maksimal ${max} baris`).default([])
export const waInputSchema = z.object({
  period_start: isoDate,
  period_end: isoDate,
  chats_in: total,
  saved_contacts: total,
  sw_views: total,
  uploaded_contacts: total,
  top_chats: rows(WA_TOP_MAX),
  reservations: rows(30),
  unavailable: rows(WA_TOP_MAX),
  images: z.array(z.string().regex(THUMB_RE, 'Nama file gambar tidak valid')).max(20, 'Maksimal 20 gambar').default([]),
})
export type WaInput = z.input<typeof waInputSchema>
