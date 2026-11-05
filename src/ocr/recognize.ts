import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { OcrWord } from './parse'

// Semua aset OCR dilayani dari /ocr (folder public): tanpa internet, gambar tidak keluar dari komputer.
let worker: Promise<Worker> | undefined
const getWorker = () =>
  (worker ??= createWorker('eng', 1, { workerPath: '/ocr/worker.min.js', corePath: '/ocr', langPath: '/ocr', gzip: true })
    .then(async (w) => {
      await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT }) // teks tersebar: kartu angka, bukan paragraf
      return w
    })
    .catch((e) => {
      worker = undefined
      throw e
    }))

export async function stopOcr() {
  const w = worker
  worker = undefined
  await (await w?.catch(() => undefined))?.terminate()
}

/** Tesseract gagal pada screenshot kecil bergaya gelap; diperbesar dan kontrasnya diregangkan, bacaannya tepat. */
async function prepare(file: Blob, invertDark: boolean): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(4, Math.max(1, 3000 / bmp.width), Math.sqrt(9e6 / (bmp.width * bmp.height)))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(bmp.width * scale))
  c.height = Math.max(1, Math.round(bmp.height * scale))
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  const img = ctx.getImageData(0, 0, c.width, c.height)
  const d = img.data
  let lo = 255
  let hi = 0
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
    d[i] = d[i + 1] = d[i + 2] = g
    if (g < lo) lo = g
    if (g > hi) hi = g
  }
  // Tema gelap (YouTube Studio): teks terang di latar gelap dibalik menjadi teks gelap di latar terang, yang jauh lebih akurat dibaca.
  let sum = 0
  for (let i = 0; i < d.length; i += 4) sum += d[i]
  const flip = invertDark && sum / (d.length / 4) < 110
  const k = hi > lo ? 255 / (hi - lo) : 1
  for (let i = 0; i < d.length; i += 4) {
    const v = (d[i] - lo) * k
    d[i] = d[i + 1] = d[i + 2] = flip ? 255 - v : v
  }
  ctx.putImageData(img, 0, 0)
  return c
}

const toWords = (data: Awaited<ReturnType<Worker['recognize']>>['data'], dx = 0, dy = 0, k = 1): OcrWord[] =>
  (data.blocks ?? [])
    .flatMap((b) => b.paragraphs.flatMap((p) => p.lines.flatMap((l) => l.words)))
    .map((x) => ({ text: x.text, x0: dx + x.bbox.x0 / k, y0: dy + x.bbox.y0 / k, x1: dx + x.bbox.x1 / k, y1: dy + x.bbox.y1 / k, conf: x.confidence }))

/**
 * Angka besar sering salah baca (mis. "85,6 rb" menjadi "856": koma hilang pada skala besar). Kotak angka yang keyakinannya
 * rendah dipotong lalu dibaca ulang sebagai satu baris pada beberapa skala; hasil dengan keyakinan tertinggi dipakai.
 */
async function refineNumbers(w: Worker, canvas: HTMLCanvasElement, words: OcrWord[]): Promise<OcrWord[]> {
  // Persen yang bentuknya sudah sah (0–100 dengan pemisah desimal) dibiarkan; persen janggal ("459%" = 45,9% tanpa koma) dibaca ulang.
  const okPct = (t: string) => /^\d{1,3}([.,]\d{1,2})?%$/.test(t) && parseFloat(t.replace(',', '.')) <= 100
  const weak = words.filter((x) => /\d/.test(x.text) && (x.text.endsWith('%') ? !okPct(x.text) : (x.conf ?? 100) < 80))
  if (!weak.length) return words
  await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE })
  const out = words.filter((x) => !weak.includes(x))
  try {
    for (const x of weak) {
      const H = x.y1 - x.y0
      const pad = Math.round(H * 0.25)
      const sx = Math.max(0, x.x0 - pad)
      const sy = Math.max(0, x.y0 - pad)
      const sh = Math.min(canvas.height - sy, H + 2 * pad)
      let best: { words: OcrWord[]; conf: number } | null = null
      // Kotak sering ikut memuat ikon di kanan angka (panah/lingkaran): coba juga tanpa bagian kanan itu.
      for (const [trim, target] of [0, 0.8, 0.95, 1.1].flatMap((t) => [26, 34, 44].map((g) => [t, g] as const))) {
        const sw = Math.max(1, Math.min(canvas.width - sx, x.x1 - x.x0 + 2 * pad - Math.round(H * trim)))
        const k = Math.min(2, Math.max(0.2, target / H))
        const c = document.createElement('canvas')
        c.width = Math.max(1, Math.round(sw * k))
        c.height = Math.max(1, Math.round(sh * k))
        const ctx = c.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, c.width, c.height)
        const { data } = await w.recognize(c, {}, { blocks: true })
        const re = toWords(data, sx, sy, k).filter((r) => /\d|^(rb|ib|lb|jt|k|m)$/i.test(r.text)) // angka dan singkatannya (rb/jt)
        // Angka yang masih memuat singkatan (rb/jt) lebih utuh daripada yang terpotong; beri bonus agar "85,6 rb" tidak kalah dari "85,6".
        const score = data.confidence + (/[\d.,]\s*(rb|ib|lb|jt|k|m)$/i.test(re.map((r) => r.text).join(' ')) ? 25 : 0)
        const pctOk = !x.text.endsWith('%') || re.some((r) => okPct(r.text)) // persen harus tetap persen yang sah
        if (re.length && pctOk && (!best || score > best.conf)) best = { words: re, conf: score }
      }
      out.push(...(best && (x.text.endsWith('%') || best.conf > (x.conf ?? 0)) ? best.words : [x]))
    }
  } finally {
    await w.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: PSM.SPARSE_TEXT })
  }
  return out
}

export async function readWords(file: Blob, invertDark = false, refine = false): Promise<OcrWord[]> {
  const w = await getWorker()
  const canvas = await prepare(file, invertDark)
  const { data } = await w.recognize(canvas, {}, { blocks: true })
  const words = toWords(data)
  return refine ? refineNumbers(w, canvas, words) : words
}
