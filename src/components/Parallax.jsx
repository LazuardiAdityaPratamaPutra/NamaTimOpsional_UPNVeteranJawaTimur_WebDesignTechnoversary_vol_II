import { useEffect, useRef } from 'react'
import { kurangiGerak } from '../lib/gerak'

/**
 * Lapisan parallax: mengisi induknya (induk harus relative + overflow-hidden), lebih tinggi sebesar `bleed`
 * di atas dan bawah, lalu bergeser sesuai posisi induk terhadap tengah layar. `kecepatan` makin besar = makin lambat
 * terhadap isi halaman (terasa lebih jauh). Tanpa gerak bila pengguna memilih mengurangi gerak.
 */
export default function Parallax({ kecepatan = 0.2, bleed = 0.15, className = '', children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current, induk = el?.parentElement
    if (!el || !induk || kurangiGerak()) return
    let raf = 0
    const hitung = () => {
      raf = 0
      const r = induk.getBoundingClientRect()
      if (r.bottom < -200 || r.top > innerHeight + 200) return
      const p = r.top + r.height / 2 - innerHeight / 2
      const maks = r.height * bleed
      el.style.transform = `translate3d(0, ${Math.max(-maks, Math.min(maks, -p * kecepatan)).toFixed(1)}px, 0)`
    }
    const naik = () => { if (!raf) raf = requestAnimationFrame(hitung) }
    hitung(); addEventListener('scroll', naik, { passive: true }); addEventListener('resize', naik)
    return () => { removeEventListener('scroll', naik); removeEventListener('resize', naik); cancelAnimationFrame(raf) }
  }, [kecepatan, bleed])
  return <div ref={ref} aria-hidden="true" className={`pointer-events-none absolute inset-x-0 will-change-transform ${className}`} style={{ top: `${-bleed * 100}%`, bottom: `${-bleed * 100}%` }}>{children}</div>
}

// Garis kontur ala peta topografi (deterministik, digambar sekali). Dipakai sebagai lapisan latar.
const KLASTER = [[820, 480, 12, 1.5], [180, 1020, 9, 1.25]]
const KONTUR = KLASTER.flatMap(([cx, cy, n, sx], c) => Array.from({ length: n }, (_, k) => {
  const r = 46 + k * 44
  const pts = Array.from({ length: 90 }, (_, i) => {
    const t = (i / 90) * Math.PI * 2
    const w = 1 + 0.13 * Math.sin(3 * t + k * 0.45 + c) + 0.07 * Math.sin(5 * t - k * 0.7 + c * 2)
    return `${(cx + Math.cos(t) * r * sx * w).toFixed(1)},${(cy + Math.sin(t) * r * w).toFixed(1)}`
  })
  return { d: `M${pts.join('L')}Z`, indeks: k % 4 === 0, lx: cx + r * sx * 1.02, ly: cy, m: 100 + (c * 9 + k) * 20 }
}))
export function GarisKontur({ className = '' }) {
  return (
    <svg viewBox="0 0 1200 1400" preserveAspectRatio="xMidYMid slice" className={`size-full ${className}`} fill="none" aria-hidden="true">
      {KONTUR.map((k, i) => <path key={i} d={k.d} stroke={k.indeks ? 'var(--ember)' : 'var(--text-2)'} strokeOpacity={k.indeks ? 0.55 : 0.28} strokeWidth={k.indeks ? 1.6 : 1} />)}
      {KONTUR.filter((k) => k.indeks && k.lx < 1090).map((k, i) => <text key={i} x={k.lx} y={k.ly} fontSize="13" fontFamily="var(--font-mono)" fill="var(--text-2)" fillOpacity="0.8">{k.m} m</text>)}
    </svg>
  )
}
