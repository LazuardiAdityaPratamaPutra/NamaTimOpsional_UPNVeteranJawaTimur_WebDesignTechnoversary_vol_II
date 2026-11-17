import { useEffect, useRef } from 'react'
import { kurangiGerak } from './gerak'

// Interaksi global yang halus: muncul saat digulir (bertahap), sorotan mengikuti kursor, tombol "magnet",
// dan bilah progres gulir. Semua mati bila pengguna memilih gerak dikurangi.
const SEL = 'h1, h2, p, .baris-indeks, form, fieldset, figure, blockquote, [data-rv]'

function layak(el) {
  if (el.closest('[data-no-rv], nav, dialog, [role="dialog"], .leaflet-container, .rv')) return false
  const a = el.closest('a'); if (a && a !== el) return false // judul di dalam tautan (panel artikel) punya animasinya sendiri
  return true
}

/** Menandai elemen di <main> agar naik pelan-pelan saat masuk layar. Aman di jsdom dan tanpa JS (tidak ada yang disembunyikan). */
export function useMunculSaatGulir(pathname) {
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function' || kurangiGerak()) return
    if (pathname === '/peta' || pathname === '/kuis') return
    const main = document.getElementById('utama'); if (!main) return
    const io = new IntersectionObserver((daftar) => {
      for (const e of daftar) {
        if (!e.isIntersecting) continue
        const el = e.target; io.unobserve(el)
        el.classList.add('rv-in')
        setTimeout(() => el.classList.remove('rv', 'rv-in'), 1100) // lepaskan agar transisi hover bawaan kembali normal
      }
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' })
    let antre = 0
    const pindai = () => {
      antre = 0
      main.querySelectorAll(SEL).forEach((el) => {
        if (el.dataset.rvOk || !layak(el)) return
        el.dataset.rvOk = '1'
        const sib = Array.from(el.parentElement?.children ?? []).indexOf(el)
        el.style.setProperty('--d', `${Math.min(Math.max(sib, 0), 5) * 70}ms`)
        el.classList.add('rv'); io.observe(el)
      })
    }
    pindai()
    const mo = new MutationObserver(() => { if (!antre) antre = requestAnimationFrame(pindai) })
    mo.observe(main, { childList: true, subtree: true })
    return () => { mo.disconnect(); io.disconnect(); cancelAnimationFrame(antre); main.querySelectorAll('.rv').forEach((el) => { el.classList.remove('rv', 'rv-in'); delete el.dataset.rvOk }) }
  }, [pathname])
}

/** Sorotan oranye mengikuti kursor pada [data-spot]/.baris-indeks dan tombol [data-mag] yang tertarik pelan ke kursor. */
export function useKursorInteraktif() {
  useEffect(() => {
    if (kurangiGerak() || typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: hover)').matches) return
    let mag = null
    const gerak = (e) => {
      const s = e.target.closest?.('[data-spot], .baris-indeks')
      if (s) { const r = s.getBoundingClientRect(); s.style.setProperty('--mx', `${e.clientX - r.left}px`); s.style.setProperty('--my', `${e.clientY - r.top}px`) }
      const m = e.target.closest?.('[data-mag]')
      if (m !== mag) { if (mag) mag.style.translate = ''; mag = m }
      if (m) { const r = m.getBoundingClientRect(); m.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 10}px ${((e.clientY - r.top) / r.height - 0.5) * 8}px` }
    }
    const keluar = () => { if (mag) { mag.style.translate = ''; mag = null } }
    document.addEventListener('pointermove', gerak, { passive: true }); document.addEventListener('pointerleave', keluar)
    return () => { document.removeEventListener('pointermove', gerak); document.removeEventListener('pointerleave', keluar) }
  }, [])
}

/**
 * Parallax umum: setiap elemen [data-gulir] mendapat --gy (-1 saat jauh di atas layar, 0 saat tepat di tengah, 1 saat jauh di bawah).
 * Gerak dipasang lewat CSS, mis. [translate:0_calc(var(--gy,0)*-40px)], jadi tiap bagian bebas menentukan arah dan jaraknya.
 */
export function useGulirVars(pathname) {
  useEffect(() => {
    if (kurangiGerak()) return
    const raiz = document.body
    let els = [], raf = 0, tunda = 0
    const hitung = () => {
      raf = 0
      const vh = window.innerHeight
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.bottom < -120 || r.top > vh + 120) continue
        const gy = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2)
        el.style.setProperty('--gy', Math.max(-1, Math.min(1, gy)).toFixed(3))
      }
    }
    const naik = () => { if (!raf) raf = requestAnimationFrame(hitung) }
    const kumpul = () => { tunda = 0; els = Array.from(raiz.querySelectorAll('[data-gulir]')); naik() }
    kumpul()
    const mo = new MutationObserver(() => { if (!tunda) tunda = requestAnimationFrame(kumpul) })
    mo.observe(raiz, { childList: true, subtree: true })
    window.addEventListener('scroll', naik, { passive: true }); window.addEventListener('resize', naik)
    return () => { mo.disconnect(); window.removeEventListener('scroll', naik); window.removeEventListener('resize', naik); cancelAnimationFrame(raf); cancelAnimationFrame(tunda) }
  }, [pathname])
}

// Gesek horizontal (sentuh/pena): kembalikan props untuk elemen. Hanya terpicu bila gerak lebih mendatar daripada menegak,
// sehingga gulir halaman tetap normal. onKiri = gesek ke kiri (berikutnya), onKanan = gesek ke kanan (sebelumnya).
export function useGesek(onKiri, onKanan) {
  const awal = useRef(null)
  return {
    onPointerDown: (e) => { if (e.pointerType !== 'mouse') awal.current = { x: e.clientX, y: e.clientY } },
    onPointerUp: (e) => {
      const a = awal.current; awal.current = null
      if (!a) return
      const dx = e.clientX - a.x, dy = e.clientY - a.y
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? onKiri : onKanan)()
    },
    onPointerCancel: () => { awal.current = null },
  }
}
