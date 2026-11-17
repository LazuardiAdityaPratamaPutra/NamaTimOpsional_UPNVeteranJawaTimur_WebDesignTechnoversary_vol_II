// Data dan penyimpanan lokal untuk dashboard admin (demo): status tindak lanjut, kotak masuk pesan, status terbit konten, dan log.
// Semua tersimpan di perangkat ini (localStorage). Laporan lapangan sungguhan datang dari IndexedDB (lihat db.js).
import hotspots from '../data/hotspot.json'
import pemukiman from '../data/pemukiman.json'
import { hitungZona } from './simulasi'
import { hitungRisiko } from './risiko'

export const TINDAK = ['baru', 'verifikasi', 'ditangani', 'selesai']
export const TINDAK_LABEL = { baru: ['Baru', 'New'], verifikasi: ['Diverifikasi', 'Verified'], ditangani: ['Ditangani', 'In progress'], selesai: ['Selesai', 'Resolved'] }
export const BATAS_LOG = 60

const jam = (n) => Date.now() - n * 3600_000
/** Laporan contoh agar dashboard tidak kosong saat pertama dibuka. Selalu berlabel demo. */
export const LAPORAN_DEMO = [
  { id: 'demo-r1', createdAt: jam(2), lat: -2.193, lon: 113.838, severity: 'berat', note: 'Api setinggi pinggang di semak dekat jalan desa, asap tebal ke arah barat.', en: { note: 'Waist-high fire in scrub near the village road, thick smoke drifting west.' } },
  { id: 'demo-r2', createdAt: jam(5), lat: -2.241, lon: 113.905, severity: 'sedang', note: 'Bara terlihat di lahan gambut kering, tidak ada petugas di lokasi.', en: { note: 'Embers visible on dry peatland, no officers on site.' } },
  { id: 'demo-r3', createdAt: jam(9), lat: -2.298, lon: 113.951, severity: 'ringan', note: 'Asap tipis dari tumpukan sisa tebasan.', en: { note: 'Thin smoke from a pile of cleared brush.' } },
  { id: 'demo-r4', createdAt: jam(14), lat: -2.158, lon: 113.972, severity: 'sedang', note: 'Api kecil menjalar di pinggir kebun, warga mulai membuat sekat.', en: { note: 'Small fire creeping along a plantation edge, residents are cutting a firebreak.' } },
  { id: 'demo-r5', createdAt: jam(27), lat: -2.221, lon: 113.884, severity: 'berat', note: 'Api meluas cepat searah angin, mendekati permukiman.', en: { note: 'Fire spreading fast downwind, approaching a settlement.' } },
  { id: 'demo-r6', createdAt: jam(41), lat: -2.262, lon: 113.93, severity: 'ringan', note: 'Titik asap kecil, sudah dipadamkan warga.', en: { note: 'Small smoke point, already put out by residents.' } },
]
const STATUS_DEMO = { 'demo-r1': 'verifikasi', 'demo-r4': 'ditangani', 'demo-r6': 'selesai' }

const PESAN_AWAL = [
  { id: 'demo-p1', nama: 'Rina Kusuma', email: 'rina@contoh.sch.id', topik: 'kolaborasi', waktu: jam(3), baca: false, pesan: 'Kami dari SMAN 2 ingin memakai materi edukasi PyraOps untuk kegiatan ekstrakurikuler lingkungan. Apakah ada paket cetaknya?', en: { pesan: 'We are from a high school and would like to use the PyraOps education materials for our environment club. Is there a printable pack?' } },
  { id: 'demo-p2', nama: 'Bagas Pratama', email: 'bagas@contoh.id', topik: 'galat', waktu: jam(20), baca: false, pesan: 'Di ponsel saya tombol Kirim di halaman Lapor tertutup keyboard saat mengetik catatan.', en: { pesan: 'On my phone the Send button on the Report page is hidden behind the keyboard while typing a note.' } },
  { id: 'demo-p3', nama: 'Komunitas Peduli Gambut', email: 'halo@contoh.org', topik: 'saran', waktu: jam(52), baca: true, pesan: 'Mungkin bisa ditambah legenda warna untuk zona 3, 6, dan 12 jam langsung di peta.', en: { pesan: 'Maybe add a colour legend for the 3, 6, and 12 hour zones directly on the map.' } },
  { id: 'demo-p4', nama: 'Dewi Anggraini', email: 'dewi@contoh.com', topik: 'lain', waktu: jam(90), baca: true, pesan: 'Terima kasih, kuisnya membantu anak saya memahami kenapa gambut sulit dipadamkan.', en: { pesan: 'Thank you, the quiz helped my child understand why peat fires are so hard to put out.' } },
]

const LOG_AWAL = [
  { t: jam(6), id: 'Menerbitkan: Mengapa gambut sulit dipadamkan?', en: 'Published: Why is peat so hard to put out?', oleh: 'Admin PyraOps' },
  { t: jam(26), id: 'Status laporan Desa Rawa Indah → Ditangani', en: 'Report near Desa Rawa Indah → In progress', oleh: 'Admin PyraOps' },
  { t: jam(30), id: 'Membaca pesan dari Komunitas Peduli Gambut', en: 'Read a message from Komunitas Peduli Gambut', oleh: 'Admin PyraOps' },
  { t: jam(49), id: 'Status laporan Desa Karang Jaya → Selesai', en: 'Report near Desa Karang Jaya → Resolved', oleh: 'Admin PyraOps' },
]

// ---- penyimpanan reaktif kecil (tanpa pustaka tambahan) ----
const K = { tindak: 'pyraops-tindak', log: 'pyraops-log', pesan: 'pyraops-pesan', konten: 'pyraops-konten' }
const baca = (kunci, awal) => { try { const v = JSON.parse(localStorage.getItem(kunci)); return v ?? awal } catch { return awal } }
const tulis = (kunci, nilai) => { try { localStorage.setItem(kunci, JSON.stringify(nilai)) } catch { /* abaikan */ } }

let cache = null
const dengar = new Set()
export const langganan = (fn) => { dengar.add(fn); return () => dengar.delete(fn) }
export const potret = () => (cache ??= { tindak: baca(K.tindak, {}), log: baca(K.log, LOG_AWAL), pesan: baca(K.pesan, PESAN_AWAL), konten: baca(K.konten, {}) })
export function setelUlang() { cache = null; dengar.forEach((f) => f()) } // untuk tes dan setelah localStorage dibersihkan
function ubah(bagian, fn) {
  const s = potret()
  const baru = fn(s[bagian])
  cache = { ...s, [bagian]: baru }
  tulis(K[bagian], baru)
  dengar.forEach((f) => f())
}

export const statusTindak = (id, tindak = potret().tindak) => tindak[id] ?? STATUS_DEMO[id] ?? 'baru'
export function setTindak(id, status) {
  if (!TINDAK.includes(status)) return
  ubah('tindak', (t) => ({ ...t, [id]: status }))
}
/** ket = ['teks Indonesia', 'English text']; oleh = nama pelaku. */
export function catat(ket, oleh = 'Admin') {
  ubah('log', (l) => [{ t: Date.now(), id: ket[0], en: ket[1], oleh }, ...l].slice(0, BATAS_LOG))
}
export function tambahPesan({ nama, email, topik, pesan }) {
  const p = { id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, nama: String(nama).trim(), email: String(email).trim(), topik, pesan: String(pesan).trim(), waktu: Date.now(), baca: false }
  ubah('pesan', (l) => [p, ...l].slice(0, 100))
  return p
}
export const tandaiBaca = (id, baca = true) => ubah('pesan', (l) => l.map((p) => (p.id === id ? { ...p, baca } : p)))
export const hapusPesan = (id) => ubah('pesan', (l) => l.filter((p) => p.id !== id))
/** Mengembalikan pesan yang baru dihapus ke posisi semula (untuk tombol Urungkan). */
export const kembalikanPesan = (p, i = 0) => ubah('pesan', (l) => (l.some((x) => x.id === p.id) ? l : [...l.slice(0, i), p, ...l.slice(i)]))
export const terbit = (id, konten = potret().konten) => konten[id] !== false
export const setTerbit = (id, nilai) => ubah('konten', (k) => ({ ...k, [id]: nilai }))

// ---- penggabungan dan hitungan turunan ----
/** Laporan IndexedDB (sungguhan) + contoh demo, terbaru di atas. Laporan demo ditandai `demo: true`. */
export function gabungLaporan(dariDb = []) {
  const nyata = dariDb.map((r) => ({ id: r.id, createdAt: r.createdAt, lat: r.lat, lon: r.lon, severity: r.severity, note: r.note, sync: r.status, hasFoto: Boolean(r.photo), demo: false }))
  const demo = LAPORAN_DEMO.map((r) => ({ ...r, sync: 'synced', hasFoto: false, demo: true }))
  return [...nyata, ...demo].sort((a, b) => b.createdAt - a.createdAt)
}

const rad = (d) => (d * Math.PI) / 180
/** Jarak lingkaran besar (km). */
export function jarakKm(a, b) {
  const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(x))
}
/** Pemukiman terdekat dari titik laporan: { nama, km }. */
export function terdekat(lat, lon) {
  let best = null
  for (const p of pemukiman) { const km = jarakKm({ lat, lon }, p); if (!best || km < best.km) best = { nama: p.nama, km } }
  return best
}

let risikoCache = null
/** Risiko tertinggi tiap pemukiman dari semua hotspot (angin dan lahan bawaan datanya). Diurutkan dari skor tertinggi. */
export function risikoSemua() {
  if (risikoCache) return risikoCache
  const peta = new Map()
  for (const h of hotspots) {
    const zona = hitungZona({ lat: h.lat, lon: h.lon, U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan })
    for (const r of hitungRisiko(pemukiman, zona)) {
      const lama = peta.get(r.nama)
      if (!lama || r.skor > lama.skor) peta.set(r.nama, { ...r, hotspotId: h.id })
    }
  }
  risikoCache = [...peta.values()].sort((a, b) => b.skor - a.skor || a.zona - b.zona || a.nama.localeCompare(b.nama))
  return risikoCache
}

/** Hitungan per tingkat dan per status tindak lanjut untuk grafik ringkasan. */
export function hitungLaporan(laporan, tindak) {
  const tingkat = { ringan: 0, sedang: 0, berat: 0 }
  const status = { baru: 0, verifikasi: 0, ditangani: 0, selesai: 0 }
  for (const r of laporan) { tingkat[r.severity] = (tingkat[r.severity] ?? 0) + 1; status[statusTindak(r.id, tindak)]++ }
  return { tingkat, status }
}
