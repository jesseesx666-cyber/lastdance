import { addDays, endOfMonth, endOfYear, format, parseISO } from 'date-fns'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, type Resolver } from 'react-hook-form'
import type { z } from 'zod'
import { AGE_BANDS, emptyAudience, hasAudience } from '../../shared/audience'
import { DEF, METRICS, type MetricKey, type Report } from '../../shared/metrics'
import { findOverlaps, findSnapshotClash } from '../../shared/overlap'
import { reportInputSchema, type ReportInput } from '../../shared/schema'
import { getAccount, getPlatform, setAccount, setPlatform, useAccount, usePlatform } from '../account'
import { metricLabel, PLATFORM_LABEL } from '../../shared/platforms'
import PostImagesField, { MAX_POST_IMAGES, type PendingImage } from '../components/PostImagesField'
import { ACCOUNT_LABEL } from '../../shared/accounts'
import { api } from '../api'
import AccountTabs from '../components/AccountTabs'
import AudienceFields from '../components/AudienceFields'
import ContentManager from '../components/ContentManager'
import { ReservationInput } from '../components/Reservations'
import { RESERVATION_ACCOUNT } from '../../shared/reservation'
import ActiveAds from '../components/ActiveAds'
import InfluencerList from '../components/InfluencerList'
import { INFLUENCER_ACCOUNT } from '../../shared/influencer'
import ImageFill from '../components/ImageFill'
import PercentGroups, { type PercentGroup } from '../components/PercentGroups'
import { Alert, btn, btnPrimary, Field, Modal, useAsync, useToast } from '../components/ui'
import type { AudiencePatch, Detection } from '../ocr/parse'
import { shrinkImage } from '../shrink'
import { fmtDate, fmtMetric, fmtRange, isReportWeek, lastThursday, num, REPORT_STATUS, weekBefore } from '../format'

export type FormValues = z.input<typeof reportInputSchema>
/** Kelompok persentase; total di sebelahnya dipakai bila pengguna mengisi dalam angka. */
const PCT_GROUPS: readonly PercentGroup[] = [
  { id: 'views', title: 'Views dari followers dan non-followers', total: 'views', keys: ['views_followers_pct', 'views_nonfollowers_pct'] },
  { id: 'viewers', title: 'Views per tipe konten (By content type)', total: 'views', keys: ['viewers_reels_pct', 'viewers_post_pct', 'viewers_story_pct'] },
  { id: 'interactions', title: 'Interaksi per tipe konten (By content interactions)', total: 'interactions', keys: ['interactions_reels_pct', 'interactions_post_pct', 'interactions_story_pct'] },
]
const num_ = { setValueAs: (v: unknown) => (v === '' || v == null ? null : Number(v)) }
const empty = (): FormValues => ({
  account: getAccount(),
  platform: getPlatform(),
  audience: emptyAudience(),
  period_start: weekBefore(lastThursday()).start, period_end: weekBefore(lastThursday()).end, recorded_at: lastThursday(), notes: '', snapshot_date: null,
  metrics: Object.fromEntries(METRICS.map((m) => [m.key, null])) as FormValues['metrics'],
} as FormValues)

// Tanggal snapshot default = akhir periode bila followers diisi.
const resolver: Resolver<FormValues> = (v, c, o) =>
  zodResolver(reportInputSchema)(
    { ...v, snapshot_date: v.metrics?.followers != null ? v.recorded_at : null },
    c, o,
  ) as ReturnType<Resolver<FormValues>>

/** `id`: admin mengubah laporan penuh; `resumeId`: pengguna biasa melanjutkan laporan dari Riwayat Data (hanya isian kosong). */
export default function InputPage({ id, resumeId }: { id?: string; resumeId?: string }) {
  const toast = useToast()
  const all = useAsync(() => api.reports(), [])
  const { register, control, handleSubmit, reset, setValue, getValues, watch, formState: { errors } } = useForm<FormValues>({ resolver, defaultValues: empty() })
  const cities = useFieldArray({ control, name: 'audience.cities' })
  const searchTerms = useFieldArray({ control, name: 'audience.search_terms' })
  const [growthFile, setGrowthFile] = useState<Blob | null>(null) // gambar pertumbuhan baru, diunggah saat Simpan
  const [growthPreview, setGrowthPreview] = useState('')
  const [growthError, setGrowthError] = useState('')
  const [growthBusy, setGrowthBusy] = useState(false)
  const [postFiles, setPostFiles] = useState<PendingImage[]>([]) // foto postingan baru (Threads), diunggah saat Simpan
  const [postError, setPostError] = useState('')
  const [postBusy, setPostBusy] = useState(false)
  const [pending, setPending] = useState<ReportInput | null>(null)
  const [contId, setContId] = useState<string | null>(null) // laporan tersimpan yang sedang dilanjutkan (hanya isian kosong yang terisi)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [ps, pe, rd] = watch(['period_start', 'period_end', 'recorded_at'])
  const metricsNow = watch('metrics') as Record<MetricKey, number | null> | undefined
  const fillFromImage = (all: Detection[], aud: AudiencePatch | null) => {
    // Hanya isian yang tampil di form platform ini yang diisi dari gambar.
    const shown: MetricKey[] | null = platform === 'instagram' ? null : platform === 'tiktok' || platform === 'youtube' ? [...insightKeys, 'followers'] : insightKeys // TikTok: Jumlah pengikut ikut terbaca
    const ds = shown ? all.filter((d) => shown.includes(d.key)) : all
    ds.forEach((d) => setValue(`metrics.${d.key}` as const, d.value, { shouldDirty: true, shouldValidate: true }))
    if (!aud || (platform !== 'instagram' && platform !== 'youtube')) return // gender dan umur dibaca untuk Instagram dan YouTube
    const opt = { shouldDirty: true, shouldValidate: true }
    if (aud.gender.women != null) setValue('audience.gender.women', aud.gender.women, opt)
    if (aud.gender.men != null) setValue('audience.gender.men', aud.gender.men, opt)
    for (const b of AGE_BANDS) if (aud.age[b] != null) setValue(`audience.age.${b}` as 'audience.age.13-17', aud.age[b]!, opt)
    if (aud.cities.length && platform === 'instagram') cities.replace(aud.cities)
    if (platform === 'youtube') {
      if (aud.search_share != null) setValue('audience.search_share', aud.search_share, opt)
      if (aud.search_terms?.length) searchTerms.replace(aud.search_terms)
    }
  }
  const growthSaved = (watch('audience.growth_image') as string | undefined) ?? ''
  const pickGrowth = async (f: File | undefined) => {
    setGrowthError('')
    if (!f) return
    if (!f.type.startsWith('image/') || f.type === 'image/svg+xml') return setGrowthError('Pilih file gambar (JPG, PNG, atau WebP).')
    if (f.size > 15 * 1024 * 1024) return setGrowthError('Ukuran gambar maksimal 15 MB.')
    setGrowthBusy(true)
    try {
      setGrowthFile(await shrinkImage(f, 1280))
    } catch {
      setGrowthError('Gambar tidak bisa dibaca. Coba file lain.')
    } finally {
      setGrowthBusy(false)
    }
  }
  const postSaved = (watch('audience.post_images') as string[] | undefined) ?? []
  const pickPosts = async (files: File[]) => {
    setPostError('')
    const room = MAX_POST_IMAGES - postSaved.length - postFiles.length
    if (files.length > room) setPostError(`Maksimal ${MAX_POST_IMAGES} gambar; hanya ${room} gambar pertama yang dipakai.`)
    setPostBusy(true)
    try {
      const next: PendingImage[] = []
      for (const f of files.slice(0, Math.max(0, room))) {
        if (!f.type.startsWith('image/') || f.type === 'image/svg+xml') { setPostError('Pilih file gambar (JPG, PNG, atau WebP).'); continue }
        if (f.size > 15 * 1024 * 1024) { setPostError('Ukuran gambar maksimal 15 MB.'); continue }
        const blob = await shrinkImage(f, 1280)
        next.push({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) })
      }
      setPostFiles((cur) => [...cur, ...next])
    } catch {
      setPostError('Gambar tidak bisa dibaca. Coba file lain.')
    } finally {
      setPostBusy(false)
    }
  }
  const removePost = (pid: string) => setPostFiles((cur) => { cur.filter((p) => p.id === pid).forEach((p) => URL.revokeObjectURL(p.url)); return cur.filter((p) => p.id !== pid) })
  const clearGrowth = () => (growthFile ? setGrowthFile(null) : setValue('audience.growth_image', '', { shouldDirty: true }))
  useEffect(() => {
    if (!growthFile) return setGrowthPreview('')
    const u = URL.createObjectURL(growthFile)
    setGrowthPreview(u)
    return () => URL.revokeObjectURL(u)
  }, [growthFile])
  const account = useAccount()
  const platform = usePlatform()
  const ig = platform === 'instagram' // platform lain: follower, insight ringan, dan foto
  const multiPhoto = platform === 'threads' || platform === 'youtube' // beberapa foto (postingan / thumbnail video)
  const insightKeys: MetricKey[] = platform === 'youtube' ? ['views', 'watch_hours'] : platform === 'tiktok' ? ['views', 'profile_visits', 'likes', 'comments', 'shares', 'reward', 'net_followers'] : ['views', 'viewers', 'profile_visits']
  const editing = id ? all.data?.find((r) => r.report_id === id) : undefined
  const base = contId ? all.data?.find((r) => r.report_id === contId) : undefined // isian miliknya terkunci
  const existing = !id && !contId ? all.data?.find((r) => r.account === account && r.platform === platform && r.period_start === ps && r.period_end === pe) : undefined
  const resume = (r: Report) => {
    reset({ ...r } as FormValues)
    setGrowthFile(null)
    setPostFiles([])
    setContId(r.report_id)
  }
  // Ganti akun/platform/periode berarti bukan laporan yang sama lagi.
  useEffect(() => {
    if (base && (base.account !== account || base.platform !== platform || base.period_start !== ps || base.period_end !== pe)) setContId(null)
  }, [base, account, platform, ps, pe])

  useEffect(() => {
    if (editing) {
      reset({ ...editing, snapshot_date: editing.snapshot_date } as FormValues)
      setGrowthFile(null)
      setAccount(editing.account) // tab akun dan platform mengikuti laporan yang diedit
      setPlatform(editing.platform)
    }
    else if (!id) reset(empty())
  }, [editing, id, reset])

  // Pindah akun/platform tanpa menyimpan: isian platform sebelumnya dikosongkan agar tidak terbawa (tanggal dan catatan tetap).
  const tab = useRef(`${account}/${platform}`)
  useEffect(() => {
    const key = `${account}/${platform}`
    if (tab.current === key) return
    tab.current = key
    if (id || resumeId) return // saat mengedit/melanjutkan laporan, tab mengikuti laporan itu
    const cur = getValues()
    reset({ ...empty(), account, platform, period_start: cur.period_start, period_end: cur.period_end, recorded_at: cur.recorded_at, notes: cur.notes } as FormValues)
    setGrowthFile(null)
    setPostFiles([])
    setContId(null)
  }, [account, platform, id, resumeId, reset, getValues])

  // Dari Riwayat Data (pengguna biasa): buka laporan itu dalam mode lanjutkan.
  const resumed = useRef('')
  useEffect(() => {
    const r = resumeId && resumed.current !== resumeId ? all.data?.find((x) => x.report_id === resumeId) : undefined
    if (!r) return
    resumed.current = resumeId!
    setAccount(r.account)
    setPlatform(r.platform)
    resume(r)
  }, [resumeId, all.data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Laporan bulanan/tahunan diinput manual (tidak dijumlahkan dari mingguan): isi periode penuh bulan/tahun.
  const fillSpan = (v: string, kind: 'month' | 'year') => {
    if (kind === 'month' ? !/^\d{4}-\d{2}$/.test(v) : !/^\d{4}$/.test(v)) return
    const from = kind === 'month' ? parseISO(v + '-01') : parseISO(v + '-01-01')
    const to = kind === 'month' ? endOfMonth(from) : endOfYear(from)
    setValue('period_start', format(from, 'yyyy-MM-dd'), { shouldDirty: true })
    setValue('period_end', format(to, 'yyyy-MM-dd'), { shouldDirty: true })
    setValue('recorded_at', format(addDays(to, 1), 'yyyy-MM-dd'), { shouldDirty: true })
  }

  const review = handleSubmit((raw) => {
    setServerError('')
    const v = reportInputSchema.parse({ ...raw, snapshot_date: raw.metrics.followers != null ? raw.recorded_at : null })
    setPending(v)
  })

  const warnings = pending && all.data ? findOverlaps({ ...pending, report_id: id ?? contId ?? undefined }, all.data) : []
  const clash = pending && all.data ? findSnapshotClash({ ...pending, report_id: id ?? contId ?? undefined }, all.data) : undefined

  async function save() {
    if (!pending) return
    setSaving(true)
    let uploaded = ''
    const uploadedPosts: string[] = []
    try {
      if (growthFile) uploaded = (await api.uploadThumb(growthFile)).file
      for (const p of postFiles) uploadedPosts.push((await api.uploadThumb(p.blob)).file)
      const body = uploaded || uploadedPosts.length ? { ...pending, audience: { ...pending.audience, ...(uploaded ? { growth_image: uploaded } : {}), post_images: [...pending.audience.post_images, ...uploadedPosts] } } : pending
      const r = id ? await api.update(id, body) : contId ? await api.continueReport(contId, body) : await api.create(body)
      const warn = r.warnings.length ? ' (perlu ditinjau: periode tumpang tindih)' : ''
      if (id) {
        toast(`Laporan disimpan${warn}`)
        location.hash = '#/history'
      } else {
        // Tetap di halaman ini: laporan tersimpan dimuat kembali sehingga bisa dilanjutkan kapan saja.
        toast(`Laporan disimpan${warn}. Anda bisa melanjutkan mengisi isian yang masih kosong.`)
        setPending(null)
        all.reload()
        resume(r.report)
      }
    } catch (e) {
      for (const u of [uploaded, ...uploadedPosts]) if (u) await api.deleteThumb(u).catch(() => {}) // jangan tinggalkan file yatim bila simpan gagal
      setServerError((e as Error).message)
      setPending(null)
    } finally {
      setSaving(false)
    }
  }

  const err = (m: MetricKey) => (errors.metrics as Record<string, { message?: string }> | undefined)?.[m]?.message
  const locked = (m: MetricKey) => !!base && base.metrics[m] != null
  const numField = (m: MetricKey) => (
    <Field key={m} label={metricLabel(platform, m, DEF[m].label) + (DEF[m].currency ? ' (Rp)' : '') + (DEF[m].percent ? ' (%)' : '') + ((m === 'followers' && !ig) ? ' *' : '')} error={err(m)}>
      <input type="number" inputMode={DEF[m].decimal ? 'decimal' : 'numeric'} min={DEF[m].signed ? undefined : 0} max={DEF[m].percent ? 100 : undefined} step={DEF[m].decimal ? 'any' : 1} readOnly={locked(m)} title={locked(m) ? 'Sudah terisi; hanya admin yang bisa mengubah lewat Riwayat Data' : undefined} className={locked(m) ? 'opacity-60' : base ? 'ring-2 ring-amber-400/70' : undefined} {...register(`metrics.${m}` as const, num_)} />
    </Field>
  )

  if (id && all.data && !editing) return <Alert>Laporan tidak ditemukan.</Alert>

  return (
    <div className="mx-auto max-w-3xl space-y-10">
    <form onSubmit={review} noValidate className="space-y-5">
      <h1 className="text-lg font-semibold">{id ? 'Edit laporan' : 'Input Insights'}</h1>
      <AccountTabs onChange={(a) => setValue('account', a)} onPlatform={(p) => setValue('platform', p)} />
      <p className="-mt-3 text-xs text-slate-500">Data di bawah disimpan untuk akun <b>{ACCOUNT_LABEL[account]}</b> · <b>{PLATFORM_LABEL[platform]}</b>.</p>
      {all.error && <Alert>{all.error}</Alert>}
      {existing && (
        <Alert kind="warn">
          Laporan {ACCOUNT_LABEL[account]} · {PLATFORM_LABEL[platform]} untuk periode {fmtRange(existing.period_start, existing.period_end)} sudah tersimpan.{' '}
          <button type="button" className="font-semibold underline" onClick={() => resume(existing)}>Lanjutkan mengisi</button>
          {' '}untuk melengkapi isian yang masih kosong.
        </Alert>
      )}
      {contId && base && (
        <Alert kind="warn">
          Melanjutkan laporan periode {fmtRange(base.period_start, base.period_end)}. Isian yang sudah terisi terkunci; isian kosong ditandai kuning dan bisa diisi sekarang. Mengubah isian yang sudah terisi hanya bisa oleh admin lewat Riwayat Data.
          {' '}<button type="button" className="font-semibold underline" onClick={() => { setContId(null); reset(empty()) }}>Batal lanjutkan</button>
        </Alert>
      )}
      {serverError && <Alert>{serverError}</Alert>}
      <ImageFill periodStart={ps} periodEnd={pe} platform={platform} onFill={fillFromImage} />

      <fieldset className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold">Periode</legend>
        <Field label="Tanggal pembuatan laporan *" error={errors.recorded_at?.message} hint="Mengisi periode otomatis: 7 hari sebelumnya (Kamis–Rabu)"><input type="date" {...register('recorded_at', { onChange: (e) => { if (e.target.value) { const w = weekBefore(e.target.value); setValue('period_start', w.start); setValue('period_end', w.end)} } })} /></Field>
        <Field label="Tanggal mulai *" error={errors.period_start?.message}><input type="date" {...register('period_start')} /></Field>
        <Field label="Tanggal akhir *" error={errors.period_end?.message}><input type="date" {...register('period_end')} /></Field>
        <div className="grid gap-3 border-t border-slate-200 pt-3 sm:col-span-3 sm:grid-cols-2">
          <Field label="Laporan bulanan: pilih bulan" hint="Mengisi periode 1 s/d akhir bulan dan tanggal laporan hari berikutnya"><input type="month" onChange={(e) => fillSpan(e.target.value, 'month')} /></Field>
          <Field label="Laporan tahunan: pilih tahun" hint="Mengisi periode 1 Jan s/d 31 Des"><input type="number" min={2000} max={2100} placeholder="2026" onChange={(e) => fillSpan(e.target.value, 'year')} /></Field>
        </div>
      </fieldset>

      {ig && (
        <fieldset className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">Metrik utama (total periode dari Instagram Insights)</legend>
          {METRICS.filter((m) => m.required || m.key === 'viewers').map((m) => numField(m.key))}
        </fieldset>
      )}

      {!ig && (
        <fieldset className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">Insight {PLATFORM_LABEL[platform]} (opsional)</legend>
          {insightKeys.map(numField)}
        </fieldset>
      )}

      <fieldset className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
        <legend className="px-1 text-sm font-semibold">Follower (snapshot pada tanggal pembuatan laporan)</legend>
        {numField('followers')}
      </fieldset>

      {ig && (
        <fieldset className="rounded-2xl glass p-4">
          <legend className="px-1 text-sm font-semibold">Persentase dari Instagram Insights (opsional)</legend>
          <PercentGroups
            groups={PCT_GROUPS}
            value={(k) => metricsNow?.[k] ?? null}
            totalOf={(k) => metricsNow?.[k] ?? null}
            setPercent={(k, v) => setValue(`metrics.${k}` as const, v as never, { shouldDirty: true, shouldValidate: true })}
            renderPercent={numField}
          />
        </fieldset>
      )}

      {multiPhoto && <PostImagesField title={platform === 'youtube' ? 'Thumbnail video' : undefined} saved={postSaved} pending={postFiles} busy={postBusy} error={postError} onPick={(fs) => void pickPosts(fs)} onRemoveSaved={(n) => setValue('audience.post_images', postSaved.filter((x) => x !== n), { shouldDirty: true })} onRemovePending={removePost} />}

      {platform === 'youtube' && <AudienceFields youtube searchTerms={searchTerms as never} register={register} errors={errors} cities={cities as never} growth={{ saved: growthSaved, preview: growthPreview, busy: growthBusy, error: growthError, pick: pickGrowth, clear: clearGrowth }} />}

      {!multiPhoto && <AudienceFields
        imageOnly={!ig}
        register={register}
        errors={errors}
        cities={cities as never}
        imageLabel={platform === 'instagram' ? undefined : platform === 'tiktok' ? 'Gambar TikTok (rasio 9:16)' : `Foto / screenshot ${PLATFORM_LABEL[platform]} (gambar)`}
        growth={{ saved: growthSaved, preview: growthPreview, busy: growthBusy, error: growthError, pick: pickGrowth, clear: clearGrowth }}
      />}

      {ig && (
        <fieldset className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">Meta Ads (kosongkan bila minggu itu tidak ada iklan)</legend>
          {(['lead', 'cost_per_result', 'budget', 'amount_spent', 'impressions', 'reach'] as const).map(numField)}
        </fieldset>
      )}

      {ig && (
        <fieldset className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
          <legend className="px-1 text-sm font-semibold">Pendapatan (kosongkan bila belum ada)</legend>
          {(['patients', 'revenue', 'avg_purchase'] as const).map(numField)}
        </fieldset>
      )}

      <div className="grid gap-3 rounded-2xl glass p-4 sm:grid-cols-3">
        <div className="sm:col-span-2"><Field label="Catatan" error={errors.notes?.message}><textarea rows={2} {...register('notes')} /></Field></div>
        {id && (
          <Field label="Status">
            <select {...register('status')}>{Object.entries(REPORT_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
        )}
      </div>

      <div className="flex gap-2">
        <button className={btnPrimary} type="submit">Tinjau</button>
        <a className={btn} href="#/history">Batal</a>
      </div>

      {pending && (
        <Modal title="Tinjau sebelum menyimpan" onClose={() => setPending(null)}>
          <p className="mb-1 text-sm">Akun: <b>{ACCOUNT_LABEL[pending.account]}</b> · <b>{PLATFORM_LABEL[pending.platform]}</b></p>
          {hasAudience(pending.audience) && <p className="mb-1 text-sm">Audience: gender, usia, lokasi, dan gambar yang terisi akan disimpan.</p>}
          <p className="mb-2 text-sm">Periode Insights: <b>{fmtRange(pending.period_start, pending.period_end)}</b> · dicatat {fmtDate(pending.recorded_at)}</p>
          <table className="mb-3 w-full text-sm">
            <tbody>
              {METRICS.map((m) => (
                <tr key={m.key} className="border-t border-slate-100">
                  <td className="py-1">{m.label}</td>
                  <td className="text-right">{pending.metrics[m.key] == null ? <span className="text-slate-400">kosong (tidak tersedia)</span> : fmtMetric(m.key, pending.metrics[m.key])}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isReportWeek(pending.period_start, pending.period_end) && <div className="mb-2"><Alert kind="warn">Periode ini bukan satu minggu Kamis–Rabu (7 hari). Tetap bisa disimpan, tetapi tidak akan cocok dengan filter Mingguan.</Alert></div>}
          {warnings.length > 0 && (
            <div className="mb-2"><Alert kind="warn">
              Periode tumpang tindih dengan laporan lain; laporan ini akan ditandai <b>Perlu ditinjau</b> dan tidak dijumlahkan otomatis:
              <ul className="list-disc pl-5">{warnings.map((w: Report | typeof warnings[number]) => <li key={w.report_id}>{fmtRange(w.period_start, w.period_end)} ({'keys' in w ? w.keys.map((k) => DEF[k].label).join(', ') : ''})</li>)}</ul>
            </Alert></div>
          )}
          {clash && <div className="mb-2"><Alert kind="warn">Sudah ada snapshot follower pada {fmtDate(clash.snapshot_date!)} ({num(clash.metrics.followers)}).</Alert></div>}
          <div className="flex justify-end gap-2">
            <button type="button" className={btn} onClick={() => setPending(null)}>Kembali</button>
            <button type="button" className={btnPrimary} disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </Modal>
      )}
    </form>

    {ig && <ContentManager reportDate={rd} />}
    {ig && account === INFLUENCER_ACCOUNT && <ContentManager reportDate={rd} section="endorsement" />}
    {account === RESERVATION_ACCOUNT && <ReservationInput period={{ start: ps, end: pe }} />}
    <section aria-labelledby="input-ads" className="space-y-3">
      <h2 id="input-ads" className="text-lg font-semibold">Input Iklan Aktif</h2>
      <p className="text-sm text-slate-500">Gambar di sini muncul di <b>Iklan Aktif</b> pada Dashboard akun ini.</p>
      <ActiveAds account={account} editable />
    </section>
    {account === INFLUENCER_ACCOUNT && (
      <section aria-labelledby="input-influencer" className="space-y-3">
        <h2 id="input-influencer" className="text-lg font-semibold">Input List Influencer</h2>
        <p className="text-sm text-slate-500">Daftar ini muncul di <b>List Influencer</b> pada Dashboard Klinik.</p>
        <InfluencerList editable />
      </section>
    )}
    </div>
  )
}
