import { AGE_BANDS, type AgeBand, type LocationRow } from '../../shared/audience'
import { DEF, type MetricKey } from '../../shared/metrics'
import { findLabels, h, mergeNumbers, norm, parseLoose, parsePercent, phrasesOf, yc, type AudiencePatch, type Detection, type OcrWord, type Parsed } from './parse'

/**
 * Pembaca khusus screenshot YouTube Studio (bahasa Indonesia atau Inggris):
 *  - Kartu gelap (Penayangan / Waktu tonton): label di atas, angka besar di bawahnya
 *  - Analisis channel: "Subscriber saat ini" (angka di bawah label); "Penayangan" dan "Waktu tonton (jam)" (angka di kanan, satu baris)
 *  - Umur dan gender: Wanita / Pria dan "13-17 tahun" … (persen di kanan, satu baris)
 *  - Penelusuran YouTube: "Proporsi dari total traffic Anda: 58,3%" lalu daftar kata kunci dengan persen di kanan.
 */
const LABELS = (
  [
    ['followers', ['subscriber', 'saat', 'ini']], ['followers', ['subscriber']],
    ['watch_hours', ['waktu', 'tonton']],
    ['views', ['penayangan']],
    // Tampilan bahasa Inggris
    ['followers', ['current', 'subscribers']], ['followers', ['subscribers']],
    ['watch_hours', ['watch', 'time']], ['views', ['views']],
  ] as [MetricKey, string[]][]
).sort((a, b) => b[1].length - a[1].length)

const GENDER: Record<string, 'women' | 'men'> = { wanita: 'women', pria: 'men', women: 'women', female: 'women', men: 'men', male: 'men' }
const AGE = /^(\d{2})\s*[-–—]\s*(\d{2})(\s*(?:tahun|years?))?$|^(\d{2})\s*\+(\s*(?:tahun|years?))?$/i

const ageOf = (t: string): AgeBand | null => {
  const m = AGE.exec(t.trim())
  if (!m) return null
  const key = (m[4] ? m[4] + '+' : m[1] + '-' + m[2]) as AgeBand
  return AGE_BANDS.includes(key) ? key : null
}

/** Angka di kanan label pada baris yang sama (Ringkasan: "Penayangan ........ 90,6 rb"). */
function rightOf(label: OcrWord, nums: OcrWord[]) {
  const H = h(label)
  return nums.filter((c) => Math.abs(yc(c) - yc(label)) <= H * 0.6 && c.x0 >= label.x1 - 2).sort((a, b) => a.x0 - b.x0)[0]
}

/** Kartu bertema gelap: label di tengah atas, angka besar di tengah tepat di bawahnya (pusat sejajar, bukan tepi kiri). */
function belowCentered(label: OcrWord, nums: OcrWord[]) {
  const H = h(label)
  const mid = (o: OcrWord) => (o.x0 + o.x1) / 2
  return nums
    .filter((c) => c.y0 >= label.y1 - H * 0.2 && c.y0 - label.y1 <= H * 4 && Math.abs(mid(c) - mid(label)) <= Math.max(label.x1 - label.x0, c.x1 - c.x0) * 0.7)
    .sort((a, b) => a.y0 - b.y0)[0]
}

/** Angka tepat di bawah label ("Subscriber saat ini" lalu 20.853). */
function below(label: OcrWord, nums: OcrWord[]) {
  const H = h(label)
  return nums
    .filter((c) => c.y0 >= label.y1 - H * 0.2 && c.y0 - label.y1 <= H * 4 && Math.abs(c.x0 - label.x0) <= Math.max(H * 0.8, (label.x1 - label.x0) * 0.5))
    .sort((a, b) => a.y0 - b.y0)[0]
}

export function parseYouTube(words: OcrWord[]): Parsed {
  // Angka yang disusul satuan waktu ("28 hari terakhir", "48 jam") adalah rentang periode, bukan nilai metrik.
  const isDuration = (n: OcrWord) => words.some((o) => /^(hari|jam|bulan|minggu|menit|days?|hours?|months?|weeks?|minutes?)$/i.test(o.text) && Math.abs(yc(o) - yc(n)) < h(n) * 0.6 && o.x0 >= n.x1 - 2 && o.x0 - n.x1 < h(n) * 2.5)
  const nums = mergeNumbers(words).filter((n) => !isDuration(n))
  const found: Detection[] = []
  const unreadable: Parsed['unreadable'] = []
  const notes: string[] = []
  const seen = new Set<MetricKey>()

  for (const { key, box } of findLabels(words, LABELS)) {
    if (seen.has(key)) continue
    const cell = key === 'followers' ? below(box, nums) ?? belowCentered(box, nums) : rightOf(box, nums) ?? belowCentered(box, nums)
    if (!cell) continue // mis. "Penayangan · 7 hari terakhir" tanpa angka di barisnya
    seen.add(key)
    const v = parseLoose(cell.text, key)
    if (!v) unreadable.push({ key, raw: cell.text })
    else {
      found.push({ key, value: v.value, raw: cell.text })
      if (v.approx) notes.push(`${DEF[key].label} dibaca dari angka singkatan “${cell.text}” (≈ ${v.value.toLocaleString('id-ID')}): YouTube membulatkannya, sesuaikan dengan angka sebenarnya bila perlu.`)
    }
  }

  // Baris persen: label di kiri, persen di ujung kanan.
  const phrases = phrasesOf(words).filter((p) => parsePercent(p.text) == null)
  const pcts = words.flatMap((w) => {
    const v = parsePercent(w.text)
    return v == null ? [] : [{ v, w }]
  })
  const labelOf = (w: OcrWord) =>
    // Label ada di ujung kiri baris; batang di tengah sering terbaca sebagai huruf liar ("om", "EEE"), jadi ambil yang paling kiri.
    phrases.filter((p) => Math.abs(yc(p) - yc(w)) <= h(w) * 0.6 && p.x1 <= w.x0 + 2).sort((a, b) => a.x0 - b.x0)[0]

  const gender: AudiencePatch['gender'] = {}
  const age: AudiencePatch['age'] = {}
  const rows: { name: string; pct: number; y: number }[] = []
  let share: { v: number; y: number } | undefined
  for (const { v, w } of [...pcts].sort((a, b) => yc(a.w) - yc(b.w))) {
    const label = labelOf(w)
    if (!label) continue
    const text = label.text.replace(/^[^\p{L}\p{N}+]+/u, '').trim()
    const g = GENDER[norm(text)]
    const band = ageOf(text)
    if (g) gender[g] ??= v
    else if (band) age[band] ??= v
    else if (/^(proporsi|proportion)/i.test(text)) share ??= { v, y: yc(w) }
    else if (/\p{L}{2,}/u.test(text) && !/(tahun|years?)$/i.test(text)) rows.push({ name: text, pct: v, y: yc(w) })
  }
  // Kata kunci hanya dari layar Penelusuran (ada baris "Proporsi" atau tulisan "Penelusuran"), di bawah baris Proporsi.
  // Barisnya dikenali dari tulisan "Proporsi…" walau angkanya tak terbaca; kata kunci selalu di bawahnya.
  const proporsi = phrases.find((p) => /^(proporsi|proportion)/i.test(p.text))
  const anchorY = share?.y ?? (proporsi ? yc(proporsi) : undefined)
  const isSearch = anchorY != null || words.some((w) => ['penelusuran', 'search'].includes(norm(w.text)))
  const terms: LocationRow[] = isSearch
    ? rows.filter((r) => anchorY == null || r.y > anchorY).sort((a, b) => a.y - b.y).slice(0, 10).map(({ name, pct }) => ({ name, pct }))
    : []

  const hasAud = Object.keys(gender).length > 0 || Object.keys(age).length > 0 || share != null || terms.length > 0
  const audience: AudiencePatch | null = hasAud
    ? { gender, age, cities: [], ...(share ? { search_share: share.v } : {}), ...(terms.length ? { search_terms: terms } : {}) }
    : null
  return { found, unreadable, period: null, notes: [], info: notes, audience }
}
