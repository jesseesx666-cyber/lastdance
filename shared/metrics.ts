import type { AccountId } from './accounts'
import type { PlatformId } from './platforms'
import type { Audience } from './audience'

export const METRIC_KEYS = [
  'views', 'reach', 'profile_visits', 'external_link_taps', 'interactions',
  'followers', 'likes', 'comments', 'shares', 'saves',
  'lead', 'cost_per_result', 'budget', 'amount_spent', 'impressions',
  'patients', 'revenue', 'avg_purchase', 'viewers',
  'views_followers_pct', 'views_nonfollowers_pct', 'viewers_reels_pct', 'viewers_post_pct', 'viewers_story_pct', 'interactions_reels_pct', 'interactions_post_pct', 'interactions_story_pct', 'watch_hours', 'reward', 'net_followers',
] as const
export type MetricKey = (typeof METRIC_KEYS)[number]

export interface MetricDef {
  key: MetricKey
  label: string
  type: 'activity' | 'snapshot'
  required: boolean
  /** Tidak boleh dijumlahkan antarperiode (akun unik, rasio/biaya per hasil). */
  unique?: boolean
  currency?: boolean
  /** Desimal diperbolehkan (nilai uang). */
  decimal?: boolean
  /** Persentase 0–100 dari Instagram Insights (pembagian, bukan total): tidak boleh dijumlahkan. */
  percent?: boolean
  /** Nilai dolar (TikTok reward): tampil dengan awalan $ dan dua desimal. */
  usd?: boolean
  /** Boleh negatif (selisih, misalnya pengikut neto). */
  signed?: boolean
}

export const METRICS: MetricDef[] = [
  { key: 'views', label: 'Views', type: 'activity', required: true },
  // Akun unik yang melihat konten: tidak dijumlahkan antarperiode, seperti reach.
  // Jam tonton YouTube: total yang boleh dijumlahkan antarperiode (desimal).
  { key: 'watch_hours', label: 'Waktu tonton (jam)', type: 'activity', required: false, decimal: true },
  { key: 'reward', label: 'Perkiraan reward ($)', type: 'activity', required: false, decimal: true, usd: true },
  { key: 'net_followers', label: 'Pengikut neto', type: 'activity', required: false, signed: true },
  { key: 'viewers', label: 'Viewers', type: 'activity', required: false, unique: true },
  { key: 'views_followers_pct', label: 'Views dari followers', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'views_nonfollowers_pct', label: 'Views dari non-followers', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'viewers_reels_pct', label: 'Views dari Reels', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'viewers_post_pct', label: 'Views dari Post', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'viewers_story_pct', label: 'Views dari Story', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'interactions_reels_pct', label: 'Interaksi dari Reels', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'interactions_post_pct', label: 'Interaksi dari Post', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'interactions_story_pct', label: 'Interaksi dari Story', type: 'activity', required: false, unique: true, decimal: true, percent: true },
  { key: 'reach', label: 'Reach', type: 'activity', required: false, unique: true },
  { key: 'profile_visits', label: 'Profile visits', type: 'activity', required: true },
  { key: 'external_link_taps', label: 'External link taps', type: 'activity', required: true },
  { key: 'interactions', label: 'Interactions', type: 'activity', required: true },
  { key: 'followers', label: 'Followers', type: 'snapshot', required: false },
  { key: 'likes', label: 'Likes', type: 'activity', required: false },
  { key: 'comments', label: 'Comments', type: 'activity', required: false },
  { key: 'shares', label: 'Shares', type: 'activity', required: false },
  { key: 'saves', label: 'Saves', type: 'activity', required: false },
  // Meta Ads (opsional: minggu tanpa iklan dibiarkan kosong)
  { key: 'lead', label: 'Lead', type: 'activity', required: false },
  { key: 'cost_per_result', label: 'Cost per result', type: 'activity', required: false, unique: true, currency: true, decimal: true },
  { key: 'budget', label: 'Budget', type: 'activity', required: false, currency: true, decimal: true },
  { key: 'amount_spent', label: 'Amount spent', type: 'activity', required: false, currency: true, decimal: true },
  { key: 'impressions', label: 'Impressions', type: 'activity', required: false },
  // Pendapatan
  { key: 'patients', label: 'Jumlah pasien', type: 'activity', required: false },
  { key: 'revenue', label: 'Pendapatan', type: 'activity', required: false, currency: true, decimal: true },
  { key: 'avg_purchase', label: 'Rata-rata pembelian pasien', type: 'activity', required: false, unique: true, currency: true, decimal: true },
]
export const DEF = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<MetricKey, MetricDef>
export const ACTIVITY_KEYS = METRICS.filter((m) => m.type === 'activity').map((m) => m.key)

export type ReportStatus = 'valid' | 'needs_review' | 'archived'

export interface Report {
  report_id: string
  account: AccountId
  platform: PlatformId
  audience: Audience
  period_start: string
  period_end: string
  recorded_at: string
  notes: string
  status: ReportStatus
  metrics: Record<MetricKey, number | null>
  snapshot_date: string | null
}
