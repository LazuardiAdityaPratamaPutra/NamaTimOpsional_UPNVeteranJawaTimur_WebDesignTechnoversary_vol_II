import { useEffect, useRef } from 'react'
import { kurangiGerak } from '../lib/gerak'

// Foto latar yang membesar/mengecil pelan mengikuti gulir. Dipakai hanya pada foto besar bergaya sampul.
//  mode "keluar": zoom-out saat panel melintas layar (cocok untuk panel penuh di tengah halaman)
//  mode "atas":   zoom-in saat sampul di puncak halaman digulir menjauh
export default function FotoZoom({ mode = 'keluar', className = '', style, ...rest }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || kurangiGerak()) return
    let raf = 0, tampak = true
    const ubah = () => {
      raf = 0
      const r = (el.parentElement ?? el).getBoundingClientRect(), vh = window.innerHeight
      const s = mode === 'atas'
        ? 1 + Math.min(1, Math.max(0, -r.top / Math.max(r.height, 1))) * 0.22
        : 1.2 - Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))) * 0.2
      el.style.transform = `scale(${s.toFixed(4)})`
    }
    const gulir = () => { if (tampak && !raf) raf = requestAnimationFrame(ubah) }
    let io
    if (typeof IntersectionObserver === 'function') { io = new IntersectionObserver(([e]) => { tampak = e.isIntersecting; if (tampak) gulir() }); io.observe(el.parentElement ?? el) }
    ubah(); window.addEventListener('scroll', gulir, { passive: true }); window.addEventListener('resize', gulir)
    return () => { io?.disconnect(); cancelAnimationFrame(raf); window.removeEventListener('scroll', gulir); window.removeEventListener('resize', gulir) }
  }, [mode])
  return <img ref={ref} alt="" className={className} style={{ ...style, willChange: 'transform' }} {...rest} />
}
