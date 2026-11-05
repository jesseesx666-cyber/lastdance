import { useEffect, useRef, type RefObject } from 'react'

/** Tempel gambar dengan Ctrl+V: hanya untuk panel yang sedang di bawah kursor atau berfokus, supaya beberapa panel di satu halaman tidak saling rebut. */
export function usePasteImages(box: RefObject<HTMLElement | null>, onFiles: (files: File[]) => void, inner = false) {
  const latest = useRef(onFiles)
  latest.current = onFiles
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (e.defaultPrevented) return // sudah ditangani panel yang lebih dalam (kotak OCR, fase capture)
      const el = box.current
      if (!el || !(el.matches(':hover') || el.contains(document.activeElement))) return
      const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
      if (!files.length) return
      e.preventDefault()
      latest.current(files)
    }
    document.addEventListener('paste', onPaste, inner)
    return () => document.removeEventListener('paste', onPaste, inner)
  }, [box, inner])
}
