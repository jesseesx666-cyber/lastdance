import { describe, expect, it } from 'vitest'
import { emptyAudience } from '../shared/audience'
import { METRIC_KEYS, type Report } from '../shared/metrics'
import { analyze, compare, valueFor } from './analytics'

let n = 0
const rep = (start: string, end: string, m: Partial<Record<string, number | null>>, extra: Partial<Report> = {}): Report => ({
  report_id: `r${n++}`, account: 'homecare', platform: 'instagram', audience: emptyAudience(), period_start: start, period_end: end, recorded_at: end, notes: '', status: 'valid', snapshot_date: null,
  metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, m[k] ?? null])) as Report['metrics'], ...extra,
})

describe('GAP dan growth', () => {
  it('menghitung selisih dan persentase', () => {
    const c = compare({ value: 150, status: 'ok' }, { value: 100, status: 'ok' })
    expect(c).toMatchObject({ gap: 50, growth: 50, growthNote: 'ok' })
  })
  it('N/A bila pembanding nol', () => {
    expect(compare({ value: 10, status: 'ok' }, { value: 0, status: 'ok' })).toMatchObject({ gap: 10, growth: null, growthNote: 'na_zero' })
  })
  it('data belum cukup bila pembanding tidak ada', () => {
    expect(compare({ value: 10, status: 'ok' }, { value: null, status: 'no_data' }).growthNote).toBe('insufficient')
  })
})

describe('valueFor', () => {
  const oct = { from: '2026-10-01', to: '2026-10-31' }
  it('menjumlahkan laporan yang menutup penuh periode', () => {
    const r = [rep('2026-10-01', '2026-10-15', { views: 100 }), rep('2026-10-16', '2026-10-31', { views: 50 })]
    expect(valueFor(r, 'views', oct)).toEqual({ value: 150, status: 'ok' })
  })
  it('tidak mengarang data: cakupan sebagian = data belum cukup', () => {
    expect(valueFor([rep('2026-10-01', '2026-10-07', { views: 100 })], 'views', oct)).toEqual({ value: null, status: 'incomplete' })
  })
  it('laporan overlap tidak dijumlahkan', () => {
    const r = [rep('2026-10-01', '2026-10-20', { views: 100 }), rep('2026-10-15', '2026-10-31', { views: 50 })]
    expect(valueFor(r, 'views', oct).status).toBe('overlap')
  })
  it('laporan arsip diabaikan', () => {
    expect(valueFor([rep('2026-10-01', '2026-10-31', { views: 9 }, { status: 'archived' })], 'views', oct).status).toBe('no_data')
  })
  it('null bukan nol', () => {
    expect(valueFor([rep('2026-10-01', '2026-10-31', { views: 0 })], 'views', oct)).toEqual({ value: 0, status: 'ok' })
    expect(valueFor([rep('2026-10-01', '2026-10-31', {})], 'views', oct).status).toBe('no_data')
  })
  it('reach (unik) tidak diagregasi dari beberapa laporan', () => {
    const r = [rep('2026-10-01', '2026-10-15', { reach: 10 }), rep('2026-10-16', '2026-10-31', { reach: 20 })]
    expect(valueFor(r, 'reach', oct).status).toBe('not_aggregable')
    expect(valueFor([rep('2026-10-01', '2026-10-31', { reach: 30 })], 'reach', oct)).toEqual({ value: 30, status: 'ok' })
  })
  it('Meta Ads: lead dan spend dijumlahkan, cost per result tidak', () => {
    const r = [
      rep('2026-10-01', '2026-10-15', { lead: 10, amount_spent: 500000, cost_per_result: 50000 }),
      rep('2026-10-16', '2026-10-31', { lead: 20, amount_spent: 600000, cost_per_result: 30000 }),
    ]
    expect(valueFor(r, 'lead', oct)).toEqual({ value: 30, status: 'ok' })
    expect(valueFor(r, 'amount_spent', oct)).toEqual({ value: 1100000, status: 'ok' })
    expect(valueFor(r, 'cost_per_result', oct).status).toBe('not_aggregable')
    expect(valueFor([r[1]], 'cost_per_result', { from: '2026-10-16', to: '2026-10-31' })).toEqual({ value: 30000, status: 'ok' })
  })
  it('viewers (akun unik) tidak diagregasi dari beberapa laporan', () => {
    const r = [rep('2026-10-01', '2026-10-15', { viewers: 100 }), rep('2026-10-16', '2026-10-31', { viewers: 200 })]
    expect(valueFor(r, 'viewers', oct).status).toBe('not_aggregable')
    expect(valueFor([rep('2026-10-01', '2026-10-31', { viewers: 300 })], 'viewers', oct)).toEqual({ value: 300, status: 'ok' })
  })
  it('filter harian tidak memakai laporan mingguan', () => {
    expect(valueFor([rep('2026-10-01', '2026-10-07', { views: 70 })], 'views', { from: '2026-10-03', to: '2026-10-03' }).status).toBe('incomplete')
  })
})

describe('minggu laporan Kamis–Rabu', () => {
  const weeks = [
    rep('2026-10-15', '2026-10-21', { views: 700, reach: 300 }),
    rep('2026-10-22', '2026-10-28', { views: 910, reach: 350 }),
  ]
  it('laporan Kamis 29 Okt memuat 22–28 Okt, pembanding 15–21 Okt', () => {
    for (const anchor of ['2026-10-29', '2026-11-01', '2026-11-04']) {
      const a = analyze(weeks, 'week', anchor)
      expect(a.range).toEqual({ from: '2026-10-22', to: '2026-10-28' })
      expect(a.previous).toEqual({ from: '2026-10-15', to: '2026-10-21' })
      expect(a.metrics.views).toMatchObject({ gap: 210, growth: 30 })
      expect(a.metrics.reach.current).toEqual({ value: 350, status: 'ok' })
    }
  })
  it('followers: snapshot di tanggal pembuatan laporan (Kamis) tanpa peringatan', () => {
    const w = [
      rep('2026-10-15', '2026-10-21', { views: 1, followers: 460 }, { recorded_at: '2026-10-22', snapshot_date: '2026-10-22' }),
      rep('2026-10-22', '2026-10-28', { views: 1, followers: 526 }, { recorded_at: '2026-10-29', snapshot_date: '2026-10-29' }),
    ]
    const f = analyze(w, 'week', '2026-10-29').followers
    expect(f).toMatchObject({ growth: 66, warnings: [] })
    expect(f.rate).toBeCloseTo(14.35, 1)
  })
  it('acuan Rabu 28 Okt masih memakai Kamis 22 Okt (15–21 Okt)', () => {
    expect(analyze(weeks, 'week', '2026-10-28').range).toEqual({ from: '2026-10-15', to: '2026-10-21' })
  })
})

describe('bulanan/tahunan = hanya laporan yang diinput manual, tidak dari mingguan', () => {
  const weekly = [
    rep('2026-09-24', '2026-09-30', { views: 140, reach: 10 }), rep('2026-10-01', '2026-10-07', { views: 150, reach: 10 }),
    rep('2026-10-08', '2026-10-14', { views: 160, reach: 10 }), rep('2026-10-22', '2026-10-28', { views: 180, reach: 10 }),
  ]
  it('hanya laporan mingguan: tab bulanan dan tahunan kosong', () => {
    for (const g of ['month', 'year'] as const) {
      const a = analyze(weekly, g, '2026-10-15')
      expect(a.metrics.views.current).toEqual({ value: null, status: 'no_data' })
      expect(a.metrics.reach.current.status).toBe('no_data')
      expect(a.coverage).toBeNull()
      expect(a.series.views).toHaveLength(0)
    }
  })
  it('laporan bulanan manual dipakai apa adanya, dibanding bulan sebelumnya', () => {
    const m = [rep('2026-09-01', '2026-09-30', { views: 1000, reach: 400 }), rep('2026-10-01', '2026-10-31', { views: 1500, reach: 500 })]
    const a = analyze([...weekly, ...m], 'month', '2026-10-15')
    expect(a.metrics.views.current).toEqual({ value: 1500, status: 'ok' })
    expect(a.metrics.reach.current).toEqual({ value: 500, status: 'ok' })
    expect(a.metrics.views).toMatchObject({ gap: 500, growth: 50 })
    expect(a.series.views).toHaveLength(2)
  })
  it('tahunan = jumlah laporan bulanan untuk metrik yang boleh dijumlahkan; persentase/unik wajib manual', () => {
    const m = [
      rep('2026-01-01', '2026-01-31', { views: 100, reach: 50, patients: 2 }), rep('2026-02-01', '2026-02-28', { views: 200, reach: 60, patients: 3 }),
    ]
    const a = analyze([...weekly, ...m], 'year', '2026-06-01')
    expect(a.metrics.views.current).toEqual({ value: 300, status: 'ok' })
    expect(a.metrics.patients.current).toEqual({ value: 5, status: 'ok' })
    expect(a.metrics.reach.current.status).toBe('no_data')
    expect(a.series.views).toHaveLength(2)
    expect(analyze([...weekly, rep('2026-01-01', '2026-01-31', { views: 1 }), rep('2026-03-01', '2026-03-31', { views: 1 })], 'year', '2026-06-01').metrics.views.current.status).toBe('incomplete')
    const manual = analyze([...m, rep('2026-01-01', '2026-12-31', { views: 9999, reach: 700 })], 'year', '2026-06-01')
    expect(manual.metrics.views.current.value).toBe(9999)
    expect(manual.metrics.reach.current.value).toBe(700)
  })
  it('laporan tahunan manual hanya muncul di tab tahunan', () => {
    const y = [...weekly, rep('2026-01-01', '2026-12-31', { views: 9000 })]
    expect(analyze(y, 'year', '2026-06-01').metrics.views.current).toEqual({ value: 9000, status: 'ok' })
    expect(analyze(y, 'week', '2026-10-29').metrics.views.current).toEqual({ value: 180, status: 'ok' })
  })
  it('mingguan tetap memakai periode Kamis–Rabu', () => {
    const w = analyze(weekly, 'week', '2026-10-29')
    expect(w.range).toEqual({ from: '2026-10-22', to: '2026-10-28' })
    expect(w.metrics.views.current).toEqual({ value: 180, status: 'ok' })
  })
})

describe('analyze', () => {
  const reports = [
    rep('2026-09-01', '2026-09-30', { views: 1000, reach: 400, interactions: 40, profile_visits: 100, external_link_taps: 10, followers: 500 }, { snapshot_date: '2026-09-30' }),
    rep('2026-10-01', '2026-10-31', { views: 1500, reach: 500, interactions: 75, profile_visits: 200, external_link_taps: 20, followers: 560 }, { snapshot_date: '2026-10-31' }),
  ]
  const a = analyze(reports, 'month', '2026-10-12')
  it('membandingkan bulan dengan bulan sebelumnya', () => {
    expect(a.range).toEqual({ from: '2026-10-01', to: '2026-10-31' })
    expect(a.previous).toEqual({ from: '2026-09-01', to: '2026-09-30' })
    expect(a.metrics.views).toMatchObject({ gap: 500, growth: 50 })
  })
  it('metrik turunan', () => {
    expect(a.derived.engagement_by_reach.current).toBeCloseTo(15)
    expect(a.derived.link_tap_rate.current).toBeCloseTo(10)
    expect(a.derived.interactions_per_1000_views.current).toBeCloseTo(50)
    expect(a.derived.avg_views_per_day.current).toBeCloseTo(1500 / 31)
  })
  it('follower memakai snapshot, bukan penjumlahan', () => {
    expect(a.followers.growth).toBe(60)
    expect(a.followers.warnings.length).toBeGreaterThan(0) // snapshot awal 30 Sep, bukan 1 Okt
  })
  it('seri hanya berisi titik laporan asli', () => {
    expect(a.series.views).toHaveLength(2)
    expect(a.sourceGranularity).toEqual(['bulanan'])
  })
  it('rata-rata pembelian pasien: diinput manual, tidak dijumlahkan', () => {
    const w = [
      rep('2026-10-15', '2026-10-21', { revenue: 1000000, patients: 10, avg_purchase: 100000 }),
      rep('2026-10-22', '2026-10-28', { revenue: 3000000, patients: 20, avg_purchase: 150000 }),
    ]
    const r = analyze(w, 'week', '2026-10-29')
    expect(r.metrics.avg_purchase).toMatchObject({ gap: 50000, growth: 50 })
    expect(r.metrics.patients.current.value).toBe(20)
    expect(valueFor(w, 'avg_purchase', { from: '2026-10-15', to: '2026-10-28' }).status).toBe('not_aggregable')
    expect(valueFor(w, 'patients', { from: '2026-10-15', to: '2026-10-28' })).toEqual({ value: 30, status: 'ok' })
  })
  it('keuntungan = pendapatan - amount spent; biaya per pasien = amount spent / pasien', () => {
    const w = [
      rep('2026-10-15', '2026-10-21', { revenue: 1000000, amount_spent: 600000, patients: 10 }),
      rep('2026-10-22', '2026-10-28', { revenue: 500000, amount_spent: 700000, patients: 20 }),
    ]
    const d = analyze(w, 'week', '2026-10-29').derived
    expect(d.profit).toMatchObject({ current: -200000, previous: 400000, gap: -600000 }) // rugi tetap tampil
    expect(d.spend_per_patient).toMatchObject({ current: 35000, previous: 60000, gap: -25000 })
    const none = analyze([rep('2026-10-22', '2026-10-28', { revenue: 5, amount_spent: 3, patients: 0 })], 'week', '2026-10-29').derived
    expect(none.spend_per_patient.current).toBeNull()
    expect(analyze([rep('2026-10-22', '2026-10-28', { revenue: 5 })], 'week', '2026-10-29').derived.profit.current).toBeNull()
  })
  it('rentang custom membandingkan dengan durasi sama sebelumnya', () => {
    const c = analyze(reports, 'custom', '2026-10-01', { from: '2026-10-01', to: '2026-10-10' })
    expect(c.previous).toEqual({ from: '2026-09-21', to: '2026-09-30' })
  })
})
