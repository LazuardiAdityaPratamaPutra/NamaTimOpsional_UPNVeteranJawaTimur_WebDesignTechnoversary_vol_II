import { useEffect, useRef } from 'react'
import { kurangiGerak } from '../../lib/gerak'

/** Angka yang menghitung naik saat muncul / berubah (langsung final bila gerak dihemat). */
export default function Angka({ n, className = '' }) {
  const el = useRef(null)
  useEffect(() => {
    const node = el.current
    if (!node) return undefined
    if (kurangiGerak() || n === 0) { node.textContent = String(n); return undefined }
    let raf = 0
    const mulai = performance.now()
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / 900)
      node.textContent = String(Math.round(n * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(langkah)
    }
    raf = requestAnimationFrame(langkah)
    return () => cancelAnimationFrame(raf)
  }, [n])
  return <span ref={el} className={className}>{n}</span>
}
