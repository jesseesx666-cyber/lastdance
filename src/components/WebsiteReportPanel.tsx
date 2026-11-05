import { useRef, useState } from 'react'
import type { WebReport, WebRow, Website } from '../../shared/website'
import { useAuth } from '../auth'
import { api, thumbUrl } from '../api'
import { num } from '../format'
import { shrinkImage } from '../shrink'
import { readWords } from '../ocr/recognize'
import { parseRankRows } from '../ocr/rank'
import { usePasteImages } from '../usePasteImages'
import { AddButton, DeleteButton, EditButton } from './IconButtons'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

export type DraftRow = { name: string; count: string }
export const toDraft = (r: WebRow[] | undefined): DraftRow[] => (r ?? []).map((x) => ({ name: x.name, count: String(x.count) }))
export const toRows = (d: DraftRow[]): WebRow[] => d.filter((x) => x.name.trim()).map((x) => ({ name: x.name.trim(), count: x.count === '' ? 0 : Number(x.count) }))
export const toNum = (s: string) => (s === '' ? 0 : Number(s))

/** Tanggal ISO digeser n hari (UTC, supaya tidak terpengaruh zona waktu). */
const shiftDay = (iso: string, days: number) => new Date(Date.parse(iso + 'T00:00:00Z') + days * 864e5).toISOString().slice(0, 10)

/** Selisih minggu ini terhadap minggu lalu: angka, persen, dan warna naik/turun. */
function Gap({ now, prev }: { now: number; prev: number | undefined }) {
  if (prev === undefined) return <span className="text-slate-400">–</span>
  const d = now - prev
  const pct = prev ? ` (${d > 0 ? '+' : ''}${((d / prev) * 100).toFixed(1).replace('.', ',')}%)` : ''
  const color = d > 0 ? '#1f7a5a' : d < 0 ? '#c0392b' : '#64748b'
  return <span className="font-semibold tabular-nums" style={{ color }}>{d > 0 ? '▲ +' : d < 0 ? '▼ ' : ''}{num(d)}{pct}</span>
}

function StatCard({ label, now, prev }: { label: string; now: number; prev: number | undefined }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-3xl font-semibold tabular-nums">{num(now)}</p>
      <p className="mt-1 text-sm text-slate-500">Minggu lalu: <b className="text-slate-900">{prev === undefined ? '–' : num(prev)}</b></p>
      <p className="text-sm">Gap: <Gap now={now} prev={prev} /></p>
    </div>
  )
}

/** Peringkat nama + kunjungan minggu ini; bila `prev` ada, ditambah kolom minggu lalu dan gap. */
export function RankTable({ title, label, rows, prev, countLabel = 'Minggu ini' }: { title: string; label: string; rows: WebRow[]; prev?: WebRow[]; countLabel?: string }) {
  const key = (n: string) => n.trim().toLowerCase()
  const before = new Map((prev ?? []).map((r) => [key(r.name), r.count]))
  const now = new Map(rows.map((r) => [key(r.name), r.count]))
  const list = [...rows, ...(prev ?? []).filter((r) => !now.has(key(r.name))).map((r) => ({ name: r.name, count: 0 }))]
    .sort((a, b) => b.count - a.count || (before.get(key(b.name)) ?? 0) - (before.get(key(a.name)) ?? 0))
  const cmp = prev !== undefined
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-base font-semibold">{title}</h3>
      {list.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-1.5 pr-2 font-medium">{label}</th>
                <th className="py-1.5 text-right font-medium">{countLabel}</th>
                {cmp && <th className="py-1.5 pl-2 text-right font-medium">Minggu lalu</th>}
                {cmp && <th className="py-1.5 pl-2 text-right font-medium">Gap</th>}
              </tr>
            </thead>
            <tbody>
              {list.map((r, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0">
                  <td className="break-all py-1.5 pr-2">{r.name}</td>
                  <td className="py-1.5 text-right font-semibold tabular-nums">{num(r.count)}</td>
                  {cmp && <td className="py-1.5 pl-2 text-right tabular-nums">{before.has(key(r.name)) ? num(before.get(key(r.name))!) : '–'}</td>}
                  {cmp && <td className="py-1.5 pl-2 text-right"><Gap now={r.count} prev={before.get(key(r.name)) ?? 0} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-slate-500">Belum ada data.</p>}
    </div>
  )
}

/** Editor baris peringkat: nama + jumlah, tambah dan hapus baris; atau isi otomatis dari screenshot tabel (OCR, tombol atau Ctrl+V di atas kotak ini). */
export function RowsEditor({ title, label, rows, onChange, max = 50, countLabel = 'Kunjungan' }: { title: string; label: string; rows: DraftRow[]; onChange: (r: DraftRow[]) => void; max?: number; countLabel?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const latest = useRef(rows)
  latest.current = rows
  const read = async (files: File[]) => {
    setBusy(true)
    setNote('')
    try {
      const found: DraftRow[] = []
      for (const f of files) found.push(...parseRankRows(await readWords(f)).map((r) => ({ name: r.name, count: String(r.count) })))
      const have = new Set(latest.current.map((r) => r.name.trim().toLowerCase()))
      const add = found.filter((r) => !have.has(r.name.toLowerCase()))
      if (add.length) onChange([...latest.current.filter((r) => r.name.trim() || r.count), ...add].slice(0, max))
      setNote(found.length ? `${add.length} baris terbaca. Periksa dulu sebelum menyimpan.` : 'Tidak ada baris (nama + angka) yang terbaca dari gambar.')
    } catch (e) {
      setNote(`Gagal membaca gambar: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }
  usePasteImages(box, (files) => void read(files), true) // capture: lebih dulu daripada tempel-gambar milik panel
  return (
    <div ref={box} className="min-w-0 space-y-2">
      <h3 className="text-base font-semibold">{title}</h3>
      {rows.map((r, i) => (
        <div key={i} className="flex gap-2">
          <input aria-label={label} placeholder={label} maxLength={200} value={r.name} onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
          <input aria-label={countLabel} placeholder="0" inputMode="numeric" className="!w-28 shrink-0" value={r.count} onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, count: e.target.value.replace(/\D/g, '') } : x)))} />
          <button type="button" aria-label="Hapus baris" className={btn} onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} disabled={rows.length >= max} onClick={() => onChange([...rows, { name: '', count: '' }])}>+ Tambah baris</button>
        <label className={`${btn} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>{busy ? 'Membaca…' : 'Baca dari gambar (OCR)'}
          <input type="file" accept="image/*" multiple hidden onChange={(e) => { void read([...(e.target.files ?? [])]); e.target.value = '' }} />
        </label>
      </div>
      <p className="text-xs text-slate-500">Atau arahkan kursor ke kotak ini lalu tekan Ctrl+V untuk menempel screenshot tabelnya.</p>
      {note && <p role="status" className="text-xs text-slate-700">{note}</p>}
    </div>
  )
}

/** Laporan Website satu minggu laporan per website: gambar, visitor dan view, Top Page, Top Article (dibanding minggu lalu), Top Referrer. */
export default function WebsiteReportPanel({ period, site }: { period: { start: string; end: string }; site: Website }) {
  const toast = useToast()
  const { isAdmin } = useAuth() // pengguna biasa hanya melihat; mengubah khusus super admin
  const { data, error, reload } = useAsync(() => api.web(), [])
  const all = data ?? []
  const row: WebReport | undefined = all.find((w) => w.site === site && w.period_start === period.start && w.period_end === period.end)
  const last: WebReport | undefined = all.find((w) => w.site === site && w.period_start === shiftDay(period.start, -7) && w.period_end === shiftDay(period.end, -7))
  const [editing, setEditing] = useState(false)
  const [kept, setKept] = useState<string[]>([])
  const [files, setFiles] = useState<Blob[]>([])
  const [visitors, setVisitors] = useState('')
  const [views, setViews] = useState('')
  const [pages, setPages] = useState<DraftRow[]>([])
  const [articles, setArticles] = useState<DraftRow[]>([])
  const [refs, setRefs] = useState<DraftRow[]>([])
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')

  const start = () => {
    setKept(row?.images ?? [])
    setFiles([])
    setVisitors(row ? String(row.visitors) : '')
    setViews(row ? String(row.views) : '')
    setPages(toDraft(row?.pages))
    setArticles(toDraft(row?.articles))
    setRefs(toDraft(row?.referrers))
    setFail('')
    setEditing(true)
  }
  /** Simpan; gambar baru diunggah dulu dan dibersihkan lagi bila simpan gagal. */
  const put = async (d: Pick<WebReport, 'images' | 'visitors' | 'views' | 'pages' | 'articles' | 'referrers'>, uploaded: string[]) => {
    try {
      await api.saveWeb({ site, period_start: period.start, period_end: period.end, ...d })
    } catch (e) {
      for (const u of uploaded) await api.deleteThumb(u).catch(() => {})
      throw e
    }
  }
  const save = async () => {
    setBusy(true)
    setFail('')
    const uploaded: string[] = []
    try {
      for (const f of files) uploaded.push((await api.uploadThumb(f)).file)
      await put({ images: [...kept, ...uploaded], visitors: toNum(visitors), views: toNum(views), pages: toRows(pages), articles: toRows(articles), referrers: toRows(refs) }, uploaded)
      setEditing(false)
      toast('Laporan Website disimpan')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  /** Tambah gambar langsung dari tampilan, tanpa masuk mode ubah. */
  const addNow = async (list: File[]) => {
    if (!row || !list.length) return
    setBusy(true)
    setFail('')
    const uploaded: string[] = []
    try {
      for (const f of list) uploaded.push((await api.uploadThumb(await shrinkImage(f, 1280))).file)
      await put({ ...row, images: [...row.images, ...uploaded] }, uploaded)
      toast('Gambar ditambahkan')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const box = useRef<HTMLDivElement>(null)
  usePasteImages(box, async (list) => {
    if (!isAdmin) return
    if (row && !editing) return void addNow(list)
    const shrunk = await Promise.all(list.map((f) => shrinkImage(f, 1280)))
    if (editing) setFiles((cur) => [...cur, ...shrunk])
    else {
      start()
      setFiles(shrunk)
    }
  })
  const del = async () => {
    if (!row || !confirm('Hapus laporan website periode ini untuk website ini?')) return
    try {
      await api.removeWeb(row.web_id)
      toast('Laporan dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  return (
    <div ref={box}>
    <Card>
      {(error || fail) && <div className="mb-3"><Alert>{error || fail}</Alert></div>}
      {editing ? (
        <div className="space-y-5">
          <label className="block text-sm font-medium">Gambar (boleh lebih dari satu; atau tempel dengan Ctrl+V)
            <input type="file" accept="image/*" multiple className="mt-1" onChange={async (e) => { const fl = [...(e.target.files ?? [])]; setFiles(await Promise.all(fl.map((f) => shrinkImage(f, 1280)))) }} />
          </label>
          <div className="flex flex-wrap gap-2">
            {kept.map((n) => (
              <span key={n} className="relative">
                <img src={thumbUrl(n)} alt="Gambar tersimpan" className="h-24 rounded-lg object-contain" />
                <button type="button" aria-label="Hapus gambar" className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-red-700" onClick={() => setKept(kept.filter((k) => k !== n))}>✕</button>
              </span>
            ))}
            {files.map((f, i) => (
              <span key={i} className="relative">
                <img src={URL.createObjectURL(f)} alt="Pratinjau gambar" className="h-24 rounded-lg object-contain" />
                <button type="button" aria-label="Hapus gambar" className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 text-xs text-red-700" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
              </span>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-medium">Jumlah visitor
              <input inputMode="numeric" className="mt-1" placeholder="0" value={visitors} onChange={(e) => setVisitors(e.target.value.replace(/\D/g, ''))} />
            </label>
            <label className="block text-sm font-medium">Jumlah view
              <input inputMode="numeric" className="mt-1" placeholder="0" value={views} onChange={(e) => setViews(e.target.value.replace(/\D/g, ''))} />
            </label>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RowsEditor title="Top Page" label="Nama page" rows={pages} onChange={setPages} />
            <RowsEditor title="Top Article" label="Judul artikel" rows={articles} onChange={setArticles} />
            <RowsEditor title="Top Referrer" label="Domain" rows={refs} onChange={setRefs} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn} onClick={() => setEditing(false)} disabled={busy}>Batal</button>
            <button type="button" className={btnPrimary} onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </div>
      ) : row ? (
        <div className="space-y-5">
          {isAdmin && <div className="flex items-center justify-end gap-1.5">
            <label className={`${btn} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>{busy ? 'Mengunggah…' : '+ Tambah gambar'}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { void addNow([...(e.target.files ?? [])]); e.target.value = '' }} />
            </label>
            <EditButton onClick={start} />
            <DeleteButton onClick={() => void del()} />
          </div>}
          {row.images.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {row.images.map((n) => <a key={n} href={thumbUrl(n)} target="_blank" rel="noreferrer"><img src={thumbUrl(n)} alt="Laporan Website" loading="lazy" className="max-h-[26rem] w-full rounded-lg object-contain" /></a>)}
            </div>
          )}
          {!last && <p className="text-sm text-slate-500">Belum ada laporan minggu lalu untuk website ini, jadi perbandingan belum tersedia.</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard label="Jumlah visitor" now={row.visitors} prev={last?.visitors} />
            <StatCard label="Jumlah view" now={row.views} prev={last?.views} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <RankTable title="Top Page" label="Nama page" rows={row.pages} prev={last?.pages} />
            <RankTable title="Top Article" label="Judul artikel" rows={row.articles} prev={last?.articles} />
            <RankTable title="Top Referrer" label="Domain" rows={row.referrers} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-slate-500">Belum ada laporan website untuk minggu ini.</p>
          {isAdmin && <AddButton label="Tambah laporan" onClick={start} />}
        </div>
      )}
    </Card>
    </div>
  )
}
