import { useEffect, useRef } from 'react'
import { tandaiBaca } from '../lib/progres'

/** Garis kemajuan baca di tepi atas layar. */
export default function KemajuanBaca({ slug }) {
  const el = useRef(null)
  useEffect(() => {
    let raf = 0
    const hitung = () => {
      raf = 0
      const maks = document.documentElement.scrollHeight - innerHeight
      const p = maks > 0 ? Math.min(scrollY / maks, 1) : 0
      if (el.current) el.current.style.transform = `scaleX(${p})`
      if (slug && p >= 0.8) tandaiBaca(slug)
    }
    const naik = () => { if (!raf) raf = requestAnimationFrame(hitung) }
    hitung(); addEventListener('scroll', naik, { passive: true }); addEventListener('resize', naik)
    return () => { removeEventListener('scroll', naik); removeEventListener('resize', naik); cancelAnimationFrame(raf) }
  }, [slug])
  return <div ref={el} className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left scale-x-0 bg-ember-ink" aria-hidden="true" />
}
