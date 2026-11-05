import { createContext, useCallback, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import type { PublicUser } from '../shared/users'
import { api } from './api'
import { Alert, btnPrimary, Field } from './components/ui'

interface AuthState { user: PublicUser | null; isAdmin: boolean; logout: () => Promise<void> }
const Ctx = createContext<AuthState>({ user: null, isAdmin: false, logout: async () => {} })
export const useAuth = () => useContext(Ctx)

function CredForm({ title, hint, button, onSubmit }: { title: string; hint?: string; button: string; onSubmit: (u: string, p: string) => Promise<void> }) {
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await onSubmit(u, p)
    } catch (x) {
      setErr((x as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl glass p-6">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">IG</span>
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {hint && <p className="text-sm text-slate-500">{hint}</p>}
        {err && <Alert>{err}</Alert>}
        <Field label="Username"><input autoFocus autoComplete="username" value={u} onChange={(e) => setU(e.target.value)} /></Field>
        <Field label="Password"><input type="password" autoComplete={button === 'Masuk' ? 'current-password' : 'new-password'} value={p} onChange={(e) => setP(e.target.value)} /></Field>
        <button className={`${btnPrimary} w-full`} disabled={busy}>{busy ? 'Memproses…' : button}</button>
      </form>
    </div>
  )
}

/** Menahan seluruh aplikasi sampai login: layar setup (akun super admin pertama) atau layar masuk. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<{ needsSetup: boolean; user: PublicUser | null } | null>(null)
  const [fatal, setFatal] = useState('')
  const refresh = useCallback(() => api.authState().then(setSt, (e: Error) => setFatal(e.message)), [])
  useEffect(() => {
    void refresh()
    addEventListener('auth-expired', refresh) // sesi habis atau akun dihapus: kembali ke layar masuk
    return () => removeEventListener('auth-expired', refresh)
  }, [refresh])

  if (fatal) return <div className="mx-auto max-w-md p-6"><Alert>{fatal}</Alert></div>
  if (!st) return <p className="p-6 text-sm text-slate-500">Memuat…</p>
  if (st.needsSetup)
    return <CredForm title="Buat super admin" hint="Belum ada akun. Akun pertama ini menjadi super admin dengan akses penuh." button="Buat akun" onSubmit={async (u, p) => { await api.setup(u, p); await refresh() }} />
  if (!st.user) return <CredForm title="Masuk" button="Masuk" onSubmit={async (u, p) => { await api.login(u, p); await refresh() }} />
  const user = st.user
  return <Ctx.Provider value={{ user, isAdmin: user.role === 'admin', logout: async () => { await api.logout(); await refresh() } }}>{children}</Ctx.Provider>
}
