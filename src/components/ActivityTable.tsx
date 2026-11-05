import { useState } from 'react'
import type { Activity } from '../../shared/activity'
import { useAuth } from '../auth'
import { api } from '../api'
import { AddButton, DeleteButton, EditButton } from './IconButtons'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

type Draft = { name: string; date_text: string; note: string }
const blank: Draft = { name: '', date_text: '', note: '' }

/** Baris isian untuk tambah atau ubah satu kegiatan. */
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
      <td className="p-2"><textarea rows={3} maxLength={600} autoFocus aria-label="Kegiatan" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></td>
      <td className="p-2"><input maxLength={40} aria-label="Tanggal" placeholder="22-28/10/2026" value={d.date_text} onChange={(e) => setD({ ...d, date_text: e.target.value })} /></td>
      <td className="p-2">
        <input maxLength={300} aria-label="Keterangan atau hasil" placeholder="Tugas Rutin" value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} />
        {err && <p role="alert" className="mt-1 text-xs text-red-700">✕ {err}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <button type="button" className={btn} onClick={onCancel} disabled={busy}>Batal</button>
          <button type="button" className={btnPrimary} onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </td>
    </>
  )
}

/** Rincian Kegiatan satu minggu laporan: tabel No, Kegiatan, Tanggal, Keterangan/Hasil dengan tambah, ubah, hapus. */
export default function ActivityTable({ period }: { period: { start: string; end: string } }) {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const { data, error, reload } = useAsync(() => api.activities(), [])
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [fail, setFail] = useState('')
  const rows = (data ?? []).filter((a) => a.period_start === period.start && a.period_end === period.end)
  const body = (d: Draft) => ({ ...d, period_start: period.start, period_end: period.end })

  const del = async (a: Activity) => {
    if (!confirm('Hapus kegiatan ini?')) return
    try {
      await api.removeActivity(a.activity_id)
      toast('Kegiatan dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  return (
    <div className="space-y-3">
      {(error || fail) && <Alert>{error || fail}</Alert>}
      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-white" style={{ background: '#1f7a5a' }}>
                <th className="w-12 px-3 py-3 text-center">No</th>
                <th className="px-3 py-3">Kegiatan</th>
                <th className="w-44 px-3 py-3 text-center">Tanggal</th>
                <th className="px-3 py-3">Keterangan / Hasil</th>
                {isAdmin && <th className="w-24 px-3 py-3"><span className="sr-only">Aksi</span></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((a, i) =>
                editing === a.activity_id ? (
                  <tr key={a.activity_id} className="border-t border-slate-200 align-top">
                    <EditRow
                      initial={{ name: a.name, date_text: a.date_text, note: a.note }}
                      onCancel={() => setEditing(null)}
                      onSave={async (d) => {
                        await api.updateActivity(a.activity_id, body(d))
                        setEditing(null)
                        toast('Kegiatan disimpan')
                        reload()
                      }}
                    />
                    <td />
                  </tr>
                ) : (
                  <tr key={a.activity_id} className="border-t border-slate-200 align-top">
                    <td className="px-3 py-3 text-center">{i + 1}</td>
                    <td className="whitespace-pre-wrap break-words px-3 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-3 py-3 text-center">{a.date_text}</td>
                    <td className="break-words px-3 py-3 text-slate-600">{a.note}</td>
                    {isAdmin && (
                      <td className="px-3 py-2">
                        <span className="flex justify-end gap-1.5">
                          <EditButton onClick={() => setEditing(a.activity_id)} />
                          <DeleteButton onClick={() => void del(a)} />
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
                      await api.addActivity(body(d))
                      setEditing(null)
                      toast('Kegiatan ditambahkan')
                      reload()
                    }}
                  />
                  <td />
                </tr>
              )}
              {!rows.length && editing !== 'new' && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Belum ada kegiatan untuk minggu ini.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      {isAdmin && <div className="flex justify-end"><AddButton label="Tambah kegiatan" onClick={() => setEditing('new')} disabled={editing === 'new'} /></div>}
    </div>
  )
}
