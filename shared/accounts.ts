/** Akun Instagram yang dikelola. Semua laporan dan konten milik tepat satu akun. */
export const ACCOUNT_IDS = ['klinik', 'bekam', 'aqur', 'homecare', 'academy'] as const
export type AccountId = (typeof ACCOUNT_IDS)[number]

export const ACCOUNT_LABEL: Record<AccountId, string> = {
  klinik: 'Klinik',
  bekam: 'Bekam',
  aqur: 'Aqur',
  homecare: 'Homecare',
  academy: 'Academy',
}

/** Data yang diisi sebelum fitur multi-akun ada adalah akun Homecare. */
export const DEFAULT_ACCOUNT: AccountId = 'homecare'

export const isAccount = (v: unknown): v is AccountId => (ACCOUNT_IDS as readonly unknown[]).includes(v)
