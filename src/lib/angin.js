// Angin per jam dari Open-Meteo. Fungsi murni (kecuali ambilAnginLangsung yang memanggil jaringan), tanpa UI.
// Sebuah "seri" = { waktu: ['YYYY-MM-DDTHH:00' waktu lokal], U: [m/s], theta: [derajat asal angin], lintang, bujur, elevasi, offsetDetik, sumber }.
import { WAKTU_ANGIN, KECEPATAN_ANGIN, ARAH_ANGIN, SUMBER_ANGIN } from '../data/angin'

export const MAKS_KECEPATAN_GRAFIK = 6 // m/s, tinggi penuh grafik

/** Seri arsip: data nyata 19–21 Agustus 2026 di sekitar Tanjung Batu (src/data/angin.js). Selalu tersedia tanpa jaringan. */
export const SERI_ARSIP = {
  waktu: WAKTU_ANGIN, U: KECEPATAN_ANGIN, theta: ARAH_ANGIN,
  lintang: SUMBER_ANGIN.lintang, bujur: SUMBER_ANGIN.bujur, elevasi: SUMBER_ANGIN.elevasi, offsetDetik: 25200, sumber: 'arsip',
}

/** Satu jam data (indeks dijepit ke rentang). Waktu dilabeli sebagai waktu dinding lokal lokasi (dibaca sebagai UTC agar tidak bergeser). */
export function bacaJam(seri, i) {
  const n = Math.min(Math.max(Math.round(i), 0), seri.waktu.length - 1)
  const waktu = seri.waktu[n]
  return { indeks: n, waktu, tanggal: waktu.slice(0, 10), jam: Number(waktu.slice(11, 13)), instan: new Date(`${waktu}:00Z`), U: seri.U[n], theta: seri.theta[n] }
}

/** Singkatan zona waktu Indonesia dari selisih UTC; di luar itu "UTC±n". */
export function namaZona(offsetDetik) {
  const jam = offsetDetik / 3600
  return { 7: 'WIB', 8: 'WITA', 9: 'WIT' }[jam] ?? `UTC${jam >= 0 ? '+' : '−'}${Math.abs(jam)}`
}

/** Rata-rata arah melingkar (derajat 0–359). Rata-rata biasa salah: 350° dan 10° harus 0°, bukan 180°. */
export function rataArah(deretan, bobot) {
  let s = 0, c = 0
  deretan.forEach((d, k) => { const w = bobot ? bobot[k] : 1; s += w * Math.sin((d * Math.PI) / 180); c += w * Math.cos((d * Math.PI) / 180) })
  return Math.round(((Math.atan2(s, c) * 180) / Math.PI + 360) % 360) % 360
}

/**
 * Ringkasan per hari: rata-rata dan maksimum kecepatan, arah dominan (rata-rata vektor berbobot kecepatan).
 * @returns {{tanggal:string, mulai:number, rata:number, maks:number, arah:number}[]}
 */
export function ringkasHarian(seri) {
  const hasil = []
  for (let m = 0; m < seri.waktu.length; m += 24) {
    const u = seri.U.slice(m, m + 24)
    const th = seri.theta.slice(m, m + 24)
    hasil.push({ tanggal: seri.waktu[m].slice(0, 10), mulai: m, rata: u.reduce((a, b) => a + b, 0) / u.length, maks: Math.max(...u), arah: rataArah(th, u) })
  }
  return hasil
}

/** Apakah parameter simulasi masih sama dengan data jam ke-i (artinya belum diubah manual)? */
export const samaDenganData = (seri, i, params) => {
  const d = bacaJam(seri, i)
  return params.U === d.U && params.theta === d.theta
}

// ---------- Angin langsung per lokasi ----------

/** URL Open-Meteo: kemarin, hari ini, dan besok (72 jam), kecepatan dalam m/s, zona waktu lokal lokasi. */
export const urlAnginLangsung = (lat, lon) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=auto&past_days=1&forecast_days=2`

/**
 * Memeriksa respons Open-Meteo dan mengubahnya menjadi seri. Mengembalikan null bila bentuknya tidak sesuai
 * (lebih baik memakai arsip daripada menyimulasikan angka yang tidak masuk akal).
 */
export function seriDariRespons(r) {
  const h = r?.hourly
  if (!h || !Array.isArray(h.time) || !Array.isArray(h.wind_speed_10m) || !Array.isArray(h.wind_direction_10m)) return null
  if (r.hourly_units?.wind_speed_10m !== 'm/s') return null
  const n = h.time.length
  if (n < 24 || n % 24 !== 0 || h.wind_speed_10m.length !== n || h.wind_direction_10m.length !== n) return null
  if (!h.time.every((w) => /^\d{4}-\d{2}-\d{2}T\d{2}:00$/.test(w))) return null
  const ok = h.wind_speed_10m.every((u) => Number.isFinite(u) && u >= 0 && u < 100) && h.wind_direction_10m.every((d) => Number.isFinite(d) && d >= 0 && d <= 360)
  if (!ok) return null
  return {
    waktu: h.time, U: h.wind_speed_10m, theta: h.wind_direction_10m.map((d) => Math.round(d) % 360),
    lintang: r.latitude, bujur: r.longitude, elevasi: r.elevation ?? null, offsetDetik: Number(r.utc_offset_seconds) || 0, sumber: 'langsung',
  }
}

const cache = new Map()
/** Mengambil angin langsung untuk koordinat; hasil disimpan per koordinat (dibulatkan 2 desimal) selama sesi. Melempar bila gagal. */
export async function ambilAnginLangsung(lat, lon, { fetchFn = (...a) => fetch(...a), timeoutMs = 8000, signal } = {}) {
  const kunci = `${lat.toFixed(2)},${lon.toFixed(2)}`
  if (cache.has(kunci)) return cache.get(kunci)
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), timeoutMs)
  signal?.addEventListener('abort', () => ac.abort(), { once: true })
  try {
    const res = await fetchFn(urlAnginLangsung(lat, lon), { signal: ac.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const seri = seriDariRespons(await res.json())
    if (!seri) throw new Error('Bentuk respons tidak dikenal')
    cache.set(kunci, seri)
    return seri
  } finally { clearTimeout(t) }
}
export const kosongkanCacheAngin = () => cache.clear()
