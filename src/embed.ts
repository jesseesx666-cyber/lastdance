/** Alamat embed resmi Instagram untuk post/reel publik; null untuk link lain. */
export const igEmbed = (url: string) => {
  const m = /instagram\.com\/(?:[^/?#]+\/)?(p|reels?|tv)\/([\w-]+)/i.exec(url)
  if (!m) return null
  const kind = m[1].toLowerCase().startsWith('reel') ? 'reel' : m[1].toLowerCase()
  return `https://www.instagram.com/${kind}/${m[2]}/embed`
}
