import { z } from 'zod'
import { ACCOUNT_IDS } from './accounts'
import { THUMB_RE } from './content'

/** Satu gambar Iklan Aktif milik satu akun. `image` = nama file di folder gambar (hasil POST /thumbs). */
export interface Ad {
  ad_id: string
  account: string
  image: string
  created_at: string
}

export const adInputSchema = z.object({
  account: z.enum(ACCOUNT_IDS),
  image: z.string().regex(THUMB_RE, 'Nama file gambar tidak valid'),
})
export type AdInput = z.input<typeof adInputSchema>
