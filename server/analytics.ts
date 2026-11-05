import {
  addDays, addMonths, addYears, differenceInCalendarDays, endOfMonth, endOfYear,
  format, parseISO, startOfMonth, startOfWeek, startOfYear,
} from 'date-fns'
import { reportKind } from '../shared/kind'
import { hasAudience } from '../shared/audience'
import { ACTIVITY_KEYS, DEF, METRIC_KEYS, type MetricKey, type Report } from '../shared/metrics'

export type Granularity = 'day' | 'week' | 'month' | 'year' | 'custom'
export interface Range { from: string; to: string }

export type ValStatus = 'ok' | 'no_data' | 'incomplete' | 'overlap' | 'not_aggregable'
export interface Val { value: number | null; status: ValStatus }
export interface Cmp {
  current: Val
  previous: Val
  gap: number | null
  /** Persen; null jika tidak dapat dihitung (lihat growthNote). */
  growth: number | null
  growthNote: 'ok' | 'na_zero' | 'insufficient'
}

const iso = (d: Date) => format(d, 'yyyy-MM-dd')
const days = (r: Range) => differenceInCalendarDays(parseISO(r.to), parseISO(r.from)) + 1
// Minggu laporan = Kamis–Rabu (laporan dibuat Kamis untuk 7 hari sebelumnya).
const TREND_POINTS = 12
const WEEK = { weekStartsOn: 4 as const }

export function resolveRange(g: Granularity, anchor: string, custom?: Range): { range: Range; previous: Range } {
  const a = parseISO(anchor)
  switch (g) {
    case 'day':
      return { range: { from: anchor, to: anchor }, previous: { from: iso(addDays(a, -1)), to: iso(addDays(a, -1)) } }
    case 'week': {
      // Tanggal acuan = tanggal pembuatan laporan: Kamis terakhir (≤ acuan) memuat 7 hari sebelumnya.
      const t = startOfWeek(a, WEEK)
      return {
        range: { from: iso(addDays(t, -7)), to: iso(addDays(t, -1)) },
        previous: { from: iso(addDays(t, -14)), to: iso(addDays(t, -8)) },
      }
    }
    case 'month': {
      const p = addMonths(a, -1)
      return {
        range: { from: iso(startOfMonth(a)), to: iso(endOfMonth(a)) },
        previous: { from: iso(startOfMonth(p)), to: iso(endOfMonth(p)) },
      }
    }
    case 'year': {
      const p = addYears(a, -1)
      return {
        range: { from: iso(startOfYear(a)), to: iso(endOfYear(a)) },
        previous: { from: iso(startOfYear(p)), to: iso(endOfYear(p)) },
      }
    }
    default: {
      const r = custom!
      const n = days(r)
      return { range: r, previous: { from: iso(addDays(parseISO(r.from), -n)), to: iso(addDays(parseISO(r.from), -1)) } }
    }
  }
}

const active = (reports: Report[]) => reports.filter((r) => r.status !== 'archived')

/**
 * Sebuah laporan masuk ke rentang menurut:
 *  - 'period'     : seluruh periodenya di dalam rentang (mingguan Kamis–Rabu, harian);
 *  - 'reportDate' : tanggal laporan (hari Kamis laporan dibuat) di dalam rentang. Dipakai bulanan, tahunan, dan rentang
 *                   khusus: bulan Oktober = laporan tanggal 1 s/d 31 Okt, walau minggunya melewati batas bulan.
 */
export type Basis = 'period' | 'reportDate' | 'exact' | 'year'
// Bulanan: hanya laporan bulanan manual dengan periode persis sama (tidak dari mingguan).
// Tahunan: laporan tahunan manual bila ada, selain itu jumlah laporan bulanan (hanya metrik yang boleh dijumlahkan).
export const basisOf = (g: Granularity): Basis => (g === 'month' ? 'exact' : g === 'year' ? 'year' : g === 'custom' ? 'reportDate' : 'period')
const inRange = (r: Report, rg: Range, basis: Basis) =>
  basis === 'exact' ? r.period_start === rg.from && r.period_end === rg.to
    : basis === 'year' ? (r.period_start === rg.from && r.period_end === rg.to) || (reportKind(r) === 'bulanan' && r.period_start >= rg.from && r.period_end <= rg.to)
    : basis === 'reportDate' ? r.recorded_at >= rg.from && r.recorded_at <= rg.to : r.period_start >= rg.from && r.period_end <= rg.to
const dayAfterIso = (d: string) => iso(addDays(parseISO(d), 1))

/** Nilai satu metrik untuk satu rentang. Tidak pernah memperkirakan data yang tidak ada. */
export function valueFor(reports: Report[], key: MetricKey, range: Range, basis: Basis = 'period'): Val {
  const withKey = active(reports).filter((r) => r.metrics[key] != null)
  let inside = withKey.filter((r) => inRange(r, range, basis)).sort((a, b) => a.period_start.localeCompare(b.period_start))
  if (!inside.length) {
    const straddles = basis === 'period' && withKey.some((r) => r.period_start <= range.to && r.period_end >= range.from)
    return { value: null, status: straddles ? 'incomplete' : 'no_data' }
  }
  if (basis === 'year') {
    const whole = inside.filter((r) => r.period_start === range.from && r.period_end === range.to)
    if (whole.length === 1) return { value: whole[0].metrics[key], status: 'ok' }
    if (whole.length > 1) return { value: null, status: 'overlap' }
    if (DEF[key].unique) return { value: null, status: 'no_data' } // persentase/akun unik tidak bisa dijumlahkan dari bulanan
    inside = inside.filter((r) => reportKind(r) === 'bulanan')
  }
  for (let i = 1; i < inside.length; i++)
    if (inside[i].period_start <= inside[i - 1].period_end) return { value: null, status: 'overlap' }

  if (DEF[key].unique) {
    // Akun unik/persentase tidak bisa dijumlahkan: sah hanya bila satu laporan persis menutup rentang.
    const [only] = inside
    if (inside.length === 1 && only.period_start === range.from && only.period_end === range.to)
      return { value: only.metrics[key], status: 'ok' }
    if (basis === 'reportDate') return { value: null, status: 'not_aggregable' }
    return { value: null, status: inside.length > 1 ? 'not_aggregable' : 'incomplete' }
  }
  if (basis === 'exact') return { value: inside[0].metrics[key], status: 'ok' }
  if (basis === 'reportDate' || basis === 'year') {
    // Tanpa celah: tiap laporan harus menyambung tepat dengan laporan sebelumnya (tidak ada minggu yang hilang).
    for (let i = 1; i < inside.length; i++)
      if (inside[i].period_start !== dayAfterIso(inside[i - 1].period_end)) return { value: null, status: 'incomplete' }
  } else {
    const covered = inside.reduce((n, r) => n + days({ from: r.period_start, to: r.period_end }), 0)
    if (covered !== days(range)) return { value: null, status: 'incomplete' }
  }
  return { value: inside.reduce((s, r) => s + r.metrics[key]!, 0), status: 'ok' }
}

export function compare(cur: Val, prev: Val): Cmp {
  if (cur.value == null || prev.value == null)
    return { current: cur, previous: prev, gap: null, growth: null, growthNote: 'insufficient' }
  const gap = cur.value - prev.value
  return prev.value === 0
    ? { current: cur, previous: prev, gap, growth: null, growthNote: 'na_zero' }
    : { current: cur, previous: prev, gap, growth: (gap / prev.value) * 100, growthNote: 'ok' }
}

export const DERIVED = {
  engagement_by_reach: { label: 'Engagement rate by reach', unit: '%', needs: ['interactions', 'reach'], f: (a: number, b: number) => (b > 0 ? (a / b) * 100 : null) },
  profile_visit_rate: { label: 'Profile visit rate', unit: '%', needs: ['profile_visits', 'reach'], f: (a: number, b: number) => (b > 0 ? (a / b) * 100 : null) },
  link_tap_rate: { label: 'External link tap rate', unit: '%', needs: ['external_link_taps', 'profile_visits'], f: (a: number, b: number) => (b > 0 ? (a / b) * 100 : null) },
  interactions_per_1000_views: { label: 'Interactions per 1.000 views', unit: '', needs: ['interactions', 'views'], f: (a: number, b: number) => (b > 0 ? (a / b) * 1000 : null) },
  profit: { label: 'Keuntungan', unit: '', needs: ['revenue', 'amount_spent'], f: (a: number, b: number) => a - b },
  spend_per_patient: { label: 'Biaya per pasien', unit: '', needs: ['amount_spent', 'patients'], f: (a: number, b: number) => (b > 0 ? a / b : null) },
} as const
export type DerivedKey = keyof typeof DERIVED | 'avg_views_per_day'

function derivedFor(vals: Record<MetricKey, Val>, range: Range): Record<DerivedKey, number | null> {
  const out = {} as Record<DerivedKey, number | null>
  for (const [k, d] of Object.entries(DERIVED)) {
    const [a, b] = d.needs.map((n) => vals[n as MetricKey].value)
    out[k as DerivedKey] = a == null || b == null ? null : d.f(a, b)
  }
  const v = vals.views.value
  out.avg_views_per_day = v == null ? null : v / days(range)
  return out
}

const kindOf = reportKind
const KIND_OF: Partial<Record<Granularity, string[]>> = { week: ['mingguan'], month: ['bulanan'], year: ['tahunan', 'bulanan'] }

function followerGrowth(reports: Report[], range: Range) {
  const snaps = active(reports)
    .filter((r) => r.metrics.followers != null && r.snapshot_date)
    .map((r) => ({ date: r.snapshot_date!, value: r.metrics.followers!, id: r.report_id }))
  const nearest = (target: string) =>
    snaps.reduce<(typeof snaps)[number] | null>((best, s) => {
      const d = (x: string) => Math.abs(differenceInCalendarDays(parseISO(x), parseISO(target)))
      return !best || d(s.date) < d(best.date) ? s : best
    }, null)
  // Snapshot diambil pada tanggal pembuatan laporan (hari setelah periode berakhir).
  const startTarget = range.from
  const endTarget = iso(addDays(parseISO(range.to), 1))
  const start = nearest(startTarget)
  const end = nearest(endTarget)
  const warnings: string[] = []
  if (!start || !end || start.id === end.id || start.date >= end.date)
    return { start, end, growth: null, rate: null, warnings: ['Snapshot follower belum cukup untuk periode ini.'] }
  if (start.date !== startTarget) warnings.push(`Snapshot awal bertanggal ${start.date}, bukan ${startTarget}.`)
  if (end.date !== endTarget) warnings.push(`Snapshot akhir bertanggal ${end.date}, bukan ${endTarget}.`)
  const growth = end.value - start.value
  return { start, end, growth, rate: start.value === 0 ? null : (growth / start.value) * 100, warnings }
}

export function analyze(all: Report[], g: Granularity, anchor: string, custom?: Range) {
  // Tiap tab hanya memakai laporan sejenis: bulanan tidak diturunkan dari mingguan.
  const want = KIND_OF[g]
  const reports = want ? all.filter((r) => want.includes(kindOf(r))) : all
  const { range, previous } = resolveRange(g, anchor, custom)
  const basis = basisOf(g)
  const cur = {} as Record<MetricKey, Val>
  const prev = {} as Record<MetricKey, Val>
  for (const k of ACTIVITY_KEYS) {
    cur[k] = valueFor(reports, k, range, basis)
    prev[k] = valueFor(reports, k, previous, basis)
  }

  // Laporan yang membentuk angka rentang ini (untuk keterangan "mencakup …" di dashboard).
  const members = active(reports).filter((r) => inRange(r, range, basis))
  const coverage = members.length
    ? { count: members.length, from: members.map((r) => r.period_start).sort()[0], to: members.map((r) => r.period_end).sort().at(-1)! }
    : null
  const metrics = Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, compare(cur[k], prev[k])])) as Record<MetricKey, Cmp>

  const dc = derivedFor(cur, range)
  const dp = derivedFor(prev, previous)
  const derived = Object.fromEntries(
    (Object.keys(dc) as DerivedKey[]).map((k) => [
      k, { current: dc[k], previous: dp[k], gap: dc[k] != null && dp[k] != null ? dc[k]! - dp[k]! : null },
    ]),
  )

  // Audiens: dari laporan terbaru di dalam rentang yang punya data audiens (persentase tidak dijumlahkan).
  // Audiens bukan penjumlahan: hanya laporan yang periodenya persis rentang (bulanan/tahunan manual).
  const src = members.filter((r) => (g !== 'month' && g !== 'year') || (r.period_start === range.from && r.period_end === range.to)).filter((r) => hasAudience(r.audience)).sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
  const audience = src ? { report_id: src.report_id, recorded_at: src.recorded_at, period_start: src.period_start, period_end: src.period_end, data: src.audience } : null

  // Seri grafik: riwayat laporan asli sampai periode terpilih (tidak ada data harian buatan).
  const history = active(reports)
    .filter((r) => r.period_end <= range.to && (g !== 'year' || kindOf(r) === 'bulanan'))
    .sort((a, b) => a.period_start.localeCompare(b.period_start))
  const series = Object.fromEntries(
    METRIC_KEYS.map((k) => [
      k,
      history
        .filter((r) => r.metrics[k] != null)
        .slice(-TREND_POINTS)
        .map((r) => ({
          report_id: r.report_id, period_start: r.period_start, period_end: r.period_end,
          snapshot_date: r.snapshot_date, value: r.metrics[k]!, kind: kindOf(r),
          slot: inRange(r, range, basis) ? ('cur' as const) : inRange(r, previous, basis) ? ('prev' as const) : null,
        })),
    ]),
  )
  const kinds = [...new Set(history.slice(-TREND_POINTS).map(kindOf))]

  // Periode tertinggi dibandingkan hanya di dalam granularitas yang sama.
  const insights = (['views', 'reach', 'interactions'] as const).flatMap((k) => {
    const byKind = new Map<string, Report>()
    for (const r of active(reports).filter((x) => x.metrics[k] != null)) {
      const best = byKind.get(kindOf(r))
      if (!best || r.metrics[k]! > best.metrics[k]!) byKind.set(kindOf(r), r)
    }
    return [...byKind].map(([kind, r]) => ({
      metric: k, kind, period_start: r.period_start, period_end: r.period_end, value: r.metrics[k]!,
    }))
  })

  return {
    granularity: g, range, previous,
    metrics, derived,
    followers: followerGrowth(reports, range),
    series, sourceGranularity: kinds, insights,
    reportCount: all.length, coverage, basis, audience,
  }
}
