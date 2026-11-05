import { useState } from 'react'
import type { AccountId } from '../../shared/accounts'
import { api, thumbUrl } from '../api'
import { useAuth } from '../auth'
import { shrinkImage } from '../shrink'
import { Alert, Card, useAsync, useToast } from './ui'

/** Iklan Aktif: kumpulan gambar per akun. Tanpa `editable` hanya tampilan (Dashboard); tambah/hapus lewat Input Insights (hapus khusus super admin). */
export default function ActiveAds({ account, editable = false }: { account: AccountId; editable?: boolean }) {
  const toast = useToast()
  const { isAdmin } = useAuth() // pengguna biasa hanya menambah; hapus khusus super admin
  const { data, error, reload } = useAsync(() => api.ads(account), [account])
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')

  const add = async (files: File[]) => {
    setBusy(true)
    setFail('')
    try {
      for (const f of files) {
        if (!f.type.startsWith('image/')) throw new Error(`${f.name} bukan gambar.`)
        const { file } = await api.uploadThumb(await shrinkImage(f, 1280))
        await api.addAd({ account, image: file })
      }
      toast('Iklan ditambahkan')
      reload()
    } catch (e) {
      setFail((e as Error).message)
      reload()
    } finally {
      setBusy(false)
    }
  }
  const del = async (id: string) => {
    if (!confirm('Hapus gambar iklan ini?')) return
    try {
      await api.removeAd(id)
      toast('Iklan dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  const ads = data ?? []
  return (
    <div className="space-y-3">
      {(error || fail) && <Alert>{error || fail}</Alert>}
      <Card>
        {ads.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {ads.map((a, i) => (
              <li key={a.ad_id} className="relative overflow-hidden rounded-lg border border-slate-300">
                <a href={thumbUrl(a.image)} target="_blank" rel="noreferrer"><img src={thumbUrl(a.image)} alt={`Iklan aktif ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" /></a>
                {editable && isAdmin && <button type="button" aria-label={`Hapus iklan ${i + 1}`} onClick={() => void del(a.ad_id)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/65 text-xs text-white hover:bg-red-600">✕</button>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Belum ada iklan aktif. Tambahkan lewat menu Input Insights.</p>
        )}
        {editable && (
          <div className="mt-3">
            <input type="file" accept="image/*" multiple aria-label="Tambah gambar iklan aktif" disabled={busy} onChange={(e) => { void add([...(e.target.files ?? [])]); e.target.value = '' }} />
            {busy && <p className="mt-1 text-xs text-slate-500">Mengunggah…</p>}
          </div>
        )}
      </Card>
    </div>
  )
}

