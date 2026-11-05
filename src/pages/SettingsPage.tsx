import { useEffect, useState } from 'react'
import { api } from '../api'
import { detectedFx, setFxPref, useFxPref, type FxPref } from '../theme'
import UsersCard from '../components/UsersCard'
import { Alert, btn, btnPrimary, Card, Field, useAsync, useToast } from '../components/ui'

export default function SettingsPage() {
  const toast = useToast()
  const fxPref = useFxPref()
  const s = useAsync(() => api.settings(), [])
  const audit = useAsync(() => api.audit(), [])
  const [form, setForm] = useState({ account_name: '', instagram_handle: '' })
  const [err, setErr] = useState('')

  useEffect(() => {
    if (s.data) setForm({ account_name: s.data.settings.account_name ?? '', instagram_handle: s.data.settings.instagram_handle ?? '' })
  }, [s.data])

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setErr('')
    try {
      await fn()
      toast(ok)
      audit.reload()
    } catch (e) {
      setErr((e as Error).message)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-lg font-semibold">Pengaturan</h1>
      {(err || s.error) && <Alert>{err || s.error}</Alert>}

      <Card title="Identitas akun">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nama akun"><input value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} /></Field>
          <Field label="Username Instagram"><input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} /></Field>
        </div>
        <button className={`${btnPrimary} mt-3`} onClick={() => run(() => api.saveSettings(form), 'Pengaturan disimpan')}>Simpan</button>
      </Card>

      <UsersCard />

      <Card title="Tampilan">
        <Field label="Latar animasi dan efek kaca" hint={`Otomatis memilih ${detectedFx === 'lite' ? 'Hemat' : 'Penuh'} untuk perangkat ini. Pilih Hemat atau Mati bila terasa lag.`}>
          <select value={fxPref} onChange={(e) => setFxPref(e.target.value as FxPref)}>
            <option value="auto">Otomatis (disarankan)</option>
            <option value="full">Penuh: animasi interaktif + kaca blur</option>
            <option value="lite">Hemat: animasi ringan, tanpa blur</option>
            <option value="off">Mati: tanpa animasi (paling ringan)</option>
          </select>
        </Field>
      </Card>

      <Card title="File data">
        <p className="break-all text-sm">Workbook: <code>{s.data?.file}</code></p>
        <p className="mt-1 text-xs text-slate-500">Tutup file di Excel sebelum menyimpan dari aplikasi; file yang terbuka terkunci oleh Windows. Folder dapat diganti lewat variabel lingkungan DATA_DIR.</p>
        <a className={`${btn} mt-3 inline-block`} href="/api/export/workbook">Unduh workbook lengkap</a>
      </Card>

      <Card title="Audit log (100 terakhir)">
        <div className="max-h-72 overflow-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-xs text-slate-500"><tr><th>Waktu</th><th>Aksi</th><th>Laporan</th></tr></thead>
            <tbody>
              {audit.data?.map((a) => (
                <tr key={a.change_id} className="border-t border-slate-100">
                  <td className="py-1">{new Date(a.changed_at).toLocaleString('id-ID')}</td>
                  <td>{a.action}</td>
                  <td className="text-xs text-slate-500">{a.report_id.slice(0, 8)}</td>
                </tr>
              ))}
              {audit.data?.length === 0 && <tr><td colSpan={3} className="py-3 text-slate-500">Belum ada perubahan.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
