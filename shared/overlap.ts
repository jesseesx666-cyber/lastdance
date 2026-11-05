import { ACTIVITY_KEYS, type MetricKey, type Report } from './metrics'
import { reportKind } from './kind'

export interface Overlap {
  report_id: string
  period_start: string
  period_end: string
  keys: MetricKey[]
}

type Candidate = Pick<Report, 'account' | 'platform' | 'period_start' | 'period_end' | 'metrics' | 'snapshot_date'> & { report_id?: string }

/** Laporan lain yang periodenya beririsan dan memuat metrik aktivitas yang sama. */
export function findOverlaps(c: Candidate, others: Report[]): Overlap[] {
  return others
    .filter((o) => o.report_id !== c.report_id && o.status !== 'archived' && o.account === c.account && o.platform === c.platform)
    .filter((o) => reportKind(o) === reportKind(c) && o.period_start <= c.period_end && c.period_start <= o.period_end)
    .map((o) => ({
      report_id: o.report_id,
      period_start: o.period_start,
      period_end: o.period_end,
      keys: ACTIVITY_KEYS.filter((k) => c.metrics[k] != null && o.metrics[k] != null),
    }))
    .filter((o) => o.keys.length > 0)
}

/** Snapshot follower pada tanggal yang sama di laporan lain. */
export function findSnapshotClash(c: Candidate, others: Report[]): Report | undefined {
  if (c.metrics.followers == null || !c.snapshot_date) return undefined
  return others.find(
    (o) => o.report_id !== c.report_id && o.status !== 'archived' && o.account === c.account && o.platform === c.platform && o.metrics.followers != null && o.snapshot_date === c.snapshot_date,
  )
}
