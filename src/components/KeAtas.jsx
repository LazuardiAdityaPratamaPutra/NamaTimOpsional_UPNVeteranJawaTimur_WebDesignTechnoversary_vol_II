import { useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { kurangiGerak } from '../lib/gerak'
import { useTr } from '../i18n'

/**
 * Tombol "kembali ke atas" yang melayang: muncul setelah menggulir lebih dari satu layar, cincinnya terisi sesuai
 * seberapa jauh halaman sudah dibaca, dan menyingkir saat footer (yang punya tombolnya sendiri) sudah terlihat.
 * Duduk tepat di atas tombol asisten TORA (pojok kanan bawah) supaya keduanya tidak bertumpuk.
 */
export default function KeAtas() {
  const tr = useTr()
  const [tampil, setTampil] = useState(false)
  const cincin = useRef(null)
  useEffect(() => {
    let raf = 0
    const ubah = () => {
      raf = 0
      const maks = document.documentElement.scrollHeight - window.innerHeight
      const p = maks > 0 ? Math.min(1, window.scrollY / maks) : 0
      const kaki = document.querySelector('footer')
      const kakiTerlihat = kaki ? kaki.getBoundingClientRect().top < window.innerHeight - 40 : false
      setTampil(window.scrollY > window.innerHeight * 1.2 && !kakiTerlihat)
      if (cincin.current) cincin.current.style.strokeDashoffset = String(1 - p)
    }
    const gulir = () => { if (!raf) raf = requestAnimationFrame(ubah) }
    ubah()
    window.addEventListener('scroll', gulir, { passive: true }); window.addEventListener('resize', gulir)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', gulir); window.removeEventListener('resize', gulir) }
  }, [])
  const naik = () => {
    window.scrollTo({ top: 0, behavior: kurangiGerak() ? 'auto' : 'smooth' })
    document.getElementById('utama')?.focus({ preventScroll: true }) // fokus papan ketik ikut kembali ke awal isi
  }
  return (
    <button type="button" onClick={naik} aria-label={tr('Kembali ke atas', 'Back to top')} tabIndex={tampil ? 0 : -1} aria-hidden={tampil ? undefined : true}
      className={`group fixed bottom-[5.25rem] right-4 z-[1500] flex size-12 items-center justify-center rounded-full bg-surface/90 text-ink shadow-lg backdrop-blur-md transition-[opacity,translate,scale] duration-300 ease-snap hover:-translate-y-0.5 active:scale-90 ${tampil ? 'ke-atas-tampil opacity-100' : 'pointer-events-none translate-y-4 scale-90 opacity-0'}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
        <circle cx="24" cy="24" r="22.5" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <circle ref={cincin} cx="24" cy="24" r="22.5" fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset="1" />
      </svg>
      <ArrowUp size={18} aria-hidden="true" className="relative transition-transform duration-200 ease-snap group-hover:-translate-y-0.5" />
    </button>
  )
}
