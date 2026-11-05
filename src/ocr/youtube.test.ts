import { describe, expect, it } from 'vitest'
import type { OcrWord } from './parse'
import { parseYouTube } from './youtube'

/** Kata sintetis setinggi 30px; lebar sebanding panjang teks. */
const w = (text: string, x: number, y: number): OcrWord => ({ text, x0: x, y0: y, x1: x + text.length * 16, y1: y + 30 })

// "Analisis channel": Subscriber saat ini (angka di bawah), Ringkasan: Penayangan dan Waktu tonton (angka di kanan).
const channel: OcrWord[] = [
  w('Subscriber', 20, 100), w('saat', 190, 100), w('ini', 260, 100), w('20.853', 20, 150), w('+77', 20, 220), w('dalam', 80, 220),
  w('Penayangan', 20, 320), w('90,6', 400, 320), w('rb', 470, 320),
  w('Waktu', 20, 380), w('tonton', 120, 380), w('(jam)', 230, 380), w('407,8', 400, 380),
  w('Penayangan', 20, 500), w('·', 190, 500), w('48', 210, 500), w('jam', 240, 500), // subjudul tanpa angka di barisnya
]

// "Umur dan gender": persen di kanan tiap baris.
const demographics: OcrWord[] = [
  w('Wanita', 20, 100), w('45,3%', 400, 100), w('Pria', 20, 150), w('54,7%', 400, 150),
  w('Ditentukan', 20, 200), w('pengguna', 170, 200), w('0%', 420, 200),
  w('13-17', 20, 280), w('tahun', 110, 280), w('2,1%', 420, 280),
  w('25-34', 20, 330), w('tahun', 110, 330), w('38,5%', 400, 330),
  w('65+', 20, 380), w('tahun', 80, 380), w('0%', 420, 380),
]

// "Penelusuran YouTube": proporsi traffic lalu kata kunci.
const search: OcrWord[] = [
  w('Penelusuran', 20, 20), w('YouTube', 190, 20),
  w('Proporsi', 20, 100), w('dari', 150, 100), w('total', 200, 100), w('traffic', 260, 100), w('Anda:', 340, 100), w('58,3%', 560, 100),
  w('asam', 20, 180), w('urat', 90, 180), w('4,7%', 560, 180),
  w('gejala', 20, 230), w('asam', 110, 230), w('urat', 180, 230), w('3,7%', 560, 230),
  w('ciri2', 20, 280), w('asam', 100, 280), w('urat', 170, 280), w('1,0%', 560, 280),
]

describe('OCR YouTube', () => {
  it('Analisis channel: Subscriber, Penayangan, Waktu tonton (jam)', () => {
    const r = parseYouTube(channel)
    const val = (k: string) => r.found.find((d) => d.key === k)?.value
    expect(val('followers')).toBe(20853)
    expect(val('views')).toBe(90600) // "90,6 rb"
    expect(val('watch_hours')).toBe(407.8)
    expect(r.found).toHaveLength(3) // subjudul "Penayangan · 48 jam" tidak dihitung lagi
    expect(r.unreadable).toEqual([])
    expect(r.info.some((n) => n.includes('singkatan'))).toBe(true)
  })
  it('Umur dan gender: Wanita, Pria, dan kelompok umur', () => {
    const a = parseYouTube(demographics).audience!
    expect(a.gender).toEqual({ women: 45.3, men: 54.7 })
    expect(a.age).toEqual({ '13-17': 2.1, '25-34': 38.5, '65+': 0 })
    expect(a.search_terms).toBeUndefined() // layar ini bukan Penelusuran
  })
  it('Penelusuran YouTube: proporsi traffic dan kata kunci berurutan', () => {
    const a = parseYouTube(search).audience!
    expect(a.search_share).toBe(58.3)
    expect(a.search_terms).toEqual([{ name: 'asam urat', pct: 4.7 }, { name: 'gejala asam urat', pct: 3.7 }, { name: 'ciri2 asam urat', pct: 1 }])
  })
  it('gambar tanpa label dikenal tidak menghasilkan apa pun', () => {
    const r = parseYouTube([w('Halo', 20, 20), w('dunia', 120, 20)])
    expect(r.found).toEqual([])
    expect(r.audience).toBeNull()
  })
})

describe('kartu gelap (screenshot YouTube Studio): label di atas, angka besar di tengah di bawahnya', () => {
  // Koordinat dari hasil OCR screenshot asli; "ib" = "rb" yang salah baca.
  const raw = (text: string, x0: number, y0: number, x1: number, y1: number): OcrWord => ({ text, x0, y0, x1, y1 })
  const card = [
    raw('Penayangan', 435, 168, 694, 212), raw('85,6', 365, 252, 640, 346), raw('ib', 648, 252, 692, 346),
    raw('Waktu', 1540, 168, 1672, 204), raw('tonton', 1685, 172, 1824, 204), raw('(jam)', 1839, 164, 1948, 216), raw('400,1', 1570, 255, 1798, 347),
    raw('25,4', 218, 400, 303, 443), raw('rb', 317, 401, 356, 436), raw('lebih', 372, 400, 467, 436), raw('rendah', 483, 401, 621, 436),
  ]
  it('membaca Penayangan 85,6 rb dan Waktu tonton 400,1', () => {
    const r = parseYouTube(card)
    expect(r.found.find((d) => d.key === 'views')?.value).toBe(85600)
    expect(r.found.find((d) => d.key === 'watch_hours')?.value).toBe(400.1)
    expect(r.unreadable).toEqual([])
  })
})

describe('screenshot YouTube Studio asli: batang terbaca sebagai huruf liar, angka persen janggal', () => {
  const raw = (text: string, x0: number, y0: number, x1: number, y1: number): OcrWord => ({ text, x0, y0, x1, y1 })
  it('Gender: batang "om"/"EEE" di antara label dan persen tidak dianggap label', () => {
    const a = parseYouTube([
      raw('Wanita', 96, 353, 267, 397), raw('om', 1576, 364, 1984, 396), raw('45,9%', 2070, 355, 2216, 404),
      raw('Pria', 99, 513, 193, 557), raw('EEE', 1504, 524, 1984, 556), raw('54,1%', 2073, 515, 2216, 564),
    ]).audience!
    expect(a.gender).toEqual({ women: 45.9, men: 54.1 })
  })
  it('Penelusuran: kata kunci tetap terbaca walau angka proporsi tidak terbaca dan tab "Penelusuran" tidak terlihat', () => {
    const base = [
      raw('Proporsi', 35, 748, 243, 804), raw('dari', 260, 748, 352, 792), raw('total', 368, 748, 480, 792), raw('traffic', 494, 748, 642, 792), raw('Anda:', 656, 748, 799, 792),
      raw('asam', 34, 1023, 169, 1057), raw('urat', 188, 1020, 282, 1057), raw('4,5%', 2102, 1015, 2216, 1064),
      raw('gejala', 33, 1172, 180, 1229), raw('asam', 197, 1183, 332, 1217), raw('urat', 351, 1180, 444, 1217), raw('3,5%', 2103, 1175, 2216, 1224),
    ]
    const withShare = parseYouTube([...base, raw('73,3%', 1934, 752, 2103, 808)]).audience!
    expect(withShare.search_share).toBe(73.3)
    const noShare = parseYouTube([...base, raw('733%', 1934, 752, 2103, 808)]).audience!
    expect(noShare.search_share).toBeUndefined()
    expect(noShare.search_terms).toEqual([{ name: 'asam urat', pct: 4.5 }, { name: 'gejala asam urat', pct: 3.5 }])
  })
  it('Umur: "13-17 tahun" … "65+ tahun" dengan persen titik/koma', () => {
    const rows = [['13-17', '3,6%'], ['18-24', '6,8%'], ['25-34', '37.4%'], ['65+', '1.4%']]
    const words = rows.flatMap(([b, p], i) => [raw(b, 104, 91 + i * 160, 258, 133 + i * 160), raw('tahun', 281, 88 + i * 160, 417, 133 + i * 160), raw(p, 2075, 91 + i * 160, 2220, 140 + i * 160)])
    expect(parseYouTube(words).audience!.age).toEqual({ '13-17': 3.6, '18-24': 6.8, '25-34': 37.4, '65+': 1.4 })
  })
})

describe('subjudul periode', () => {
  const raw = (text: string, x0: number, y0: number, x1: number, y1: number): OcrWord => ({ text, x0, y0, x1, y1 })
  it('"Penayangan · 28 hari terakhir" tidak dibaca sebagai Views = 28', () => {
    const r = parseYouTube([raw('Penayangan', 36, 168, 335, 220), raw('28', 383, 168, 440, 208), raw('hari', 461, 165, 547, 208), raw('terakhir', 566, 165, 752, 208)])
    expect(r.found).toEqual([])
  })
})

describe('OCR YouTube berbahasa Inggris', () => {
  it('membaca Subscribers, Views, Watch time', () => {
    const r = parseYouTube([
      w('Current', 20, 100), w('subscribers', 150, 100), w('20,853', 20, 150),
      w('Views', 20, 320), w('90.6K', 400, 320),
      w('Watch', 20, 380), w('time', 120, 380), w('(hours)', 200, 380), w('407.8', 400, 380),
    ])
    const val = (k: string) => r.found.find((d) => d.key === k)?.value
    expect([val('followers'), val('views'), val('watch_hours')]).toEqual([20853, 90600, 407.8])
  })
  it('membaca gender dan umur berbahasa Inggris', () => {
    const r = parseYouTube([
      w('Female', 20, 100), w('45.3%', 400, 100), w('Male', 20, 150), w('54.7%', 400, 150),
      w('25-34', 20, 330), w('years', 110, 330), w('38.5%', 400, 330),
    ])
    expect(r.audience?.gender).toEqual({ women: 45.3, men: 54.7 })
    expect(r.audience?.age['25-34']).toBe(38.5)
  })
})
