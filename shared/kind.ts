import { differenceInCalendarDays, parseISO } from 'date-fns'

export type ReportKind = 'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'rentang khusus'

/** Jenis laporan disimpulkan dari panjang periodenya; tidak ada kolom tambahan di workbook. */
export const reportKind = (r: { period_start: string; period_end: string }): ReportKind => {
  const n = differenceInCalendarDays(parseISO(r.period_end), parseISO(r.period_start)) + 1
  return n === 1 ? 'harian' : n === 7 ? 'mingguan' : n >= 28 && n <= 31 ? 'bulanan' : n >= 365 ? 'tahunan' : 'rentang khusus'
}
