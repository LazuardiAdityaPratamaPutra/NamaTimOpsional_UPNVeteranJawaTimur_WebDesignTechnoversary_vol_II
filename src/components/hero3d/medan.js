// Medan prosedural untuk hero 3D. Fungsi murni: dipakai untuk membentuk mesh dan menaruh pohon serta bangunan di atas tanah.
const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s) }
const halus = (t) => t * t * (3 - 2 * t)
const vnoise = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  const u = halus(xf), v = halus(yf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
export const fbm = (x, y, oktaf = 5) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oktaf; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5 } return s }
const langkahHalus = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }

export const UKURAN_KM = 44

/** Garis tengah sungai (km timur) pada z. Rumus yang sama dipakai di shader (sungaiX). */
export const sungaiX = (z) => -9 + 6 * Math.sin(z * 0.13) + 3 * Math.sin(z * 0.31 + 1)

/** Tinggi tanah (km, dilebihkan) di (x timur, z selatan) relatif titik api. Hampir datar di sekitar api (lahan gambut), berbukit di tepi, sungai mengalir di sisi barat. */
export function tinggi(x, z) {
  const mask = langkahHalus(6, 22, Math.hypot(x, z))
  const bukit = Math.pow(fbm(x * 0.09 + 3.1, z * 0.09 - 1.7, 4) * 1.25, 2.0) * 1.7 * mask
  const gelombang = (fbm(x * 0.45, z * 0.45, 2) - 0.4) * 0.07
  const dr = (x - sungaiX(z)) / 1.5
  return bukit + gelombang - 0.18 * Math.exp(-dr * dr)
}

/** Pembangkit acak deterministik (mulberry32): sebaran hutan sama di setiap muat. */
export const acak = (benih) => () => { benih |= 0; benih = (benih + 0x6d2b79f5) | 0; let t = Math.imul(benih ^ (benih >>> 15), 1 | benih); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
