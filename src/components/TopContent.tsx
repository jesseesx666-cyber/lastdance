import { useState } from 'react'
import type { Content, ContentSection } from '../../shared/content'
import { reportKind } from '../../shared/kind'
import { useAccount, usePlatform } from '../account'
import { api, thumbUrl, type Analysis } from '../api'
import { igEmbed } from '../embed'
import { dayAfter, fmtRange, num } from '../format'
import { useFx } from '../theme'
import { label } from './ContentForm'
import { Alert, Card, useAsync } from './ui'

const STATS = [['views', 'Views'], ['likes', 'Likes'], ['interactions', 'Interaksi']] as const

/** Gambar sampul menutupi embed (yang gagal untuk akun privat); tanpa sampul dicoba embed resmi Instagram. */
function Media({ c }: { c: Content }) {
  // Mode Penuh: embed langsung dimuat. Hemat/Mati: tunggu klik, karena embed Instagram berat bagi perangkat lemah.
  const [on, setOn] = useState(useFx() === 'full')
  if (c.thumbnail)
    return (
      <a href={c.url} target="_blank" rel="noopener noreferrer" aria-label={`Buka video ${label(c)}`} className="group relative mt-3 block overflow-hidden rounded-lg bg-black">
        <img src={thumbUrl(c.thumbnail)} alt={`Sampul ${label(c)}`} loading="lazy" className="mx-auto max-h-[540px] w-full object-contain" />
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 ring-2 ring-white/70 transition-colors group-hover:bg-black/75"><svg viewBox="0 0 24 24" width="26" height="26" fill="#ffffff" className="ml-0.5"><path d="M8 5v14l11-7z" /></svg></span>
        </span>
      </a>
    )
  const src = igEmbed(c.url)
  if (!src) return <p className="mt-3 text-xs text-slate-500">Pratinjau hanya tersedia untuk link Instagram. Gunakan tautan di atas, atau tambahkan gambar sampul lewat Input → Input Content.</p>
  return on ? (
    <>
      <iframe
        src={src}
        title="Pratinjau video Instagram"
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="mt-3 h-[540px] w-full rounded-lg border-0 bg-white"
      />
      <p className="mt-1.5 text-[11px] text-slate-500">Video tidak muncul? Instagram hanya menampilkan post dari akun publik. Tambahkan gambar sampul lewat Input → Input Content.</p>
    </>
  ) : (
    <button type="button" onClick={() => setOn(true)} className="mt-3 grid h-32 w-full place-items-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-600 hover:border-indigo-600">▶︎ Muat video</button>
  )
}

/** Konten milik rentang yang sedang dilihat: mingguan = periodenya beririsan; bulanan/tahunan = periode persis sama; khusus = tanggal laporannya di dalam rentang. */
export function pickTop(data: Content[], account: string, platform: string, a: Analysis, section: ContentSection = 'top') {
  const inRange = data.filter((c) => c.account === account && c.platform === platform && c.section === section && (a.basis === 'reportDate' ? dayAfter(c.period_end) >= a.range.from && dayAfter(c.period_end) <= a.range.to : a.basis === 'exact' || a.basis === 'year' ? c.period_start === a.range.from && c.period_end === a.range.to : reportKind(c) === 'mingguan' && c.period_end >= a.range.from && c.period_start <= a.range.to))
  const top = [...inRange].sort((x, y) => y.views - x.views || y.likes - x.likes || y.interactions - x.interactions).slice(0, 3)
  return { inRange, top }
}

/** Tampilan saja: tiga konten dengan Views terbanyak pada periode dashboard. Input ada di halaman Input. */
export default function TopContent({ a, section = 'top' }: { a: Analysis; section?: ContentSection }) {
  const account = useAccount()
  const platform = usePlatform()
  const { data, error } = useAsync(() => api.contents(), [])

  const { inRange, top } = pickTop(data ?? [], account, platform, a, section)

  return (
    <>
      <p className="mb-3 text-xs text-slate-500">{inRange.length} konten di periode ini · peringkat berdasarkan Views</p>
      {error && <div className="mb-3"><Alert>{error}</Alert></div>}

      {top.length === 0 ? (
        <Card><p className="py-6 text-center text-sm text-slate-500">Belum ada konten untuk periode {fmtRange(a.range.from, a.range.to)}. Tambahkan lewat halaman <a href="#/input" className="text-indigo-700 underline underline-offset-2">Input → {section === 'top' ? 'Input Content' : 'Input Endorsement'}</a>.</p></Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {top.map((c, i) => (
            <Card key={c.content_id} className="!p-4">
              <div className="flex items-start gap-3">
                <span aria-label={`Peringkat ${i + 1}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white" style={i > 0 ? { opacity: i === 1 ? 0.75 : 0.55 } : undefined}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium" title={label(c)}>{label(c)}</p>
                  {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-700 underline-offset-2 hover:underline">Buka video ↗</a>}
                </div>
              </div>
              <Media c={c} />
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                {STATS.map(([k, l]) => (
                  <div key={k} className={`rounded-lg px-1 py-2 ${k === 'views' ? 'bg-indigo-50' : ''}`}>
                    <dt className="text-[11px] text-slate-500">{l}</dt>
                    <dd className={`text-lg font-semibold tracking-tight ${k === 'views' ? 'text-indigo-900' : ''}`}>{num(c[k])}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
