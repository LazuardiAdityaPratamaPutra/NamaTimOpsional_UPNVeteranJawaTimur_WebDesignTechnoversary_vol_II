// Penyimpanan kecil (localStorage, demo) untuk konten edukasi selain artikel: galeri, kuis, dan checklist persiapan,
// ditambah gambar unggahan (sampul artikel dan lukisan galeri). Pola sama dengan artikelStore: potret ber-cache + pendengar.
// Perubahan dari tab lain (event `storage`) ikut membersihkan cache, jadi tab pengunjung melihat hasil admin tanpa muat ulang.
import { setelUlangArtikel } from './artikelStore'

export const KUNCI_KONTEN = { galeri: 'pyraops-galeri-admin', kuis: 'pyraops-kuis-admin', checklist: 'pyraops-checklist-admin', gambar: 'pyraops-gambar' }
const bacaObj = (k) => { try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} } catch { return {} } }

const cache = {}
const dengar = new Set()
export const langgananKonten = (fn) => { dengar.add(fn); return () => dengar.delete(fn) }
export const potretKonten = (jenis) => (cache[jenis] ??= bacaObj(KUNCI_KONTEN[jenis]))
/** Satu tanda gabungan untuk useSyncExternalStore (berubah bila salah satu simpanan berubah). */
let tanda = 0
export const tandaKonten = () => tanda
export function setelUlangKonten() { for (const k of Object.keys(cache)) delete cache[k]; tanda++; dengar.forEach((f) => f()) }

/** Mengubah simpanan satu jenis. Mengembalikan false bila penyimpanan perangkat penuh (mis. gambar terlalu banyak). */
export function ubahKonten(jenis, fn) {
  const baru = fn(potretKonten(jenis))
  try { localStorage.setItem(KUNCI_KONTEN[jenis], JSON.stringify(baru)) } catch { return false }
  cache[jenis] = baru
  tanda++
  dengar.forEach((f) => f())
  return true
}

// ---- gambar unggahan: { 'artikel-<slug>': dataURL, 'galeri-<id>': dataURL } ----
export const gambarUnggahan = (kunci) => potretKonten('gambar')[kunci] ?? null
export const simpanGambar = (kunci, dataUrl) => ubahKonten('gambar', (g) => (dataUrl ? { ...g, [kunci]: dataUrl } : (() => { const { [kunci]: _, ...sisa } = g; return sisa })()))

/** Perkiraan pemakaian penyimpanan perangkat oleh data PyraOps (byte, UTF-16). */
export function pakaiPenyimpanan() {
  let n = 0
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith('pyraops')) n += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2 } } catch { /* abaikan */ }
  return n
}

// Tab lain mengubah simpanan (mis. admin di satu tab, pratinjau di tab lain): buang cache agar data baru terbaca
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!e.key || e.key.startsWith('pyraops-')) { setelUlangKonten(); setelUlangArtikel() }
  })
}
