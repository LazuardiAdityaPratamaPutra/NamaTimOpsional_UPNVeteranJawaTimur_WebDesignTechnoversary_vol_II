// Penyimpanan offline laporan lapangan (IndexedDB lewat Dexie)
import Dexie from 'dexie'

export const db = new Dexie('pyraops')
// Hanya field yang di-index dideklarasikan; field lain (note, photo, dst.) tersimpan apa adanya
db.version(1).stores({ reports: 'id, createdAt, status' })

export const TINGKAT = ['ringan', 'sedang', 'berat']

/** Menyimpan laporan baru dengan status pending. */
export async function tambahLaporan({ lat, lon, accuracy = null, severity, note = '', photo = null, pemilik = null }) {
  if (!(typeof lat === 'number' && lat >= -90 && lat <= 90 && typeof lon === 'number' && lon >= -180 && lon <= 180)) {
    throw new Error('Koordinat tidak valid')
  }
  if (!TINGKAT.includes(severity)) throw new Error('Tingkat keparahan tidak valid')
  const laporan = {
    id: crypto.randomUUID(), // UUID dibuat di klien: dipakai server untuk idempotensi
    createdAt: Date.now(), lat, lon, accuracy, severity,
    note: String(note).trim().slice(0, 500),
    photo, // Blob JPEG <= 800px
    status: 'pending', syncedAt: null, tries: 0,
    pemilik, // email akun pelapor (null = tamu); dipakai halaman Akun > Laporan saya
  }
  await db.reports.add(laporan)
  return laporan
}

/** Menghapus satu laporan dari perangkat (daftar langsung ikut berubah lewat liveQuery). */
export async function hapusLaporan(id) {
  await db.reports.delete(id)
}
