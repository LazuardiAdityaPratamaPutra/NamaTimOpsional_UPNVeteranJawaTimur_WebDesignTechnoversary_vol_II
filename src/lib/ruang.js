// "Ruang" penyimpanan: tamu memakai kunci lama (bersama di perangkat), pengguna login punya ruang sendiri.
// Inilah yang membuat progres belajar, centang checklist, artikel tersimpan, dan laporan benar-benar berbeda
// antara tamu dan akun. Demo: tetap di perangkat ini (localStorage), bukan sinkron antarperangkat.
let aktif = null // email pengguna yang sedang login, atau null untuk tamu

export const setRuang = (email) => { aktif = email ? String(email).toLowerCase() : null }
export const ruangAktif = () => aktif
/** Kunci penyimpanan menurut ruang aktif. */
export const kunciRuang = (dasar) => (aktif ? `${dasar}::${aktif}` : dasar)

export const bacaJson = (dasar, awal) => {
  try { const v = JSON.parse(localStorage.getItem(kunciRuang(dasar))); return v ?? awal } catch { return awal }
}
export const tulisJson = (dasar, nilai) => {
  try { localStorage.setItem(kunciRuang(dasar), JSON.stringify(nilai)) } catch { /* penyimpanan tidak tersedia: abaikan */ }
}
/** Salinan semua data milik ruang pengguna ini (untuk Urungkan setelah dihapus). */
export function potretRuang(email) {
  const akhiran = `::${String(email).toLowerCase()}`
  try { return Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('pyraops-') && k.endsWith(akhiran)).map((k) => [k, localStorage.getItem(k)])) } catch { return {} }
}
export function pulihkanRuang(potret) {
  try { Object.entries(potret).forEach(([k, v]) => localStorage.setItem(k, v)) } catch { /* abaikan */ }
}
/** Hapus semua data milik ruang pengguna ini (bukan data tamu). */
export function hapusRuang(email) {
  const akhiran = `::${String(email).toLowerCase()}`
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('pyraops-') && k.endsWith(akhiran)).forEach((k) => localStorage.removeItem(k))
  } catch { /* abaikan */ }
}
