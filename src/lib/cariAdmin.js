// Pencarian global dashboard admin: membangun indeks dari halaman, laporan, pesan, dan konten, lalu menilai kecocokannya.
// Murni (tanpa React) supaya mudah diuji.
import { lokal } from '../i18n'
import { terdekat, statusTindak, TINDAK_LABEL } from './admin'
import { daftarArtikel } from './artikel'
import { daftarChecklist, daftarGaleri, daftarKuis } from './kontenEdukasi'

export const GRUP = ['halaman', 'aksi', 'laporan', 'pesan', 'konten']
const BATAS = { halaman: 6, aksi: 4, laporan: 4, pesan: 4, konten: 5 }
const BATAS_TOTAL = 16

/** Huruf kecil tanpa tanda diakritik, spasi dirapikan. */
export const normal = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()
export const pecah = (q) => normal(q).split(' ').filter(Boolean)
const potong = (t, n) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t)

const HALAMAN = [
  { to: '/admin', id: 'Ringkasan', en: 'Overview', kata: 'dashboard beranda utama statistik grafik home' },
  { to: '/admin/laporan', id: 'Laporan', en: 'Reports', kata: 'laporan lapangan triase tindak lanjut status field' },
  { to: '/admin/peta', id: 'Peta risiko', en: 'Risk map', kata: 'peta hotspot titik panas pemukiman zona map' },
  { to: '/admin/konten', id: 'Konten edukasi', en: 'Education content', kata: 'artikel galeri kuis persiapan checklist edukasi terbit draf cms article sampul cover' },
  { to: '/admin/pesan', id: 'Pesan', en: 'Messages', kata: 'kotak masuk kontak inbox surel email' },
  { to: '/admin/aktivitas', id: 'Aktivitas', en: 'Activity', kata: 'log riwayat audit catatan history' },
]

/**
 * Indeks yang bisa dicari. Tiap butir: { id, grup, judul, ket, kata (teks pencarian ternormalisasi), ke: { to, state } }.
 * `bahasa` memilih teks tampilan; kata kunci mencakup kedua bahasa.
 */
export function bangunIndeks({ bahasa = 'id', laporan = [], tindak = {}, pesan = [], topik = {}, ringkasanTingkat = {} }) {
  const tr = (i, e) => (bahasa === 'en' ? e : i)
  const hasil = []
  for (const h of HALAMAN) {
    hasil.push({ id: `halaman-${h.to}`, grup: 'halaman', judul: tr(h.id, h.en), ket: tr('Buka halaman', 'Open page'), kata: normal(`${h.id} ${h.en} ${h.kata}`), ke: { to: h.to } })
  }
  for (const r of laporan) {
    const dekat = terdekat(r.lat, r.lon)
    const k = lokal(r, bahasa)
    const st = statusTindak(r.id, tindak)
    const tingkat = ringkasanTingkat[r.severity] ?? r.severity
    hasil.push({
      id: `laporan-${r.id}`, grup: 'laporan', judul: potong(k.note || tr('Tanpa catatan', 'No note'), 90),
      ket: `${dekat.nama} · ${tingkat} · ${tr(...TINDAK_LABEL[st])}`,
      kata: normal(`${r.note ?? ''} ${r.en?.note ?? ''} ${dekat.nama} ${r.severity} ${tingkat} ${TINDAK_LABEL[st].join(' ')} ${r.demo ? 'demo contoh' : ''}`),
      ke: { to: `/admin/laporan?r=${encodeURIComponent(r.id)}`, state: { sorot: `lap-${r.id}` } },
    })
  }
  for (const p of pesan) {
    const k = lokal(p, bahasa)
    hasil.push({
      id: `pesan-${p.id}`, grup: 'pesan', judul: p.nama, ket: `${topik[p.topik] ?? p.topik} · ${potong(k.pesan, 70)}${p.baca ? '' : ` · ${tr('belum dibaca', 'unread')}`}`,
      kata: normal(`${p.nama} ${p.email} ${p.topik} ${topik[p.topik] ?? ''} ${p.pesan} ${k.pesan}`),
      ke: { to: '/admin/pesan', state: { sorot: `pesan-${p.id}`, buka: p.id } },
    })
  }
  for (const a of daftarArtikel(bahasa, { draf: true })) {
    hasil.push({
      id: `konten-artikel-${a.slug}`, grup: 'konten', judul: a.judul, ket: `${tr('Artikel', 'Article')} · ${potong(a.ringkas, 80)}`,
      kata: normal(`${a.judul} ${a.ringkas} ${a.isi} artikel article`), ke: { to: '/admin/konten', state: { sorot: `konten-artikel-${a.slug}` } },
    })
  }
  for (const g of daftarGaleri(bahasa, { draf: true })) {
    hasil.push({ id: `konten-galeri-${g.id}`, grup: 'konten', judul: g.judul, ket: `${tr('Galeri', 'Gallery')} · ${potong(g.keterangan ?? '', 80)}`,
      kata: normal(`${g.judul} ${g.keterangan} ${g.alt} galeri gallery lukisan painting`), ke: { to: '/admin/konten', state: { sorot: `konten-galeri-${g.id}` } } })
  }
  daftarKuis(bahasa, { draf: true }).forEach((k, i) => {
    hasil.push({ id: `konten-kuis-${k.id}`, grup: 'konten', judul: k.tanya, ket: `${tr('Kuis', 'Quiz')} · ${tr('Soal', 'Question')} ${i + 1}`,
      kata: normal(`${k.tanya} ${(k.opsi ?? []).join(' ')} kuis quiz soal`), ke: { to: '/admin/konten', state: { sorot: `konten-kuis-${k.id}` } } })
  })
  for (const grup of ['keluarga', 'sekolah']) {
    for (const d of daftarChecklist(grup, bahasa, { draf: true })) {
      hasil.push({ id: `konten-checklist-${d.id}`, grup: 'konten', judul: potong(d.teks, 90), ket: `${tr('Persiapan', 'Preparation')} · ${grup === 'keluarga' ? tr('Keluarga', 'Family') : tr('Sekolah', 'School')}`,
        kata: normal(`${d.teks} ${d.kenapa?.teks ?? ''} persiapan checklist preparation ${grup}`), ke: { to: '/admin/konten', state: { sorot: `konten-checklist-${d.id}` } } })
    }
  }
  return hasil
}

/** Nilai satu butir untuk daftar kata kunci; 0 bila ada kata yang tidak ditemukan sama sekali. */
export function nilai(butir, token) {
  const judul = normal(butir.judul)
  const ket = normal(butir.ket ?? '')
  let total = 0
  for (const t of token) {
    let s = 0
    if (judul.startsWith(t)) s = 6
    else if (judul.split(/[^a-z0-9]+/).some((w) => w.startsWith(t))) s = 5
    else if (judul.includes(t)) s = 3
    else if (ket.includes(t)) s = 2
    else if (butir.kata.includes(t)) s = 1
    if (!s) return 0
    total += s
  }
  return total
}

/**
 * Mencari dalam indeks (+ butir tambahan seperti aksi cepat). Hasil dikelompokkan menurut GRUP, tiap grup dibatasi,
 * dan butir dalam grup diurutkan menurut nilai (urutan indeks bila sama). Kueri kosong mengembalikan halaman dan aksi saja.
 */
export function cari(indeks, kueri, tambahan = []) {
  const token = pecah(kueri)
  const semua = [...indeks, ...tambahan]
  let dipilih
  if (!token.length) dipilih = semua.filter((b) => b.grup === 'halaman' || b.grup === 'aksi').map((b) => ({ ...b, skor: 0 }))
  else dipilih = semua.map((b) => ({ ...b, skor: nilai(b, token) })).filter((b) => b.skor > 0)
  const hasil = []
  for (const g of GRUP) {
    const isi = dipilih.filter((b) => b.grup === g).map((b, i) => [b, i]).sort((x, y) => y[0].skor - x[0].skor || x[1] - y[1]).slice(0, BATAS[g]).map(([b]) => b)
    hasil.push(...isi)
  }
  return hasil.slice(0, BATAS_TOTAL)
}
