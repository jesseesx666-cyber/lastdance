import type { WebRow } from '../../shared/website'
import { h, parseCount, yc, type OcrWord } from './parse'

/**
 * Tabel peringkat dari screenshot (Top Pages / Top Referrer / Top Article): satu baris = nama di kiri, jumlah di kanan.
 * Baris tanpa angka di ujung kanan (judul tabel, kepala kolom) dibuang; ikon kaca pembesar di ujung nama (terbaca "Q") ikut dibuang.
 */
export function parseRankRows(words: OcrWord[]): WebRow[] {
  const sorted = [...words].filter((w) => w.text.trim()).sort((a, b) => yc(a) - yc(b))
  const lines: OcrWord[][] = []
  for (const w of sorted) {
    const line = lines.find((l) => Math.abs(yc(l[0]) - yc(w)) < h(w) * 0.6)
    if (line) line.push(w)
    else lines.push([w])
  }
  const out: WebRow[] = []
  for (const line of lines) {
    line.sort((a, b) => a.x0 - b.x0)
    const last = line[line.length - 1]
    const count = parseCount(last.text)
    if (count === null) continue
    const name = line.slice(0, -1)
    // Ikon di ujung nama: simbol saja, atau satu-dua huruf kecil-besar sisa ikon (Q, Qo, ©).
    while (name.length > 1 && (!/[\p{L}\p{N}]/u.test(name[name.length - 1].text) || /^[A-Za-z]{1,2}$/.test(name[name.length - 1].text) && name[name.length - 1].x0 - name[name.length - 2].x1 > h(name[name.length - 1]) * 0.3)) name.pop()
    const text = name.map((w) => w.text).join(' ').replace(/[|©®]+$/, '').trim()
    if (text) out.push({ name: text, count })
  }
  return out
}
