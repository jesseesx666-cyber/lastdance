import { useState } from 'react'
import { SUMMARY_COLUMNS, type SummaryItem } from '../../shared/summary'
import { MAPS_ACCOUNTS, type MapsAccount } from '../../shared/maps'
import { WEBSITES, WEBSITE_LABEL, type Website } from '../../shared/website'
import MapsReportPanel from '../components/MapsReportPanel'
import WebsiteReportPanel from '../components/WebsiteReportPanel'
import WhatsAppReportPanel from '../components/WhatsAppReportPanel'
import { useAuth } from '../auth'
import { api } from '../api'
import { AddButton, DeleteButton, EditButton } from '../components/IconButtons'
import ActivityTable from '../components/ActivityTable'
import { Alert, btn, btnPrimary, Card, Section, useAsync, useToast } from '../components/ui'
import { fmtRange, lastThursday, weekBefore } from '../format'

const COLUMNS: Record<(typeof SUMMARY_COLUMNS)[number], { title: string; icon: string; color: string; empty: string }> = {
  capaian: { title: 'CAPAIAN', icon: '✓', color: '#1f7a5a', empty: 'Belum ada capaian.' },
  kendala: { title: 'KENDALA', icon: '!', color: '#ee8a3c', empty: 'Belum ada kendala.' },
  rencana: { title: 'RENCANA', icon: '→', color: '#4a90e2', empty: 'Belum ada rencana.' },
}

/** Editor satu poin (tambah atau ubah). */
function ItemEditor({ initial, onSave, onCancel }: { initial: string; onSave: (text: string) => Promise<void>; onCancel: () => void }) {
  const [text, setText] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const save = async () => {
    setBusy(true)
    setErr('')
    try {
      await onSave(text)
    } catch (e) {
      setErr((e as Error).message)
      setBusy(false)
    }
  }
  return (
    <div className="space-y-2">
      <textarea autoFocus rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
      {err && <p role="alert" className="text-xs text-red-700">✕ {err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className={btn} onClick={onCancel} disabled={busy}>Batal</button>
        <button type="button" className={btnPrimary} onClick={() => void save()} disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </div>
  )
}

function Column({ kind, items, period, onChanged }: { kind: (typeof SUMMARY_COLUMNS)[number]; items: SummaryItem[]; period: { start: string; end: string }; onChanged: () => void }) {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const c = COLUMNS[kind]
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [fail, setFail] = useState('')
  const base = { kind, period_start: period.start, period_end: period.end }

  const del = async (it: SummaryItem) => {
    if (!confirm('Hapus poin ini?')) return
    try {
      await api.removeSummary(it.item_id)
      toast('Poin dihapus')
      onChanged()
    } catch (e) {
      setFail((e as Error).message)
    }
  }

  return (
    <Card className="flex flex-col overflow-hidden !p-0">
      <div aria-hidden className="h-2.5 w-full" style={{ background: c.color }} />
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold tracking-wide" style={{ color: c.color }}><span aria-hidden>{c.icon}</span> {c.title}</h3>
          {isAdmin && <AddButton onClick={() => setEditing('new')} disabled={editing === 'new'} />}
        </div>
        {fail && <div className="mb-2"><Alert>{fail}</Alert></div>}
        <ol className="list-decimal space-y-3 pl-6 text-base marker:font-semibold marker:text-slate-500">
          {items.map((it) => (
            <li key={it.item_id} className="pl-1">
              {editing === it.item_id ? (
                <ItemEditor
                  initial={it.text}
                  onCancel={() => setEditing(null)}
                  onSave={async (text) => {
                    await api.updateSummary(it.item_id, { ...base, text })
                    setEditing(null)
                    toast('Poin disimpan')
                    onChanged()
                  }}
                />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 whitespace-pre-wrap break-words text-base font-medium leading-snug text-slate-900">{it.text}</span>
                  {isAdmin && (
                    <span className="flex shrink-0 gap-1.5">
                      <EditButton onClick={() => setEditing(it.item_id)} />
                      <DeleteButton onClick={() => void del(it)} />
                    </span>
                  )}
                </div>
              )}
            </li>
          ))}
        </ol>
        {!items.length && editing !== 'new' && <p className="py-4 text-sm text-slate-500">{c.empty}</p>}
        {editing === 'new' && (
          <div className="mt-3">
            <ItemEditor
              initial=""
              onCancel={() => setEditing(null)}
              onSave={async (text) => {
                await api.addSummary({ ...base, text })
                setEditing(null)
                toast('Poin ditambahkan')
                onChanged()
              }}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

/** Rencana Minggu Depan: daftar bernomor (lencana hijau), satu poin per baris, dengan tambah, ubah, hapus. */
function NextPlan({ items, period, onChanged }: { items: SummaryItem[]; period: { start: string; end: string }; onChanged: () => void }) {
  const toast = useToast()
  const { isAdmin } = useAuth()
  const [editing, setEditing] = useState<string | 'new' | null>(null)
  const [fail, setFail] = useState('')
  const base = { kind: 'minggu_depan' as const, period_start: period.start, period_end: period.end }

  const del = async (it: SummaryItem) => {
    if (!confirm('Hapus rencana ini?')) return
    try {
      await api.removeSummary(it.item_id)
      toast('Rencana dihapus')
      onChanged()
    } catch (e) {
      setFail((e as Error).message)
    }
  }
  const badge = (n: number) => <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-bold text-white" style={{ background: '#2db67c' }}>{n}</span>

  return (
    <Card>
      <p className="mb-4 text-sm text-slate-500">Agenda prioritas periode mendatang.</p>
      {fail && <div className="mb-2"><Alert>{fail}</Alert></div>}
      <ol className="space-y-3">
        {items.map((it, i) => (
          <li key={it.item_id} className="flex items-start gap-4">
            {badge(i + 1)}
            {editing === it.item_id ? (
              <div className="min-w-0 flex-1">
                <ItemEditor
                  initial={it.text}
                  onCancel={() => setEditing(null)}
                  onSave={async (text) => {
                    await api.updateSummary(it.item_id, { ...base, text })
                    setEditing(null)
                    toast('Rencana disimpan')
                    onChanged()
                  }}
                />
              </div>
            ) : (
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3 pt-2">
                <span className="min-w-0 whitespace-pre-wrap break-words text-base leading-snug text-slate-900">{it.text}</span>
                {isAdmin && (
                  <span className="flex shrink-0 gap-1.5">
                    <EditButton onClick={() => setEditing(it.item_id)} />
                    <DeleteButton onClick={() => void del(it)} />
                  </span>
                )}
              </div>
            )}
          </li>
        ))}
        {editing === 'new' && (
          <li className="flex items-start gap-4">
            {badge(items.length + 1)}
            <div className="min-w-0 flex-1">
              <ItemEditor
                initial=""
                onCancel={() => setEditing(null)}
                onSave={async (text) => {
                  await api.addSummary({ ...base, text })
                  setEditing(null)
                  toast('Rencana ditambahkan')
                  onChanged()
                }}
              />
            </div>
          </li>
        )}
      </ol>
      {!items.length && editing !== 'new' && <p className="py-4 text-sm text-slate-500">Belum ada rencana minggu depan.</p>}
      {isAdmin && <div className="mt-4 flex justify-end"><AddButton label="Tambah rencana" onClick={() => setEditing('new')} disabled={editing === 'new'} /></div>}
    </Card>
  )
}

/** Ringkasan Eksekutif per minggu laporan: tiga kolom (Capaian, Kendala, Rencana) dengan tambah, ubah, hapus poin. */
export default function LaporanPage() {
  const [date, setDate] = useState(lastThursday())
  const [mapsAccount, setMapsAccount] = useState<MapsAccount>('klinik')
  const [site, setSite] = useState<Website>('klinik')
  const period = weekBefore(date || lastThursday())
  const { data, error, reload } = useAsync(() => api.summary(), [])
  const mine = (data ?? []).filter((i) => i.period_start === period.start && i.period_end === period.end)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Periode</p>
          <h1 className="text-2xl font-semibold tracking-tight">{fmtRange(period.start, period.end)}</h1>
        </div>
        <input type="date" aria-label="Tanggal laporan (Kamis)" className="!w-auto" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
      </header>
      {error && <Alert>{error}</Alert>}

      <Section title="Ringkasan Eksekutif">
        <div className="grid gap-4 lg:grid-cols-3">
          {SUMMARY_COLUMNS.map((k) => <Column key={`${k}-${period.start}`} kind={k} items={mine.filter((i) => i.kind === k)} period={period} onChanged={reload} />)}
        </div>
      </Section>

      <Section title="Rincian Kegiatan">
        <ActivityTable key={period.start} period={period} />
      </Section>

      <Section title="Laporan Google Maps">
        <div className="mb-3 flex gap-2" role="tablist" aria-label="Akun laporan Google Maps">
          {MAPS_ACCOUNTS.map((a) => <button key={a} type="button" role="tab" aria-selected={mapsAccount === a} className={mapsAccount === a ? btnPrimary : btn} onClick={() => setMapsAccount(a)}>{a === 'klinik' ? 'Klinik' : 'Bekam'}</button>)}
        </div>
        <MapsReportPanel key={`${mapsAccount}-${period.start}`} period={period} account={mapsAccount} />
      </Section>

      <Section title="Laporan Website">
        <div className="mb-3 flex gap-2" role="tablist" aria-label="Website laporan">
          {WEBSITES.map((w) => <button key={w} type="button" role="tab" aria-selected={site === w} className={site === w ? btnPrimary : btn} onClick={() => setSite(w)}>{WEBSITE_LABEL[w]}</button>)}
        </div>
        <WebsiteReportPanel key={`${site}-${period.start}`} period={period} site={site} />
      </Section>

      <Section title="Laporan WhatsApp">
        <WhatsAppReportPanel key={period.start} period={period} />
      </Section>

      <Section title="Rencana Minggu Depan">
        <NextPlan key={period.start} items={mine.filter((i) => i.kind === 'minggu_depan')} period={period} onChanged={reload} />
      </Section>
    </div>
  )
}
