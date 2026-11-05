import { useEffect, useState, type ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DEF, type MetricKey } from '../../shared/metrics'
import type { Granularity } from '../../server/analytics'
import { api, thumbUrl, type Analysis } from '../api'
import { useAccount } from '../account'
import { ACCOUNT_PLATFORMS, DEFAULT_PLATFORM, PLATFORM_LABEL, THREADS_LABEL, TIKTOK_LABEL, YOUTUBE_LABEL } from '../../shared/platforms'
import AccountTabs from '../components/AccountTabs'
import AudienceCharts, { YouTubeAudience } from '../components/AudienceCharts'
import TopContent from '../components/TopContent'
import { ReservationCharts } from '../components/Reservations'
import { RESERVATION_ACCOUNT } from '../../shared/reservation'
import ActiveAds from '../components/ActiveAds'
import InfluencerList from '../components/InfluencerList'
import { INFLUENCER_ACCOUNT } from '../../shared/influencer'
import { downloadReport } from '../reportRows'
import { Alert, Block, btnPrimary, Card, Delta, Panel, Section, useAsync } from '../components/ui'
import { PALETTE, useTheme } from '../theme'
import { fmtDate, fmtMetric, fmtRange, fmtShort, num, STATUS_TEXT, today } from '../format'

const GRAN: [Granularity, string][] = [['week', 'Mingguan'], ['month', 'Bulanan'], ['year', 'Tahunan'], ['custom', 'Rentang khusus']]
const CORE: MetricKey[] = ['views', 'viewers', 'profile_visits', 'external_link_taps', 'interactions']
const META: MetricKey[] = ['lead', 'cost_per_result', 'budget', 'amount_spent', 'impressions', 'reach']
const OPTIONAL: MetricKey[] = ['likes', 'comments', 'shares', 'saves']
const REVENUE: MetricKey[] = ['patients', 'revenue', 'avg_purchase']
/** Grafik Tren dikelompokkan seperti urutan dashboard supaya tiap metrik mudah ditemukan. */
const GROUPS: [string, MetricKey[]][] = [
  ['Instagram', [...CORE, 'followers', ...OPTIONAL]],
  ['Meta Ads', META],
  ['Pendapatan', REVENUE],
]

export default function Dashboard() {
  const P = PALETTE[useTheme()]
  const account = useAccount()
  const platform = DEFAULT_PLATFORM // sementara Instagram saja; tampilan semua platform menunggu rancangan
  const [g, setG] = useState<Granularity>('week')
  const [anchor, setAnchor] = useState(today())
  const [from, setFrom] = useState(today().slice(0, 8) + '01')
  const [to, setTo] = useState(today())
  const [grp, setGrp] = useState('Instagram')
  const [tab, setTab] = useState<MetricKey>('views')

  // Mulai dari laporan terbaru akun ini agar tidak membuka minggu kosong.
  useEffect(() => {
    api.reports().then((rs) => {
      const mine = rs.filter((r) => r.account === account && r.platform === platform)
      setAnchor(mine.length ? mine.reduce((m, r) => (r.recorded_at > m ? r.recorded_at : m), '') : today())
    }, () => {})
  }, [account, platform])

  const q: Record<string, string> = g === 'custom' ? { granularity: g, from, to, account, platform } : { granularity: g, anchor, account, platform }
  const { data: a, error, loading } = useAsync(() => (g === 'custom' && from > to ? Promise.reject(new Error('Tanggal mulai tidak boleh melewati tanggal akhir.')) : api.analytics(q)), [g, anchor, from, to, account, platform])

  const optionalShown = a ? OPTIONAL.filter((k) => a.metrics[k].current.status !== 'no_data' || a.metrics[k].previous.status !== 'no_data') : []
  const tabs = a ? (GROUPS.find(([n]) => n === grp)?.[1] ?? []).filter((k) => a.series[k].length > 0) : []
  const active = tabs.includes(tab) ? tab : tabs[0]

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <AccountTabs className="w-full" platforms={false} />

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Periode</p>
          <h1 className="text-2xl font-semibold tracking-tight">{a ? fmtRange(a.range.from, a.range.to) : '…'}</h1>
          {a && <p className="mt-0.5 text-sm text-slate-500">dibandingkan dengan {fmtRange(a.previous.from, a.previous.to)}</p>}
          {a?.basis === 'reportDate' && a.coverage && <p className="mt-0.5 text-xs text-slate-500">Mencakup {a.coverage.count} laporan bertanggal {fmtRange(a.range.from, a.range.to)} (periode data {fmtRange(a.coverage.from, a.coverage.to)})</p>}
          {(g === 'month' || g === 'year') && <p className="mt-0.5 text-xs text-slate-500">Data {g === 'month' ? 'bulanan' : 'tahunan'} diinput manual lewat Input Insights (pilih {g === 'month' ? 'bulan' : 'tahun'}); tidak dijumlahkan dari laporan mingguan.</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Granularitas periode" className="inline-flex rounded-full glass p-1">
            {GRAN.map(([k, l]) => (
              <button key={k} aria-pressed={g === k} onClick={() => setG(k)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${g === k ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{l}</button>
            ))}
          </div>
          {g === 'custom' ? (
            <>
              <input type="date" aria-label="Tanggal mulai" className="!w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
              <input type="date" aria-label="Tanggal akhir" className="!w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
            </>
          ) : (
            <input type="date" aria-label="Tanggal acuan" className="!w-auto" value={anchor} onChange={(e) => e.target.value && setAnchor(e.target.value)} />
          )}
        </div>
      </header>

      {error && <Alert>{error}</Alert>}
      {loading && !a && <p className="text-sm text-slate-500">Memuat data…</p>}

      {a && (
        <>
          {a.reportCount === 0 && <Alert kind="info">Belum ada laporan. Tambahkan data dari menu <b>Input Insights</b>.</Alert>}

          <Section title={`Dashboard ${PLATFORM_LABEL[platform]}`}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {CORE.map((k) => <Kpi key={k} k={k} a={a} />)}
              <FollowersStat a={a} />
            </div>
            {a.followers.growth != null && a.followers.warnings.length > 0 && <div className="mt-3"><Alert kind="warn">{a.followers.warnings.join(' ')}</Alert></div>}
            {optionalShown.length > 0 && <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{optionalShown.map((k) => <Kpi key={k} k={k} a={a} />)}</div>}
          </Section>

          {ACCOUNT_PLATFORMS[account].includes('facebook') && <FacebookSection q={q} />}

          {ACCOUNT_PLATFORMS[account].includes('tiktok') && <TikTokSection q={q} />}

          {ACCOUNT_PLATFORMS[account].includes('threads') && <ThreadsSection q={q} />}

          {ACCOUNT_PLATFORMS[account].includes('youtube') && <YouTubeSection q={q} />}

          <Section title="Top 3 Content">
            <TopContent a={a} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SplitDonut title="By Content Type" prefix="viewers" a={a} />
              <SplitDonut title="By content interactions" prefix="interactions" a={a} />
            </div>
          </Section>

          {account === INFLUENCER_ACCOUNT && (
            <Section title="ENDORSMENT">
              <TopContent a={a} section="endorsement" />
            </Section>
          )}

          <Section title="Audience">
            <AudienceCharts a={a} />
          </Section>

          <Panel>
            <Block title="Dashboard Meta Ads">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">{META.map((k) => <Kpi key={k} k={k} a={a} />)}</div>
            </Block>
            <Block title="Dashboard Pendapatan">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {REVENUE.map((k) => <Kpi key={k} k={k} a={a} />)}
              </div>
            </Block>
          </Panel>

          {account === RESERVATION_ACCOUNT && (
            <Section title="Reservasi">
              <ReservationCharts period={{ start: a.range.from, end: a.range.to }} />
            </Section>
          )}

          <Section title="Tren">
            <div className="grid gap-4 xl:grid-cols-3">
              <Card className="xl:col-span-2">
                <div role="group" aria-label="Kelompok grafik" className="mb-3 inline-flex rounded-full border border-slate-200 bg-white p-1">
                  {GROUPS.map(([name]) => (
                    <button key={name} aria-pressed={name === grp} onClick={() => setGrp(name)} className={`rounded-full px-3.5 py-1 text-sm font-medium transition-colors ${name === grp ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}>{name}</button>
                  ))}
                </div>
                {tabs.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-500">Belum ada data {grp} untuk digrafikkan.</p>
                ) : (
                  <>
                    <div role="tablist" aria-label="Metrik grafik" className="-mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1">
                      {tabs.map((k) => (
                        <button key={k} role="tab" aria-selected={k === active} onClick={() => setTab(k)} className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${k === active ? 'border-indigo-600 bg-indigo-600 font-medium text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'}`}>{DEF[k].label}</button>
                      ))}
                    </div>
                    <Trend k={active} a={a} />
                    <p className="mt-3 text-xs text-slate-500">
                      Riwayat laporan {a.sourceGranularity.join(', ')} sampai periode terpilih; satu batang/titik = satu laporan, tanpa data harian buatan.
                      {' '}<Dot c={P.cur} /> terpilih <Dot c={P.prev} /> pembanding <Dot c={P.rest} /> lainnya
                    </p>
                  </>
                )}
              </Card>
              <Profit a={a} />
            </div>
          </Section>

          <Section title="Iklan Aktif">
            <ActiveAds account={account} />
          </Section>

          {account === INFLUENCER_ACCOUNT && (
            <Section title="List Influencer">
              <InfluencerList />
            </Section>
          )}
        </>
      )}
    </div>
  )
}

/** Wadah: semua kartu di bawah judulnya berada di dalam satu panel. Beberapa judul boleh berbagi satu wadah (Block). */
/** Jumlah follower akhir periode beserta selisih (gap) dari awal periode. */
function FollowersStat({ a, label = 'Followers' }: { a: Analysis; label?: string }) {
  return (
    <Stat
      label={label}
      value={num(a.followers.end?.value)}
      prev={a.followers.growth != null && a.followers.start ? num(a.followers.start.value) : undefined}
      delta={a.followers.growth != null ? <Delta gap={a.followers.growth} growth={a.followers.rate} /> : <span className="text-xs text-slate-500">{a.followers.warnings[0]}</span>}
      foot="Snapshot, tidak dijumlahkan"
    />
  )
}

/** Gambar rasio 9:16 dalam bingkai ponsel putih (TikTok dan Facebook). */
function PhoneFrame({ image, alt, platform }: { image?: string; alt: string; platform: string }) {
  return (
    <div className="mx-auto w-full max-w-[17rem] overflow-hidden rounded-[2rem] border-[6px] border-[#ffffff] bg-black shadow-lg">
      {image ? (
        <img src={thumbUrl(image)} alt={alt} className="aspect-[9/16] w-full object-cover" />
      ) : (
        <div className="grid aspect-[9/16] place-items-center p-4 text-center text-sm text-slate-400">Belum ada gambar untuk periode ini. Unggah di Input Insights (pilih {platform}).</div>
      )}
    </div>
  )
}

/** Dashboard Facebook: foto (screenshot laporan terbaru di periode) dan jumlah follower beserta gap. */
function FacebookSection({ q }: { q: Record<string, string> }) {
  const { data: fb, error } = useAsync(() => api.analytics({ ...q, platform: 'facebook' }), [JSON.stringify(q)])
  const photo = fb?.audience?.data.growth_image
  return (
    <Section title="Dashboard Facebook">
      {error && <Alert>{error}</Alert>}
      {fb && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="!p-3 sm:!p-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Foto</p>
            {photo ? (
              <img src={thumbUrl(photo)} alt="Foto dari Facebook" loading="lazy" className="mx-auto max-h-[22rem] w-full rounded-lg object-contain" />
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada foto untuk periode ini. Unggah di Input Insights (pilih Facebook).</p>
            )}
          </Card>
          <FollowersStat a={fb} />
        </div>
      )}
    </Section>
  )
}

/** Dashboard Threads: foto insight beberapa postingan, lalu Dilihat, Pemirsa, Kunjungan Profil, dan Pengikut beserta gap. */
function ThreadsSection({ q }: { q: Record<string, string> }) {
  const { data: th, error } = useAsync(() => api.analytics({ ...q, platform: 'threads' }), [JSON.stringify(q)])
  const photos = th?.audience?.data.post_images ?? []
  return (
    <Section title="Dashboard Threads">
      {error && <Alert>{error}</Alert>}
      {th && (
        <div className="space-y-3">
          <Card className="!p-3 sm:!p-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Insight postingan</p>
            {photos.length ? (
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {photos.map((p, i) => (
                  <li key={p} className="overflow-hidden rounded-lg border border-slate-200">
                    <img src={thumbUrl(p)} alt={`Insight postingan ${i + 1}`} className="h-56 w-full bg-black/20 object-contain" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada foto untuk periode ini. Unggah di Input Insights (pilih Threads).</p>
            )}
          </Card>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Kpi k="views" a={th} label={THREADS_LABEL.views} />
            <Kpi k="viewers" a={th} label={THREADS_LABEL.viewers} />
            <Kpi k="profile_visits" a={th} label={THREADS_LABEL.profile_visits} />
            <FollowersStat a={th} label={THREADS_LABEL.followers} />
          </div>
        </div>
      )}
    </Section>
  )
}

/** Dashboard YouTube: thumbnail video, lalu Penayangan, Waktu Tonton (jam), dan Subscriber beserta gap. */
function YouTubeSection({ q }: { q: Record<string, string> }) {
  const { data: yt, error } = useAsync(() => api.analytics({ ...q, platform: 'youtube' }), [JSON.stringify(q)])
  const thumbs = yt?.audience?.data.post_images ?? []
  return (
    <Section title="Dashboard YouTube">
      {error && <Alert>{error}</Alert>}
      {yt && (
        <div className="space-y-3">
          <Card className="!p-3 sm:!p-4">
            <p className="mb-2 text-xs font-medium text-slate-500">Thumbnail video</p>
            {thumbs.length ? (
              <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {thumbs.map((p, i) => (
                  <li key={p} className="overflow-hidden rounded-lg border border-slate-200">
                    <img src={thumbUrl(p)} alt={`Thumbnail video ${i + 1}`} className="h-56 w-full bg-black/20 object-contain" />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Belum ada thumbnail untuk periode ini. Unggah di Input Insights (pilih YouTube).</p>
            )}
          </Card>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <Kpi k="views" a={yt} label={YOUTUBE_LABEL.views} />
            <Kpi k="watch_hours" a={yt} label={YOUTUBE_LABEL.watch_hours} />
            <FollowersStat a={yt} label={YOUTUBE_LABEL.followers} />
          </div>
          <h3 className="pt-2 text-lg font-semibold tracking-tight">Audience</h3>
          <YouTubeAudience a={yt} />
        </div>
      )}
    </Section>
  )
}

/** Dashboard TikTok: gambar 9:16 di kiri dan Metrik utama di kanan, lalu lalu Jumlah pengikut dan Pengikut neto. */
function TikTokSection({ q }: { q: Record<string, string> }) {
  const { data: tk, error } = useAsync(() => api.analytics({ ...q, platform: 'tiktok' }), [JSON.stringify(q)])
  const image = tk?.audience?.data.growth_image
  return (
    <Section title="Dashboard TikTok">
      {error && <Alert>{error}</Alert>}
      {tk && (
        <div className="space-y-4">
          <div className="grid items-start gap-5 md:grid-cols-[17rem_1fr]">
            <PhoneFrame image={image} alt="Gambar TikTok" platform="TikTok" />
            <Card>
              <h3 className="text-lg font-semibold tracking-tight">Metrik utama</h3>
              <p className="mb-3 text-sm text-slate-500">{fmtRange(tk.range.from, tk.range.to)}</p>
              <div className="grid grid-cols-2 gap-3">
                {(['views', 'profile_visits', 'likes', 'comments', 'shares', 'reward'] as const).map((k) => <Kpi key={k} k={k} a={tk} label={TIKTOK_LABEL[k]} />)}
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label={TIKTOK_LABEL.followers!} value={num(tk.followers.end?.value)} foot="Sepanjang waktu" />
            <Kpi k="net_followers" a={tk} label={TIKTOK_LABEL.net_followers} />
          </div>
        </div>
      )}
    </Section>
  )
}

/** Kartu angka: nilai, nilai pembanding, lalu selisih. */
function Stat({ label, value, prev, delta, foot, dim, sub }: { label: string; value: string; prev?: string; delta?: ReactNode; foot?: string; dim?: boolean; sub?: ReactNode }) {
  return (
    <Card className={`!p-3 transition-colors hover:border-slate-300 sm:!p-4 ${dim ? 'opacity-55' : ''}`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="break-words text-2xl font-semibold tracking-tight">{value}</p>
        {sub}
      </div>
      {prev !== undefined && <p className="mt-0.5 text-xs text-slate-500">Sebelumnya {prev}</p>}
      {delta && <div className="mt-2">{delta}</div>}
      {foot && <p className="mt-2 text-[11px] text-slate-400">{foot}</p>}
    </Card>
  )
}

function Kpi({ k, a, label }: { k: MetricKey; a: Analysis; label?: string }) {
  const m = a.metrics[k]
  const ok = m.current.status === 'ok'
  const none = m.current.status === 'no_data'
  return (
    <Stat
      label={label ?? DEF[k].label}
      value={ok ? fmtMetric(k, m.current.value) : '–'}
      prev={ok ? (m.previous.status === 'ok' ? fmtMetric(k, m.previous.value) : '–') : undefined}
      dim={none}
      sub={k === 'views' && ok ? <FollowerSplit a={a} /> : undefined}
      delta={ok ? <Delta gap={m.gap} growth={m.growth} note={m.growthNote} digits={DEF[k].decimal && !DEF[k].currency && !DEF[k].percent ? 2 : 0} lowerIsBetter={k === 'cost_per_result'} /> : none ? undefined : <span className="text-xs text-amber-700">⚠ {STATUS_TEXT[m.current.status]}</span>}
    />
  )
}

/** Keuntungan dan biaya per pasien dihitung di backend; "–" bila data periode itu belum lengkap. */
function Profit({ a }: { a: Analysis }) {
  const account = useAccount()
  const platform = DEFAULT_PLATFORM // sementara Instagram saja; tampilan semua platform menunggu rancangan
  const [busy, setBusy] = useState(false)
  const download = async () => {
    setBusy(true)
    try {
      downloadReport(a, await api.contents(), account, platform)
    } finally {
      setBusy(false)
    }
  }
  const rows = [
    { key: 'profit' as const, label: 'Keuntungan', note: 'Pendapatan − Amount spent', lowerIsBetter: false },
    { key: 'spend_per_patient' as const, label: 'Biaya per pasien', note: 'Amount spent ÷ Jumlah pasien', lowerIsBetter: true },
  ]
  const f = (v: number | null) => (v == null ? '–' : fmtMetric('revenue', v))
  return (
    <Card title="Keuntungan" className="flex flex-col">
      <div className="space-y-5">
        {rows.map((r) => {
          const d = a.derived[r.key]
          const growth = d.gap != null && d.previous && d.previous > 0 ? (d.gap / d.previous) * 100 : null
          return (
            <div key={r.key} className={d.current == null ? 'opacity-55' : ''}>
              <p className="text-xs font-medium text-slate-500">{r.label}</p>
              <p className={`mt-1 break-words text-2xl font-semibold tracking-tight ${d.current != null && d.current < 0 ? 'text-red-700' : ''}`}>{f(d.current)}</p>
              {d.current != null && <p className="mt-0.5 text-xs text-slate-500">Sebelumnya {f(d.previous)}</p>}
              {d.current != null && <div className="mt-2"><Delta gap={d.gap} growth={growth} lowerIsBetter={r.lowerIsBetter} /></div>}
              <p className="mt-2 text-[11px] text-slate-400">{r.note}</p>
            </div>
          )
        })}
      </div>
      <button type="button" onClick={download} disabled={busy} className={`${btnPrimary} mt-auto w-full`}>{busy ? 'Menyiapkan…' : '⬇ Unduh laporan'}</button>
    </Card>
  )
}

const okValue = (a: Analysis, k: MetricKey) => {
  const c = a.metrics[k].current
  return c.status === 'ok' ? c.value : null
}

/** Porsi views dari followers dan non-followers (input manual atau gambar); yang satu dilengkapi dari 100% bila hanya satu terisi. */
function FollowerSplit({ a }: { a: Analysis }) {
  const f0 = okValue(a, 'views_followers_pct')
  const n0 = okValue(a, 'views_nonfollowers_pct')
  const f = f0 ?? (n0 != null ? 100 - n0 : null)
  const nf = n0 ?? (f0 != null ? 100 - f0 : null)
  if (f == null || nf == null) return null
  // Dua baris di kanan angka: "20% Follower" dan "80% Non-Follower".
  return (
    <div className="text-xs font-semibold leading-snug text-slate-800">
      <span className="block">{num(f, 2)}% Follower</span>
      <span className="block">{num(nf, 2)}% Non-Follower</span>
    </div>
  )
}

const SPLITS = [['reels', 'Reels'], ['post', 'Post'], ['story', 'Story']] as const

/** Donut persentase Reels / Post / Story dari angka yang diinput (viewers atau interaksi). */
function SplitDonut({ title, prefix, a }: { title: string; prefix: 'viewers' | 'interactions'; a: Analysis }) {
  const P = PALETTE[useTheme()]
  const colors = [P.cur, P.prev, P.third]
  const parts: { name: string; value: number | null; color: string }[] = SPLITS.map(([k, name], i) => ({ name, value: okValue(a, `${prefix}_${k}_pct` as MetricKey), color: colors[i] }))
  const have = parts.filter((p): p is { name: string; value: number; color: string } => p.value != null)
  const total = have.reduce((s, p) => s + p.value, 0)
  // Instagram punya jenis konten lain di luar Reels/Post/Story: sisanya ditampilkan sebagai "Lainnya".
  const rest = 100 - total
  const slices = rest > 1 ? [...have, { name: 'Lainnya', value: rest, color: P.rest }] : have
  return (
    <Card title={title}>
      {have.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Belum ada data periode ini. Isi lewat Input Insights atau gambar.</p>
      ) : (
        <>
          <div className="mx-auto h-44 max-w-[11rem]">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" stroke="none" paddingAngle={slices.length > 1 ? 2 : 0}>
                  {slices.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
                <Tooltip formatter={(v: number, n: string) => [num(v, 2) + '%', n]} contentStyle={{ background: P.tipBg, border: '1px solid ' + P.tipBorder, borderRadius: 8, color: P.tipText }} labelStyle={{ color: P.tipText }} itemStyle={{ color: P.tipText }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {parts.map((p) => (
              <li key={p.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name}</span>
                <b>{p.value == null ? '–' : num(p.value, 2) + '%'}</b>
              </li>
            ))}
          </ul>
          {rest > 1 && (
            <p className="mt-1.5 flex items-center justify-between text-sm text-slate-500">
              <span className="flex items-center gap-2"><span aria-hidden className="h-2.5 w-2.5 rounded-full" style={{ background: P.rest }} />Lainnya</span>
              <span>{num(rest, 2)}%</span>
            </p>
          )}
          {total - 100 > 1 && <p className="mt-2 text-xs text-amber-700">⚠ Total {num(total, 2)}% melebihi 100%. Periksa angkanya.</p>}
        </>
      )}
    </Card>
  )
}

const Dot = ({ c }: { c: string }) => <span aria-hidden className="mx-0.5 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ background: c }} />

/** Total per periode = batang; metrik uang = garis; followers (snapshot, level) = area. */
function Trend({ k, a }: { k: MetricKey; a: Analysis }) {
  const P = PALETTE[useTheme()]
  const snap = DEF[k].type === 'snapshot'
  const money = !!DEF[k].currency // metrik uang = garis, supaya naik-turunnya terbaca
  const data = a.series[k].map((p) => ({
    ...p,
    x: fmtShort(snap && p.snapshot_date ? p.snapshot_date : p.period_end),
    color: p.slot === 'cur' ? P.cur : p.slot === 'prev' ? P.prev : P.rest,
  }))
  const compact = (v: number) =>
    DEF[k].currency ? (v >= 1e6 ? num(v / 1e6, 1) + ' jt' : v >= 1e3 ? num(v / 1e3) + ' rb' : num(v)) : v >= 1e4 ? num(v / 1e3, 1) + 'k' : num(v)
  const labels = (
    <LabelList
      dataKey="value"
      position="top"
      offset={10}
      fill={P.tipText}
      fontSize={11}
      fontWeight={600}
      formatter={(v: unknown) => (typeof v === 'number' ? (data.length > 6 ? compact(v) : fmtMetric(k, v)) : '')}
    />
  )
  const tip = {
    formatter: (v: number) => [fmtMetric(k, v), DEF[k].label] as [string, string],
    labelFormatter: (_: unknown, p: readonly { payload?: (typeof data)[number] }[]) => {
      const d = p?.[0]?.payload
      return d ? (snap && d.snapshot_date ? 'Snapshot ' + fmtDate(d.snapshot_date) : fmtRange(d.period_start, d.period_end)) : ''
    },
  }
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={P.grid} vertical={false} />
      <XAxis dataKey="x" fontSize={11} interval="preserveStartEnd" tick={{ fill: P.axis }} stroke={P.axisLine} padding={snap || money ? { left: 32, right: 32 } : undefined} />
      <YAxis fontSize={11} width={48} tick={{ fill: P.axis }} stroke={P.axisLine} tickFormatter={(v) => (DEF[k].currency ? (v >= 1e6 ? num(v / 1e6, 1) + ' jt' : v >= 1e4 ? num(v / 1e3) + ' rb' : num(v)) : v >= 1e4 ? num(v / 1e3) + 'k' : num(v))} domain={snap || money ? ['auto', 'auto'] : [0, 'auto']} />
      <Tooltip {...tip} cursor={snap || money ? { stroke: P.axisLine } : { fill: P.cursor }} contentStyle={{ background: P.tipBg, border: '1px solid ' + P.tipBorder, borderRadius: 8, color: P.tipText }} labelStyle={{ color: P.tipText }} itemStyle={{ color: P.tipText }} />
    </>
  )
  return (
    <div className="h-64 md:h-80">
      <ResponsiveContainer>
        {snap ? (
          <AreaChart data={data} margin={{ left: 0, right: 12, top: 26 }}>
            <defs>
              <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={P.prev} stopOpacity={0.45} />
                <stop offset="100%" stopColor={P.prev} stopOpacity={0} />
              </linearGradient>
            </defs>
            {axes}
            <Area type="monotone" dataKey="value" stroke={P.cur} fill="url(#fillArea)" strokeWidth={2.5} dot={{ r: 4, fill: P.cur, strokeWidth: 0 }}>{labels}</Area>
          </AreaChart>
        ) : money ? (
          <LineChart data={data} margin={{ left: 0, right: 12, top: 26 }}>
            {axes}
            <Line
              type="monotone"
              dataKey="value"
              stroke={P.cur}
              strokeWidth={2.5}
              dot={(p: { cx?: number; cy?: number; payload?: { color: string; report_id: string } }) => (
                <circle key={p.payload?.report_id} cx={p.cx} cy={p.cy} r={5} fill={p.payload?.color === P.rest ? P.axis : p.payload?.color} stroke={P.tipBg} strokeWidth={2} />
              )}
              activeDot={{ r: 7 }}
            >
              {labels}
            </Line>
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ left: 0, right: 12, top: 26 }}>
            {axes}
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {data.map((d) => <Cell key={d.report_id} fill={d.color} />)}
              {labels}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
