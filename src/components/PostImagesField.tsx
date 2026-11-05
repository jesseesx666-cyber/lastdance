import { thumbUrl } from '../api'

export const MAX_POST_IMAGES = 6

export interface PendingImage { id: string; blob: Blob; url: string }

/** Unggah beberapa screenshot insight postingan (maksimal 6): yang sudah tersimpan dan yang baru dipilih. */
export default function PostImagesField({ title = 'Foto insight postingan', saved, pending, busy, error, onPick, onRemoveSaved, onRemovePending }: {
  title?: string
  saved: string[]
  pending: PendingImage[]
  busy: boolean
  error: string
  onPick: (files: File[]) => void
  onRemoveSaved: (name: string) => void
  onRemovePending: (id: string) => void
}) {
  const total = saved.length + pending.length
  const tile = (src: string, alt: string, remove: () => void, key: string) => (
    <li key={key} className="relative overflow-hidden rounded-lg border border-slate-300">
      <img src={src} alt={alt} className="h-28 w-full object-cover" />
      <button type="button" aria-label={`Hapus ${alt}`} onClick={remove} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-xs text-white hover:bg-red-600">✕</button>
    </li>
  )
  return (
    <fieldset className="rounded-2xl glass p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {total > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {saved.map((n, i) => tile(thumbUrl(n), `postingan ${i + 1}`, () => onRemoveSaved(n), n))}
          {pending.map((p, i) => tile(p.url, `postingan baru ${i + 1}`, () => onRemovePending(p.id), p.id))}
        </ul>
      )}
      <input type="file" accept="image/*" multiple aria-label={`Pilih ${title.toLowerCase()}`} disabled={busy || total >= MAX_POST_IMAGES}
        onChange={(e) => { onPick([...(e.target.files ?? [])]); e.target.value = '' }} />
      <p className="mt-1.5 text-xs text-slate-500">Unggah beberapa gambar, maksimal {MAX_POST_IMAGES} gambar ({total} dipilih). Gambar diperkecil otomatis.</p>
      {busy && <p className="text-xs text-slate-500">Memproses gambar…</p>}
      {error && <p role="alert" className="text-xs text-red-700">✕ {error}</p>}
    </fieldset>
  )
}
