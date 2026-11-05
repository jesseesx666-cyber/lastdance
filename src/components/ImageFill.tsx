import { useEffect, useRef, useState } from 'react'
import { DEF } from '../../shared/metrics'
import { parseInsights, periodMatches, type AudiencePatch, type Detection, type Parsed } from '../ocr/parse'
import { readWords, stopOcr } from '../ocr/recognize'
import { parseTikTok } from '../ocr/tiktok'
import { parseYouTube } from '../ocr/youtube'
import { Alert, btn, Card } from './ui'
import { fmtMetric, fmtRange } from '../format'

interface Result { name: string; parsed: Parsed }
const MAX_BYTES = 15 * 1024 * 1024
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const md = (x: { m: number; d: number }) => `${x.d} ${MONTHS[x.m - 1]}`

/** Isi form dari screenshot (Instagram Insights / Ads Manager). Hanya mengisi; menyimpan tetap lewat Tinjau. */
export default function ImageFill({ periodStart, periodEnd, platform, onFill }: { periodStart: string; periodEnd: string; platform?: string; onFill: (d: Detection[], audience: AudiencePatch | null) => void }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const input = useRef<HTMLInputElement>(null)
  const onFillRef = useRef(onFill)
  onFillRef.current = onFill

  async function run(files: File[]) {
    setError('')
    const images = files.filter((f) => f.type.startsWith('image/'))
    if (!images.length) return setError('File harus berupa gambar (PNG, JPG, atau screenshot).')
    const out: Result[] = []
    for (const f of images) {
      if (f.size > MAX_BYTES) {
        setError(`${f.name} terlalu besar (maksimal 15 MB).`)
        continue
      }
      setBusy(f.name || 'gambar tempel')
      try {
        const p = platformRef.current
        const studio = p === 'youtube' || p === 'tiktok' // tema gelap dibalik dan angka besar dibaca ulang
        const words = await readWords(f, studio, studio)
        // TikTok dan YouTube punya tata letak dan istilah sendiri; platform non-Instagram membaca angka desimal dan singkatan (rb/jt) apa adanya.
        const parsed = p === 'tiktok' ? parseTikTok(words) : p === 'youtube' ? parseYouTube(words) : parseInsights(words, p !== undefined && p !== 'instagram')
        out.push({ name: f.name || 'gambar tempel', parsed })
        if (autoRef.current) onFillRef.current(parsed.found, parsed.audience)
      } catch (e) {
        setError(`Gagal membaca ${f.name || 'gambar'}: ${(e as Error).message}`)
      }
    }
    setBusy('')
    setResults((r) => [...r, ...out])
    if (input.current) input.current.value = ''
  }

  // Ctrl+V: tempel screenshot langsung dari clipboard.
  const [auto, setAuto] = useState(() => {
    try {
      return localStorage.getItem('ocrAuto') !== '0'
    } catch {
      return true
    }
  })
  const autoRef = useRef(auto)
  autoRef.current = auto
  const toggleAuto = (v: boolean) => {
    setAuto(v)
    try {
      localStorage.setItem('ocrAuto', v ? '1' : '0')
    } catch {
      /* penyimpanan diblokir */
    }
  }
  const platformRef = useRef(platform)
  platformRef.current = platform
  useEffect(() => {
    const h = (e: ClipboardEvent) => {
      if (document.querySelector('[role=dialog]')) return // tempelan milik form konten yang sedang terbuka
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (files.length) {
        e.preventDefault()
        void run(files)
      }
    }
    window.addEventListener('paste', h)
    return () => {
      window.removeEventListener('paste', h)
      void stopOcr() // lepaskan memori mesin OCR saat meninggalkan halaman
    }
  }, [])

  const nothing = results.length > 0 && results.every((r) => !r.parsed.found.length && !r.parsed.unreadable.length && !r.parsed.notes.length && !r.parsed.audience)

  return (
    <Card title="Isi dari gambar">
      <label
        className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center text-sm hover:border-indigo-600"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          void run([...e.dataTransfer.files])
        }}
      >
        <span className="font-medium">{busy ? `Membaca ${busy}…` : 'Klik, seret, atau tempel (Ctrl+V) screenshot Insights / Ads Manager'}</span>
        <span className="text-xs text-slate-500">Angka yang terbaca langsung mengisi form di bawah. Gambar diproses di komputermu dan tidak dikirim ke mana pun.</span>
        <input ref={input} type="file" accept="image/*" multiple className="sr-only" disabled={!!busy} onChange={(e) => void run([...(e.target.files ?? [])])} />
      </label>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" className="!w-auto" checked={auto} onChange={(e) => toggleAuto(e.target.checked)} />
        Isi form otomatis dari hasil gambar
        <span className="text-xs text-slate-500">{auto ? '' : '(mati: pilih “Isi form dari hasil ini” di bawah)'}</span>
      </label>

      <div className="mt-3 space-y-2" aria-live="polite">
        {error && <Alert>{error}</Alert>}
        {nothing && <Alert kind="warn">Tidak ada angka yang dikenali. Pastikan labelnya (Views, Reach, Interactions, dan seterusnya) terlihat jelas dan tidak terpotong, atau isi manual.</Alert>}
        {results.map((r, i) => (
          <div key={i} className="rounded-lg border border-slate-200 p-3 text-sm">
            <p className="mb-1 break-all text-xs text-slate-500">{r.name}</p>
            <ul className="space-y-0.5">
              {r.parsed.found.map((d) => (
                <li key={d.key}>✓ <b>{DEF[d.key].label}</b>: {fmtMetric(d.key, d.value)} <span className="text-xs text-slate-500">(terbaca “{d.raw}”)</span></li>
              ))}
              {r.parsed.unreadable.map((u) => (
                <li key={u.key} className="text-amber-700">⚠ {DEF[u.key].label}: “{u.raw}” tidak bisa dipastikan (singkatan/desimal), isi manual.</li>
              ))}
            </ul>
            {r.parsed.audience && <AudienceLines a={r.parsed.audience} />}
            {!auto && (r.parsed.found.length > 0 || r.parsed.audience) && (
              <button type="button" className={`${btn} mt-2`} onClick={() => onFill(r.parsed.found, r.parsed.audience)}>Isi form dari hasil ini</button>
            )}
            {r.parsed.info.map((n) => <p key={n} className="mt-1 text-xs text-slate-500">ℹ {n}</p>)}
            {r.parsed.notes.map((n) => <p key={n} className="mt-1 text-xs text-amber-700">⚠ {n}</p>)}
            {r.parsed.period && (periodMatches(r.parsed.period, periodStart, periodEnd) ? (
              <p className="mt-1 text-xs text-emerald-700">✓ Periode di gambar ({md(r.parsed.period.from)} – {md(r.parsed.period.to)}) sama dengan form.</p>
            ) : (
              <div className="mt-2"><Alert kind="warn">Periode di gambar ({md(r.parsed.period.from)} – {md(r.parsed.period.to)}) berbeda dengan form ({fmtRange(periodStart, periodEnd)}). Pastikan gambar ini untuk minggu yang benar.</Alert></div>
            ))}
          </div>
        ))}
        {results.some((r) => r.parsed.found.length > 0) && <p className="text-xs text-slate-500">Pembacaan otomatis bisa meleset: periksa angka di form, lalu klik Tinjau.</p>}
      </div>
    </Card>
  )
}

const pctText = (v: number) => `${v.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`

/** Ringkasan Gender / Age range / lokasi yang terbaca dari gambar. */
function AudienceLines({ a }: { a: AudiencePatch }) {
  const g = Object.entries(a.gender).map(([k, v]) => `${k === 'women' ? 'Women' : 'Men'} ${pctText(v)}`)
  const age = Object.entries(a.age).map(([k, v]) => `${k} ${pctText(v)}`)
  const rows = (r: { name: string; pct: number }[]) => r.map((x) => `${x.name || '(nama kosong)'} ${pctText(x.pct)}`).join(' · ')
  return (
    <ul className="mt-1 space-y-0.5 text-sm">
      {g.length > 0 && <li>✓ <b>Gender</b>: {g.join(' · ')}</li>}
      {age.length > 0 && <li>✓ <b>Age range</b>: {age.join(' · ')}</li>}
      {a.cities.length > 0 && <li>✓ <b>Top locations</b>: {rows(a.cities)}</li>}
      {a.search_share != null && <li>✓ <b>Proporsi traffic penelusuran</b>: {pctText(a.search_share)}</li>}
      {(a.search_terms?.length ?? 0) > 0 && <li>✓ <b>Kata kunci penelusuran</b>: {rows(a.search_terms!)}</li>}
    </ul>
  )
}
