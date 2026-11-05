/** Perkecil gambar (sisi terpanjang maksimal `max` px) dan simpan sebagai JPEG, supaya sampul tetap ±100 KB. */
export async function shrinkImage(file: Blob, max = 960): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * k))
  c.height = Math.max(1, Math.round(bmp.height * k))
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#fff' // PNG transparan jadi putih, bukan hitam
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses gambar.'))), 'image/jpeg', 0.85))
}
