import { z } from 'zod'
import { ACCOUNT_IDS, DEFAULT_ACCOUNT } from './accounts'
import { DEFAULT_PLATFORM, PLATFORM_IDS, platformAllowed } from './platforms'
import { audienceSchema } from './audience'
import { METRICS, type MetricKey } from './metrics'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
const count = (required: boolean, decimal = false, percent = false, signed = false) => {
  const base = z.number({ invalid_type_error: 'Wajib diisi', required_error: 'Wajib diisi' })
  const whole = decimal ? base : base.int('Harus bilangan bulat')
  const plain = signed ? whole : whole.nonnegative('Tidak boleh negatif')
  const n = percent ? plain.max(100, 'Maksimal 100%') : plain
  return required ? n : n.nullable().default(null)
}

const metricShape = Object.fromEntries(METRICS.map((m) => [m.key, count(false, m.decimal, m.percent, m.signed)])) as Record<
  MetricKey,
  ReturnType<typeof count>
>

export const reportInputSchema = z
  .object({
    account: z.enum(ACCOUNT_IDS).default(DEFAULT_ACCOUNT),
    platform: z.enum(PLATFORM_IDS).default(DEFAULT_PLATFORM),
    audience: audienceSchema,
    period_start: isoDate,
    period_end: isoDate,
    recorded_at: isoDate,
    notes: z.string().max(500, 'Maksimal 500 karakter').default(''),
    status: z.enum(['valid', 'needs_review', 'archived']).optional(),
    snapshot_date: isoDate.nullable().default(null),
    metrics: z.object(metricShape),
  })
  .superRefine((r, ctx) => {
    // Metrik Instagram boleh dikosongkan: laporan bisa disimpan dulu dan dilengkapi nanti (cicil). Platform lain wajib follower.
    if (r.platform !== 'instagram' && r.metrics.followers == null) ctx.addIssue({ code: 'custom', path: ['metrics', 'followers'], message: 'Wajib diisi' })
    if (!platformAllowed(r.account, r.platform)) ctx.addIssue({ code: 'custom', path: ['platform'], message: 'Platform ini tidak dipakai oleh akun tersebut' })
    if (r.period_start > r.period_end)
      ctx.addIssue({ code: 'custom', path: ['period_end'], message: 'Tanggal akhir tidak boleh sebelum tanggal mulai' })
    if (r.metrics.followers != null && !r.snapshot_date)
      ctx.addIssue({ code: 'custom', path: ['snapshot_date'], message: 'Wajib diisi untuk followers' })
  })

export type ReportInput = z.infer<typeof reportInputSchema>
