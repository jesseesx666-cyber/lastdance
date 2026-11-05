import { DEF, type MetricKey } from '../../shared/metrics'
import { findLabels, findPeriod, h, mergeNumbers, parseLoose, type Detection, type OcrWord, type Parsed } from './parse'

/**
 * Pembaca khusus screenshot TikTok (bahasa Indonesia atau Inggris): kartu "Metrik utama" (label di atas, angka besar tepat di
 * bawahnya, lalu baris selisih) dan kartu "Jumlah pengikut" / "Pengikut neto".
 */
const LABELS = (
  [
    ['views', ['tayangan', 'postingan']], ['views', ['tayangan']],
    ['profile_visits', ['tampilan', 'profil']],
    ['likes', ['suka']], ['comments', ['komentar']], ['shares', ['bagikan']],
    ['reward', ['perkiraan', 'reward']],
    ['net_followers', ['pengikut', 'neto']], ['followers', ['jumlah', 'pengikut']],
    // Tampilan bahasa Inggris
    ['views', ['video', 'views']], ['profile_visits', ['profile', 'views']],
    ['likes', ['likes']], ['comments', ['comments']], ['shares', ['shares']],
    ['reward', ['estimated', 'rewards']], ['reward', ['estimated', 'reward']],
    ['net_followers', ['net', 'followers']], ['followers', ['total', 'followers']],
  ] as [MetricKey, string[]][]
).sort((a, b) => b[1].length - a[1].length) // label terpanjang dicoba lebih dulu

export const parseTikTokValue = parseLoose

/** Angka tepat di bawah label (kartu): baris pertama di bawah label dengan tepi kiri sejajar. */
function below(label: OcrWord, nums: OcrWord[]) {
  const H = h(label)
  return nums
    .filter((c) => c.y0 >= label.y1 - H * 0.2 && c.y0 - label.y1 <= H * 4 && Math.abs(c.x0 - label.x0) <= Math.max(H * 0.8, (label.x1 - label.x0) * 0.5))
    .sort((a, b) => a.y0 - b.y0)[0]
}

export function parseTikTok(words: OcrWord[]): Parsed {
  const nums = mergeNumbers(words)
  const found: Detection[] = []
  const unreadable: Parsed['unreadable'] = []
  const notes: string[] = []
  const seen = new Set<MetricKey>()
  for (const { key, box } of findLabels(words, LABELS)) {
    if (seen.has(key)) continue
    const cell = below(box, nums)
    if (!cell) continue
    seen.add(key)
    const v = parseTikTokValue(cell.text, key)
    if (!v) unreadable.push({ key, raw: cell.text })
    else {
      found.push({ key, value: v.value, raw: cell.text })
      if (v.approx) notes.push(`${DEF[key].label} dibaca dari angka singkatan “${cell.text}” (≈ ${v.value.toLocaleString('id-ID')}): TikTok membulatkannya, jadi sesuaikan dengan angka sebenarnya bila perlu.`)
    }
  }
  return { found, unreadable, period: findPeriod(words), notes: [], info: notes, audience: null }
}
