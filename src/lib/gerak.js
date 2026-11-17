// Preferensi efek gerak. Bawaan mengikuti sistem (prefers-reduced-motion); pengguna bisa memaksa "penuh" atau "hemat"
// lewat tombol di bilah navigasi. Pilihan disimpan dan dibaca semua efek yang digerakkan JavaScript.
const KUNCI = 'pyraops-gerak'
const baca = () => { try { const v = localStorage.getItem(KUNCI); return v === 'penuh' || v === 'hemat' ? v : null } catch { return null } }

export const kurangiGerak = () => {
  const p = baca()
  if (p) return p === 'hemat'
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
export const setGerak = (penuh) => { try { localStorage.setItem(KUNCI, penuh ? 'penuh' : 'hemat') } catch { /* penyimpanan tidak tersedia */ } }
// CSS membaca html[data-gerak] agar pilihan "penuh" juga mematikan peredam gerak global
if (typeof document !== 'undefined') { const p = baca(); if (p) document.documentElement.dataset.gerak = p }
