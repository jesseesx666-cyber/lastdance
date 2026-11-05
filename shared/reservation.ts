import { z } from 'zod'

/** Hanya akun Bekam yang punya container Reservasi. */
export const RESERVATION_ACCOUNT = 'bekam'

/** `branch` = reservasi per cabang; `treatment` = tindakan gabungan semua cabang. */
export const RESERVATION_KINDS = ['branch', 'treatment'] as const
export type ReservationKind = (typeof RESERVATION_KINDS)[number]

/** Satu irisan diagram (nama cabang atau nama tindakan beserta jumlahnya) untuk satu periode. */
export interface Reservation {
  reservation_id: string
  kind: ReservationKind
  name: string
  count: number
  period_start: string
  period_end: string
  created_at: string
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
export const reservationInputSchema = z.object({
  kind: z.enum(RESERVATION_KINDS),
  name: z.string().trim().min(1, 'Nama wajib diisi').max(80, 'Nama maksimal 80 karakter'),
  count: z.number().int('Jumlah harus bilangan bulat').min(0, 'Jumlah tidak boleh negatif').max(1e7),
  period_start: isoDate,
  period_end: isoDate,
})
export type ReservationInput = z.input<typeof reservationInputSchema>
