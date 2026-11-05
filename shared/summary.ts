import { z } from 'zod'

/** Tiga kolom Ringkasan Eksekutif. */
export const SUMMARY_COLUMNS = ['capaian', 'kendala', 'rencana'] as const
/** Ditambah daftar "Rencana Minggu Depan" yang memakai penyimpanan poin yang sama. */
export const SUMMARY_KINDS = [...SUMMARY_COLUMNS, 'minggu_depan'] as const
export type SummaryKind = (typeof SUMMARY_KINDS)[number]

/** Satu poin di salah satu kolom, milik satu minggu laporan (Kamis–Rabu). */
export interface SummaryItem {
  item_id: string
  kind: SummaryKind
  text: string
  period_start: string
  period_end: string
  created_at: string
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
export const summaryInputSchema = z.object({
  kind: z.enum(SUMMARY_KINDS),
  text: z.string().trim().min(1, 'Teks wajib diisi').max(500, 'Maksimal 500 karakter'),
  period_start: isoDate,
  period_end: isoDate,
})
export type SummaryInput = z.infer<typeof summaryInputSchema>
