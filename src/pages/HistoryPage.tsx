import { useMemo, useState } from 'react'
import type { Report } from '../../shared/metrics'
import { useAccount, usePlatform } from '../account'
import { api } from '../api'
import { useAuth } from '../auth'
import AccountTabs from '../components/AccountTabs'
import { Alert, btn, btnPrimary, useAsync, useToast } from '../components/ui'
import { fmtDate, fmtRange, num, REPORT_STATUS } from '../format'

type SortKey = 'period_start' | 'recorded_at' | 'views' | 'reach' | 'interactions' | 'status'
const val = (r: Report, k: SortKey) => (k === 'views' || k === 'reach' || k === 'interactions' ? r.metrics[k] ?? -1 : r[k])
const BADGE: Record<string, string> = { valid: 'bg-emerald-100 text-emerald-800', needs_review: 'bg-amber-100 text-amber-900', archived: 'bg-slate-200 text-slate-700' }

export default function HistoryPage() {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const account = useAccount()
  const platform = usePlatform()
  const { data, error, loading, reload } = useAsync(() => api.reports(), [])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: 'period_start', dir: -1 })
  const [failure, setFailure] = useState('')

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (data ?? [])
      .filter((r) => r.account === account && r.platform === platform && (!status || r.status === status) && (!t || `${r.period_start} ${r.period_end} ${fmtRange(r.period_start, r.period_end)} ${r.notes}`.toLowerCase().includes(t)))
      .sort((a, b) => (val(a, sort.k) > val(b, sort.k) ? 1 : val(a, sort.k) < val(b, sort.k) ? -1 : 0) * sort.dir)
  }, [data, q, status, sort, account, platform])

  const head = (k: SortKey, label: string, right = false) => (
    <th scope="col" aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'} className={`px-3 py-2 ${right ? 'text-right' : 'text-left'}`}>
      <button className="font-semibold hover:underline" onClick={() => setSort((s) => ({ k, dir: s.k === k ? (-s.dir as 1 | -1) : -1 }))}>
        {label}{sort.k === k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  )

  async function del(r: Report) {
    if (!confirm(`Hapus laporan ${fmtRange(r.period_start, r.period_end)}? Tindakan ini tidak dapat dibatalkan.`)) return
    try {
      await api.remove(r.report_id)
      toast('Laporan dihapus')
      reload()
    } catch (e) {
      setFailure((e as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      <AccountTabs />
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-lg font-semibold">Riwayat Data</h1>
        <input className="!w-56" aria-label="Cari" placeholder="Cari tanggal atau catatan…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="!w-40" aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Semua status</option>
          {Object.entries(REPORT_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <a className={btnPrimary} href="#/input">+ Tambah laporan</a>
      </div>
      {(error || failure) && <Alert>{error || failure}</Alert>}
      <div className="overflow-x-auto rounded-2xl glass">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
            <tr>{head('period_start', 'Periode')}{head('recorded_at', 'Dicatat')}{head('views', 'Views', true)}{head('reach', 'Reach', true)}{head('interactions', 'Interactions', true)}<th className="px-3 py-2 text-right">Followers</th>{head('status', 'Status')}<th className="px-3 py-2" /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.report_id} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2">{fmtRange(r.period_start, r.period_end)}{r.notes && <div className="text-xs text-slate-500">{r.notes}</div>}</td>
                <td className="px-3 py-2">{fmtDate(r.recorded_at)}</td>
                <td className="px-3 py-2 text-right">{num(r.metrics.views)}</td>
                <td className="px-3 py-2 text-right">{num(r.metrics.reach)}</td>
                <td className="px-3 py-2 text-right">{num(r.metrics.interactions)}</td>
                <td className="px-3 py-2 text-right">{num(r.metrics.followers)}</td>
                <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs ${BADGE[r.status]}`}>{REPORT_STATUS[r.status]}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <a className={btn} href={`#/input/${r.report_id}`}>{isAdmin ? 'Edit' : 'Lanjutkan'}</a>
                  {isAdmin && <>{' '}<button className={`${btn} text-red-700`} onClick={() => del(r)}>Hapus</button></>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-500">{loading ? 'Memuat…' : data?.length ? 'Tidak ada laporan yang cocok.' : 'Belum ada laporan.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
