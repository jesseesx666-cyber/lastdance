import type { AccountId } from './accounts'
import type { MetricKey } from './metrics'

/** Platform sosial media. Laporan dan konten milik satu akun dan satu platform. */
export const PLATFORM_IDS = ['instagram', 'facebook', 'threads', 'tiktok', 'youtube'] as const
export type PlatformId = (typeof PLATFORM_IDS)[number]

export const PLATFORM_LABEL: Record<PlatformId, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  threads: 'Threads',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

/** Data yang diisi sebelum ada pilihan platform adalah Instagram. */
export const DEFAULT_PLATFORM: PlatformId = 'instagram'

/** Platform yang dipakai tiap akun. */
export const ACCOUNT_PLATFORMS: Record<AccountId, readonly PlatformId[]> = {
  klinik: ['instagram', 'facebook', 'threads', 'tiktok', 'youtube'],
  bekam: ['instagram', 'facebook', 'tiktok'],
  aqur: ['instagram', 'facebook', 'threads', 'youtube', 'tiktok'],
  homecare: ['instagram'],
  academy: ['instagram'],
}

/** Istilah Threads untuk metrik yang sama (Input dan Dashboard Threads). */
export const THREADS_LABEL: Partial<Record<MetricKey, string>> = { views: 'Dilihat', viewers: 'Pemirsa', profile_visits: 'Kunjungan Profil', followers: 'Pengikut' }

export const YOUTUBE_LABEL: Partial<Record<MetricKey, string>> = { views: 'Penayangan', watch_hours: 'Waktu Tonton (jam)', followers: 'Subscriber' }

export const TIKTOK_LABEL: Partial<Record<MetricKey, string>> = { views: 'Tayangan postingan', profile_visits: 'Tampilan Profil', likes: 'Suka', comments: 'Komentar', shares: 'Bagikan', reward: 'Perkiraan reward', followers: 'Jumlah pengikut', net_followers: 'Pengikut neto' }

/** Nama metrik menurut istilah platform (Instagram dan lainnya memakai nama bawaan). */
export const metricLabel = (platform: PlatformId, key: MetricKey, fallback: string) =>
  (platform === 'threads' ? THREADS_LABEL[key] : platform === 'youtube' ? YOUTUBE_LABEL[key] : platform === 'tiktok' ? TIKTOK_LABEL[key] : undefined) ?? fallback

export const isPlatform = (v: unknown): v is PlatformId => (PLATFORM_IDS as readonly unknown[]).includes(v)
export const platformAllowed = (account: AccountId, platform: PlatformId) => ACCOUNT_PLATFORMS[account].includes(platform)
