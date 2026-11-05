import { AGE_BANDS, type AgeBand, type LocationRow } from '../../shared/audience'
import { DEF, type MetricKey } from '../../shared/metrics'

export interface OcrWord { text: string; x0: number; y0: number; x1: number; y1: number; conf?: number }
export interface Detection { key: MetricKey; value: number; raw: string }
export interface MonthDay { m: number; d: number }
export interface Parsed {
  found: Detection[]
  /** Label ketemu tetapi angkanya tidak bisa dibaca pasti (mis. singkatan 13K). */
  unreadable: { key: MetricKey; raw: string }[]
  period: { from: MonthDay; to: MonthDay } | null
  /** Catatan untuk pengguna: ada angka yang terbaca tetapi tidak bisa dipetakan dengan yakin. */
  notes: string[]
  /** Penjelasan netral untuk pengguna (mis. tabel Meta Ads hanya dibaca baris totalnya). */
  info: string[]
  /** Gender, Age range, dan Top locations yang terbaca (null bila gambar bukan layar Audience). */
  audience: AudiencePatch | null
}

/** Nama lokasi kosong ('') = nama tidak terbaca jelas; pengguna mengisinya. */
export interface AudiencePatch {
  /** YouTube: proporsi traffic penelusuran (%) dan kata kunci teratas. */
  search_share?: number
  search_terms?: LocationRow[]
  gender: { women?: number; men?: number }
  age: Partial<Record<AgeBand, number>>
  cities: LocationRow[]
}

// Label di screenshot Instagram Insights dan Ads Manager. "Net followers" sengaja tidak ada:
// itu selisih followers, bukan total, sehingga tidak boleh masuk ke metrik apa pun.
const LABELS: [MetricKey, string[]][] = [
  ['cost_per_result', ['cost', 'per', 'result']], ['cost_per_result', ['biaya', 'per', 'hasil']],
  // Header tabel sering terpotong dua baris, dan kata terakhirnya bisa tak terbaca: awalan dua kata sudah cukup.
  ['cost_per_result', ['cost', 'per']], ['cost_per_result', ['biaya', 'per']],
  ['external_link_taps', ['external', 'link', 'taps']],
  ['external_link_taps', ['ketukan', 'tautan', 'eksternal']], ['external_link_taps', ['ketukan', 'tautan']],
  ['external_link_taps', ['bio', 'link', 'taps']], ['external_link_taps', ['bio', 'tap', 'link']], ['external_link_taps', ['bio', 'link', 'tap']],
  ['profile_visits', ['profile', 'visits']], ['profile_visits', ['kunjungan', 'profil']], // Threads berbahasa Indonesia
  ['profile_visits', ['tampilan', 'profil']], ['likes', ['suka']], ['shares', ['bagikan']], // TikTok berbahasa Indonesia
  ['viewers', ['pemirsa']], ['views', ['dilihat']],
  ['amount_spent', ['amount', 'spent']], ['amount_spent', ['jumlah', 'yang', 'dibelanjakan']], ['amount_spent', ['jumlah', 'yang']], ['amount_spent', ['dibelanjakan']],
  ['interactions', ['interactions']], ['interactions', ['interaksi']],
  ['impressions', ['impressions']], ['impressions', ['impresi']],
  ['comments', ['comments']], ['comments', ['komentar']],
  ['viewers', ['viewers']],
  ['views', ['views']], ['views', ['tayangan']], ['views', ['penayangan']],
  ['watch_hours', ['waktu', 'tonton']], ['watch_hours', ['watch', 'time']],
  ['reach', ['reach']], ['reach', ['jangkauan']], ['reach', ['akun', 'dijangkau']],
  ['likes', ['likes']],
  ['shares', ['shares']],
  ['saves', ['saves']],
  ['lead', ['leads']], ['lead', ['lead']], ['lead', ['results']], ['lead', ['hasil']],
  ['budget', ['budget']], ['budget', ['anggaran']],
].sort((a, b) => b[1].length - a[1].length) as [MetricKey, string[]][] // label terpanjang dicoba lebih dulu

const MONTH_RE = [/^jan/, /^feb/, /^mar/, /^apr/, /^(may|mei)/, /^jun/, /^jul/, /^(aug|agu|agt)/, /^sep/, /^(oct|okt)/, /^nov/, /^(dec|des)/]
export const monthOf = (w: string) => {
  const i = MONTH_RE.findIndex((r) => r.test(w.toLowerCase().replace(/[^a-z]/g, '')))
  return i >= 0 ? i + 1 : null
}

export const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '')
export const h = (w: OcrWord) => w.y1 - w.y0
export const yc = (w: OcrWord) => (w.y0 + w.y1) / 2

/** Bilangan bulat: 62199 atau 62,199 / 62.199. Singkatan (13K) dan desimal ditolak. */
export function parseCount(t: string): number | null {
  const s = t.replace(/^\+/, '')
  if (/^\d+$/.test(s)) return Number(s)
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''))
  return null
}

/** Desimal: "400,1" / "400.1" / "1.234,5" / "1,234.5". Satu pemisah diikuti tepat 3 digit dianggap pemisah ribuan. */
export function parseDecimal(t: string): number | null {
  if (/^\d+$/.test(t)) return Number(t)
  if (/^\d{1,3}([.,]\d{3})+$/.test(t)) return Number(t.replace(/[.,]/g, ''))
  const both = /^\d{1,3}(?:\.\d{3})+,\d+$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : /^\d{1,3}(?:,\d{3})+\.\d+$/.test(t) ? t.replace(/,/g, '') : null
  if (both) return Number(both)
  return /^\d+[.,]\d+$/.test(t) ? Number(t.replace(',', '.')) : null
}

const SCALE: Record<string, number> = { rb: 1e3, ib: 1e3, lb: 1e3, k: 1e3, jt: 1e6, m: 1e6 }
const NUM_TOKEN = /^[+\-−–]?[$S]?\d[\d.,]*(rb|ib|lb|jt|k|m)?$/i

/** Angka dengan singkatan terpisah ("33,8" + "rb") digabung; baris selisih ("+65 (+14,9%)") dibuang. Dipakai TikTok dan platform non-Instagram. */
export function mergeNumbers(words: OcrWord[]): OcrWord[] {
  const out: OcrWord[] = []
  for (let i = 0; i < words.length; i++) {
    const w = words[i]
    let text = w.text
    let x1 = w.x1
    const next = words[i + 1]
    if (/^[+\-−–]?[$S]?\d[\d.,]*$/.test(text) && next && /^(rb|ib|lb|jt|k|m)$/i.test(next.text) && Math.abs(yc(next) - yc(w)) < h(w) * 0.6 && next.x0 - w.x1 < h(w) * 1.2) {
      text += next.text
      x1 = next.x1
      i++
    }
    if (!NUM_TOKEN.test(text)) continue
    const isDelta = words.some((o) => o !== w && o.text.startsWith('(') && Math.abs(yc(o) - yc(w)) < h(w) * 0.6 && o.x0 >= x1 - 2 && o.x0 - x1 < h(w) * 3)
    if (!isDelta) out.push({ ...w, text, x1 })
  }
  return out
}

/** Nilai longgar: desimal, singkatan rb/jt/k/m (dibulatkan, jadi perkiraan), uang dolar, dan negatif bila metrik boleh negatif. */
export function parseLoose(raw: string, key: MetricKey): { value: number; approx: boolean } | null {
  const t = raw.replace(/[−–]/g, '-').replace(/^([+-]?)S(?=\d)/, '$1$')
  const neg = t.startsWith('-')
  if (neg && !DEF[key].signed) return null
  const body = t.replace(/^[+-]/, '')
  let value: number | null = null
  let approx = false
  if (DEF[key].usd) value = parseMoney(body.replace(/^\$/, ''))
  else if (DEF[key].currency) value = parseMoney(body)
  else {
    const ab = /^(\d+(?:[.,]\d+)?)(rb|ib|lb|jt|k|m)$/i.exec(body)
    if (ab) {
      value = Math.round(Number(ab[1].replace(',', '.')) * SCALE[ab[2].toLowerCase()])
      approx = true
    } else value = DEF[key].decimal ? parseDecimal(body) : parseCount(body)
  }
  return value == null ? null : { value: neg ? -value : value, approx }
}

/** Rupiah: "Rp 686.059" (titik ribuan), "1,234.50" (format Inggris), atau angka polos. */
export function parseMoney(t: string): number | null {
  const s = t.replace(/^(rp|idr)\.?/i, '')
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'))
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(s)) return Number(s.replace(/,/g, ''))
  if (/^\d+([.,]\d{1,2})?$/.test(s)) return Number(s.replace(',', '.'))
  return null
}

const numericLike = (t: string) => /^(rp|idr)?\.?[+-]?\d[\d.,]*[kKmMbB]?%?$/i.test(t.trim())

function lev(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
/** Sama persis, atau salah baca satu huruf pada kata panjang (OCR membaca "Impresi" sebagai "mpresi"). */
export const same = (a: string, b: string) => a === b || (b.length >= 6 && a.length >= 5 && lev(a, b) <= 1)

export function findLabels(words: OcrWord[], labels: [MetricKey, string[]][] = LABELS) {
  const hits: { key: MetricKey; box: OcrWord }[] = []
  for (let i = 0; i < words.length; i++) {
    for (const [key, toks] of labels) {
      const seq = words.slice(i, i + toks.length)
      if (seq.length < toks.length) continue
      const ok = seq.every((w, j) => same(norm(w.text), toks[j]) && (j === 0 || (Math.abs(yc(w) - yc(seq[0])) < h(seq[0]) * 0.7 && w.x0 >= seq[j - 1].x1 - h(seq[0]) * 0.5 && w.x0 - seq[j - 1].x1 < h(seq[0]) * 2.5)))
      if (!ok) continue
      const box = { text: toks.join(' '), x0: seq[0].x0, y0: Math.min(...seq.map((w) => w.y0)), x1: seq[seq.length - 1].x1, y1: Math.max(...seq.map((w) => w.y1)) }
      // "hasil" di baris kedua header "Biaya per / hasil" bukan kolom Hasil (lead).
      const wrapped = key === 'lead' && words.some((p) => norm(p.text) === 'biaya' && box.y0 >= p.y1 - 2 && box.y0 - p.y1 <= h(p) * 1.6 && Math.abs(p.x0 - box.x0) <= h(p) * 1.5)
      if (!wrapped) hits.push({ key, box })
      i += toks.length - 1
      break
    }
  }
  return hits
}

/** Urutan kolom standar Ads Manager (Hasil, Anggaran, Biaya per hasil, Jumlah yang dibelanjakan, Impresi, Jangkauan). */
const TABLE_KEYS: MetricKey[] = ['lead', 'budget', 'cost_per_result', 'amount_spent', 'impressions', 'reach']

/**
 * Tabel Ads Manager: judul kolom berderet di atas, baris kampanye di tengah, baris TOTAL paling bawah.
 * Hanya baris paling bawah yang dibaca. Kolom dibatasi dari tepi kiri judul sampai tepi kiri kolom berikutnya
 * (judul rata kiri, angka rata kanan). Judul dua baris sering hanya terbaca sebagian oleh OCR: posisi kolom yang
 * judulnya hilang diperkirakan dari urutan standar di atas dan jarak antar kolom yang terbaca.
 * Kolom yang kosong di baris total (mis. Anggaran) dilewati.
 */
function readTable(hits: { key: MetricKey; box: OcrWord }[], nums: OcrWord[]) {
  const cand = hits.filter((x) => TABLE_KEYS.includes(x.key))
  if (!cand.length) return null
  const top = Math.min(...cand.map((x) => yc(x.box)))
  const H = h(cand[0].box)
  const row = new Map<MetricKey, OcrWord>() // judul paling atas per metrik
  for (const x of cand.filter((c) => yc(c.box) <= top + H * 3.5)) if (!row.has(x.key) || x.box.y0 < row.get(x.key)!.y0) row.set(x.key, x.box)
  if (row.size < 3) return null

  const heads = [...row].map(([key, box]) => ({ key, box, idx: TABLE_KEYS.indexOf(key) })).sort((p, q) => p.box.x0 - q.box.x0)
  const headBottom = Math.max(...heads.map((x) => x.box.y1))
  const pad = H * 0.5
  const below = nums.filter((c) => c.y0 >= headBottom - pad && c.x1 >= heads[0].box.x0 - pad)
  if (!below.length) return null

  const known = new Map(heads.map((x) => [x.idx, x.box.x0]))
  const ordered = heads.every((x, i) => i === 0 || x.idx > heads[i - 1].idx) // urutan sesuai standar?
  const idxs = [...known.keys()].sort((p, q) => p - q)
  /** Tepi kiri kolom ke-t: dari judul terbaca, atau interpolasi/ekstrapolasi linear dari kolom terbaca di dekatnya. */
  const xAt = (t: number) => {
    if (known.has(t)) return known.get(t)!
    const lo = [...idxs].reverse().find((k) => k < t)
    const hi = idxs.find((k) => k > t)
    const [p, q] = lo !== undefined && hi !== undefined ? [lo, hi] : lo !== undefined ? idxs.slice(-2) : idxs.slice(0, 2)
    return known.get(p)! + ((known.get(q)! - known.get(p)!) / (q - p)) * (t - p)
  }
  const cols = (ordered
    ? TABLE_KEYS.map((key, idx) => ({ key, x: xAt(idx), inferred: !known.has(idx) }))
    : heads.map((x) => ({ key: x.key, x: x.box.x0, inferred: false }))
  ).sort((p, q) => p.x - q.x)

  const totalY = Math.max(...below.map(yc)) // baris paling bawah = total
  const total = below.filter((c) => Math.abs(yc(c) - totalY) <= h(c) * 0.8)
  const found: Detection[] = []
  const unreadable: Parsed['unreadable'] = []
  const inferred: MetricKey[] = []
  cols.forEach(({ key, x, inferred: guess }, i) => {
    const to = cols[i + 1] ? cols[i + 1].x - pad : Infinity
    const cell = total.filter((c) => (c.x0 + c.x1) / 2 >= x - pad && (c.x0 + c.x1) / 2 < to).sort((p, q) => q.x1 - p.x1)[0]
    if (!cell) return
    const value = DEF[key].currency ? parseMoney(cell.text) : parseCount(cell.text)
    if (value == null) unreadable.push({ key, raw: cell.text })
    else {
      found.push({ key, value, raw: cell.text })
      if (guess) inferred.push(key)
    }
  })
  return { found, unreadable, inferred, keys: new Set(cols.map((x) => x.key)) }
}

/** Angka milik sebuah label: di kanan pada baris yang sama (tabel), atau tepat di bawahnya (kartu). */
function valueFor(label: OcrWord, nums: OcrWord[]) {
  const H = h(label)
  const right = nums
    .filter((c) => Math.abs(yc(c) - yc(label)) <= H * 0.6 && c.x0 >= label.x1 - 2)
    .sort((a, b) => a.x0 - b.x0)[0]
  if (right) return right
  return nums
    .filter((c) => c.y0 >= label.y1 - H * 0.2 && c.y0 - label.y1 <= H * 4 && Math.abs(c.x0 - label.x0) <= Math.max(H * 0.8, (label.x1 - label.x0) * 0.5))
    .sort((a, b) => a.y0 - b.y0)[0]
}

/** Periode di gambar: "Oct 21 - Oct 27" (bulan dulu, Instagram Inggris) atau "21 Okt - 27 Okt" (tanggal dulu, Indonesia). */
export function findPeriod(words: OcrWord[]) {
  const pts: { m: number; d: number; x: number }[] = []
  const day = (w?: OcrWord) => (w && /^\d{1,2}$/.test(w.text) ? Number(w.text) : NaN)
  for (let i = 0; i < words.length - 1; i++) {
    const [a, b] = [words[i], words[i + 1]]
    if (Math.abs(yc(b) - yc(a)) >= h(a) * 0.7) continue
    const mFirst = monthOf(a.text)
    const mSecond = monthOf(b.text)
    const d1 = day(b)
    const d2 = day(a)
    if (mFirst && d1 >= 1 && d1 <= 31) pts.push({ m: mFirst, d: d1, x: a.x0 })
    else if (mSecond && d2 >= 1 && d2 <= 31) pts.push({ m: mSecond, d: d2, x: a.x0 })
  }
  if (pts.length < 2) return null
  pts.sort((a, b) => a.x - b.x)
  return { from: { m: pts[0].m, d: pts[0].d }, to: { m: pts[pts.length - 1].m, d: pts[pts.length - 1].d } }
}

/** Persentase: "3.7%" atau "85,2%" (0–100). */
export function parsePercent(t: string): number | null {
  const m = /^(\d{1,3}(?:[.,]\d{1,2})?)%$/.exec(t.trim())
  if (!m) return null
  const v = Number(m[1].replace(',', '.'))
  return v <= 100 ? v : null
}

const SEGMENT: Record<string, 'reels' | 'post' | 'story'> = { reels: 'reels', reel: 'reels', posts: 'post', post: 'post', postingan: 'post', stories: 'story', story: 'story', cerita: 'story' }
const HEADING: Record<string, 'viewers' | 'interactions'> = { views: 'viewers', viewers: 'viewers', interactions: 'interactions', interaksi: 'interactions', tayangan: 'viewers', penayangan: 'viewers', pemirsa: 'viewers' }

/**
 * Persentase di samping label: "3.7% followers" (angka di kiri, seperti Instagram) atau "Reels ... 85%" (angka di kanan).
 * Angka di kiri yang dekat didahulukan; selain itu angka terdekat di kanan pada baris yang sama.
 */
function percentOf(label: OcrWord, pcts: { v: number; w: OcrWord }[]) {
  const H = h(label)
  const line = pcts.filter((p) => Math.abs(yc(p.w) - yc(label)) <= H * 0.6)
  const left = line.filter((p) => p.w.x1 <= label.x0 + 2 && label.x0 - p.w.x1 <= H * 2.5).sort((a, b) => b.w.x1 - a.w.x1)[0]
  if (left) return left
  return line.filter((p) => p.w.x0 >= label.x1 - 2).sort((a, b) => a.w.x0 - b.w.x0)[0]
}

/** Judul bagian (Views/Viewers atau Interactions) terdekat di atas posisi y. */
const headingAbove = (words: OcrWord[], y: number) =>
  words.filter((w) => HEADING[norm(w.text)] && w.y1 <= y + 1).sort((a, b) => b.y1 - a.y1)[0]

function findSegments(words: OcrWord[]) {
  const pcts = words.flatMap((w) => {
    const v = parsePercent(w.text)
    return v == null ? [] : [{ v, w }]
  })
  const found: Detection[] = []
  const notes: string[] = []
  if (!pcts.length) return { found, notes }

  // Followers / non-followers: hanya bila bagiannya Views (bukan Interactions).
  for (const [i, w] of words.entries()) {
    const t0 = norm(w.text)
    const bukan = t0 === 'pengikut' && norm(words[i - 1]?.text ?? '') === 'bukan' // "Bukan pengikut"
    const t = t0 === 'pengikut' ? (bukan ? 'nonfollowers' : 'followers') : t0
    if (t !== 'followers' && t !== 'nonfollowers') continue
    const p = percentOf(w, pcts)
    if (!p) continue
    const head = headingAbove(words, w.y0)
    if (head && HEADING[norm(head.text)] === 'interactions') continue
    found.push({ key: t === 'followers' ? 'views_followers_pct' : 'views_nonfollowers_pct', value: p.v, raw: p.w.text })
  }

  // Reels / Post / Story di bawah tiap "By content type": pemiliknya (Viewers atau Interaksi) = judul terdekat di atasnya.
  const heads = words.flatMap((w, i) => ((norm(w.text) === 'content' && norm(words[i + 1]?.text ?? '') === 'type') || (norm(w.text) === 'jenis' && norm(words[i + 1]?.text ?? '') === 'konten') ? [w] : [])).sort((x, y) => x.y0 - y.y0)
  heads.forEach((th, i) => {
    const end = heads[i + 1]?.y0 ?? Infinity // blok ini berakhir di judul "content type" berikutnya
    const owner = headingAbove(words, th.y0)
    const kind = owner ? HEADING[norm(owner.text)] : null
    const hits = words.flatMap((w) => {
      const seg = SEGMENT[norm(w.text)]
      const p = seg && w.y0 >= th.y0 && w.y0 < end ? percentOf(w, pcts) : undefined
      return seg && p ? [{ seg, p }] : []
    })
    if (hits.length && !kind) notes.push('Persentase Reels/Post/Story terbaca, tetapi tidak jelas milik Viewers atau Interaksi. Isi manual.')
    else for (const { seg, p } of hits) found.push({ key: `${kind}_${seg}_pct` as MetricKey, value: p.v, raw: p.w.text })
  })
  return { found, notes }
}

// ---------------------------------------------------------------- Audience (Gender, Age range, Top locations)

const GENDER_WORD: Record<string, 'women' | 'men'> = { women: 'women', woman: 'women', perempuan: 'women', wanita: 'women', men: 'men', man: 'men', pria: 'men', laki: 'men', lakilaki: 'men' }
const NOT_A_PLACE = new Set(['views', 'viewers', 'reach', 'interactions', 'followers', 'nonfollowers', 'impressions', 'countries', 'cities', 'country', 'city', 'gender', 'age', 'agerange', 'toplocations', 'women', 'men', 'total', 'tayangan', 'pengikut', 'bukanpengikut', 'jangkauan', 'interaksi', 'kota', 'negara', 'usia', 'kisaranusia', 'jeniskelamin', 'lokasiteratas', 'perempuan', 'pria', 'laki', 'lakilaki'])
const MIN_NAME_CONF = 60 // nama dengan keyakinan OCR lebih rendah dianggap tidak terbaca
const WARN_CONF = 90 // angka dengan keyakinan lebih rendah ditandai untuk diperiksa

export interface Phrase { text: string; x0: number; y0: number; x1: number; y1: number; conf: number }

/** Kata satu baris digabung menjadi frasa ("Bandar" + "Lampung"); baris dikelompokkan dulu agar urutan kiri-kanan benar. */
export function phrasesOf(words: OcrWord[]): Phrase[] {
  const lines: OcrWord[][] = []
  const meanY: number[] = []
  for (const w of [...words].sort((a, b) => yc(a) - yc(b))) {
    const i = lines.length - 1
    if (i >= 0 && Math.abs(yc(w) - meanY[i]) <= h(w) * 0.6) {
      lines[i].push(w)
      meanY[i] = lines[i].reduce((t, x) => t + yc(x), 0) / lines[i].length
    } else {
      lines.push([w])
      meanY.push(yc(w))
    }
  }
  const out: Phrase[] = []
  for (const line of lines) {
    let cur: Phrase | null = null
    for (const w of line.sort((a, b) => a.x0 - b.x0)) {
      if (cur && w.x0 - cur.x1 < h(w) * 1.6) {
        cur.text += ' ' + w.text
        cur.x1 = Math.max(cur.x1, w.x1)
        cur.y0 = Math.min(cur.y0, w.y0)
        cur.y1 = Math.max(cur.y1, w.y1)
        cur.conf = Math.min(cur.conf, w.conf ?? 100)
      } else {
        if (cur) out.push(cur)
        cur = { text: w.text, x0: w.x0, y0: w.y0, x1: w.x1, y1: w.y1, conf: w.conf ?? 100 }
      }
    }
    if (cur) out.push(cur)
  }
  return out
}

const bandOf = (t: string): AgeBand | null => {
  const m = /^\D{0,2}\s*(\d{2})\s*[-–—]\s*(\d{2})\s*$/.exec(t) ?? /^\D{0,2}\s*(\d{2})\s*(\+)\s*$/.exec(t)
  if (!m) return null
  const key = (m[2] === '+' ? m[1] + '+' : m[1] + '-' + m[2]) as AgeBand
  return AGE_BANDS.includes(key) ? key : null
}

function findAudience(words: OcrWord[]): { patch: AudiencePatch | null; notes: string[]; info: string[] } {
  const pcts = words.flatMap((w) => {
    const v = parsePercent(w.text)
    return v == null ? [] : [{ v, w }]
  })
  const notes: string[] = []
  const info: string[] = []
  if (!pcts.length) return { patch: null, notes, info }

  // "3.7% followers" (angka di kiri label) milik kartu Views, bukan Audience.
  const free = pcts.filter(({ w }) => !words.some((o) => o !== w && /[a-z]/i.test(o.text) && Math.abs(yc(o) - yc(w)) < h(w) * 0.6 && o.x0 >= w.x1 - 2 && o.x0 - w.x1 < h(w) * 2.5))
  const phrases = phrasesOf(words).filter((p) => parsePercent(p.text) == null)

  const gender: AudiencePatch['gender'] = {}
  const age: AudiencePatch['age'] = {}
  const places: { name: string; pct: number; y: number }[] = []
  const weak: string[] = []
  const used = new Set<Phrase>()

  for (const { v, w } of [...free].sort((a, b) => yc(a.w) - yc(b.w))) {
    const H = h(w)
    // Bar chart: label di baris atas, persen di ujung kanan baris bar. List biasa: label di baris yang sama.
    const above = phrases
      .filter((p) => !used.has(p) && p.y1 <= w.y0 + H * 0.3 && yc(w) - yc(p) <= 4 * Math.max(H, p.y1 - p.y0) && p.x0 <= w.x0)
      .sort((a, b) => yc(w) - yc(a) - (yc(w) - yc(b)))[0]
    const sameLine = phrases
      .filter((p) => !used.has(p) && Math.abs(yc(p) - yc(w)) <= H * 0.6 && p.x1 <= w.x0 + 2)
      .sort((a, b) => b.x1 - a.x1)[0]
    const label = above ?? sameLine
    if (!label) continue
    used.add(label)

    const g = GENDER_WORD[norm(label.text)]
    const band = bandOf(label.text)
    const shaky = (w.conf ?? 100) < WARN_CONF
    if (g) {
      gender[g] ??= v
      if (shaky) weak.push(`Gender ${label.text} = ${v}%`)
    } else if (band) {
      age[band] ??= v
      if (shaky) weak.push(`Age range ${band} = ${v}%`)
    } else {
      const name = label.text.replace(/^[^\p{L}\p{N}]+/u, '').trim()
      if (!/\p{L}{2,}/u.test(name) || NOT_A_PLACE.has(norm(name))) continue
      const readable = label.conf >= MIN_NAME_CONF
      places.push({ name: readable ? name : '', pct: v, y: yc(w) })
      if (!readable) weak.push(`nama lokasi untuk ${v}% tidak terbaca`)
      else if (shaky) weak.push(`Lokasi ${name} = ${v}%`)
    }
  }

  const rows = places.sort((a, b) => a.y - b.y).map(({ name, pct }) => ({ name, pct }))
  const patch: AudiencePatch = { gender, age, cities: rows.length >= 2 ? rows : [] } // satu baris saja bukan daftar lokasi
  const any = Object.keys(gender).length || Object.keys(age).length || patch.cities.length
  if (!any) return { patch: null, notes, info }

  if (weak.length) notes.push(`Kurang yakin dibaca: ${weak.join('; ')}. Periksa angkanya.`)
  const ageTotal = AGE_BANDS.every((b) => age[b] != null) ? AGE_BANDS.reduce((t, b) => t + age[b]!, 0) : null
  if (ageTotal != null && Math.abs(ageTotal - 100) > 3) notes.push(`Total Age range ${Math.round(ageTotal * 10) / 10}% (seharusnya sekitar 100%): ada angka yang kemungkinan salah baca.`)
  if (gender.women != null && gender.men != null && Math.abs(gender.women + gender.men - 100) > 1) notes.push('Total Gender tidak mendekati 100%: periksa angkanya.')
  return { patch, notes, info }
}

/** `loose`: pembacaan longgar untuk platform non-Instagram (desimal dan singkatan rb/jt diterima, bukan ditolak). */
export function parseInsights(words: OcrWord[], loose = false): Parsed {
  const nums = loose ? mergeNumbers(words) : words.filter((w) => numericLike(w.text))
  const cellValue = (key: MetricKey, text: string) => {
    if (!loose) return DEF[key].currency ? parseMoney(text) : parseCount(text)
    const v = parseLoose(text, key)
    if (v?.approx) info.push(`${DEF[key].label} dibaca dari angka singkatan “${text}” (≈ ${v.value.toLocaleString('id-ID')}): sudah dibulatkan oleh platform, sesuaikan dengan angka sebenarnya bila perlu.`)
    return v?.value ?? null
  }
  const found: Detection[] = []
  const unreadable: Parsed['unreadable'] = []
  const info: string[] = []
  const notes: string[] = []
  const seen = new Set<MetricKey>()
  const hits = findLabels(words)

  const table = readTable(hits, nums)
  if (table) {
    found.push(...table.found)
    unreadable.push(...table.unreadable)
    table.keys.forEach((k) => seen.add(k)) // kolom tabel tidak dibaca lagi dari baris kampanye
    if (table.inferred.length)
      notes.push(`Judul kolom ${table.inferred.map((k) => DEF[k].label).join(' dan ')} tidak terbaca; angkanya diambil dari urutan kolom standar Ads Manager (Hasil, Anggaran, Biaya per hasil, Jumlah yang dibelanjakan, Impresi, Jangkauan). Periksa angkanya.`)
    info.push('Tabel Meta Ads terdeteksi: hanya baris paling bawah (total) yang dibaca. Kolom yang kosong di baris itu, misalnya Anggaran, tidak diisi.')
  }

  for (const { key, box } of hits) {
    if (seen.has(key)) continue // pakai kemunculan pertama
    const cell = valueFor(box, nums)
    if (!cell) continue
    seen.add(key)
    const value = cellValue(key, cell.text)
    if (value == null) unreadable.push({ key, raw: cell.text })
    else found.push({ key, value, raw: cell.text })
  }
  const seg = findSegments(words)
  for (const d of seg.found) if (!seen.has(d.key)) {
    seen.add(d.key)
    found.push(d)
  }
  const aud = findAudience(words)
  return { found, unreadable, period: findPeriod(words), notes: [...notes, ...seg.notes, ...aud.notes], info: [...info, ...aud.info], audience: aud.patch }
}

/** Apakah periode di gambar sama dengan periode form (tanpa tahun: gambar Instagram tidak memuatnya). */
export function periodMatches(p: NonNullable<Parsed['period']>, startIso: string, endIso: string) {
  const md = (iso: string) => ({ m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) })
  const s = md(startIso)
  const e = md(endIso)
  return p.from.m === s.m && p.from.d === s.d && p.to.m === e.m && p.to.d === e.d
}
