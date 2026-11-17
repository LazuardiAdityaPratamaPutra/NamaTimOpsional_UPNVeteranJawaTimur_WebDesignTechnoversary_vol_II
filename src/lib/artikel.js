// Memuat artikel dari src/data/artikel/*.md saat build (tanpa permintaan jaringan)
import { parseFrontmatter, waktuBaca } from './markdown'
import { potretArtikel, tandaSimpanan, terbitLangsung, ubahArtikel } from './artikelStore'

const mentahId = import.meta.glob('../data/artikel/*.md', { query: '?raw', import: 'default', eager: true })
const mentahEn = import.meta.glob('../data/artikel/en/*.md', { query: '?raw', import: 'default', eager: true })

const muat = (mentah) => Object.entries(mentah)
  .map(([path, raw]) => {
    const { meta, isi } = parseFrontmatter(raw)
    return {
      slug: path.split('/').pop().replace(/\.md$/, ''),
      judul: meta.judul, ringkas: meta.ringkas, urutan: Number(meta.urutan) || 99,
      isi, menit: waktuBaca(isi),
    }
  })
  .sort((a, b) => a.urutan - b.urutan)

export const ARTIKEL = muat(mentahId)
export const ARTIKEL_EN = muat(mentahEn)
const idTerbit = (slug) => `artikel-${slug}`
const ADA = (o) => o && typeof o === 'object'

// Memo daftar: identitas array stabil selama simpanan tidak berubah (aman dipakai sebagai dependensi hook).
const memo = new Map()
function gabung(bahasa, draf) {
  const dasar = bahasa === 'en' ? ARTIKEL_EN : ARTIKEL
  const simpan = potretArtikel()
  if (!Object.keys(simpan).length && (draf || dasar.every((a) => terbitLangsung(idTerbit(a.slug))))) return dasar
  const [a, k] = tandaSimpanan()
  const kunci = `${bahasa}|${draf}`
  const lama = memo.get(kunci)
  if (lama && lama.a === a && lama.k === k) return lama.v
  const pakai = (o, asli) => {
    const isi = (bahasa === 'en' ? o.en : o)
    return ADA(isi) && isi.judul ? { judul: isi.judul, ringkas: isi.ringkas, isi: isi.isi } : asli
  }
  const bawaan = dasar.map((x) => {
    const o = simpan[x.slug]
    const m = o && !o.kustom ? pakai(o, x) : x
    return { ...x, judul: m.judul, ringkas: m.ringkas, isi: m.isi, menit: waktuBaca(m.isi), kustom: false, diubah: Boolean(o && !o.kustom) }
  })
  const kustom = Object.values(simpan).filter((o) => o.kustom).sort((p, q) => (p.dibuat ?? 0) - (q.dibuat ?? 0)).map((o) => {
    const m = pakai(o, o)
    return { slug: o.slug, judul: m.judul, ringkas: m.ringkas, isi: m.isi, urutan: 100, menit: waktuBaca(m.isi), kustom: true, diubah: false, terjemah: bahasa !== 'en' || Boolean(o.en?.judul) }
  })
  const v = [...bawaan, ...kustom].filter((x) => draf || terbitLangsung(idTerbit(x.slug)))
  memo.set(kunci, { a, k, v })
  return v
}

/** Daftar artikel menurut bahasa (bawaan + buatan admin, suntingan sudah diterapkan). `draf: true` ikut menyertakan yang belum terbit. */
export const daftarArtikel = (bahasa, { draf = false } = {}) => gabung(bahasa, draf)
export const cariArtikel = (slug, bahasa = 'id') => daftarArtikel(bahasa).find((a) => a.slug === slug)

// ---- CRUD untuk dashboard admin ----
export const BATAS_ARTIKEL = { judul: 90, ringkas: 200, isiMin: 40, isiMaks: 12000 }
export const slugBawaan = () => ARTIKEL.map((a) => a.slug)

/** Isi lengkap satu artikel (dua bahasa) untuk formulir sunting, termasuk draf. */
export function bacaArtikelLengkap(slug) {
  const id = daftarArtikel('id', { draf: true }).find((a) => a.slug === slug)
  if (!id) return null
  const en = daftarArtikel('en', { draf: true }).find((a) => a.slug === slug)
  const o = potretArtikel()[slug]
  return {
    slug, kustom: id.kustom, diubah: id.diubah,
    id: { judul: id.judul, ringkas: id.ringkas, isi: id.isi },
    en: id.kustom ? (o?.en ? { ...o.en } : { judul: '', ringkas: '', isi: '' }) : { judul: en.judul, ringkas: en.ringkas, isi: en.isi },
  }
}

const bersih = (v) => String(v ?? '').replace(/\r\n/g, '\n').trim()
const kosong = (b) => !b.judul && !b.ringkas && !b.isi

/** Galat per bidang. Bahasa Indonesia wajib; terjemahan Inggris boleh kosong, tetapi bila diisi harus lengkap. */
export function validasiArtikel(f, bahasa = 'id') {
  const t = (i, e) => (bahasa === 'en' ? e : i)
  const L = BATAS_ARTIKEL
  const g = {}
  const id = { judul: bersih(f.id?.judul), ringkas: bersih(f.id?.ringkas), isi: bersih(f.id?.isi) }
  if (!id.judul) g.judul = t('Judul wajib diisi.', 'A title is required.')
  else if (id.judul.length > L.judul) g.judul = t(`Judul maksimal ${L.judul} karakter.`, `The title can be at most ${L.judul} characters.`)
  if (!id.ringkas) g.ringkas = t('Ringkasan wajib diisi.', 'A summary is required.')
  else if (id.ringkas.length > L.ringkas) g.ringkas = t(`Ringkasan maksimal ${L.ringkas} karakter.`, `The summary can be at most ${L.ringkas} characters.`)
  if (id.isi.length < L.isiMin) g.isi = t(`Isi artikel minimal ${L.isiMin} karakter.`, `The article body needs at least ${L.isiMin} characters.`)
  else if (id.isi.length > L.isiMaks) g.isi = t(`Isi artikel maksimal ${L.isiMaks} karakter.`, `The article body can be at most ${L.isiMaks} characters.`)
  const en = { judul: bersih(f.en?.judul), ringkas: bersih(f.en?.ringkas), isi: bersih(f.en?.isi) }
  if (!kosong(en)) {
    if (!en.judul) g.enJudul = t('Judul Inggris belum diisi (atau kosongkan semua kolom Inggris).', 'The English title is missing (or leave all English fields empty).')
    else if (en.judul.length > L.judul) g.enJudul = t(`Judul maksimal ${L.judul} karakter.`, `The title can be at most ${L.judul} characters.`)
    if (!en.ringkas) g.enRingkas = t('Ringkasan Inggris belum diisi.', 'The English summary is missing.')
    else if (en.ringkas.length > L.ringkas) g.enRingkas = t(`Ringkasan maksimal ${L.ringkas} karakter.`, `The summary can be at most ${L.ringkas} characters.`)
    if (en.isi.length < L.isiMin) g.enIsi = t(`Isi Inggris minimal ${L.isiMin} karakter.`, `The English body needs at least ${L.isiMin} characters.`)
    else if (en.isi.length > L.isiMaks) g.enIsi = t(`Isi artikel maksimal ${L.isiMaks} karakter.`, `The article body can be at most ${L.isiMaks} characters.`)
  }
  return g
}

export const buatSlug = (judul, terpakai = []) => {
  const dasar = String(judul).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '') || 'artikel'
  const pakai = new Set([...slugBawaan(), ...Object.keys(potretArtikel()), ...terpakai])
  if (!pakai.has(dasar)) return dasar
  let n = 2
  while (pakai.has(`${dasar}-${n}`)) n++
  return `${dasar}-${n}`
}

/** Membuat artikel baru (tanpa `slug`) atau menyimpan suntingan (dengan `slug`). Mengembalikan slug, atau null bila tidak sah. */
export function simpanArtikel({ slug, id, en }) {
  if (Object.keys(validasiArtikel({ id, en })).length) return null
  const isiId = { judul: bersih(id.judul), ringkas: bersih(id.ringkas), isi: bersih(id.isi) }
  const e = { judul: bersih(en?.judul), ringkas: bersih(en?.ringkas), isi: bersih(en?.isi) }
  const isiEn = kosong(e) ? null : e
  const lama = slug ? potretArtikel()[slug] : null
  const bawaan = slug ? slugBawaan().includes(slug) : false
  if (slug && !bawaan && !lama?.kustom) return null
  const kunci = slug ?? buatSlug(isiId.judul)
  const sekarang = Date.now()
  ubahArtikel((s) => ({ ...s, [kunci]: { slug: kunci, kustom: !bawaan, ...isiId, en: isiEn, dibuat: lama?.dibuat ?? sekarang, diubah: sekarang } }))
  return kunci
}

/** Menghapus artikel buatan admin. Artikel bawaan tidak bisa dihapus (gunakan draf atau pulihkan). Mengembalikan data yang dihapus. */
export function hapusArtikel(slug) {
  const o = potretArtikel()[slug]
  if (!o?.kustom) return null
  ubahArtikel((s) => { const { [slug]: _, ...sisa } = s; return sisa })
  return o
}
/** Memasukkan kembali data hasil `hapusArtikel` (urungkan). */
export const kembalikanArtikel = (o) => { if (o?.slug) ubahArtikel((s) => ({ ...s, [o.slug]: o })) }
/** Membuang suntingan atas artikel bawaan sehingga kembali ke isi aslinya. */
export function pulihkanArtikel(slug) {
  const o = potretArtikel()[slug]
  if (!o || o.kustom) return false
  ubahArtikel((s) => { const { [slug]: _, ...sisa } = s; return sisa })
  return true
}
