import { useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'
/** Pilihan pengguna untuk latar animasi dan efek kaca. */
export type FxPref = 'auto' | 'full' | 'lite' | 'off'
/** Mode yang benar-benar dipakai setelah 'auto' diputuskan. */
export type Fx = 'full' | 'lite' | 'off'

const THEME_KEY = 'theme'
const FX_KEY = 'fx'

const load = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const save = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* penyimpanan diblokir: pilihan tetap berlaku sampai halaman dimuat ulang */
  }
}

/** Perangkat lemah: RAM/CPU kecil, mode hemat data, layar ponsel, atau minta gerakan dikurangi. */
const isLowEnd = () => {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  return (
    (n.deviceMemory ?? 8) <= 4 ||
    (n.hardwareConcurrency ?? 8) <= 4 ||
    n.connection?.saveData === true ||
    matchMedia('(max-width: 767px)').matches ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

let theme: Theme = load(THEME_KEY) === 'light' ? 'light' : 'dark'
let fxPref: FxPref = (['full', 'lite', 'off'] as const).find((v) => v === load(FX_KEY)) ?? 'auto'
const autoFx: Fx = isLowEnd() ? 'lite' : 'full'
const resolve = (): Fx => (fxPref === 'auto' ? autoFx : fxPref)

const subs = new Set<() => void>()
const apply = () => {
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.fx = resolve()
}
apply()

const subscribe = (cb: () => void) => (subs.add(cb), () => subs.delete(cb))

export const setTheme = (t: Theme) => {
  theme = t
  apply()
  save(THEME_KEY, t)
  subs.forEach((f) => f())
}
export const useTheme = () => useSyncExternalStore(subscribe, () => theme)

export const setFxPref = (p: FxPref) => {
  fxPref = p
  apply()
  save(FX_KEY, p)
  subs.forEach((f) => f())
}
export const useFxPref = () => useSyncExternalStore(subscribe, () => fxPref)
export const useFx = () => useSyncExternalStore(subscribe, resolve)
export const detectedFx = autoFx

/** Warna grafik (hex karena dipakai langsung oleh Recharts). */
export const PALETTE = {
  dark: { cur: '#c8f23d', prev: '#a78bfa', third: '#22d3ee', rest: '#4a4a55', axis: '#9b9ba5', axisLine: '#4a4a52', grid: '#35353b', tipBg: '#2c2c31', tipBorder: '#4a4a52', tipText: '#ececf0', cursor: '#ffffff14' },
  light: { cur: '#4f46e5', prev: '#a5b4fc', third: '#0891b2', rest: '#cbd5e1', axis: '#64748b', axisLine: '#cbd5e1', grid: '#e2e8f0', tipBg: '#ffffff', tipBorder: '#e2e8f0', tipText: '#1e293b', cursor: '#0f172a0d' },
} as const
