import { useEffect, useState } from 'react'
import type { Granularity } from '../../server/analytics'
import { useAccount, usePlatform } from '../account'
import { api } from '../api'
import AccountTabs from '../components/AccountTabs'
import { Alert, btn, Card, useAsync } from '../components/ui'
import { fmtRange, today } from '../format'
import { buildReport, downloadReport } from '../reportRows'

const GRAN: [Granularity, string][] = [['week', 'Mingguan'], ['month', 'Bulanan'], ['year', 'Tahunan']]

/** Versi teks dari dashboard: periode, perhitungan, dan sumber datanya sama persis (hasil /api/analytics yang sama). */
export default function ReportsPage() {
  const account = useAccount()
  const platform = usePlatform()
  const [g, setG] = useState<Granularity>('week')
  const [anchor, setAnchor] = useState(today())
  useEffect(() => {
    api.reports().then((rs) => {
      const mine = rs.filter((r) => r.account === account && r.platform === platform)
      setAnchor(mine.length ? mine.reduce((m, r) => (r.recorded_at > m ? r.recorded_at : m), '') : today())
    }, () => {})
  }, [account, platform])
  const { data: a, error } = useAsync(() => api.analytics({ granularity: g, anchor, account, platform }), [g, anchor, account, platform])
  const contents = useAsync(() => api.contents(), [])
  const sections = a ? buildReport(a, contents.data ?? [], account, platform) : []

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <AccountTabs />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Summary</h1>
          {a && <p className="text-sm text-slate-500">{fmtRange(a.range.from, a.range.to)} · dibandingkan dengan {fmtRange(a.previous.from, a.previous.to)}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Jenis periode" className="inline-flex rounded-full glass p-1">
            {GRAN.map(([k, l]) => (
              <button key={k} aria-pressed={g === k} onClick={() => setG(k)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${g === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
            ))}
          </div>
          <input type="date" aria-label="Tanggal acuan" className="!w-auto" value={anchor} onChange={(e) => e.target.value && setAnchor(e.target.value)} />
        </div>
      </div>
      {error && <Alert>{error}</Alert>}
      {g === 'month' && <p className="text-xs text-slate-500">Data bulanan diinput manual (tidak dari mingguan).</p>}
      {g === 'year' && <p className="text-xs text-slate-500">Tahunan: jumlah laporan bulanan; metrik yang tidak bisa dijumlahkan, top content, persentase, dan audience harus diinput manual.</p>}

      {a && (
        <>
          {sections.map((s) => (
            <Card key={s.title} title={s.title}>
              <table className="w-full text-sm">
                <tbody>
                  {s.rows.map((r, i) => (
                    <tr key={i} className="border-t border-slate-100 first:border-0">
                      <td className="py-1.5 pr-3">{r.name}</td>
                      <td className="text-right">{r.warn ? <span className="text-amber-700">⚠ {r.value}</span> : r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
          <button className={btn} onClick={() => downloadReport(a, contents.data ?? [], account, platform)}>Unduh laporan</button>
        </>
      )}
    </div>
  )
}
