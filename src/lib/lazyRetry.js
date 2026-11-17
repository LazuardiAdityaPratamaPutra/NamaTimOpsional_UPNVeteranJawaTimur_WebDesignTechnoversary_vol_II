import { lazy } from 'react'

const KUNCI = 'pyraops-muat-ulang'

// Pembungkus lazy() yang tahan "gagal memuat potongan halaman" meski sedang online.
// Penyebab umum: versi baru terpasang (nama berkas berubah) sementara tab lama masih memegang daftar lama.
// Peramban menyimpan kegagalan impor dinamis, jadi mencoba ulang di halaman yang sama percuma:
// muat ulang halaman satu kali (mengambil versi terbaru); bila masih gagal, barulah tampilkan galat.
export function lazyRetry(impor) {
  return lazy(async () => {
    try {
      const m = await impor()
      try { sessionStorage.removeItem(KUNCI) } catch { /* abaikan */ }
      return m
    } catch (e) {
      let sudah = true
      try { sudah = sessionStorage.getItem(KUNCI) === '1'; if (!sudah) sessionStorage.setItem(KUNCI, '1') } catch { /* abaikan */ }
      if (navigator.onLine && !sudah) {
        window.location.reload()
        return new Promise(() => {})
      }
      throw e
    }
  })
}
