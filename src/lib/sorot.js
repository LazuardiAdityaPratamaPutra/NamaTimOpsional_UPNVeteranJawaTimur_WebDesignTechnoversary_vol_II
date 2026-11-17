import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { kurangiGerak } from './gerak'

/**
 * Setelah pindah dari pencarian admin, gulir ke butir tujuan (`location.state.sorot` = id elemen), beri fokus,
 * dan nyalakan sorotan singkat. Tidak berbuat apa-apa bila elemen tidak ditemukan.
 */
export function useSorot() {
  const { state, key } = useLocation()
  const id = state?.sorot
  useEffect(() => {
    if (!id) return undefined
    let el = null
    const t = requestAnimationFrame(() => {
      el = document.getElementById(id)
      if (!el) return
      el.scrollIntoView({ block: 'center', behavior: kurangiGerak() ? 'auto' : 'smooth' })
      el.focus({ preventScroll: true })
      el.classList.remove('sorot'); void el.offsetWidth; el.classList.add('sorot')
    })
    return () => { cancelAnimationFrame(t); el?.classList.remove('sorot') }
  }, [id, key])
}
