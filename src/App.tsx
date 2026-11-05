import { useEffect, useState } from 'react'
import { api } from './api'
import { useAuth } from './auth'
import Background from './components/Background'
import ThemeToggle from './components/ThemeToggle'
import { Alert, ToastProvider } from './components/ui'
import Dashboard from './pages/Dashboard'
import HistoryPage from './pages/HistoryPage'
import InputPage from './pages/InputPage'
import LaporanPage from './pages/LaporanPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

const NAV = [
  ['input', 'Input Insights', '＋'], ['reports', 'Summary', '⎙'], ['laporan', 'Laporan', '▤'], ['dashboard', 'Dashboard', '▦'],
  ['history', 'Riwayat Data', '☰'], ['settings', 'Pengaturan', '⚙'],
] as const

// Pengguna biasa: Input Insights, Riwayat Data (lihat dan lanjutkan), Laporan (hanya lihat), dan Dashboard; halaman lain khusus super admin.
const USER_PAGES = ['input', 'history', 'laporan', 'dashboard']
const parse = (admin: boolean) => {
  const [page = 'dashboard', id] = location.hash.replace(/^#\/?/, '').split('/')
  const ok = NAV.some((n) => n[0] === page) && (admin || USER_PAGES.includes(page))
  return { page: ok ? page : 'dashboard', id }
}

export default function App() {
  const { user, isAdmin, logout } = useAuth()
  const nav = NAV.filter(([id]) => isAdmin || USER_PAGES.includes(id))
  const [route, setRoute] = useState(() => parse(isAdmin))
  const [conn, setConn] = useState<{ ok: boolean; file?: string; error?: string }>({ ok: true })

  useEffect(() => {
    const h = () => setRoute(parse(isAdmin))
    addEventListener('hashchange', h)
    return () => removeEventListener('hashchange', h)
  }, [isAdmin])
  // Titik status: cek saat dibuka lalu tiap 10 detik (dilewati saat tab tersembunyi).
  useEffect(() => {
    let fails = 0 // banner baru tampil setelah 2 gagal beruntun, agar lambat sesaat (fungsi hosting baru bangun) tidak mengganggu
    const check = () => {
      if (document.hidden) return
      api.health().then((h) => { fails = 0; setConn({ ok: true, file: h.file.split(/[\\/]/).pop() }) }, (e: Error) => { if (++fails >= 2) setConn({ ok: false, error: e.message }) })
    }
    check()
    const t = setInterval(check, 10_000)
    return () => clearInterval(t)
  }, [])

  const link = (id: string, label: string, icon: string, mobile = false) => (
    <a key={id} href={`#/${id}`} aria-current={route.page === id ? 'page' : undefined}
      className={mobile
        ? `flex flex-1 flex-col items-center py-2 text-[11px] ${route.page === id ? 'font-semibold text-indigo-700' : 'text-slate-600'}`
        : `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${route.page === id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}>
      <span aria-hidden className={mobile ? 'text-base' : 'w-4 text-center'}>{icon}</span>{label}
    </a>
  )

  return (
    <ToastProvider>
      <Background />
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col glass p-4 md:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2 pt-1">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white">IG</span>
          <span className="text-sm font-semibold leading-tight">Instagram<br />Analytics</span>
        </div>
        <nav className="space-y-1" aria-label="Navigasi utama">{nav.map(([id, l, i]) => link(id, l, i))}</nav>
        <div className="mt-auto border-t border-slate-200 px-2 pt-3 text-xs text-slate-500">
          <p className="truncate">Masuk: <b>{user?.username}</b></p>
          <button type="button" onClick={() => void logout()} className="mt-1 text-indigo-700 underline-offset-2 hover:underline">Keluar</button>
        </div>
      </aside>
      <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-40 flex glass md:hidden">
        {nav.map(([id, l, i]) => link(id, l.split(' ')[0], i, true))}
        <button type="button" onClick={() => void logout()} className="flex flex-1 flex-col items-center py-2 text-[11px] text-slate-600"><span aria-hidden className="text-base">⏻</span>Keluar</button>
      </nav>
      <main className="px-4 pb-24 pt-4 md:ml-60 md:px-10 md:pb-10">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-3">
            <span
              role="img"
              aria-label={conn.ok ? 'Tersambung ke server' : 'Terputus dari server'}
              title={conn.ok ? 'Tersambung ke server' : 'Terputus dari server'}
              className={`h-3 w-3 rounded-full ring-4 ${conn.ok ? 'bg-emerald-500 ring-emerald-500/25' : 'bg-red-500 ring-red-500/25'}`}
            />
            <ThemeToggle />
          </span>
        </div>
        {!conn.ok && <div className="mb-4"><Alert>{conn.error}</Alert></div>}
        {route.page === 'dashboard' && <Dashboard />}
        {route.page === 'input' && <InputPage id={isAdmin ? route.id : undefined} resumeId={isAdmin ? undefined : route.id} key={route.id ?? 'new'} />}
        {route.page === 'history' && <HistoryPage />}
        {isAdmin && route.page === 'reports' && <ReportsPage />}
        {route.page === 'laporan' && <LaporanPage />}
        {isAdmin && route.page === 'settings' && <SettingsPage />}
      </main>
    </ToastProvider>
  )
}
