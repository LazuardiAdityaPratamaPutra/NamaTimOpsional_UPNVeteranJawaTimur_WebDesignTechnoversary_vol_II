import { hitungParameter, hitungZona } from '../../lib/simulasi'
import { hitungRisiko } from '../../lib/risiko'
import hotspots from '../../data/hotspot.json'
import pemukiman from '../../data/pemukiman.json'

// Keadaan demo tunggal untuk adegan 3D (hotspot H-06, angin dari data demo). Dipakai Beranda dan Tentang.
const h = hotspots.find((x) => x.id === 'H-06')
export const ANGIN_ADEGAN = { U: h.angin.U, theta: h.angin.theta }
const KM_LON = 111.32 * Math.cos((h.lat * Math.PI) / 180)
const KM_LAT = 111.32
const JAM = [3, 6, 12]

const par = JAM.map((t) => hitungParameter({ U: ANGIN_ADEGAN.U, jenisLahan: h.jenisLahan, t }))
const zona = hitungZona({ lat: h.lat, lon: h.lon, U: ANGIN_ADEGAN.U, theta: ANGIN_ADEGAN.theta, jenisLahan: h.jenisLahan })
export const RISIKO_ADEGAN = hitungRisiko(pemukiman, zona)
const kat = Object.fromEntries(RISIKO_ADEGAN.map((r) => [r.nama, r.kategori]))
const teratas = new Set(RISIKO_ADEGAN.slice(0, 3).map((r) => r.nama))
const pem = pemukiman
  .map((p) => ({ nama: p.nama, tipe: p.tipe, e: (p.lon - h.lon) * KM_LON, n: (p.lat - h.lat) * KM_LAT }))
  .filter((p) => Math.abs(p.e) < 19 && Math.abs(p.n) < 19)
  .map((p) => ({ ...p, kategori: kat[p.nama] }))
export const DATA_ADEGAN = {
  a: par.map((p) => p.a), b: par.map((p) => p.b), c: par.map((p) => (p.ah - p.ab) / 2),
  phi: (((ANGIN_ADEGAN.theta + 180) % 360) * Math.PI) / 180, U: ANGIN_ADEGAN.U,
  pemukiman: pem, berlabel: pem.filter((p) => teratas.has(p.nama)),
}

/** True bila perangkat bisa menjalankan WebGL2 dan bukan lingkungan uji (jsdom). */
export function dukungWebGL() {
  if (typeof document === 'undefined' || /jsdom/i.test(navigator.userAgent)) return false
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}
