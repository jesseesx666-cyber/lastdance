import { describe, expect, it } from 'vitest'
import { parseRankRows } from './rank'
import type { OcrWord } from './parse'

const w = (text: string, x0: number, y0: number): OcrWord => ({ text, x0, x1: x0 + text.length * 8, y0, y1: y0 + 16 })

describe('parseRankRows', () => {
  it('membaca nama + jumlah, membuang judul, kepala kolom, dan ikon', () => {
    const words = [
      w('Top', 10, 0), w('Pages', 50, 0),
      w('Page', 10, 40), w('Views', 300, 40), w('↓', 360, 40),
      w('Tautan', 10, 90), w('Resmi', 70, 90), w('Q', 130, 90), w('203', 300, 90),
      w('Kosasih', 10, 140), w('Medika', 80, 140), w('156', 300, 140),
      w('Kosasih', 10, 190), w('Medika', 80, 190), w('Rajabasa', 150, 190), w('53', 300, 190),
    ]
    expect(parseRankRows(words)).toEqual([
      { name: 'Tautan Resmi', count: 203 },
      { name: 'Kosasih Medika', count: 156 },
      { name: 'Kosasih Medika Rajabasa', count: 53 },
    ])
  })
  it('angka ribuan dan urutan kata acak', () => {
    expect(parseRankRows([w('1.234', 300, 10), w('google.com', 10, 10)])).toEqual([{ name: 'google.com', count: 1234 }])
  })
})
