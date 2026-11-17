// Prioritas penanganan hotspot: skor berbasis aturan dari beberapa faktor, bobot bisa diatur pengguna.
// Curah hujan (curahHujan7h) dan kelas populasi adalah DATA ILUSTRASI, bukan pengukuran nyata.
import { jarakKm } from './admin'
import { faktorKerentanan, hitungRisiko } from './risiko'
import { hitungZona } from './simulasi'

/** Radius (km) permukiman yang dianggap terdampak dari sebuah hotspot. */
export const RADIUS_DAMPAK_KM = 15
/** Curah hujan 7 hari (mm) yang dianggap sudah cukup basah: skor hujan 0. */
export const HUJAN_BASAH_MM = 60

/** [kunci, label ID, label EN, kelas warna, bobot awal] */
export const FAKTOR = [
  ['penduduk', 'Penduduk terdampak', 'Population at risk', 'bg-flame', 20],
  ['simulasi', 'Jangkauan simulasi', 'Simulated reach', 'bg-ink', 25],
  ['hujan', 'Curah hujan rendah', 'Low rainfall', 'bg-amber', 20],
  ['lahan', 'Jenis lahan', 'Land type', 'bg-canopy', 15],
  ['angin', 'Kecepatan angin', 'Wind speed', 'bg-mint', 10],
  ['keyakinan', 'Keyakinan deteksi', 'Detection confidence', 'bg-ember', 10],
]
export const BOBOT_AWAL = Object.fromEntries(FAKTOR.map(([k, , , , w]) => [k, w]))

const LAHAN = { gambut: 100, semak: 70, hutan: 55, pertanian: 40 }
const YAKIN = { high: 100, nominal: 65, low: 30 }

/** Jumlah skor risiko permukiman yang dianggap menjangkau skor simulasi penuh. */
export const SKALA_SIMULASI = 100

const cacheAncaman = new Map()
/**
 * Hasil simulasi sebaran api (angin dan lahan bawaan hotspot) terhadap permukiman:
 * { jumlah, kritis, skorTotal }. Memakai model yang sama dengan panel Simulasi.
 */
export function ancamanSimulasi(h, daftarPemukiman) {
  const kunci = `${h.id}|${daftarPemukiman.length}`
  if (!cacheAncaman.has(kunci)) {
    const zona = hitungZona({ lat: h.lat, lon: h.lon, U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan })
    const hasil = hitungRisiko(daftarPemukiman, zona)
    cacheAncaman.set(kunci, {
      jumlah: hasil.length,
      kritis: hasil.filter((r) => r.kategori === 'kritis').length,
      skorTotal: hasil.reduce((a, r) => a + r.skor, 0),
    })
  }
  return cacheAncaman.get(kunci)
}

const batas = (x) => Math.max(0, Math.min(100, x))

/** Nilai tiap faktor 0-100 untuk satu hotspot. */
export function nilaiFaktor(h, daftarPemukiman) {
  let beban = 0
  for (const p of daftarPemukiman) {
    const km = jarakKm(h, p)
    if (km <= RADIUS_DAMPAK_KM) beban += faktorKerentanan(p) * (1 - km / RADIUS_DAMPAK_KM * 0.5)
  }
  const anc = ancamanSimulasi(h, daftarPemukiman)
  return {
    simulasi: batas(anc.skorTotal / SKALA_SIMULASI * 100),
    penduduk: batas(beban / 7 * 100), // 7 = beban ilustratif yang dianggap penuh
    hujan: batas((1 - (h.curahHujan7h ?? HUJAN_BASAH_MM) / HUJAN_BASAH_MM) * 100),
    lahan: LAHAN[h.jenisLahan] ?? 50,
    angin: batas((h.angin?.U ?? 0) / 8 * 100),
    keyakinan: YAKIN[h.confidence] ?? 50,
  }
}

/** Ambang skor tiap tingkat (juga dipakai sebagai penanda pada batang skor). */
export const AMBANG = { sedang: 45, utama: 62 }
/** Tingkat: >= 62 utama, >= 45 sedang, selebihnya pantau. */
export function tingkatPrioritas(skor) {
  return skor >= AMBANG.utama ? 'utama' : skor >= AMBANG.sedang ? 'sedang' : 'pantau'
}

/** Skenario bobot siap pakai (tiap jumlahnya 100, sama dengan bobot awal). */
export const SKENARIO = [
  ['awal', 'Seimbang', 'Balanced', BOBOT_AWAL],
  ['warga', 'Warga dulu', 'People first', { penduduk: 45, simulasi: 20, hujan: 10, lahan: 10, angin: 10, keyakinan: 5 }],
  ['api', 'Perilaku api', 'Fire behaviour', { penduduk: 5, simulasi: 30, hujan: 15, lahan: 20, angin: 25, keyakinan: 5 }],
]

/**
 * Daftar hotspot terurut dari prioritas tertinggi.
 * Tiap item: { id, hotspot, rank, skor, tingkat, nilai, sumbang, utama } (sumbang = poin per faktor, jumlahnya = skor).
 */
export function hitungPrioritas(daftarHotspot, daftarPemukiman, bobot = BOBOT_AWAL) {
  const total = FAKTOR.reduce((a, [k]) => a + Math.max(0, bobot[k] ?? 0), 0)
  const hasil = daftarHotspot.map((h) => {
    const nilai = nilaiFaktor(h, daftarPemukiman)
    const sumbang = {}
    let skor = 0
    for (const [k] of FAKTOR) {
      sumbang[k] = total > 0 ? nilai[k] * Math.max(0, bobot[k] ?? 0) / total : 0
      skor += sumbang[k]
    }
    skor = Math.round(skor * 10) / 10
    const utama = FAKTOR.map(([k]) => k).reduce((a, k) => (sumbang[k] > sumbang[a] ? k : a))
    return { id: h.id, hotspot: h, ancaman: ancamanSimulasi(h, daftarPemukiman), skor, tingkat: tingkatPrioritas(skor), nilai, sumbang, utama }
  })
  hasil.sort((a, b) => b.skor - a.skor || a.id.localeCompare(b.id))
  return hasil.map((r, i) => ({ ...r, rank: i + 1 }))
}
