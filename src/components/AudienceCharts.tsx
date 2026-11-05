import type { ReactNode } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { AGE_BANDS } from '../../shared/audience'
import { thumbUrl, type Analysis } from '../api'
import { fmtDate, num } from '../format'
import { Card } from './ui'

// Warna batang mengikuti contoh Instagram: magenta tua (Women/umum) dan merah muda (Men).
const FUCHSIA = '#c93fd0'
const PINK = '#e58ae0'

const Title = ({ children, hint }: { children: ReactNode; hint: string }) => (
  <h3 className="mb-4 flex items-center text-lg font-semibold tracking-tight">
    {children}
    <span title={hint} aria-label={hint} className="ml-2 inline-grid h-5 w-5 place-items-center rounded-full border border-slate-400 text-[11px] font-normal text-slate-500">i</span>
  </h3>
)

/** Satu baris: label di atas, batang berlatar gelap (lebar = persen), angka di ujung kanan. */
function BarRow({ label, pct, color = FUCHSIA }: { label: string; pct: number; color?: string }) {
  const w = Math.max(0, Math.min(100, pct))
  return (
    <div className="mb-4 last:mb-0">
      <p className="text-sm">{label}</p>
      <div className="mt-1.5 flex items-center gap-4">
        <div role="img" aria-label={`${label}: ${num(pct, 2)}%`} className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full" style={{ width: `${w}%`, background: color, minWidth: w > 0 ? 4 : 0 }} />
        </div>
        <span className="w-16 shrink-0 text-right text-sm font-medium">{num(pct, 2)}%</span>
      </div>
    </div>
  )
}

/** Donut gender: sisa (bila Women + Men < 100%) dibiarkan kosong, bukan dibagi rata. */
function GenderDonut({ women, men, labels = ['Women', 'Men'] }: { women: number | null; men: number | null; labels?: [string, string] }) {
  const rows = [
    { name: labels[0], value: women ?? 0, color: FUCHSIA },
    { name: labels[1], value: men ?? 0, color: PINK },
  ].filter((r) => r.value > 0)
  const rest = 100 - rows.reduce((n, r) => n + r.value, 0)
  const data = rest > 0.01 ? [...rows, { name: 'Lainnya', value: rest, color: 'rgba(148,163,184,0.25)' }] : rows
  return (
    <div className="flex flex-1 flex-wrap items-center justify-center gap-x-10 gap-y-4">
      <div role="img" aria-label={rows.map((r) => `${r.name}: ${num(r.value, 2)}%`).join(', ')} className="aspect-square w-60 max-w-full sm:w-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="62%" outerRadius="100%" stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>
              {data.map((r) => <Cell key={r.name} fill={r.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-3 text-base">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: r.color }} />
            {r.name} <b className="ml-2">{num(r.value, 2)}%</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Empty = ({ children }: { children: ReactNode }) => <p className="py-8 text-center text-sm text-slate-500">{children}</p>

/** Audience: Pertumbuhan (gambar), Gender, Age range, Top locations. Persentase dari laporan terbaru di rentang. */
export default function AudienceCharts({ a }: { a: Analysis }) {
  const src = a.audience
  const d = src?.data
  const rows = d?.cities ?? []
  const none = 'Belum ada data. Isi lewat Input Insights (bagian Audience), atau lewat gambar.'
  const ages = d ? AGE_BANDS.filter((b) => d.age[b] != null) : []

  return (
    <div>
      {src && <p className="mb-3 text-xs text-slate-500">Dari laporan tanggal {fmtDate(src.recorded_at)}. Persentase tidak dijumlahkan antar laporan.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <Title hint="Screenshot grafik pertumbuhan dari Instagram, diunggah lewat Input Insights.">Growth</Title>
          {d?.growth_image ? (
            <img src={thumbUrl(d.growth_image)} alt="Grafik pertumbuhan dari Instagram" loading="lazy" className="mx-auto max-h-[22rem] w-full rounded-lg object-contain" />
          ) : (
            <Empty>Belum ada gambar. Unggah di Input Insights, bagian Audience.</Empty>
          )}
        </Card>

        <Card className="flex flex-col">
          <Title hint="Persentase audiens berdasarkan jenis kelamin.">Gender</Title>
          {d && (d.gender.women != null || d.gender.men != null) ? (
            <GenderDonut women={d.gender.women} men={d.gender.men} />
          ) : (
            <Empty>{none}</Empty>
          )}
        </Card>

        <Card>
          <Title hint="Persentase audiens berdasarkan kelompok usia.">Age range</Title>
          {ages.length > 0 ? ages.map((b) => <BarRow key={b} label={b} pct={d!.age[b]!} />) : <Empty>{none}</Empty>}
        </Card>

        <Card>
          <Title hint="Kota dengan persentase audiens terbanyak.">Top locations</Title>
          <p className="mb-4 text-sm text-slate-500">Cities</p>
          {rows.length > 0 ? rows.map((r, i) => <BarRow key={`${r.name}-${i}`} label={r.name} pct={r.pct} />) : <Empty>{none}</Empty>}
        </Card>
      </div>
    </div>
  )
}

/** Audience di Dashboard YouTube: Gender (Wanita/Pria), Umur, dan Penelusuran YouTube (proporsi traffic + kata kunci). */
export function YouTubeAudience({ a }: { a: Analysis }) {
  const d = a.audience?.data
  const none = 'Belum ada data. Isi lewat Input Insights (pilih YouTube), atau lewat gambar.'
  const ages = d ? AGE_BANDS.filter((b) => d.age[b] != null) : []
  const terms = d?.search_terms ?? []
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="flex flex-col">
        <Title hint="Persentase penonton berdasarkan jenis kelamin.">Gender</Title>
        {d && (d.gender.women != null || d.gender.men != null) ? <GenderDonut women={d.gender.women} men={d.gender.men} labels={['Wanita', 'Pria']} /> : <Empty>{none}</Empty>}
      </Card>
      <Card>
        <Title hint="Persentase penonton berdasarkan kelompok umur.">Umur</Title>
        {ages.length > 0 ? ages.map((b) => <BarRow key={b} label={`${b} tahun`} pct={d!.age[b]!} />) : <Empty>{none}</Empty>}
      </Card>
      <Card className="md:col-span-2">
        <Title hint="Kata kunci penelusuran YouTube yang membawa penonton ke video Anda.">Penelusuran YouTube</Title>
        {d?.search_share != null && <p className="mb-4 text-sm text-slate-500">Proporsi dari total traffic: <b className="text-base text-slate-900">{num(d.search_share, 2)}%</b></p>}
        {terms.length > 0 ? terms.map((t, i) => <BarRow key={`${t.name}-${i}`} label={t.name} pct={t.pct} />) : <Empty>{none}</Empty>}
      </Card>
    </div>
  )
}
