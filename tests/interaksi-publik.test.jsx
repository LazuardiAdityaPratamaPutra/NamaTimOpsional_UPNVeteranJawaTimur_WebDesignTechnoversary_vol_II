// @vitest-environment jsdom
// Getar halus yang menghormati mode hemat gerak, Urungkan untuk atur ulang progres, dan tombol kembali-ke-atas.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act } from 'react'
import { POLA, sentuhan } from '../src/lib/sentuhan'
import { hapusRuang, potretRuang, pulihkanRuang } from '../src/lib/ruang'
import KeAtas from '../src/components/KeAtas'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
afterEach(() => { localStorage.clear(); document.body.innerHTML = ''; vi.restoreAllMocks(); delete navigator.vibrate })

describe('sentuhan (getar)', () => {
  it('bergetar bila didukung dan gerak tidak dihemat', () => {
    window.matchMedia = (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })
    const v = vi.fn(() => true); navigator.vibrate = v
    expect(sentuhan(POLA.salah)).toBe(true)
    expect(v).toHaveBeenCalledWith(POLA.salah)
  })
  it('diam saat pengguna memilih gerak dihemat', () => {
    localStorage.setItem('pyraops-gerak', 'hemat')
    const v = vi.fn(() => true); navigator.vibrate = v
    expect(sentuhan()).toBe(false)
    expect(v).not.toHaveBeenCalled()
  })
  it('aman di perangkat tanpa getar', () => { expect(sentuhan()).toBe(false) })
})

describe('potret & pulihkan ruang', () => {
  it('mengembalikan data pengguna yang diatur ulang, tanpa menyentuh data tamu', () => {
    localStorage.setItem('pyraops-baca::a@b.id', '["gambut"]')
    localStorage.setItem('pyraops-skor::a@b.id', '{"skor":4,"total":5}')
    localStorage.setItem('pyraops-baca', '["tamu"]')
    const salinan = potretRuang('A@b.id')
    hapusRuang('a@b.id')
    expect(localStorage.getItem('pyraops-baca::a@b.id')).toBeNull()
    expect(localStorage.getItem('pyraops-baca')).toBe('["tamu"]')
    pulihkanRuang(salinan)
    expect(localStorage.getItem('pyraops-baca::a@b.id')).toBe('["gambut"]')
    expect(localStorage.getItem('pyraops-skor::a@b.id')).toBe('{"skor":4,"total":5}')
  })
})

describe('KeAtas', () => {
  it('tersembunyi dan tak bisa difokus selama halaman belum digulir jauh', () => {
    const el = document.createElement('div'); document.body.appendChild(el)
    const root = createRoot(el)
    act(() => root.render(<KeAtas />))
    const b = el.querySelector('button')
    expect(b.getAttribute('tabindex')).toBe('-1')
    expect(b.getAttribute('aria-hidden')).toBe('true')
    act(() => root.unmount())
  })
})
