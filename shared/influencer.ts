import { z } from 'zod'

/** Hanya akun Klinik yang punya daftar influencer. */
export const INFLUENCER_ACCOUNT = 'klinik'

/** Satu influencer yang bekerja sama dengan klinik. `handle` bebas ("@nama" atau tautan profil). */
export interface Influencer {
  influencer_id: string
  name: string
  handle: string
  followers: number | null
  note: string
  created_at: string
}

export const influencerInputSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi').max(120, 'Nama maksimal 120 karakter'),
  handle: z.string().trim().max(200, 'Akun maksimal 200 karakter').default(''),
  followers: z.number().int('Followers harus bilangan bulat').min(0, 'Followers tidak boleh negatif').max(1e10).nullable().default(null),
  note: z.string().trim().max(300, 'Keterangan maksimal 300 karakter').default(''),
})
export type InfluencerInput = z.input<typeof influencerInputSchema>
