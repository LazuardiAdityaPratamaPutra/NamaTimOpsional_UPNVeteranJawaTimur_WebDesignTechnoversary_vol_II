// Daftar konten edukasi yang dilihat pengunjung: data bawaan + suntingan + buatan admin, disaring status terbit.
// Dipakai halaman publik (Galeri, Kuis, Checklist) dan dashboard admin, jadi angka di keduanya selalu sama.
import { GALERI } from '../data/galeri'
import { KUIS } from '../data/kuis'
import { CHECKLIST } from '../data/checklist'
import { lokal } from '../i18n'
import { terbitLangsung } from './artikelStore'
import { gambarUnggahan, potretKonten, simpanGambar, tandaKonten, ubahKonten } from './kontenStore'

const bersih = (v) => String(v ?? '').replace(/\r\n/g, '\n').trim()
const isi = (o, b) => (b === 'en' && o.en ? { ...o, ...o.en } : o)

// Memo per (jenis, bahasa, draf, grup) agar identitas array stabil selama simpanan tidak berubah
const memo = new Map()
function ingat(kunci, buat) {
  const t = `${tandaKonten()}|${(() => { try { return localStorage.getItem('pyraops-konten') } catch { return '' } })()}`
  const lama = memo.get(kunci)
  if (lama && lama.t === t) return lama.v
  const v = buat()
  memo.set(kunci, { t, v })
  return v
}
const urutKustom = (s) => Object.values(s).filter((o) => o.kustom).sort((p, q) => (p.dibuat ?? 0) - (q.dibuat ?? 0))

// ---- Galeri ----
export const BATAS_GALERI = { judul: 60, alt: 220, keterangan: 220, atribusi: 90 }
export function daftarGaleri(b = 'id', { draf = false } = {}) {
  return ingat(`galeri|${b}|${draf}`, () => {
    const s = potretKonten('galeri')
    const bawaan = GALERI.map((g) => {
      const o = s[g.id]
      const dasar = lokal(g, b)
      const ubah = o && !o.kustom ? isi(o, b) : null
      return { ...dasar, ...(ubah ? { judul: ubah.judul, alt: ubah.alt, keterangan: ubah.keterangan } : {}), id: g.id, kustom: false, diubah: Boolean(o && !o.kustom) || Boolean(gambarUnggahan(`galeri-${g.id}`)), src: gambarUnggahan(`galeri-${g.id}`) ?? `/foto/galeri-${g.id}.webp` }
    })
    const kustom = urutKustom(s).map((o) => { const x = isi(o, b); return { id: o.id, judul: x.judul, alt: x.alt, keterangan: x.keterangan, atribusi: o.atribusi, lisensi: b === 'en' ? 'Uploaded by the PyraOps admin' : 'Diunggah admin PyraOps', kustom: true, diubah: false, src: gambarUnggahan(`galeri-${o.id}`) ?? '/foto/edu-hero.webp' } })
    return [...bawaan, ...kustom].filter((g) => draf || terbitLangsung(`galeri-${g.id}`))
  })
}

// ---- Kuis ----
export const BATAS_KUIS = { topik: 24, tanya: 200, opsi: 120, jelasan: 320, sumber: 160 }
export function daftarKuis(b = 'id', { draf = false } = {}) {
  return ingat(`kuis|${b}|${draf}`, () => {
    const s = potretKonten('kuis')
    const bawaan = KUIS.map((k) => {
      const o = s[k.id]
      const dasar = lokal(k, b)
      const ubah = o && !o.kustom ? isi(o, b) : null
      return { ...dasar, ...(ubah ? { tanya: ubah.tanya, opsi: ubah.opsi, jelasan: ubah.jelasan, sumber: ubah.sumber, benar: o.benar } : {}), id: k.id, kustom: false, diubah: Boolean(o && !o.kustom) }
    })
    const kustom = urutKustom(s).map((o) => { const x = isi(o, b); return { id: o.id, topik: x.topik, tanya: x.tanya, opsi: x.opsi, benar: o.benar, jelasan: x.jelasan, sumber: x.sumber, kustom: true, diubah: false } })
    return [...bawaan, ...kustom].filter((k) => draf || terbitLangsung(`kuis-${k.id}`))
  })
}

// ---- Checklist persiapan ----
export const BATAS_CHECKLIST = { teks: 180, kenapa: 320 }
export function daftarChecklist(grup, b = 'id', { draf = false } = {}) {
  return ingat(`checklist|${grup}|${b}|${draf}`, () => {
    const s = potretKonten('checklist')
    const bawaan = (CHECKLIST[grup] ?? []).map((d) => {
      const o = s[d.id]
      const dasar = lokal(d, b)
      const ubah = o && !o.kustom ? isi(o, b) : null
      return { ...dasar, ...(ubah ? { teks: ubah.teks, tahap: o.tahap, kenapa: { teks: ubah.kenapa, artikel: d.kenapa?.artikel ?? null } } : {}), grup, kustom: false, diubah: Boolean(o && !o.kustom) }
    })
    const kustom = urutKustom(s).filter((o) => o.grup === grup).map((o) => { const x = isi(o, b); return { id: o.id, grup, tahap: o.tahap, teks: x.teks, kenapa: { teks: x.kenapa ?? '', artikel: null }, kustom: true, diubah: false } })
    return [...bawaan, ...kustom].filter((d) => draf || terbitLangsung(`checklist-${d.id}`))
  })
}
export const semuaChecklist = (b = 'id') => Object.keys(CHECKLIST).flatMap((g) => daftarChecklist(g, b))

// ---- Validasi (Indonesia wajib; Inggris boleh kosong, tetapi bila diisi harus lengkap) ----
const t = (b, i, e) => (b === 'en' ? e : i)
const panjang = (g, k, v, maks, b, wajib = true) => {
  if (!v) { if (wajib) g[k] = t(b, 'Wajib diisi.', 'Required.') } else if (v.length > maks) g[k] = t(b, `Maksimal ${maks} karakter.`, `At most ${maks} characters.`)
}
const kosongSemua = (o) => Object.values(o).every((v) => (Array.isArray(v) ? v.every((x) => !bersih(x)) : !bersih(v)))

export function validasiGaleri(f, b = 'id', { baru = false } = {}) {
  const g = {}, L = BATAS_GALERI
  panjang(g, 'judul', bersih(f.id.judul), L.judul, b)
  panjang(g, 'alt', bersih(f.id.alt), L.alt, b)
  panjang(g, 'keterangan', bersih(f.id.keterangan), L.keterangan, b)
  if (f.kustom) panjang(g, 'atribusi', bersih(f.atribusi), L.atribusi, b)
  if (baru && !f.gambar) g.gambar = t(b, 'Unggah gambarnya dulu.', 'Upload the image first.')
  if (!kosongSemua(f.en)) {
    panjang(g, 'enJudul', bersih(f.en.judul), L.judul, b)
    panjang(g, 'enAlt', bersih(f.en.alt), L.alt, b)
    panjang(g, 'enKeterangan', bersih(f.en.keterangan), L.keterangan, b)
  }
  return g
}
export function validasiKuis(f, b = 'id') {
  const g = {}, L = BATAS_KUIS
  if (f.kustom) panjang(g, 'topik', bersih(f.id.topik), L.topik, b)
  panjang(g, 'tanya', bersih(f.id.tanya), L.tanya, b)
  f.id.opsi.forEach((o, i) => panjang(g, `opsi${i}`, bersih(o), L.opsi, b))
  if (new Set(f.id.opsi.map((o) => bersih(o).toLowerCase())).size < f.id.opsi.length && f.id.opsi.every((o) => bersih(o))) g.opsi0 = t(b, 'Pilihan jawaban tidak boleh sama.', 'Answer choices must be different.')
  if (!(f.benar >= 0 && f.benar < f.id.opsi.length)) g.benar = t(b, 'Pilih jawaban yang benar.', 'Pick the correct answer.')
  panjang(g, 'jelasan', bersih(f.id.jelasan), L.jelasan, b)
  panjang(g, 'sumber', bersih(f.id.sumber), L.sumber, b)
  if (!kosongSemua(f.en)) {
    if (f.kustom) panjang(g, 'enTopik', bersih(f.en.topik), L.topik, b)
    panjang(g, 'enTanya', bersih(f.en.tanya), L.tanya, b)
    f.en.opsi.forEach((o, i) => panjang(g, `enOpsi${i}`, bersih(o), L.opsi, b))
    panjang(g, 'enJelasan', bersih(f.en.jelasan), L.jelasan, b)
    panjang(g, 'enSumber', bersih(f.en.sumber), L.sumber, b)
  }
  return g
}
export function validasiChecklist(f, b = 'id') {
  const g = {}, L = BATAS_CHECKLIST
  panjang(g, 'teks', bersih(f.id.teks), L.teks, b)
  panjang(g, 'kenapa', bersih(f.id.kenapa), L.kenapa, b, false)
  if (!['kemarau', 'asap', 'api'].includes(f.tahap)) g.tahap = t(b, 'Pilih tahapnya.', 'Pick a stage.')
  if (!['keluarga', 'sekolah'].includes(f.grup)) g.grup = t(b, 'Pilih kelompoknya.', 'Pick a group.')
  if (!kosongSemua(f.en)) {
    panjang(g, 'enTeks', bersih(f.en.teks), L.teks, b)
    panjang(g, 'enKenapa', bersih(f.en.kenapa), L.kenapa, b, Boolean(bersih(f.id.kenapa)))
  }
  return g
}

export const bersihkan = (o) => (Array.isArray(o) ? o.map(bersih) : Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Array.isArray(v) ? v.map(bersih) : bersih(v)])))
export const tanpaKosong = (o) => (kosongSemua(o) ? null : bersihkan(o))
export const idBaru = (awalan) => `${awalan}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`

// ---- CRUD untuk dashboard admin (galeri, kuis, checklist) ----

const BAWAAN = { galeri: () => GALERI, kuis: () => KUIS, checklist: () => Object.values(CHECKLIST).flat() }
const asli = (jenis, id) => BAWAAN[jenis]().find((x) => x.id === id) ?? null

/** Isian formulir untuk menyunting (id ada) atau membuat (id null) satu butir. */
export function bacaFormKonten(jenis, id, { grup = 'keluarga' } = {}) {
  const s = potretKonten(jenis)
  const o = id ? s[id] : null
  const a = id ? asli(jenis, id) : null
  if (jenis === 'galeri') {
    const kosong = { judul: '', alt: '', keterangan: '' }
    if (!id) return { kustom: true, id: kosong, en: kosong, atribusi: '', gambar: null }
    const sumber = o ?? a
    const en = o ? (o.en ?? kosong) : { judul: a.en.judul, alt: a.en.alt, keterangan: a.en.keterangan }
    return { kustom: Boolean(o?.kustom), id: { judul: sumber.judul, alt: sumber.alt, keterangan: sumber.keterangan }, en, atribusi: o?.atribusi ?? '', gambar: gambarUnggahan(`galeri-${id}`) }
  }
  if (jenis === 'kuis') {
    const kosong = { topik: '', tanya: '', opsi: ['', '', '', ''], jelasan: '', sumber: '' }
    if (!id) return { kustom: true, id: kosong, en: kosong, benar: 0 }
    const sumber = o ?? a
    const en = o ? (o.en ?? kosong) : { topik: '', tanya: a.en.tanya, opsi: [...a.en.opsi], jelasan: a.en.jelasan, sumber: a.en.sumber }
    return { kustom: Boolean(o?.kustom), id: { topik: sumber.topik ?? '', tanya: sumber.tanya, opsi: [...sumber.opsi], jelasan: sumber.jelasan, sumber: sumber.sumber }, en, benar: sumber.benar }
  }
  const kosong = { teks: '', kenapa: '' }
  if (!id) return { kustom: true, id: kosong, en: kosong, tahap: 'kemarau', grup }
  const g = Object.keys(CHECKLIST).find((k) => CHECKLIST[k].some((d) => d.id === id)) ?? o?.grup ?? grup
  if (o) return { kustom: Boolean(o.kustom), id: { teks: o.teks, kenapa: o.kenapa ?? '' }, en: o.en ?? kosong, tahap: o.tahap, grup: o.grup ?? g }
  return { kustom: false, id: { teks: a.teks, kenapa: a.kenapa?.teks ?? '' }, en: { teks: a.en.teks, kenapa: a.en.kenapa?.teks ?? '' }, tahap: a.tahap, grup: g }
}

const VALIDASI = { galeri: validasiGaleri, kuis: validasiKuis, checklist: validasiChecklist }
const AWALAN = { galeri: 'lukisan', kuis: 'soal', checklist: 'butir' }

/** Simpan butir baru (id null) atau suntingan. Mengembalikan { id } , { galat } bila tidak sah, atau { penuh: true } bila penyimpanan perangkat penuh. */
export function simpanKonten(jenis, id, form) {
  const galat = VALIDASI[jenis](form, 'id', { baru: !id })
  if (Object.keys(galat).length) return { galat }
  const kunci = id ?? idBaru(AWALAN[jenis])
  const lama = potretKonten(jenis)[kunci]
  const kustom = id ? Boolean(lama?.kustom) : true
  const sekarang = Date.now()
  const rekam = { id: kunci, kustom, ...bersihkan(form.id), en: tanpaKosong(form.en), dibuat: lama?.dibuat ?? sekarang, diubah: sekarang }
  if (jenis === 'galeri' && kustom) rekam.atribusi = bersih(form.atribusi)
  if (jenis === 'kuis') rekam.benar = form.benar
  if (jenis === 'checklist') { rekam.tahap = form.tahap; rekam.grup = form.grup }
  if (jenis === 'galeri' && form.gambar !== undefined) {
    const lamaGambar = gambarUnggahan(`galeri-${kunci}`)
    if (form.gambar !== lamaGambar && !simpanGambar(`galeri-${kunci}`, form.gambar)) return { penuh: true }
  }
  if (!ubahKonten(jenis, (s) => ({ ...s, [kunci]: rekam }))) return { penuh: true }
  return { id: kunci }
}
/** Hapus butir buatan admin; mengembalikan data untuk Urungkan. Butir bawaan tidak bisa dihapus (pakai draf). */
export function hapusKonten(jenis, id) {
  const o = potretKonten(jenis)[id]
  if (!o?.kustom) return null
  const gambar = jenis === 'galeri' ? gambarUnggahan(`galeri-${id}`) : null
  ubahKonten(jenis, (s) => { const { [id]: _, ...sisa } = s; return sisa })
  if (gambar) simpanGambar(`galeri-${id}`, null)
  return { jenis, o, gambar }
}
export function kembalikanKonten({ jenis, o, gambar }) {
  ubahKonten(jenis, (s) => ({ ...s, [o.id]: o }))
  if (gambar) simpanGambar(`galeri-${o.id}`, gambar)
}
/** Buang suntingan (dan gambar pengganti) atas butir bawaan. */
export function pulihkanKonten(jenis, id) {
  if (!asli(jenis, id)) return false
  ubahKonten(jenis, (s) => { const { [id]: _, ...sisa } = s; return sisa })
  if (jenis === 'galeri') simpanGambar(`galeri-${id}`, null)
  return true
}
