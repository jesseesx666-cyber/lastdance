import { describe, expect, it } from 'vitest'
import type { OcrWord } from './parse'
import { parseTikTok, parseTikTokValue } from './tiktok'

/** Kata sintetis setinggi 30px; lebar sebanding panjang teks. */
const w = (text: string, x: number, y: number): OcrWord => ({ text, x0: x, y0: y, x1: x + text.length * 16, y1: y + 30 })

// Susunan kartu seperti screenshot TikTok: dua kolom (x=20 dan x=300), label, angka besar, lalu baris selisih.
const metricCards: OcrWord[] = [
  w('21', 20, 0), w('Okt', 50, 0), w('-', 100, 0), w('27', 120, 0), w('Okt', 150, 0),
  w('Tayangan', 20, 60), w('postingan', 150, 60), w('33,8', 20, 100), w('rb', 90, 100), w('-6,7', 40, 150), w('rb', 110, 150), w('(-16.5%)', 150, 150),
  w('Tampilan', 300, 60), w('Profil', 420, 60), w('500', 300, 100), w('+65', 320, 150), w('(+14.9%)', 380, 150),
  w('Suka', 20, 210), w('808', 20, 250), w('+169', 40, 300), w('(+26.4%)', 110, 300),
  w('Komentar', 300, 210), w('35', 300, 250), w('+8', 320, 300), w('(+29.6%)', 370, 300),
  w('Bagikan', 20, 360), w('60', 20, 400), w('-58', 40, 450), w('(-49.2%)', 100, 450),
  w('Perkiraan', 300, 360), w('reward', 460, 360), w('$0.00', 300, 400), w('+$0.00', 320, 450),
]
const followerCards = (net: string): OcrWord[] => [
  w('Jumlah', 20, 520), w('pengikut', 120, 520), w('2,773', 20, 560), w('Sepanjang', 20, 610), w('waktu', 150, 610),
  w('Pengikut', 300, 520), w('neto', 420, 520), w(net, 300, 560), w('+6', 320, 610), w('(+33.3%)', 360, 610),
]

describe('OCR TikTok', () => {
  const r = parseTikTok([...metricCards, ...followerCards('24')])
  const val = (k: string) => r.found.find((d) => d.key === k)?.value

  it('membaca semua label: Metrik utama, Pengikut neto, dan Jumlah pengikut', () => {
    expect(val('views')).toBe(33800) // "33,8 rb" = singkatan, dibulatkan
    expect(val('profile_visits')).toBe(500)
    expect(val('likes')).toBe(808)
    expect(val('comments')).toBe(35)
    expect(val('shares')).toBe(60)
    expect(val('reward')).toBe(0)
    expect(val('followers')).toBe(2773) // koma ribuan gaya Inggris
    expect(val('net_followers')).toBe(24)
    expect(r.found).toHaveLength(8)
    expect(r.unreadable).toEqual([])
  })
  it('baris selisih (+65, -6,7 rb, +$0.00) tidak dianggap angka kartu', () => {
    expect(r.found.some((d) => d.value === 65 || d.value === 6700 || d.value === 169)).toBe(false)
  })
  it('singkatan diberi catatan perkiraan', () => {
    expect(r.info.some((n) => n.includes('singkatan') && n.includes('33,8rb'))).toBe(true)
  })
  it('periode "21 Okt - 27 Okt" terbaca', () => {
    expect(r.period).toEqual({ from: { m: 10, d: 21 }, to: { m: 10, d: 27 } })
  })
  it('pengikut neto negatif terbaca negatif; metrik lain yang negatif ditolak', () => {
    expect(parseTikTok([...metricCards, ...followerCards('-5')]).found.find((d) => d.key === 'net_followers')?.value).toBe(-5)
    expect(parseTikTokValue('-5', 'likes')).toBeNull()
  })
  it('nilai: juta, uang, dan angka polos', () => {
    expect(parseTikTokValue('1,2jt', 'views')).toEqual({ value: 1200000, approx: true })
    expect(parseTikTokValue('$12.50', 'reward')).toEqual({ value: 12.5, approx: false })
    expect(parseTikTokValue('S0.00', 'reward')).toEqual({ value: 0, approx: false }) // "$" sering terbaca "S"
    expect(parseTikTokValue('1,234', 'likes')).toEqual({ value: 1234, approx: false })
  })
})

describe('pembacaan longgar (non-Instagram)', () => {
  const youtube: OcrWord[] = [
    w('Penayangan', 20, 100), w('90,6', 400, 100), w('rb', 470, 100),
    w('Waktu', 20, 160), w('tonton', 130, 160), w('(jam)', 250, 160), w('400,1', 400, 160),
  ]
  it('desimal dan singkatan langsung diisi, tanpa peringatan "tidak bisa dipastikan"', async () => {
    const { parseInsights } = await import('./parse')
    const r = parseInsights(youtube, true)
    expect(r.found).toContainEqual({ key: 'watch_hours', value: 400.1, raw: '400,1' })
    expect(r.found.find((d) => d.key === 'views')?.value).toBe(90600)
    expect(r.unreadable).toEqual([])
  })
  it('Instagram tetap ketat: desimal ditolak', async () => {
    const { parseInsights } = await import('./parse')
    expect(parseInsights(youtube).unreadable.map((u) => u.key)).toContain('watch_hours')
  })
  it('parseDecimal: koma/titik desimal dan pemisah ribuan', async () => {
    const { parseDecimal } = await import('./parse')
    expect([parseDecimal('400,1'), parseDecimal('400.1'), parseDecimal('1.234,5'), parseDecimal('1,234.5'), parseDecimal('1,234'), parseDecimal('12')]).toEqual([400.1, 400.1, 1234.5, 1234.5, 1234, 12])
  })
})

describe('OCR TikTok berbahasa Inggris', () => {
  const r = parseTikTok([
    w('Oct', 20, 0), w('21', 70, 0), w('-', 110, 0), w('Oct', 130, 0), w('27', 180, 0),
    w('Video', 20, 60), w('views', 110, 60), w('33.8K', 20, 100),
    w('Profile', 300, 60), w('views', 410, 60), w('500', 300, 100),
    w('Likes', 20, 210), w('808', 20, 250),
    w('Net', 300, 360), w('followers', 350, 360), w('24', 300, 400),
  ])
  const val = (k: string) => r.found.find((d) => d.key === k)?.value
  it('membaca label Inggris dan periode bulan-dulu', () => {
    expect([val('views'), val('profile_visits'), val('likes'), val('net_followers')]).toEqual([33800, 500, 808, 24])
    expect(r.period).toEqual({ from: { m: 10, d: 21 }, to: { m: 10, d: 27 } })
  })
})
