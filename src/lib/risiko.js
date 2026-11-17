// Deteksi pemukiman terancam dan skor risiko (berbasis aturan, bisa dijelaskan)
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { RISIKO, SIM } from './config'

/** Zona tercepat (3, 6, atau 12 jam) yang memuat titik; null bila di luar semua zona. */
export function zonaTercepat(lon, lat, zona) {
  const titik = { type: 'Point', coordinates: [lon, lat] }
  for (const jam of SIM.zonaJam) { // urut 3, 6, 12: yang pertama cocok = tercepat
    if (booleanPointInPolygon(titik, zona[jam].poligon)) return jam
  }
  return null
}

/** Sekolah dan fasilitas kesehatan memakai faktor khusus; selebihnya menurut kelas populasi. */
export function faktorKerentanan({ tipe, kelasPopulasi }) {
  return RISIKO.faktorKhusus[tipe] ?? RISIKO.faktorKelas[kelasPopulasi]
}

/** Skor = skor zona x faktor kerentanan, dibatasi maksimum, dibulatkan 1 desimal. */
export function hitungSkor(jam, pemukiman) {
  const mentah = RISIKO.skorZona[jam] * faktorKerentanan(pemukiman)
  return Math.round(Math.min(RISIKO.maks, mentah) * 10) / 10
}

/** Kategori: >= 80 kritis; 50-79 tinggi; < 50 waspada. */
export function kategoriRisiko(skor) {
  if (skor >= RISIKO.batasKritis) return 'kritis'
  if (skor >= RISIKO.batasTinggi) return 'tinggi'
  return 'waspada'
}

/** Daftar pemukiman terancam, diurutkan dari skor tertinggi. zona = hasil hitungZona(). */
export function hitungRisiko(daftarPemukiman, zona) {
  const hasil = []
  for (const p of daftarPemukiman) {
    const jam = zonaTercepat(p.lon, p.lat, zona)
    if (jam === null) continue
    const skor = hitungSkor(jam, p)
    hasil.push({ ...p, zona: jam, skor, kategori: kategoriRisiko(skor) })
  }
  return hasil.sort((a, b) => b.skor - a.skor || a.zona - b.zona || a.nama.localeCompare(b.nama))
}
