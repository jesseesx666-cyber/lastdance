import { describe, expect, it } from 'vitest'
import adsBrowser from './fixtures/ads-table-browser.json'
import audAge from './fixtures/audience-age.json'
import audGender from './fixtures/audience-gender.json'
import audPlaces from './fixtures/audience-locations.json'
import ads from './fixtures/ads-table.json'
import fixture from './fixtures/insights-views.json'
import { parseCount, parseInsights, parseMoney, parsePercent, periodMatches, type OcrWord } from './parse'

/** Susun kata sintetis: tiap kata 40px tinggi, lebar sebanding panjang teks. */
const w = (text: string, x: number, y: number): OcrWord => ({ text, x0: x, y0: y, x1: x + text.length * 22, y1: y + 40 })

describe('screenshot Insights asli (hasil OCR gambar pengguna)', () => {
  const r = parseInsights(fixture.words)
  it('membaca Views = 62199 dari kartu "Views"', () => {
    expect(r.found).toContainEqual({ key: 'views', value: 62199, raw: '62,199' })
  })
  it('membaca 3.7% followers dan 96.3% non-followers (angka di kiri label)', () => {
    expect(r.found).toContainEqual({ key: 'views_followers_pct', value: 3.7, raw: '3.7%' })
    expect(r.found).toContainEqual({ key: 'views_nonfollowers_pct', value: 96.3, raw: '96.3%' })
    expect(r.found).toHaveLength(3)
  })
  it('kartu Views bukan layar Audience: 3.7% followers tidak dibaca sebagai lokasi', () => {
    expect(r.audience).toBeNull()
  })
  it('tidak memetakan "Net followers +50" ke metrik apa pun', () => {
    expect(r.found.some((d) => d.value === 50)).toBe(false)
    expect(r.notes).toEqual([])
    expect(r.unreadable).toEqual([])
  })
  it('mendeteksi periode Oct 22 sampai Oct 28 dari sumbu grafik', () => {
    expect(r.period).toEqual({ from: { m: 10, d: 22 }, to: { m: 10, d: 28 } })
    expect(periodMatches(r.period!, '2026-10-22', '2026-10-28')).toBe(true)
    expect(periodMatches(r.period!, '2026-10-15', '2026-10-21')).toBe(false)
  })
})

describe('tata letak lain', () => {
  it('tabel: angka di kanan label pada baris yang sama', () => {
    const r = parseInsights([w('Reach', 0, 0), w('23,716', 600, 0), w('Interactions', 0, 80), w('896', 600, 80)])
    expect(r.found).toEqual([
      { key: 'reach', value: 23716, raw: '23,716' },
      { key: 'interactions', value: 896, raw: '896' },
    ])
  })
  it('label dua/tiga kata dan uang Rupiah (Ads Manager)', () => {
    const r = parseInsights([
      w('Amount', 0, 0), w('spent', 160, 0), w('Rp686.059', 0, 60),
      w('Cost', 500, 0), w('per', 600, 0), w('result', 680, 0), w('Rp29.828', 500, 60),
      w('Profile', 0, 200), w('visits', 170, 200), w('315', 0, 260),
    ])
    expect(r.found).toEqual(expect.arrayContaining([
      { key: 'amount_spent', value: 686059, raw: 'Rp686.059' },
      { key: 'cost_per_result', value: 29828, raw: 'Rp29.828' },
      { key: 'profile_visits', value: 315, raw: '315' },
    ]))
  })
  it('singkatan (13K) tidak ditebak, dilaporkan sebagai tidak terbaca', () => {
    const r = parseInsights([w('Views', 0, 0), w('13K', 0, 60)])
    expect(r.found).toEqual([])
    expect(r.unreadable).toEqual([{ key: 'views', raw: '13K' }])
  })
  it('label Indonesia', () => {
    expect(parseInsights([w('Jangkauan', 0, 0), w('1.234', 0, 60)]).found).toEqual([{ key: 'reach', value: 1234, raw: '1.234' }])
  })
  it('label tanpa angka di dekatnya diabaikan', () => {
    expect(parseInsights([w('Views', 0, 0), w('62,199', 900, 400)]).found).toEqual([])
  })
})

describe('tabel Meta Ads berbahasa Indonesia (screenshot asli): hanya baris total', () => {
  const r = parseInsights(ads.words)
  const get = (k: string) => r.found.find((d) => d.key === k)?.value
  it('membaca baris paling bawah (Total): Hasil, Biaya per hasil, Jumlah yang dibelanjakan, Impresi, Jangkauan', () => {
    expect(get('lead')).toBe(3)
    expect(get('cost_per_result')).toBe(19509)
    expect(get('amount_spent')).toBe(58527)
    expect(get('impressions')).toBe(3446)
    expect(get('reach')).toBe(2714)
  })
  it('tidak memakai baris kampanye di atasnya (22.981 / 35.546 / 1.600 / 1.846)', () => {
    const nilai = r.found.map((d) => d.value)
    for (const bukan of [22981, 35546, 1600, 1846, 1478, 1601]) expect(nilai).not.toContain(bukan)
  })
  it('Anggaran kosong di baris total: tidak diisi, dan dijelaskan', () => {
    expect(get('budget')).toBeUndefined()
    expect(r.info[0]).toMatch(/baris paling bawah/)
    expect(r.unreadable).toEqual([])
  })
})

describe('tabel Meta Ads: hasil OCR di browser (judul 2 baris tidak terbaca)', () => {
  const r = parseInsights(adsBrowser.words)
  const get = (k: string) => r.found.find((d) => d.key === k)?.value
  it('tetap membaca kelima kolom baris total', () => {
    expect([get('lead'), get('cost_per_result'), get('amount_spent'), get('impressions'), get('reach')]).toEqual([3, 19509, 58527, 3446, 2714])
  })
  it('kolom di sebelah Anggaran tidak salah masuk ke Budget', () => {
    expect(get('budget')).toBeUndefined()
  })
  it('memberi catatan bahwa dua kolom dibaca dari urutan standar', () => {
    expect(r.notes.join(' ')).toMatch(/Cost per result dan Amount spent tidak terbaca/)
    expect(r.notes.join(' ')).toMatch(/urutan kolom standar/)
  })
})

describe('label Indonesia, varian bio link, dan salah baca OCR', () => {
  it('"mpresi" (salah baca "Impresi") tetap dikenali', () => {
    expect(parseInsights([w('mpresi', 0, 0), w('3.446', 0, 60)]).found).toEqual([{ key: 'impressions', value: 3446, raw: '3.446' }])
  })
  it('bio tap link / bio link taps = External link taps', () => {
    expect(parseInsights([w('Bio', 0, 0), w('tap', 70, 0), w('link', 150, 0), w('72', 0, 60)]).found).toEqual([{ key: 'external_link_taps', value: 72, raw: '72' }])
    expect(parseInsights([w('Bio', 0, 0), w('link', 70, 0), w('taps', 150, 0), w('72', 0, 60)]).found).toEqual([{ key: 'external_link_taps', value: 72, raw: '72' }])
  })
  it('Biaya per hasil dan Jumlah yang dibelanjakan di luar tabel (kartu biasa)', () => {
    const r = parseInsights([w('Biaya', 0, 0), w('per', 120, 0), w('hasil', 200, 0), w('Rp19.509', 0, 60), w('Jumlah', 600, 0), w('yang', 740, 0), w('dibelanjakan', 830, 0), w('Rp58.527', 600, 60)])
    expect(r.found).toEqual(expect.arrayContaining([
      { key: 'cost_per_result', value: 19509, raw: 'Rp19.509' },
      { key: 'amount_spent', value: 58527, raw: 'Rp58.527' },
    ]))
  })
  it('kata "Hasil" di baris kedua header "Biaya per" bukan kolom Hasil', () => {
    const r = parseInsights([w('Biaya', 0, 0), w('per', 120, 0), w('hasil', 0, 50), w('Rp19.509', 0, 110)])
    expect(r.found.map((d) => d.key)).toEqual(['cost_per_result'])
  })
})

describe('Audience (screenshot asli): Gender, Age range, Top locations', () => {
  it('Gender: Women 78.5% dan Men 21.5% (persen di baris bar, label di atasnya)', () => {
    const r = parseInsights(audGender.words)
    expect(r.audience).toEqual({ gender: { women: 78.5, men: 21.5 }, age: {}, cities: [] })
    expect(r.notes).toEqual([])
    expect(r.found).toEqual([]) // bukan metrik laporan
  })
  it('Age range: ketujuh pita terbaca, dan angka yang diragukan ditandai', () => {
    const r = parseInsights(audAge.words)
    const a = r.audience!.age
    expect([a['13-17'], a['25-34'], a['35-44'], a['45-54'], a['55-64'], a['65+']]).toEqual([0.5, 32.6, 33.6, 14.1, 6.9, 0.9])
    // OCR membaca 11.3% sebagai 1.3%: harus ketahuan lewat keyakinan rendah dan total yang tidak mendekati 100%.
    expect(r.notes.join(' ')).toMatch(/Kurang yakin dibaca: Age range 18-24/)
    expect(r.notes.join(' ')).toMatch(/Total Age range 89.9%/)
    expect(r.audience!.gender).toEqual({}) // legenda Women/Men tidak ikut terbaca sebagai gender
  })
  it('Top locations: lima baris sebagai kota, nama yang tidak terbaca dikosongkan (bukan ditebak)', () => {
    const r = parseInsights(audPlaces.words)
    expect(r.audience!.cities).toEqual([
      { name: 'Bandar Lampung', pct: 47.5 }, { name: 'Jakarta', pct: 6.1 }, { name: 'Balikpapan', pct: 2.5 },
      { name: '', pct: 2.1 }, { name: 'Natar', pct: 1.3 },
    ])
    expect(r.notes.join(' ')).toMatch(/nama lokasi untuk 2.1% tidak terbaca/)
    expect(r.info.join(' ')).not.toMatch(/negara/i) // lokasi selalu kota, tanpa pilihan negara
  })
})

describe('Audience (data tiruan)', () => {
  const list = (names: string[]) => names.flatMap((n, i) => [w(n, 0, i * 160), w(`${10 + i}.5%`, 900, i * 160 + 70)])
  it('semua daftar lokasi dibaca sebagai kota (tanpa pilihan negara)', () => {
    const r = parseInsights(list(['Indonesia', 'Malaysia', 'Singapore']))
    expect(r.audience!.cities.map((c) => c.name)).toEqual(['Indonesia', 'Malaysia', 'Singapore'])
    expect(r.audience).not.toHaveProperty('countries')
  })
  it('satu baris lokasi saja tidak dianggap daftar lokasi', () => {
    expect(parseInsights(list(['Jakarta'])).audience).toBeNull()
  })
  it('label Indonesia: Perempuan dan Laki-laki', () => {
    const r = parseInsights([w('Perempuan', 0, 0), w('60%', 900, 70), w('Laki-laki', 0, 160), w('40%', 900, 230)])
    expect(r.audience!.gender).toEqual({ women: 60, men: 40 })
  })
  it('persen tanpa label di dekatnya diabaikan', () => {
    expect(parseInsights([w('12.5%', 900, 400)]).audience).toBeNull()
  })
})

describe('persentase tipe konten (Reels / Post / Story)', () => {
  const block = (heading: string, y: number, vals: [string, string, string]) => [
    w(heading, 0, y), w('By', 0, y + 80), w('content', 70, y + 80), w('type', 230, y + 80),
    w('Reels', 0, y + 160), w(vals[0], 600, y + 160),
    w('Posts', 0, y + 220), w(vals[1], 600, y + 220),
    w('Stories', 0, y + 280), w(vals[2], 600, y + 280),
  ]
  it('di bawah judul Views dipetakan ke Viewers', () => {
    const r = parseInsights(block('Views', 0, ['85.2%', '10.1%', '4.7%']))
    expect(r.found).toEqual(expect.arrayContaining([
      { key: 'viewers_reels_pct', value: 85.2, raw: '85.2%' },
      { key: 'viewers_post_pct', value: 10.1, raw: '10.1%' },
      { key: 'viewers_story_pct', value: 4.7, raw: '4.7%' },
    ]))
  })
  it('dua blok dalam satu gambar: Viewers dan Interaksi tidak tertukar', () => {
    const r = parseInsights([...block('Views', 0, ['70%', '20%', '10%']), ...block('Interactions', 500, ['60%', '30%', '10%'])])
    const get = (k: string) => r.found.find((d) => d.key === k)?.value
    expect([get('viewers_reels_pct'), get('viewers_post_pct'), get('viewers_story_pct')]).toEqual([70, 20, 10])
    expect([get('interactions_reels_pct'), get('interactions_post_pct'), get('interactions_story_pct')]).toEqual([60, 30, 10])
  })
  it('angka di kiri label juga terbaca (85% Reels)', () => {
    const r = parseInsights([w('Views', 0, 0), w('By', 0, 80), w('content', 70, 80), w('type', 230, 80), w('85%', 0, 160), w('Reels', 90, 160)])
    expect(r.found).toContainEqual({ key: 'viewers_reels_pct', value: 85, raw: '85%' })
  })
  it('tanpa judul pemilik: tidak ditebak, diberi catatan', () => {
    const r = parseInsights([w('By', 0, 80), w('content', 70, 80), w('type', 230, 80), w('Reels', 0, 160), w('85%', 600, 160)])
    expect(r.found.filter((d) => d.key.endsWith('_pct'))).toEqual([])
    expect(r.notes[0]).toMatch(/tidak jelas milik/)
  })
  it('followers di bawah judul Interactions tidak dimasukkan ke Views', () => {
    const r = parseInsights([w('Interactions', 0, 0), w('12%', 0, 80), w('followers', 90, 80)])
    expect(r.found).toEqual([])
  })
})

describe('parseCount / parseMoney / parsePercent', () => {
  it('persen 0–100', () => {
    expect([parsePercent('3.7%'), parsePercent('85,2%'), parsePercent('100%')]).toEqual([3.7, 85.2, 100])
    expect([parsePercent('120%'), parsePercent('85'), parsePercent('abc%')]).toEqual([null, null, null])
  })
  it('bilangan bulat', () => {
    expect([parseCount('62,199'), parseCount('62.199'), parseCount('896'), parseCount('+50')]).toEqual([62199, 62199, 896, 50])
    expect([parseCount('3.7'), parseCount('13K'), parseCount('1,5')]).toEqual([null, null, null])
  })
  it('uang format Indonesia dan Inggris', () => {
    expect([parseMoney('Rp686.059'), parseMoney('686.059,50'), parseMoney('1,234.50'), parseMoney('50000')]).toEqual([686059, 686059.5, 1234.5, 50000])
  })
})
