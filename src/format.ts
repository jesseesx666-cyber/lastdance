import { differenceInCalendarDays, format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'
import type { ValStatus } from '../server/analytics'
import { DEF, type MetricKey } from '../shared/metrics'

export const num = (n: number | null | undefined, digits = 0) =>
  n == null ? '–' : n.toLocaleString('id-ID', { maximumFractionDigits: digits })
/** Nilai metrik; uang diberi awalan Rp. */
export const fmtMetric = (k: MetricKey, v: number | null | undefined) =>
  v == null ? '–' : DEF[k].percent ? num(v, 2) + '%' : DEF[k].usd ? '$' + v.toFixed(2) : (DEF[k].currency ? 'Rp ' : '') + num(v, DEF[k].decimal && !DEF[k].currency ? 2 : 0)
export const pct = (n: number | null | undefined) => (n == null ? 'N/A' : num(n, 1) + '%')
export const signed = (n: number, digits = 0) => (n > 0 ? '+' : '') + num(n, digits)
export const fmtDate = (s: string) => format(parseISO(s), 'd MMM yyyy', { locale: id })
export const fmtShort = (s: string) => format(parseISO(s), 'd MMM', { locale: id })
export const fmtRange = (a: string, b: string) => (a === b ? fmtDate(a) : `${fmtDate(a)} – ${fmtDate(b)}`)
export const today = () => format(new Date(), 'yyyy-MM-dd')
const iso = (d: Date) => format(d, 'yyyy-MM-dd')
/** Kamis terakhir (atau hari ini bila Kamis): tanggal pembuatan laporan mingguan. */
export const lastThursday = () => {
  const d = new Date()
  while (d.getDay() !== 4) d.setDate(d.getDate() - 1)
  return iso(d)
}
/** Hari berikutnya (yyyy-MM-dd): tanggal laporan = hari setelah periode berakhir. */
export const dayAfter = (d: string) => {
  const x = parseISO(d)
  x.setDate(x.getDate() + 1)
  return iso(x)
}
/** Laporan dibuat pada tanggal X memuat 7 hari sebelumnya: X-7 sampai X-1. */
export const weekBefore = (created: string) => {
  const d = parseISO(created)
  const s = new Date(d), e = new Date(d)
  s.setDate(d.getDate() - 7)
  e.setDate(d.getDate() - 1)
  return { start: iso(s), end: iso(e) }
}
/** True bila periode persis Kamis–Rabu (7 hari). */
export const isReportWeek = (start: string, end: string) =>
  parseISO(start).getDay() === 4 && differenceInCalendarDays(parseISO(end), parseISO(start)) === 6

export const STATUS_TEXT: Record<ValStatus, string> = {
  ok: '',
  no_data: 'Belum ada data',
  incomplete: 'Data belum cukup',
  overlap: 'Periode tumpang tindih',
  not_aggregable: 'Tidak dapat diagregasi',
}
export const REPORT_STATUS: Record<string, string> = { valid: 'Valid', needs_review: 'Perlu ditinjau', archived: 'Arsip' }
