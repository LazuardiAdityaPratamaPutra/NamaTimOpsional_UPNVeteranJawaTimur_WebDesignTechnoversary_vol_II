// Sampul artikel (dekoratif); posisi = object-position agar bagian penting tetap terlihat saat dipotong.
// Sampul unggahan admin (dashboard Konten) menggantikan sampul bawaan dan dipakai juga untuk artikel buatan admin.
import { gambarUnggahan } from '../lib/kontenStore'

export const SAMPUL = {
  penyebab: { src: '/foto/edu-penyebab.webp', posisi: '50% 62%' },
  dampak: { src: '/foto/footer-kabut.webp', posisi: '50% 60%' },
  gambut: { src: '/foto/edu-gambut.webp', posisi: '50% 55%' },
  pencegahan: { src: '/foto/edu-pencegahan.webp', posisi: '40% 50%' },
}
export const SAMPUL_UMUM = { src: '/foto/edu-hero.webp', posisi: '50% 50%' }
export const sampul = (slug) => {
  const unggah = gambarUnggahan(`artikel-${slug}`)
  return unggah ? { src: unggah, posisi: '50% 50%', unggahan: true } : (SAMPUL[slug] ?? SAMPUL_UMUM)
}
