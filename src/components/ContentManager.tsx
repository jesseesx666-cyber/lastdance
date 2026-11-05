import { useState } from 'react'
import type { Content, ContentSection } from '../../shared/content'
import { useAccount, usePlatform } from '../account'
import { api } from '../api'
import { useAuth } from '../auth'
import { dayAfter, fmtDate, lastThursday, num } from '../format'
import ContentForm, { label, newContent } from './ContentForm'
import { Alert, btn, btnPrimary, Card, useAsync, useToast } from './ui'

/** Satu-satunya tempat menambah, mengubah, dan menghapus konten untuk "Top 3 Content" di Dashboard. */
export default function ContentManager({ reportDate, section = 'top' }: { reportDate: string; section?: ContentSection }) {
  const title = section === 'top' ? 'Input Content' : 'Input Endorsement'
  const toast = useToast()
  const { isAdmin } = useAuth() // pengguna biasa hanya menambah; ubah/hapus khusus super admin
  const account = useAccount()
  const platform = usePlatform()
  const { data, error, reload } = useAsync(() => api.contents(), [])
  const [editing, setEditing] = useState<Content | 'new' | null>(null)
  const [fail, setFail] = useState('')
  const rows = (data ?? []).filter((c) => c.account === account && c.platform === platform && c.section === section).sort((x, y) => y.period_end.localeCompare(x.period_end) || y.views - x.views)

  async function del(c: Content) {
    if (!confirm(`Hapus konten "${label(c)}"?`)) return
    try {
      await api.removeContent(c.content_id)
      toast('Konten dihapus')
      reload()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  return (
    <section aria-labelledby={`input-${section}`} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={`input-${section}`} className="mr-auto text-lg font-semibold">{title}</h2>
        <button type="button" className={btnPrimary} onClick={() => setEditing('new')}>+ Tambah konten</button>
      </div>
      <p className="text-sm text-slate-500">Konten di sini muncul di <b>{section === 'top' ? 'Top 3 Content' : 'ENDORSMENT'}</b> pada Dashboard, sesuai periodenya.</p>

      {(error || fail) && <Alert>{error || fail}</Alert>}

      <Card className="overflow-x-auto !p-2">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="text-left text-xs text-slate-500"><tr><th className="p-2">Konten</th><th className="p-2">Tanggal laporan</th><th className="p-2 text-right">Views</th><th className="p-2 text-right">Likes</th><th className="p-2 text-right">Interaksi</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.content_id} className="border-t border-slate-100">
                <td className="max-w-[16rem] truncate p-2" title={c.url}>{label(c)}</td>
                <td className="whitespace-nowrap p-2">{fmtDate(dayAfter(c.period_end))}</td>
                <td className="p-2 text-right">{num(c.views)}</td>
                <td className="p-2 text-right">{num(c.likes)}</td>
                <td className="p-2 text-right">{num(c.interactions)}</td>
                <td className="whitespace-nowrap p-2 text-right">
                  {isAdmin && <><button type="button" className={btn} onClick={() => setEditing(c)}>Edit</button>{' '}
                  <button type="button" className={`${btn} text-red-700`} onClick={() => void del(c)}>Hapus</button></>}
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Belum ada konten. Klik <b>+ Tambah konten</b> untuk memasukkan link atau file video beserta angkanya.</td></tr>}
          </tbody>
        </table>
      </Card>

      {editing && (
        <ContentForm
          key={editing === 'new' ? 'new' : editing.content_id}
          initial={editing === 'new' ? newContent(reportDate || lastThursday(), account, platform, section) : editing}
          id={editing === 'new' ? undefined : editing.content_id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            toast('Konten disimpan')
            reload()
          }}
        />
      )}
    </section>
  )
}
