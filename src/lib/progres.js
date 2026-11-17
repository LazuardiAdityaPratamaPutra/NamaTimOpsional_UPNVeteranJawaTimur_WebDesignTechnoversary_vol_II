// Kemajuan belajar disimpan di perangkat (localStorage); semua akses aman bila penyimpanan tidak tersedia.
import { CHECKLIST } from '../data/checklist'
import { daftarChecklist } from './kontenEdukasi'
import { muatCentang } from './checklist'
import { bacaJson, tulisJson } from './ruang'

const K_BACA = 'pyraops-baca', K_TGL = 'pyraops-baca-tgl', K_SKOR = 'pyraops-skor-kuis', K_PATROLI = 'pyraops-skor-patroli'

export const muatBaca = () => { const v = bacaJson(K_BACA, []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [] }
export const tandaiBaca = (slug) => {
  const v = muatBaca(); if (!v.includes(slug)) tulisJson(K_BACA, [...v, slug])
  const t = muatTanggalBaca(); if (!t[slug]) tulisJson(K_TGL, { ...t, [slug]: new Date().toISOString() })
}
/** Tanggal pertama kali tiap artikel selesai dibaca (untuk cap "Dikembalikan" di kartu peminjaman perpustakaan). */
export const muatTanggalBaca = () => { const v = bacaJson(K_TGL, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} }
export const muatSkor = () => { const v = bacaJson(K_SKOR, null); return v && Number.isFinite(v.skor) && Number.isFinite(v.total) ? v : null }
export const simpanSkor = (skor, total) => { const lama = muatSkor(); if (!lama || skor / total > lama.skor / lama.total) tulisJson(K_SKOR, { skor, total }) }
// Hanya centang pada butir yang masih tampil (butir yang dijadikan draf atau dihapus admin tidak ikut dihitung)
export const hitungCentang = () => Object.keys(CHECKLIST).reduce((n, g) => { const ada = new Set(daftarChecklist(g).map((d) => d.id)); return n + muatCentang(g).filter((id) => ada.has(id)).length }, 0)

// Skor terbaik game Patroli Hutan (/patroli): jumlah titik api yang ditangani benar dari seluruh titik.
export const muatPatroli = () => { const v = bacaJson(K_PATROLI, null); return v && Number.isFinite(v.skor) && Number.isFinite(v.total) ? v : null }
export const simpanPatroli = (skor, total) => { const lama = muatPatroli(); if (!lama || skor / total > lama.skor / lama.total) tulisJson(K_PATROLI, { skor, total }) }
