import { useEffect, useState, type ReactNode } from 'react'
import { DEF, type MetricKey } from '../../shared/metrics'
import { num } from '../format'
import { Field } from './ui'

export interface PercentGroup {
  id: string
  title: string
  /** Metrik total yang menjadi pembagi saat diisi dalam angka (Views, Viewers, atau Interactions). */
  total: MetricKey
  keys: readonly MetricKey[]
}

const round2 = (v: number) => Math.round(v * 100) / 100

/**
 * Persentase Instagram Insights, bisa diisi sebagai persen langsung atau sebagai angka
 * (mis. 12.000 dari 29.140 viewers). Yang tersimpan selalu persen: angka dikonversi terhadap totalnya.
 */
export default function PercentGroups({ groups, value, setPercent, totalOf, renderPercent }: {
  groups: readonly PercentGroup[]
  value: (k: MetricKey) => number | null
  setPercent: (k: MetricKey, v: number | null) => void
  totalOf: (k: MetricKey) => number | null
  renderPercent: (k: MetricKey) => ReactNode
}) {
  const [mode, setMode] = useState<Record<string, 'pct' | 'count'>>({})
  const [typed, setTyped] = useState<Partial<Record<MetricKey, string>>>({})
  const asCount = (g: PercentGroup) => (mode[g.id] ?? 'pct') === 'count'

  const convert = (k: MetricKey, text: string, total: number | null) => {
    const n = Number(text)
    if (text === '' || !total || !Number.isFinite(n) || n < 0) return null
    const p = round2((n / total) * 100)
    return p <= 100 ? p : null
  }

  // Total berubah saat mode angka: hitung ulang persen dari angka yang sudah diketik.
  const totalsKey = groups.map((g) => totalOf(g.total) ?? '').join('|')
  useEffect(() => {
    for (const g of groups) {
      if (!asCount(g)) continue
      for (const k of g.keys) if (typed[k] !== undefined) setPercent(k, convert(k, typed[k]!, totalOf(g.total)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalsKey])

  const switchTo = (g: PercentGroup, next: 'pct' | 'count') => {
    setMode((m) => ({ ...m, [g.id]: next }))
    if (next === 'pct') setTyped((t) => Object.fromEntries(Object.entries(t).filter(([k]) => !g.keys.includes(k as MetricKey))))
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const count = asCount(g)
        const total = totalOf(g.total)
        return (
          <div key={g.id}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{g.title}</p>
              <div role="group" aria-label={`Cara mengisi ${g.title}`} className="inline-flex rounded-full border border-slate-200 p-0.5 text-xs">
                {([['pct', 'Persen (%)'], ['count', 'Angka']] as const).map(([m, l]) => (
                  <button key={m} type="button" aria-pressed={(count ? 'count' : 'pct') === m} onClick={() => switchTo(g, m)} className={`rounded-full px-3 py-1 font-medium transition-colors ${(count ? 'count' : 'pct') === m ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
                ))}
              </div>
            </div>
            {count && !total && <p className="mb-2 text-xs text-amber-700">⚠ Isi <b>{DEF[g.total].label}</b> di atas dulu; angka dibagi dengan total itu untuk menjadi persen.</p>}
            <div className="grid gap-3 sm:grid-cols-3">
              {g.keys.map((k) => {
                if (!count) return renderPercent(k)
                const pct = value(k)
                const shown = typed[k] ?? (pct != null && total ? String(Math.round((pct * total) / 100)) : '')
                const over = !!total && shown !== '' && Number(shown) > total
                return (
                  <Field key={k} label={`${DEF[k].label} (angka)`} error={over ? `Melebihi total ${num(total!)}` : undefined} hint={pct != null && total ? `= ${num(pct, 2)}% dari ${num(total)}` : undefined}>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={shown}
                      onChange={(e) => {
                        setTyped((t) => ({ ...t, [k]: e.target.value }))
                        setPercent(k, convert(k, e.target.value, total))
                      }}
                    />
                  </Field>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
