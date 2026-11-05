import { useState } from 'react'
import type { Influencer } from '../../shared/influencer'
import { api } from '../api'
import { useAuth } from '../auth'
import { num } from '../format'
import { AddButton, DeleteButton, EditButton } from './IconButtons'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

type Draft = { name: string; handle: string; followers: string; note: string }
const blank: Draft = { name: '', handle: '', followers: '', note: '' }

/** Baris isian untuk tambah atau ubah satu influencer. */
function EditRow({ initial, onSave, onCancel }: { initial: Draft; onSave: (d: Draft) => Promise<void>; onCancel: () => void }) {
  const [d, setD] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      await onSave(d)
    } catch (e) {
      setErr((e as Error).message)
      setBusy(false)
    }
  }
  return (
    <>
      <td className="p-2" />
      <td className="p-2"><input maxLength={120} autoFocus aria-label="Nama influencer" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></td>
      <td className="p-2"><input maxLength={200} aria-label="Akun atau tautan" placeholder="@nama" value={d.handle} onChange={(e) => setD({ ...d, handle: e.target.value })} /></td>
      <td className="p-2"><input inputMode="numeric" aria-label="Followers" placeholder="0" value={d.followers} onChange={(e) => setD({ ...d, followers: e.target.value.replace(/\D/g, '') })} /></td>
      <td className="p-2">
        <input maxLength={300} aria-label="Keterangan" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
        {err && <p role="alert" className="mt-1 text-xs text-red-700">✕ {err}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className={btn} onClick={onCancel} disabled={busy}>Batal</button>
          <button type="button" className={btnPrimary} onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </td>
    </>
  )
}

/** Daftar influencer klinik: semua peran melihat; tambah/ubah/hapus hanya lewat Input Insights (ubah dan hapus khusus super admin). */
export default function InfluencerList({ editable = false }: { editable?: boolean }) {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const { data, error, reload } = useAsync(() => api.influencers(), [])
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [fail, setFail] = useState('')
  const body = (d: Draft) => ({ name: d.name, handle: d.handle, note: d.note, followers: d.followers === '' ? null : Number(d.followers) })

  const del = async (i: Influencer) => {
    if (!confirm(`Hapus ${i.name} dari daftar?`)) return
    try {
      await api.removeInfluencer(i.influencer_id)
      toast('Influencer dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  const rows = data ?? []
  return (
    <div className="space-y-3">
      {(error || fail) && <Alert>{error || fail}</Alert>}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-white" style={{ background: '#1f7a5a' }}>
                <th className="w-12 px-3 py-3 text-center">No</th>
                <th className="px-3 py-3">Nama</th>
                <th className="px-3 py-3">Akun</th>
                <th className="w-32 px-3 py-3 text-right">Followers</th>
                <th className="px-3 py-3">Keterangan</th>
                {editable && isAdmin && <th className="w-24 px-3 py-3"><span className="sr-only">Aksi</span></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((i, n) =>
                editing === i.influencer_id ? (
                  <tr key={i.influencer_id} className="border-t border-slate-200 align-top">
                    <EditRow
                      initial={{ name: i.name, handle: i.handle, followers: i.followers == null ? '' : String(i.followers), note: i.note }}
                      onCancel={() => setEditing(null)}
                      onSave={async (d) => {
                        await api.updateInfluencer(i.influencer_id, body(d))
                        setEditing(null)
                        toast('Influencer disimpan')
                        reload()
                      }}
                    />
                    <td />
                  </tr>
                ) : (
                  <tr key={i.influencer_id} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-3 text-center">{n + 1}</td>
                    <td className="break-words px-3 py-3 font-medium text-slate-900">{i.name}</td>
                    <td className="break-all px-3 py-3 text-slate-600">{i.handle}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{i.followers == null ? '–' : num(i.followers)}</td>
                    <td className="break-words px-3 py-3 text-slate-600">{i.note}</td>
                    {editable && isAdmin && (
                      <td className="px-3 py-2">
                        <span className="flex justify-end gap-1.5">
                          <EditButton onClick={() => setEditing(i.influencer_id)} />
                          <DeleteButton onClick={() => void del(i)} />
                        </span>
                      </td>
                    )}
                  </tr>
                ),
              )}
              {editing === 'new' && (
                <tr className="border-t border-slate-200 align-top">
                  <EditRow
                    initial={blank}
                    onCancel={() => setEditing(null)}
                    onSave={async (d) => {
                      await api.addInfluencer(body(d))
                      setEditing(null)
                      toast('Influencer ditambahkan')
                      reload()
                    }}
                  />
                  <td />
                </tr>
              )}
              {!rows.length && editing !== 'new' && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Belum ada influencer. Tambahkan lewat menu Input Insights.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {editable && <div className="flex justify-end"><AddButton label="Tambah influencer" onClick={() => setEditing('new')} disabled={editing === 'new'} /></div>}
    </div>
  )
}

