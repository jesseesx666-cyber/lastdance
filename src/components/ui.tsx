import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { num, pct, signed } from '../format'

export const btn = 'rounded-md border border-slate-300 bg-white/85 px-3 py-1.5 text-sm font-medium hover:bg-slate-100 disabled:opacity-50'
export const btnPrimary = 'rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50'

export const Card = ({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) => (
  <section className={`min-w-0 rounded-2xl glass p-4 ${className}`}>
    {title && <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>}
    {children}
  </section>
)

export const Alert = ({ kind = 'error', children }: { kind?: 'error' | 'warn' | 'info'; children: ReactNode }) => {
  const c = { error: 'border-red-300 bg-red-50 text-red-800', warn: 'border-amber-300 bg-amber-50 text-amber-900', info: 'border-sky-300 bg-sky-50 text-sky-900' }[kind]
  const icon = { error: '✕', warn: '⚠', info: 'ℹ' }[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`flex gap-2 rounded-md border px-3 py-2 text-sm ${c}`}>
      <span aria-hidden>{icon}</span>
      <div>{children}</div>
    </div>
  )
}

/** Naik/turun/tetap dinyatakan dengan ikon dan teks, bukan hanya warna. */
export function Delta({ gap, growth, note, suffix = '', digits = 0, lowerIsBetter = false }: { gap: number | null; growth?: number | null; note?: string; suffix?: string; digits?: number; lowerIsBetter?: boolean }) {
  if (gap == null) return <span className="text-xs text-slate-500">Belum ada pembanding</span>
  const [good, bad] = lowerIsBetter ? ['bg-red-50 text-red-700', 'bg-emerald-100 text-emerald-700'] : ['bg-emerald-100 text-emerald-700', 'bg-red-50 text-red-700']
  const [cls, icon, word] = gap > 0 ? [good, '▲', 'Naik'] : gap < 0 ? [bad, '▼', 'Turun'] : ['bg-slate-100 text-slate-600', '●', 'Tetap']
  return (
    <span className={`inline-flex items-center gap-x-1 whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-medium sm:px-2.5 sm:text-xs ${cls}`}>
      <span aria-hidden>{icon}</span>
      {word} {signed(gap, digits)}
      {suffix}
      {growth !== undefined && <> ({note === 'na_zero' ? 'N/A' : growth == null ? '–' : signed(growth, 1) + '%'})</>}
    </span>
  )
}

export const Field = ({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) => (
  <label className="block text-sm">
    <span className="mb-1 block font-medium text-slate-700">{label}</span>
    {children}
    {hint && !error && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
    {error && <span role="alert" className="mt-0.5 block text-xs text-red-700">✕ {error}</span>}
  </label>
)

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={title} className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-t-xl bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-3 text-lg font-semibold">{title}</h2>
        {children}
      </div>
    </div>
  )
}

const ToastCtx = createContext<(m: string) => void>(() => {})
export const useToast = () => useContext(ToastCtx)
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(''), 4000)
    return () => clearTimeout(t)
  }, [msg])
  return (
    <ToastCtx.Provider value={setMsg}>
      {children}
      {msg && <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-md bg-slate-900 px-4 py-2 text-sm text-white md:bottom-6">✓ {msg}</div>}
    </ToastCtx.Provider>
  )
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, set] = useState<{ data?: T; error?: string; loading: boolean }>({ loading: true })
  const [tick, setTick] = useState(0)
  useEffect(() => {
    let live = true
    set((s) => ({ ...s, loading: true, error: undefined }))
    fn().then(
      (data) => live && set({ data, loading: false }),
      (e: Error) => live && set({ error: e.message, loading: false }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])
  return { ...state, reload: () => setTick((t) => t + 1) }
}

export { num, pct }

/** Wadah per judul (dipakai Dashboard dan Ringkasan Eksekutif). */
export const Panel = ({ children }: { children: ReactNode }) => <section className="panel space-y-6 p-3 sm:p-5">{children}</section>
export const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
    {children}
  </div>
)
export const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Panel>
    <Block title={title}>{children}</Block>
  </Panel>
)
