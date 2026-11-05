import { useSyncExternalStore } from 'react'
import { DEFAULT_ACCOUNT, isAccount, type AccountId } from '../shared/accounts'
import { DEFAULT_PLATFORM, isPlatform, platformAllowed, type PlatformId } from '../shared/platforms'

// Akun yang sedang dilihat/diisi: satu pilihan untuk seluruh aplikasi, diingat di browser.
const KEY = 'account'
const load = (): AccountId => {
  try {
    const v = localStorage.getItem(KEY)
    return isAccount(v) ? v : DEFAULT_ACCOUNT
  } catch {
    return DEFAULT_ACCOUNT
  }
}

const PKEY = 'platform'
const loadPlatform = (a: AccountId): PlatformId => {
  try {
    const v = localStorage.getItem(PKEY)
    return isPlatform(v) && platformAllowed(a, v) ? v : DEFAULT_PLATFORM
  } catch {
    return DEFAULT_PLATFORM
  }
}

let current = load()
let platform = loadPlatform(current)
const subs = new Set<() => void>()

export const getAccount = () => current
export const setAccount = (a: AccountId) => {
  if (a === current) return
  current = a
  if (!platformAllowed(a, platform)) platform = DEFAULT_PLATFORM // platform lama tidak dipakai akun baru
  try {
    localStorage.setItem(KEY, a)
    localStorage.setItem(PKEY, platform)
  } catch {
    /* penyimpanan diblokir: pilihan tetap berlaku sampai halaman dimuat ulang */
  }
  subs.forEach((f) => f())
}
/** Platform sosial media yang sedang dilihat/diisi (di bawah akun). */
export const getPlatform = () => platform
export const setPlatform = (p: PlatformId) => {
  if (p === platform || !platformAllowed(current, p)) return
  platform = p
  try {
    localStorage.setItem(PKEY, p)
  } catch {
    /* penyimpanan diblokir */
  }
  subs.forEach((f) => f())
}
export const usePlatform = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => platform)
export const useAccount = () => useSyncExternalStore((cb) => (subs.add(cb), () => subs.delete(cb)), () => current)
