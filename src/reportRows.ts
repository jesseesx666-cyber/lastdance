import { PLATFORM_LABEL, type PlatformId } from '../shared/platforms'
import { AGE_BANDS } from '../shared/audience'
import type { Content } from '../shared/content'
import { DEF, type MetricKey } from '../shared/metrics'
import type { Analysis } from './api'
import { label } from './components/ContentForm'
import { pickTop } from './components/TopContent'
import { fmtMetric, num, STATUS_TEXT } from './format'

export interface ReportRow { name: string; value: string; warn?: boolean }
export interface ReportSection { title: string; rows: ReportRow[] }

const CORE: MetricKey[] = ['views', 'viewers', 'profile_visits', 'external_link_taps', 'interactions']
const OPTIONAL: MetricKey[] = ['likes', 'comments', 'shares', 'saves']
const META: MetricKey[] = ['lead', 'cost_per_result', 'budget', 'amount_spent', 'impressions', 'reach']
const REVENUE: MetricKey[] = ['patients', 'revenue', 'avg_purchase']
const SPLITS = [['reels', 'Reels'], ['post', 'Post'], ['story', 'Story']] as const

/** Isi laporan teks: satu sumber untuk halaman Laporan dan file unduhan, sama dengan angka dashboard. */
export function buildReport(a: Analysis, contents: Content[], account: string, platform: string): ReportSection[] {
  const metric = (k: MetricKey): ReportRow => {
    const v = a.metrics[k]
    const c = v.current
    if (c.status !== 'ok') return { name: DEF[k].label, value: STATUS_TEXT[c.status], warn: true }
    const prev = v.previous.value != null ? ` (sebelumnya ${fmtMetric(k, v.previous.value)}${v.growth != null ? `, ${v.growth >= 0 ? '+' : ''}${num(v.growth, 1)}%` : ''})` : ''
    return { name: DEF[k].label, value: fmtMetric(k, c.value) + prev }
  }
  // Metrik opsional yang tidak pernah diisi disembunyikan, sama seperti dashboard.
  const optional = OPTIONAL.filter((k) => a.metrics[k].current.status !== 'no_data' || a.metrics[k].previous.status !== 'no_data')
  const f = a.followers
  const pct = (prefix: string): ReportRow[] =>
    SPLITS.map(([k, n]) => {
      const c = a.metrics[`${prefix}_${k}_pct` as MetricKey].current
      return c.status === 'ok' ? { name: n, value: `${num(c.value, 2)}%` } : { name: n, value: STATUS_TEXT[c.status], warn: true }
    })
  const money = (v: number | null): ReportRow['value'] => (v == null ? '' : fmtMetric('revenue', v))
  const derived = (name: string, v: number | null): ReportRow => (v == null ? { name, value: 'Belum ada data', warn: true } : { name, value: money(v) })
  const aud = a.audience?.data
  const audience: ReportRow[] = aud
    ? [
        ...(aud.gender.women != null ? [{ name: 'Gender: Women', value: `${num(aud.gender.women, 2)}%` }] : []),
        ...(aud.gender.men != null ? [{ name: 'Gender: Men', value: `${num(aud.gender.men, 2)}%` }] : []),
        ...AGE_BANDS.filter((b) => aud.age[b] != null).map((b) => ({ name: `Usia ${b}`, value: `${num(aud.age[b], 2)}%` })),
        ...aud.cities.map((c) => ({ name: `Kota: ${c.name}`, value: `${num(c.pct, 2)}%` })),
      ]
    : [{ name: 'Audience', value: 'Belum ada data untuk periode ini', warn: true }]
  const top = pickTop(contents, account, platform, a).top.map((c, i) => ({ name: `${i + 1}. ${label(c)}`, value: `${num(c.views)} views · ${num(c.likes)} likes · ${num(c.interactions)} interaksi` }))

  return [
    {
      title: `Dashboard ${PLATFORM_LABEL[platform as PlatformId]}`,
      rows: [
        ...CORE.map(metric),
        f.growth == null ? { name: 'Followers', value: 'Data belum cukup', warn: true } : { name: 'Followers', value: `${num(f.end?.value)} (growth ${f.growth >= 0 ? '+' : ''}${num(f.growth)})` },
        ...optional.map(metric),
      ],
    },
    { title: 'Top 3 Content', rows: top.length ? top : [{ name: 'Top 3 Content', value: 'Belum ada konten untuk periode ini', warn: true }] },
    { title: 'By Content Type', rows: pct('viewers') },
    { title: 'By content interactions', rows: pct('interactions') },
    { title: 'Audience', rows: audience },
    { title: 'Dashboard Meta Ads', rows: META.map(metric) },
    { title: 'Dashboard Pendapatan', rows: [...REVENUE.map(metric), derived('Keuntungan', a.derived.profit.current), derived('Biaya per pasien', a.derived.spend_per_patient.current)] },
  ]
}

const csv = (s: string) => `"${s.replace(/"/g, '""')}"`

/** Unduh laporan sebagai CSV (BOM agar Excel membaca UTF-8). Isinya persis yang tampil di halaman Laporan. */
export function downloadReport(a: Analysis, contents: Content[], account: string, platform: string) {
  const lines = [['Bagian', 'Item', 'Nilai'], ['Periode', `${a.range.from} s/d ${a.range.to}`, `dibandingkan ${a.previous.from} s/d ${a.previous.to}`]]
  for (const s of buildReport(a, contents, account, platform)) for (const r of s.rows) lines.push([s.title, r.name, r.value])
  const blob = new Blob(['﻿' + lines.map((l) => l.map(csv).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `laporan-${account}-${platform}-${a.range.from}_${a.range.to}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}
