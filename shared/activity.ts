import { z } from 'zod'

/** Satu baris Rincian Kegiatan, milik satu minggu laporan (Kamis–Rabu). `date_text` bebas ("22-28/10/2026", "29/10/2026"). */
export interface Activity {
  activity_id: string
  name: string
  date_text: string
  note: string
  period_start: string
  period_end: string
  created_at: string
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
export const activityInputSchema = z.object({
  name: z.string().trim().min(1, 'Kegiatan wajib diisi').max(600, 'Kegiatan maksimal 600 karakter'),
  date_text: z.string().trim().max(40, 'Tanggal maksimal 40 karakter').default(''),
  note: z.string().trim().max(300, 'Keterangan maksimal 300 karakter').default(''),
  period_start: isoDate,
  period_end: isoDate,
})
export type ActivityInput = z.input<typeof activityInputSchema>
