// Penyimpanan kecil untuk artikel buatan admin dan suntingan artikel bawaan (localStorage, demo).
// Dipisah dari admin.js agar halaman publik tidak ikut memuat data dashboard.
const K = 'pyraops-artikel'
const K_KONTEN = 'pyraops-konten'

const bacaObj = (kunci) => { try { const v = JSON.parse(localStorage.getItem(kunci)); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} } catch { return {} } }

let cache = null
const dengar = new Set()
export const langgananArtikel = (fn) => { dengar.add(fn); return () => dengar.delete(fn) }
/** { [slug]: { slug, kustom, judul, ringkas, isi, en: {judul,ringkas,isi}|null, dibuat?, diubah } } */
export const potretArtikel = () => (cache ??= bacaObj(K))
export function setelUlangArtikel() { cache = null; konten = { mentah: undefined, nilai: {} }; dengar.forEach((f) => f()) }

/** Mengubah isi simpanan; hasil `fn` menggantikan seluruh objek. */
export function ubahArtikel(fn) {
  const baru = fn(potretArtikel())
  cache = baru
  try { localStorage.setItem(K, JSON.stringify(baru)) } catch { /* penyimpanan penuh atau tidak tersedia */ }
  dengar.forEach((f) => f())
}

// Status terbit dibaca langsung dari simpanan admin (kunci yang sama dengan admin.js) dan di-memo menurut teks mentahnya.
let konten = { mentah: undefined, nilai: {} }
const bacaKonten = () => {
  let mentah = null
  try { mentah = localStorage.getItem(K_KONTEN) } catch { /* abaikan */ }
  if (mentah !== konten.mentah) konten = { mentah, nilai: bacaObj(K_KONTEN) }
  return konten
}
/** Sama seperti `terbit` di admin.js: terbit kecuali ditandai false. */
export const terbitLangsung = (id) => bacaKonten().nilai[id] !== false
/** Tanda yang berubah bila simpanan artikel atau status terbit berubah (untuk memo daftar). */
export const tandaSimpanan = () => [potretArtikel(), bacaKonten().mentah]
