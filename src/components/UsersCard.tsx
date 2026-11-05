import { useState, type FormEvent } from 'react'
import { ROLE_LABEL, type PublicUser, type Role } from '../../shared/users'
import { api } from '../api'
import { useAuth } from '../auth'
import { Alert, btn, btnPrimary, Card, Field, useAsync, useToast } from './ui'

/** Kelola akun (hanya tampil untuk super admin): tambah, reset password, hapus. */
export default function UsersCard() {
  const toast = useToast()
  const { user: me } = useAuth()
  const { data, error, reload } = useAsync(() => api.users(), [])
  const [form, setForm] = useState<{ username: string; password: string; role: Role }>({ username: '', password: '', role: 'user' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false) // Google Sheets bisa butuh belasan detik; cegah klik ganda

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    if (busy) return
    setErr('')
    setBusy(true)
    try {
      await fn()
      toast(ok)
      reload()
    } catch (e) {
      setErr((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const add = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await api.addUser(form)
      setForm({ username: '', password: '', role: 'user' })
    }, 'Akun dibuat')
  }
  const reset = (u: PublicUser) => {
    const password = prompt(`Password baru untuk ${u.username} (minimal 4 karakter):`)
    if (password) void run(() => api.setPassword(u.user_id, password), 'Password diganti')
  }
  const del = (u: PublicUser) => confirm(`Hapus akun ${u.username}?`) && void run(() => api.removeUser(u.user_id), 'Akun dihapus')

  return (
    <Card title="Pengguna">
      {(err || error) && <div className="mb-3"><Alert>{err || error}</Alert></div>}
      <p className="mb-3 text-xs text-slate-500">Pengguna bisa melihat Dashboard dan Laporan (hanya baca) serta Input Insights. Super admin punya akses ke semua fitur.</p>
      <ul className="divide-y divide-slate-100 text-sm">
        {data?.map((u) => (
          <li key={u.user_id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span><b>{u.username}</b> <span className="text-xs text-slate-500">· {ROLE_LABEL[u.role]}{u.user_id === me?.user_id ? ' (Anda)' : ''}</span></span>
            <span className="flex gap-2">
              <button className={btn} onClick={() => reset(u)}>Ganti password</button>
              {u.user_id !== me?.user_id && <button className={`${btn} text-red-700`} onClick={() => del(u)}>Hapus</button>}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-4">
        <Field label="Username"><input autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
        <Field label="Password"><input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Peran">
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            <option value="user">{ROLE_LABEL.user}</option>
            <option value="admin">{ROLE_LABEL.admin}</option>
          </select>
        </Field>
        <div className="flex items-end"><button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'Menyimpan… (bisa 10–20 detik)' : 'Tambah akun'}</button></div>
      </form>
    </Card>
  )
}
