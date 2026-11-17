// Mesin simulasi sebaran api: model edukatif berbasis elips. Fungsi murni, tanpa UI.
import area from '@turf/area'
import { SIM } from './config'

const rad = (d) => (d * Math.PI) / 180

/**
 * Menghitung parameter elips untuk waktu t (jam).
 * @param {{U:number, jenisLahan:string, t:number}} p  U = kecepatan angin (m/s)
 */
export function hitungParameter({ U, jenisLahan = 'hutan', t }) {
  const F = SIM.faktorLahan[jenisLahan]
  if (F === undefined) throw new Error(`Jenis lahan tidak dikenal: ${jenisLahan}`)
  if (!(U >= 0)) throw new Error('Kecepatan angin harus >= 0')
  if (!(t >= 0)) throw new Error('Waktu harus >= 0')

  // 1. Laju searah angin: dasar x bahan bakar x pengaruh angin
  const Rh = SIM.R0 * F * (1 + SIM.koefAngin * U)
  // 2. Laju melawan angin jauh lebih lambat
  const Rb = SIM.rasioBelakang * Rh
  // 3. Makin kencang angin, makin lonjong (tanpa angin: lingkaran)
  const LW = Math.min(SIM.maksLW, 1 + SIM.koefLW * U)
  // 4. Jarak tempuh api ke depan dan ke belakang pada waktu t
  const ah = Rh * t
  const ab = Rb * t
  // 5. Elips: sumbu panjang menjangkau depan + belakang; pusat bergeser searah angin
  const a = (ah + ab) / 2
  const b = a / LW
  const c = (ah - ab) / 2
  return { Rh, Rb, LW, ah, ab, a, b, c }
}

/**
 * Poligon elips sebaran api sebagai GeoJSON Polygon ([lon, lat]).
 * @param {{lat:number, lon:number, U:number, theta:number, jenisLahan?:string, t:number}} p
 *   theta = arah ASAL angin (derajat, 0 = utara)
 */
export function hitungPoligon({ lat, lon, U, theta, jenisLahan = 'hutan', t }) {
  const { a, b, c } = hitungParameter({ U, jenisLahan, t })
  // 6. Api menjalar ke arah berlawanan dengan asal angin
  const phi = rad((((theta + 180) % 360) + 360) % 360)
  const sinP = Math.sin(phi)
  const cosP = Math.cos(phi)
  // Pusat elips = titik ignisi digeser sejauh c ke arah phi (km, timur/utara)
  const pusatT = c * sinP
  const pusatU = c * cosP
  // 7. Konversi km -> derajat (bujur menyempit mengikuti cos lintang)
  const kmLon = SIM.kmPerDerajat * Math.cos(rad(lat))
  const n = SIM.titikPoligon
  const ring = []
  for (let i = 0; i < n; i++) {
    const s = (2 * Math.PI * i) / n
    const u = a * Math.cos(s) // sepanjang arah penjalaran
    const v = b * Math.sin(s) // tegak lurus arah penjalaran
    const timur = pusatT + u * sinP + v * cosP
    const utara = pusatU + u * cosP - v * sinP
    ring.push([lon + timur / kmLon, lat + utara / SIM.kmPerDerajat])
  }
  ring.push(ring[0]) // cincin GeoJSON harus tertutup
  return { type: 'Polygon', coordinates: [ring] }
}

/** 8. Luas poligon dalam hektare (turf.area menghasilkan m2; 1 ha = 10.000 m2). */
export function luasHa(poligon) {
  return area({ type: 'Feature', properties: {}, geometry: poligon }) / 10000
}

/** Poligon + luas untuk waktu kontinu (slider 0-12 jam). */
export function hitungKontinu(params, t) {
  const tt = Math.min(Math.max(t, 0), SIM.maksJam)
  const poligon = hitungPoligon({ ...params, t: tt })
  return { t: tt, poligon, luasHa: luasHa(poligon), ...hitungParameter({ ...params, t: tt }) }
}

/** Zona 3, 6, dan 12 jam: { 3: {poligon, luasHa}, 6: ..., 12: ... } */
export function hitungZona(params) {
  const zona = {}
  for (const jam of SIM.zonaJam) {
    const poligon = hitungPoligon({ ...params, t: jam })
    zona[jam] = { poligon, luasHa: luasHa(poligon) }
  }
  return zona
}
