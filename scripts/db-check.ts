/**
 * Uji cepat penyimpanan MySQL: baca data, jalankan analitik, lalu tulis + hapus satu laporan
 * sementara untuk memastikan perubahan benar-benar tersimpan di database (bukan cache).
 *
 * Pakai: DATABASE_URL=mysql://... npm run db:check
 */
import { createMysqlPool, createMysqlStore } from '../server/mysql'
import { analyze } from '../server/analytics'
import { METRIC_KEYS } from '../shared/metrics'

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL belum diisi.')
  process.exit(1)
}

const pool = createMysqlPool(url, process.env.DATABASE_SSL === '1')
const store = createMysqlStore(pool, { dir: '/tmp/lastdance-check' })

const data = await store.read()
console.log('Isi database:', {
  users: data.users.length,
  reports: data.reports.length,
  contents: data.contents.length,
  ads: data.ads.length,
  reservations: data.reservations.length,
  maps: data.maps.length,
  web: data.web.length,
  wa: data.wa.length,
  audit: data.audit.length,
})

// Integritas: setiap laporan harus punya 30 baris metrik.
const [perReport] = await pool.query('SELECT report_id, COUNT(*) AS n FROM metrics GROUP BY report_id')
const kurang = (perReport as { report_id: string; n: number }[]).filter((r) => Number(r.n) !== METRIC_KEYS.length)
console.log(`Metrik: ${(perReport as unknown[]).length} laporan, ${kurang.length} laporan tidak lengkap`)

const bekam = data.reports.filter((r) => r.account === 'bekam' && r.platform === 'instagram')
const a = analyze(bekam, 'week', '2026-11-05')
console.log('Analitik bekam/instagram minggu 2026-11-05:', {
  rentang: a.range,
  views: a.metrics.views.current,
  interaksi: a.metrics.interactions.current,
  lead: a.metrics.lead.current,
  laporan: a.coverage,
})

// Uji tulis: buat laporan sementara, baca ulang lewat store BARU (tanpa cache), lalu hapus.
const id = crypto.randomUUID()
const now = new Date().toISOString()
await store.mutate((d) => {
  d.reports.push({
    report_id: id,
    account: 'homecare',
    platform: 'instagram',
    period_start: '2026-01-01',
    period_end: '2026-01-07',
    recorded_at: '2026-01-08',
    notes: 'uji tulis MySQL',
    status: 'valid',
    audience: {
      gender: { women: null, men: null },
      age: { '13-17': null, '18-24': null, '25-34': null, '35-44': null, '45-54': null, '55-64': null, '65+': null },
      cities: [], growth_image: '', post_images: [], search_share: null, search_terms: [],
    },
    metrics: Object.fromEntries(METRIC_KEYS.map((k) => [k, k === 'views' ? 1234 : null])) as never,
    snapshot_date: null,
  })
  d.audit.push({ change_id: crypto.randomUUID(), report_id: id, changed_at: now, action: 'create', before_json: '', after_json: '{}' })
})

const store2 = createMysqlStore(pool, { dir: '/tmp/lastdance-check' })
const afterCreate = await store2.read()
const created = afterCreate.reports.find((r) => r.report_id === id)
console.log('Tulis:', created ? `tersimpan (views=${created.metrics.views})` : 'GAGAL tersimpan')

await store2.mutate((d) => {
  const i = d.reports.findIndex((r) => r.report_id === id)
  if (i >= 0) d.reports.splice(i, 1)
  d.audit.push({ change_id: crypto.randomUUID(), report_id: id, changed_at: new Date().toISOString(), action: 'delete', before_json: '{}', after_json: '' })
})
const store3 = createMysqlStore(pool, { dir: '/tmp/lastdance-check' })
const afterDelete = await store3.read()
console.log('Hapus:', afterDelete.reports.some((r) => r.report_id === id) ? 'GAGAL terhapus' : 'terhapus dari database')

await pool.end()
