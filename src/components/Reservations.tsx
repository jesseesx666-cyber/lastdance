import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Reservation, ReservationKind } from '../../shared/reservation'
import { api } from '../api'
import { useAuth } from '../auth'
import { fmtRange, num } from '../format'
import { PALETTE, useTheme } from '../theme'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

const KINDS: { kind: ReservationKind; title: string; unit: string; hint: string }[] = [
  { kind: 'branch', title: 'Perbandingan Reservasi per Cabang', unit: 'reservasi', hint: 'Tirtayasa' },
  { kind: 'treatment', title: 'Perbandingan Tindakan Gabungan 4 Cabang', unit: 'tindakan', hint: 'Totok Wajah' },
]
/** Warna tab10 (sama dengan diagram contoh). */
const TAB10 = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']

const inPeriod = (r: Reservation, p: { start: string; end: string }) => r.period_start === p.start && r.period_end === p.end

/** Diagram lingkaran: nama di luar irisan, persentase dan jumlah di dalam. */
function Pie10({ rows }: { rows: Reservation[] }) {
  const P = PALETTE[useTheme()]
  const total = rows.reduce((s, r) => s + r.count, 0)
  const data = rows.filter((r) => r.count > 0).map((r, i) => ({ name: r.name, value: r.count, color: TAB10[i % TAB10.length] }))
  const label = ({ cx, cy, midAngle, outerRadius, name, value }: { cx: number; cy: number; midAngle: number; outerRadius: number; name: string; value: number }) => {
    const rad = Math.PI / 180
    const at = (r: number) => ({ x: cx + r * Math.cos(-midAngle * rad), y: cy + r * Math.sin(-midAngle * rad) })
    const out = at(outerRadius + 14)
    const inn = at(outerRadius * 0.62)
    return (
      <g>
        <text x={out.x} y={out.y} textAnchor={out.x > cx ? 'start' : 'end'} dominantBaseline="middle" fontSize={12} fill={P.tipText}>{name}</text>
        <text x={inn.x} y={inn.y - 7} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#ffffff">{num((value / total) * 100, 1)}%</text>
        <text x={inn.x} y={inn.y + 8} textAnchor="middle" dominantBaseline="middle" fontSize={12} fill="#ffffff">({num(value)})</text>
      </g>
    )
  }
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <PieChart margin={{ top: 16, right: 72, bottom: 16, left: 72 }}>
          <Pie data={data} dataKey="value" nameKey="name" startAngle={90} endAngle={-270} outerRadius="88%" stroke="none" label={label} labelLine={false} isAnimationActive={false}>
            {data.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip formatter={(v: number, n: string) => [num(v), n]} contentStyle={{ background: P.tipBg, border: '1px solid ' + P.tipBorder, borderRadius: 8, color: P.tipText }} labelStyle={{ color: P.tipText }} itemStyle={{ color: P.tipText }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Dashboard Bekam: dua diagram lingkaran untuk periode yang sedang dilihat. */
export function ReservationCharts({ period }: { period: { start: string; end: string } }) {
  const { data, error } = useAsync(() => api.reservations(), [])
  return (
    <>
      {error && <Alert>{error}</Alert>}
      <div className="grid gap-4 xl:grid-cols-2">
        {KINDS.map(({ kind, title, unit }) => {
          const rows = (data ?? []).filter((r) => r.kind === kind && inPeriod(r, period))
          const total = rows.reduce((s, r) => s + r.count, 0)
          return (
            <Card key={kind} title={title}>
              {total > 0 ? (
                <>
                  <p className="-mt-1 mb-1 text-center text-sm text-slate-500">Total: {num(total)} {unit}</p>
                  <Pie10 rows={rows} />
                </>
              ) : (
                <p className="py-10 text-center text-sm text-slate-500">Belum ada data periode ini. Isi lewat menu Input Insights.</p>
              )}
            </Card>
          )
        })}
      </div>
    </>
  )
}

/** Input Insights Bekam: tambah/ubah/hapus irisan diagram untuk periode laporan yang sedang diisi. Ubah dan hapus khusus super admin. */
export function ReservationInput({ period }: { period: { start: string; end: string } }) {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const { data, error, reload } = useAsync(() => api.reservations(), [])
  const [fail, setFail] = useState('')
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [draft, setDraft] = useState<Record<ReservationKind, { name: string; count: string }>>({ branch: { name: '', count: '' }, treatment: { name: '', count: '' } })

  const save = async (kind: ReservationKind) => {
    const d = draft[kind]
    setFail('')
    try {
      const body = { kind, name: d.name, count: d.count === '' ? NaN : Number(d.count), period_start: period.start, period_end: period.end }
      if (editing?.kind === kind) await api.updateReservation(editing.reservation_id, body)
      else await api.addReservation(body)
      setEditing(null)
      setDraft({ ...draft, [kind]: { name: '', count: '' } })
      toast('Data reservasi disimpan')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }
  const del = async (r: Reservation) => {
    if (!confirm(`Hapus "${r.name}"?`)) return
    try {
      await api.removeReservation(r.reservation_id)
      toast('Data dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  return (
    <section aria-labelledby="input-reservasi" className="space-y-3">
      <h2 id="input-reservasi" className="text-lg font-semibold">Input Reservasi</h2>
      <p className="text-sm text-slate-500">Periode: <b>{fmtRange(period.start, period.end)}</b> (ikut tanggal laporan di atas). Muncul di container <b>Reservasi</b> pada Dashboard Bekam dengan periode yang sama.</p>
      {(error || fail) && <Alert>{error || fail}</Alert>}
      <div className="grid gap-4 md:grid-cols-2">
        {KINDS.map(({ kind, title, hint }) => {
          const rows = (data ?? []).filter((r) => r.kind === kind && inPeriod(r, period))
          const d = draft[kind]
          return (
            <Card key={kind} title={title}>
              <ul className="mb-3 divide-y divide-slate-200 text-sm">
                {rows.map((r) => (
                  <li key={r.reservation_id} className="flex items-center gap-2 py-1.5">
                    <span className="mr-auto break-words">{r.name}</span>
                    <b className="tabular-nums">{num(r.count)}</b>
                    {isAdmin && (
                      <>
                        <button type="button" className={btn} onClick={() => { setEditing(r); setDraft({ ...draft, [kind]: { name: r.name, count: String(r.count) } }) }}>Edit</button>
                        <button type="button" className={btn} onClick={() => void del(r)}>Hapus</button>
                      </>
                    )}
                  </li>
                ))}
                {!rows.length && <li className="py-3 text-center text-slate-500">Belum ada data untuk periode ini.</li>}
              </ul>
              <div className="flex flex-wrap gap-2">
                <input className="min-w-0 flex-1" maxLength={80} placeholder={hint} aria-label={`Nama (${title})`} value={d.name} onChange={(e) => setDraft({ ...draft, [kind]: { ...d, name: e.target.value } })} />
                <input className="!w-24" inputMode="numeric" placeholder="Jumlah" aria-label={`Jumlah (${title})`} value={d.count} onChange={(e) => setDraft({ ...draft, [kind]: { ...d, count: e.target.value.replace(/\D/g, '') } })} />
                <button type="button" className={btnPrimary} onClick={() => void save(kind)}>{editing?.kind === kind ? 'Simpan' : '+ Tambah'}</button>
                {editing?.kind === kind && <button type="button" className={btn} onClick={() => { setEditing(null); setDraft({ ...draft, [kind]: { name: '', count: '' } }) }}>Batal</button>}
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
