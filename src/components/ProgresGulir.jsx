import { useEffect, useRef } from 'react'

// Garis tipis oranye di tepi atas layar: seberapa jauh halaman sudah digulir.
export default function ProgresGulir() {
  const ref = useRef(null)
  useEffect(() => {
    let raf = 0
    const ubah = () => { raf = 0; const m = document.documentElement.scrollHeight - window.innerHeight; if (ref.current) ref.current.style.transform = `scaleX(${m > 0 ? Math.min(1, window.scrollY / m) : 0})` }
    const gulir = () => { if (!raf) raf = requestAnimationFrame(ubah) }
    ubah(); window.addEventListener('scroll', gulir, { passive: true }); window.addEventListener('resize', gulir)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', gulir); window.removeEventListener('resize', gulir) }
  }, [])
  return <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]"><div ref={ref} className="h-full origin-left scale-x-0 bg-ember will-change-transform" /></div>
}
