import type { FieldErrors, UseFieldArrayReturn, UseFormRegister } from 'react-hook-form'
import { AGE_BANDS } from '../../shared/audience'
import { thumbUrl } from '../api'
import type { FormValues } from '../pages/InputPage'
import { btn, Field } from './ui'

const num_ = { setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)) }

type Rows = UseFieldArrayReturn<FormValues, 'audience.cities'>
type TermRows = UseFieldArrayReturn<FormValues, 'audience.search_terms'>

/** Form Audience (opsional): Gender, Age range, Top locations, dan gambar Pertumbuhan (hanya lewat unggah file). */
export default function AudienceFields({ register, errors, cities, growth, imageLabel = 'Grafik Pertumbuhan (gambar)', imageOnly = false, youtube = false, searchTerms }: {
  imageLabel?: string
  imageOnly?: boolean
  /** YouTube: Gender, Age range, dan Penelusuran YouTube (tanpa lokasi dan gambar pertumbuhan). */
  youtube?: boolean
  searchTerms?: TermRows
  register: UseFormRegister<FormValues>
  errors: FieldErrors<FormValues>
  cities: Rows
  growth: { saved: string; preview: string; busy: boolean; error: string; pick: (f: File | undefined) => void; clear: () => void }
}) {
  const aud = errors.audience
  const pctField = (path: string, label: string, error?: string) => (
    <Field key={path} label={`${label} (%)`} error={error}>
      <input type="number" inputMode="decimal" min={0} max={100} step="any" {...register(path as 'audience.gender.women', num_)} />
    </Field>
  )

  const list = (title: string, rows: Rows | TermRows, kind: 'cities' | 'search_terms' = 'cities', label = 'Nama') => (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      <div className="space-y-2">
        {rows.fields.map((f, i) => {
          const e = aud?.[kind]?.[i]
          return (
            <div key={f.id} className="grid grid-cols-[1fr_6.5rem_auto] items-start gap-2">
              <Field label={`${label} ${i + 1}`} error={e?.name?.message}><input maxLength={60} {...register(`audience.${kind}.${i}.name` as const)} /></Field>
              <Field label="%" error={e?.pct?.message}><input type="number" inputMode="decimal" min={0} max={100} step="any" {...register(`audience.${kind}.${i}.pct` as const, num_)} /></Field>
              <button type="button" className={`${btn} mt-6`} aria-label={`Hapus baris ${i + 1}`} onClick={() => (rows as Rows).remove(i)}>✕</button>
            </div>
          )
        })}
      </div>
      {rows.fields.length < 10 && (
        <button type="button" className={`${btn} mt-2`} onClick={() => (rows as Rows).append({ name: '', pct: undefined as unknown as number })}>+ Tambah baris</button>
      )}
    </div>
  )

  const shown = growth.preview || (growth.saved ? thumbUrl(growth.saved) : '')

  const imageBlock = (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{imageLabel}</p>
      {shown && (
        <div className="flex items-center gap-3 rounded-md border border-slate-300 p-2">
          <img src={shown} alt="Pratinjau grafik pertumbuhan" className="h-24 w-auto max-w-[12rem] rounded object-contain" />
          <button type="button" className="text-sm text-red-700 underline-offset-2 hover:underline" onClick={growth.clear}>Hapus gambar</button>
        </div>
      )}
      <input type="file" accept="image/*" aria-label="Pilih gambar grafik pertumbuhan" disabled={growth.busy} onChange={(e) => { growth.pick(e.target.files?.[0]); e.target.value = '' }} />
      <p className="text-xs text-slate-500">Unggah gambar (hanya lewat file; tidak dibaca OCR). Gambar diperkecil otomatis.</p>
      {growth.busy && <p className="text-xs text-slate-500">Memproses gambar…</p>}
      {growth.error && <p role="alert" className="text-xs text-red-700">✕ {growth.error}</p>}
    </div>
  )

  if (youtube)
    return (
      <fieldset className="space-y-6 rounded-2xl glass p-4">
        <legend className="px-1 text-sm font-semibold">Audience YouTube (opsional)</legend>
        <div>
          <p className="mb-2 text-sm font-medium">Gender</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pctField('audience.gender.women', 'Wanita', aud?.gender?.women?.message)}
            {pctField('audience.gender.men', 'Pria', aud?.gender?.men?.message)}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Umur</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{AGE_BANDS.map((b) => pctField(`audience.age.${b}`, b, aud?.age?.[b]?.message))}</div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Penelusuran YouTube</p>
          <div className="mb-3 max-w-xs">{pctField('audience.search_share', 'Proporsi dari total traffic', aud?.search_share?.message)}</div>
          {searchTerms && list('Kata kunci penelusuran, maksimal 10 baris', searchTerms, 'search_terms', 'Kata kunci')}
        </div>
      </fieldset>
    )

  if (imageOnly)
    return (
      <fieldset className="rounded-2xl glass p-4">
        <legend className="px-1 text-sm font-semibold">Foto</legend>
        {imageBlock}
      </fieldset>
    )

  return (
    <fieldset className="space-y-6 rounded-2xl glass p-4">
      <legend className="px-1 text-sm font-semibold">Audience (opsional)</legend>

      <div>
        <p className="mb-2 text-sm font-medium">Gender</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {pctField('audience.gender.women', 'Women', aud?.gender?.women?.message)}
          {pctField('audience.gender.men', 'Men', aud?.gender?.men?.message)}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Age range</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AGE_BANDS.map((b) => pctField(`audience.age.${b}`, b, aud?.age?.[b]?.message))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Top locations (kota)</p>
        {list('Kota (Cities), maksimal 10 baris', cities)}
      </div>

      {imageBlock}
    </fieldset>
  )
}
