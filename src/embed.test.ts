import { describe, expect, it } from 'vitest'
import { igEmbed } from './embed'

describe('igEmbed', () => {
  it('reel, post, dan tv menjadi alamat embed', () => {
    expect(igEmbed('https://www.instagram.com/reel/Cabc_123-x/')).toBe('https://www.instagram.com/reel/Cabc_123-x/embed')
    expect(igEmbed('https://instagram.com/p/XyZ9/?igsh=tracking')).toBe('https://www.instagram.com/p/XyZ9/embed')
    expect(igEmbed('https://www.instagram.com/tv/AB12/')).toBe('https://www.instagram.com/tv/AB12/embed')
  })
  it('link dengan nama akun di depan dan /reels/ dinormalkan', () => {
    expect(igEmbed('https://www.instagram.com/namaakun/reel/Q1w2/')).toBe('https://www.instagram.com/reel/Q1w2/embed')
    expect(igEmbed('https://www.instagram.com/reels/Q1w2/')).toBe('https://www.instagram.com/reel/Q1w2/embed')
  })
  it('bukan link post Instagram: tidak ada embed', () => {
    expect(igEmbed('https://www.tiktok.com/@a/video/123')).toBeNull()
    expect(igEmbed('https://www.instagram.com/namaakun/')).toBeNull()
  })
  it('hasil selalu di host instagram.com', () => {
    expect(igEmbed('https://evil.example/?u=instagram.com/p/abc')).toBe('https://www.instagram.com/p/abc/embed')
  })
})
