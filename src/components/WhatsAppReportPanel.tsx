import { useRef, useState } from 'react'
import { WA_TOP_MAX, type WaReport } from '../../shared/whatsapp'
import { useAuth } from '../auth'
import { api, thumbUrl } from '../api'
import { num } from '../format'
import { shrinkImage } from '../shrink'
import { usePasteImages } from '../usePasteImages'
import { AddButton, DeleteButton, EditButton } from './IconButtons'
import { RankTable, RowsEditor, toDraft, toNum, toRows, type DraftRow } from './WebsiteReportPanel'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

const STATS = [
  { key: 'chats_in', label: 'Jumlah Chat Masuk' },
  { key: 'saved_contacts', label: 'Jumlah Save Kontak WA' },
  { key: 'sw_views', label: 'Jumlah View SW' },
  { key: 'uploaded_contacts', label: 'Jumlah Upload Kontak' },
] as const
type StatKey = (typeof STATS)[number]['key']
type Nums = Record<StatKey, string>
const emptyNums: Nums = { chats_in: '', saved_contacts: '', sw_views: '', uploaded_contacts: '' }

/** Laporan WhatsApp satu minggu laporan: card chat, reservasi per cabang, permintaan tak tersedia, dan gambar. */
export default function WhatsAppReportPanel({ period }: { period: { start: string; end: string } }) {
  const toast = useToast()
  const { isAdmin } = useAuth() // pengguna biasa hanya melihat; mengubah khusus super admin
  const { data, error, reload } = useAsync(() => api.wa(), [])
  const row: WaReport | undefined = (data ?? []).find((w) => w.period_start === period.start && w.period_end === period.end)
  const [editing, setEditing] = useState(false)
  const [nums, setNums] = useState<Nums>(emptyNums)
  const [chats, setChats] = useState<DraftRow[]>([])
  const [resv, setResv] = useState<DraftRow[]>([])
  const [unavail, setUnavail] = useState<DraftRow[]>([])
  const [kept, setKept] = useState<string[]>([])
  const [files, setFiles] = useState<Blob[]>([])
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')

  const start = () => {
    setNums(row ? { chats_in: String(row.chats_in), saved_contacts: String(row.saved_contacts), sw_views: String(row.sw_views), uploaded_contacts: String(row.uploaded_contacts) } : emptyNums)
    setChats(toDraft(row?.top_chats))
    setResv(toDraft(row?.reservations))
    setUnavail(toDraft(row?.unavailable))
    setKept(row?.images ?? [])
    setFiles([])
    setFail('')
    setEditing(true)
  }
  /** Simpan; gambar baru yang sudah terunggah dibersihkan lagi bila simpan gagal. */
  const put = async (d: Omit<WaReport, 'wa_id' | 'period_start' | 'period_end' | 'created_at'>, uploaded: string[]) => {
    try {
      await api.saveWa({ period_start: period.start, period_end: period.end, ...d })
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
      await put({ chats_in: toNum(nums.chats_in), saved_contacts: toNum(nums.saved_contacts), sw_views: toNum(nums.sw_views), uploaded_contacts: toNum(nums.uploaded_contacts), top_chats: toRows(chats), reservations: toRows(resv), unavailable: toRows(unavail), images: [...kept, ...uploaded] }, uploaded)
      setEditing(false)
      toast('Laporan WhatsApp disimpan')
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
    if (!row || !confirm('Hapus laporan WhatsApp periode ini?')) return
    try {
      await api.removeWa(row.wa_id)
      toast('Laporan dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  const header = (title: string) => <h3 className="mb-3 text-base font-semibold">{title}</h3>
  return (
    <div ref={box} className="space-y-4">
      {(error || fail) && <Alert>{error || fail}</Alert>}
      {editing ? (
        <>
          <Card>
            {header('Chat')}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <label key={s.key} className="block text-sm font-medium">{s.label}
                  <input inputMode="numeric" className="mt-1" placeholder="0" value={nums[s.key]} onChange={(e) => setNums({ ...nums, [s.key]: e.target.value.replace(/\D/g, '') })} />
                </label>
              ))}
            </div>
            <div className="mt-5"><RowsEditor title="Top 5 List Chat" label="Nama / topik chat" countLabel="Jumlah chat" max={WA_TOP_MAX} rows={chats} onChange={setChats} /></div>
          </Card>
          <Card><RowsEditor title="Reservasi per Cabang (Klinik Kosasih Medika)" label="Nama cabang" countLabel="Jumlah reservasi" max={30} rows={resv} onChange={setResv} /></Card>
          <Card><RowsEditor title="Top 5 Permintaan Tak Tersedia" label="Permintaan" countLabel="Jumlah" max={WA_TOP_MAX} rows={unavail} onChange={setUnavail} /></Card>
          <Card>
            {header('Gambar')}
            <label className="block text-sm font-medium">Gambar (boleh lebih dari satu; atau tempel dengan Ctrl+V)
              <input type="file" accept="image/*" multiple className="mt-1" onChange={async (e) => { const fl = [...(e.target.files ?? [])]; setFiles(await Promise.all(fl.map((f) => shrinkImage(f, 1280)))) }} />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
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
          </Card>
          <div className="flex justify-end gap-2">
            <button type="button" className={btn} onClick={() => setEditing(false)} disabled={busy}>Batal</button>
            <button type="button" className={btnPrimary} onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </>
      ) : row ? (
        <>
          {isAdmin && <div className="flex items-center justify-end gap-1.5">
            <label className={`${btn} cursor-pointer ${busy ? 'pointer-events-none opacity-50' : ''}`}>{busy ? 'Mengunggah…' : '+ Tambah gambar'}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { void addNow([...(e.target.files ?? [])]); e.target.value = '' }} />
            </label>
            <EditButton onClick={start} />
            <DeleteButton onClick={() => void del()} />
          </div>}
          <Card>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.key} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-500">{s.label}</p>
                  <p className="text-3xl font-semibold tabular-nums">{num(row[s.key])}</p>
                </div>
              ))}
            </div>
            <div className="mt-5"><RankTable title="Top 5 List Chat" label="Nama / topik chat" countLabel="Jumlah chat" rows={row.top_chats} /></div>
          </Card>
          <Card><RankTable title="Reservasi per Cabang (Klinik Kosasih Medika)" label="Cabang" countLabel="Reservasi" rows={row.reservations} /></Card>
          <Card><RankTable title="Top 5 Permintaan Tak Tersedia" label="Permintaan" countLabel="Jumlah" rows={row.unavailable} /></Card>
          {row.images.length > 0 && (
            <Card>
              <div className="grid gap-3 sm:grid-cols-2">
                {row.images.map((n) => <a key={n} href={thumbUrl(n)} target="_blank" rel="noreferrer"><img src={thumbUrl(n)} alt="Laporan WhatsApp" loading="lazy" className="max-h-[26rem] w-full rounded-lg object-contain" /></a>)}
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-slate-500">Belum ada laporan WhatsApp untuk minggu ini.</p>
            {isAdmin && <AddButton label="Tambah laporan" onClick={start} />}
          </div>
        </Card>
      )}
    </div>
  )
}
