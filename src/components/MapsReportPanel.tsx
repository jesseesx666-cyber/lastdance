import { useRef, useState } from 'react'
import type { MapsAccount, MapsReport } from '../../shared/maps'
import { useAuth } from '../auth'
import { api, thumbUrl } from '../api'
import { num } from '../format'
import { shrinkImage } from '../shrink'
import { usePasteImages } from '../usePasteImages'
import { AddButton, DeleteButton, EditButton } from './IconButtons'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

const STARS = [1, 2, 3, 4, 5] as const
type Draft = Record<`s${(typeof STARS)[number]}`, string>
const starKey = (n: (typeof STARS)[number]) => `s${n}` as keyof Draft

/** Laporan Google Maps satu minggu laporan: beberapa gambar dan jumlah ulasan bintang 1 sampai 5. */
export default function MapsReportPanel({ period, account }: { period: { start: string; end: string }; account: MapsAccount }) {
  const toast = useToast()
  const { isAdmin } = useAuth() // pengguna biasa hanya melihat; mengubah khusus super admin
  const { data, error, reload } = useAsync(() => api.maps(), [])
  const row: MapsReport | undefined = (data ?? []).find((m) => m.account === account && m.period_start === period.start && m.period_end === period.end)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Draft>({ s1: '', s2: '', s3: '', s4: '', s5: '' })
  const [kept, setKept] = useState<string[]>([])
  const [files, setFiles] = useState<Blob[]>([])
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')

  const start = () => {
    setDraft({ s1: String(row?.s1 ?? ''), s2: String(row?.s2 ?? ''), s3: String(row?.s3 ?? ''), s4: String(row?.s4 ?? ''), s5: String(row?.s5 ?? '') })
    setKept(row?.images ?? [])
    setFiles([])
    setFail('')
    setEditing(true)
  }
  const save = async () => {
    setBusy(true)
    setFail('')
    const uploaded: string[] = []
    try {
      for (const f of files) uploaded.push((await api.uploadThumb(f)).file)
      const n = (k: keyof Draft) => (draft[k] === '' ? 0 : Number(draft[k]))
      await api.saveMaps({ account, period_start: period.start, period_end: period.end, images: [...kept, ...uploaded], s1: n('s1'), s2: n('s2'), s3: n('s3'), s4: n('s4'), s5: n('s5') })
      setEditing(false)
      toast('Laporan Google Maps disimpan')
      reload()
    } catch (e) {
      for (const u of uploaded) await api.deleteThumb(u).catch(() => {})
      setFail((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  /** Tambah gambar langsung dari tampilan, tanpa masuk mode ubah; angka bintang tidak berubah. */
  const addNow = async (list: File[]) => {
    if (!row || !list.length) return
    setBusy(true)
    setFail('')
    const uploaded: string[] = []
    try {
      for (const f of list) uploaded.push((await api.uploadThumb(await shrinkImage(f, 1280))).file)
      await api.saveMaps({ account, period_start: row.period_start, period_end: row.period_end, images: [...row.images, ...uploaded], s1: row.s1, s2: row.s2, s3: row.s3, s4: row.s4, s5: row.s5 })
      toast('Gambar ditambahkan')
      reload()
    } catch (e) {
      for (const u of uploaded) await api.deleteThumb(u).catch(() => {})
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
    if (!row || !confirm('Hapus laporan Google Maps periode ini untuk akun ini?')) return
    try {
      await api.removeMaps(row.map_id)
      toast('Laporan dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  const total = row ? row.s1 + row.s2 + row.s3 + row.s4 + row.s5 : 0
  return (
    <div ref={box}>
    <Card>
      {(error || fail) && <div className="mb-3"><Alert>{error || fail}</Alert></div>}
      {editing ? (
        <div className="space-y-4">
          <label className="block text-sm font-medium">Gambar (screenshot Google Maps, boleh lebih dari satu; atau tempel dengan Ctrl+V)
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {STARS.map((n) => (
              <label key={n} className="block text-sm font-medium">Bintang {n}
                <input inputMode="numeric" className="mt-1" placeholder="0" value={draft[starKey(n)]} onChange={(e) => setDraft({ ...draft, [starKey(n)]: e.target.value.replace(/\D/g, '') })} />
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn} onClick={() => setEditing(false)} disabled={busy}>Batal</button>
            <button type="button" className={btnPrimary} onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </div>
      ) : row ? (
        <div className="space-y-4">
          {isAdmin && <div className="flex items-center justify-end gap-1.5">
            <label className={`${btn} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>{busy ? 'Mengunggah…' : '+ Tambah gambar'}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { void addNow([...(e.target.files ?? [])]); e.target.value = '' }} />
            </label>
            <EditButton onClick={start} />
            <DeleteButton onClick={() => void del()} />
          </div>}
          <div className="grid gap-4 lg:grid-cols-2">
            {row.images.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {row.images.map((n) => <a key={n} href={thumbUrl(n)} target="_blank" rel="noreferrer"><img src={thumbUrl(n)} alt="Laporan Google Maps" loading="lazy" className="max-h-[26rem] w-full rounded-lg object-contain" /></a>)}
              </div>
            ) : (
              <p className="grid place-items-center rounded-lg border border-dashed border-slate-300 p-8 text-sm text-slate-500">Belum ada gambar.</p>
            )}
            <div>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STARS.map((n) => (
                  <li key={n} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-medium text-slate-500">Bintang {n}</p>
                    <p className="text-2xl font-semibold tabular-nums">{num(row[starKey(n)])}</p>
                    <p className="text-sm" style={{ color: '#f5a623' }} aria-hidden>{'★'.repeat(n)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-500">Total ulasan: <b className="text-slate-900">{num(total)}</b></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6">
          <p className="text-sm text-slate-500">Belum ada laporan Google Maps untuk minggu ini.</p>
          {isAdmin && <AddButton label="Tambah laporan" onClick={start} />}
        </div>
      )}
    </Card>
    </div>
  )
}
