import { addDays, endOfMonth, endOfYear, format, parseISO } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import type { AccountId } from '../../shared/accounts'
import type { PlatformId } from '../../shared/platforms'
import { contentInputSchema, type Content, type ContentInput, type ContentSection } from '../../shared/content'
import { api, thumbUrl } from '../api'
import { dayAfter, fmtRange, weekBefore } from '../format'
import { shrinkImage } from '../shrink'
import { Alert, btn, btnPrimary, Field, Modal } from './ui'

export type ContentFormValues = z.input<typeof contentInputSchema>
const MAX_INPUT_MB = 15
const n = { setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)) }

/** Judul bila ada, kalau tidak host + path link (dipotong). */
export const label = (c: Content) => {
  if (c.title) return c.title
  try {
    const u = new URL(c.url)
    return (u.hostname.replace(/^www\./, '') + u.pathname).replace(/\/$/, '').slice(0, 48)
  } catch {
    return c.url.slice(0, 48)
  }
}

/** Nilai awal form untuk konten baru pada tanggal laporan tertentu (periode = 7 hari sebelumnya). */
export const newContent = (reportDate: string, account: AccountId, platform: PlatformId, section: ContentSection = 'top'): ContentFormValues => {
  const w = weekBefore(reportDate)
  return { account, platform, section, url: '', thumbnail: '', title: '', views: null, likes: null, interactions: null, period_start: w.start, period_end: w.end } as unknown as ContentFormValues
}

export default function ContentForm({ initial, id, onClose, onSaved }: { initial: ContentFormValues; id?: string; onClose: () => void; onSaved: () => void }) {
  const [image, setImage] = useState<Blob | null>(null) // gambar baru, sudah diperkecil, belum diunggah
  const [preview, setPreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [busy, setBusy] = useState(false)
  const [reportDate, setReportDate] = useState(() => dayAfter(initial.period_end))
  const [serverError, setServerError] = useState('')
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ContentFormValues, unknown, ContentInput>({ resolver: zodResolver(contentInputSchema), defaultValues: initial })

  const [ps, pe] = watch(['period_start', 'period_end'])
  const saved = watch('thumbnail')
  const thursday = new Date(reportDate + 'T00:00:00').getDay() === 4

  useEffect(() => {
    if (!image) return setPreview('')
    const u = URL.createObjectURL(image)
    setPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [image])

  const pickImage = async (f: File | undefined) => {
    setImageError('')
    if (!f) return
    if (!f.type.startsWith('image/') || f.type === 'image/svg+xml') return setImageError('Pilih file gambar (JPG, PNG, atau WebP).')
    if (f.size > MAX_INPUT_MB * 1024 * 1024) return setImageError(`Ukuran gambar maksimal ${MAX_INPUT_MB} MB.`)
    setBusy(true)
    try {
      setImage(await shrinkImage(f))
    } catch {
      setImageError('Gambar tidak bisa dibaca. Coba file lain.')
    } finally {
      setBusy(false)
    }
  }

  // Ctrl+V: tempel screenshot thumbnail langsung dari clipboard.
  useEffect(() => {
    const h = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith('image/'))
      if (f) {
        e.preventDefault()
        void pickImage(f)
      }
    }
    window.addEventListener('paste', h)
    return () => window.removeEventListener('paste', h)
  }, [])

  const pickDate = (v: string) => {
    setReportDate(v)
    if (!v) return
    const w = weekBefore(v)
    setValue('period_start', w.start)
    setValue('period_end', w.end)
  }

  // Top 3 bulanan/tahunan diinput manual: periode penuh bulan/tahun.
  const pickSpan = (v: string, kind: 'month' | 'year') => {
    if (kind === 'month' ? !/^\d{4}-\d{2}$/.test(v) : !/^\d{4}$/.test(v)) return
    const from = parseISO(kind === 'month' ? v + '-01' : v + '-01-01')
    const to = kind === 'month' ? endOfMonth(from) : endOfYear(from)
    setValue('period_start', format(from, 'yyyy-MM-dd'))
    setValue('period_end', format(to, 'yyyy-MM-dd'))
    setReportDate(format(addDays(to, 1), 'yyyy-MM-dd'))
  }

  const save = handleSubmit(async (v) => {
    setServerError('')
    let uploaded = ''
    try {
      if (image) uploaded = (await api.uploadThumb(image)).file
      const data = { ...v, thumbnail: uploaded || v.thumbnail }
      await (id ? api.updateContent(id, data) : api.addContent(data))
      onSaved()
    } catch (e) {
      if (uploaded) await api.deleteThumb(uploaded).catch(() => {}) // jangan tinggalkan file yatim bila simpan gagal
      setServerError((e as Error).message)
    }
  })

  const shown = preview || (saved ? thumbUrl(saved) : '')

  return (
    <Modal title={id ? 'Edit konten' : 'Tambah konten'} onClose={onClose}>
      <form onSubmit={save} noValidate className="space-y-3">
        {serverError && <Alert>{serverError}</Alert>}

        <Field label="Link video *" error={errors.url?.message} hint="Salin link reel/video dari Instagram"><input type="url" inputMode="url" placeholder="https://www.instagram.com/reel/…" {...register('url')} /></Field>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-slate-700">Gambar sampul (opsional)</span>
          {shown && (
            <div className="flex items-center gap-3 rounded-md border border-slate-300 p-2">
              <img src={shown} alt="Pratinjau gambar sampul" className="h-20 w-auto max-w-[8rem] rounded object-cover" />
              <button type="button" className="text-sm text-red-700 underline-offset-2 hover:underline" onClick={() => (image ? setImage(null) : setValue('thumbnail', ''))}>Hapus gambar</button>
            </div>
          )}
          <input type="file" accept="image/*" aria-label="Pilih gambar sampul" disabled={busy} onChange={(e) => { void pickImage(e.target.files?.[0]); e.target.value = '' }} />
          <p className="text-xs text-slate-500">Tampil di kartu bila video tidak bisa diputar dari link. Pilih file atau tempel screenshot dengan <b>Ctrl+V</b>; gambar diperkecil otomatis.</p>
          {busy && <p className="text-xs text-slate-500">Memproses gambar…</p>}
          {imageError && <p role="alert" className="text-xs text-red-700">✕ {imageError}</p>}
        </div>

        <Field label="Judul (opsional)" error={errors.title?.message}><input maxLength={120} {...register('title')} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Views *" error={errors.views?.message}><input type="number" inputMode="numeric" min={0} step={1} {...register('views', n)} /></Field>
          <Field label="Likes *" error={errors.likes?.message}><input type="number" inputMode="numeric" min={0} step={1} {...register('likes', n)} /></Field>
          <Field label="Interaksi *" error={errors.interactions?.message}><input type="number" inputMode="numeric" min={0} step={1} {...register('interactions', n)} /></Field>
        </div>

        <Field label="Tanggal laporan (Kamis) *" error={errors.period_end?.message} hint={`Periode laporan otomatis: ${fmtRange(ps, pe)}`}>
          <input type="date" value={reportDate} onChange={(e) => pickDate(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Atau konten bulanan: pilih bulan"><input type="month" onChange={(e) => pickSpan(e.target.value, 'month')} /></Field>
          <Field label="Atau konten tahunan: pilih tahun"><input type="number" min={2000} max={2100} placeholder="2026" onChange={(e) => pickSpan(e.target.value, 'year')} /></Field>
        </div>
        {reportDate && !thursday && ps === weekBefore(reportDate).start && <p className="text-xs text-amber-700">⚠ Tanggal ini bukan hari Kamis. Periode tetap dihitung 7 hari sebelum tanggal ini.</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btn} onClick={onClose}>Batal</button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting || busy}>{isSubmitting ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  )
}
