import { describe, it, expect } from 'vitest'
import booleanWithin from '@turf/boolean-within'
import centroid from '@turf/centroid'
import distance from '@turf/distance'
import { hitungParameter, hitungPoligon, hitungZona, hitungKontinu, luasHa } from '../src/lib/simulasi'

const IGNISI = { lat: -2.2, lon: 113.9 } // titik contoh (Kalimantan Tengah)
const feat = (g) => ({ type: 'Feature', properties: {}, geometry: g })

describe('parameter (contoh PRD: U=5, F=1, t=6)', () => {
  it('sesuai hitungan tangan', () => {
    const p = hitungParameter({ U: 5, jenisLahan: 'hutan', t: 6 })
    expect(p.Rh).toBeCloseTo(0.5)
    expect(p.ah).toBeCloseTo(3.0)
    expect(p.ab).toBeCloseTo(0.6)
    expect(p.a).toBeCloseTo(1.8)
    expect(p.LW).toBeCloseTo(2)
    expect(p.b).toBeCloseTo(0.9)
  })
  it('LW dibatasi maksimum 4', () => {
    expect(hitungParameter({ U: 30, t: 1 }).LW).toBe(4)
  })
  it('menolak masukan tidak valid', () => {
    expect(() => hitungParameter({ U: 1, jenisLahan: 'laut', t: 1 })).toThrow()
    expect(() => hitungParameter({ U: -1, t: 1 })).toThrow()
  })
})

describe('luas', () => {
  it('U=5, F=1, t=6 sekitar 509 ha (toleransi 2%)', () => {
    const poli = hitungPoligon({ ...IGNISI, U: 5, theta: 45, jenisLahan: 'hutan', t: 6 })
    expect(luasHa(poli)).toBeGreaterThan(509 * 0.98)
    expect(luasHa(poli)).toBeLessThan(509 * 1.02)
  })
})

describe('bentuk dan arah', () => {
  it('U=0 menghasilkan lingkaran', () => {
    const poli = hitungPoligon({ ...IGNISI, U: 0, theta: 0, t: 6 })
    const pusat = centroid(feat(poli))
    const jarak = poli.coordinates[0].slice(0, -1).map((k) => distance(pusat, k, { units: 'kilometers' }))
    const rata = jarak.reduce((s, x) => s + x, 0) / jarak.length
    jarak.forEach((d) => expect(Math.abs(d - rata) / rata).toBeLessThan(0.01))
  })
  it('angin dari timur (90) menggeser pusat ke barat', () => {
    const poli = hitungPoligon({ ...IGNISI, U: 5, theta: 90, t: 6 })
    const [lon, lat] = centroid(feat(poli)).geometry.coordinates
    expect(lon).toBeLessThan(IGNISI.lon)
    expect(Math.abs(lat - IGNISI.lat)).toBeLessThan(1e-6)
  })
  it('angin dari utara (0) menggeser pusat ke selatan', () => {
    const poli = hitungPoligon({ ...IGNISI, U: 5, theta: 0, t: 6 })
    const [, lat] = centroid(feat(poli)).geometry.coordinates
    expect(lat).toBeLessThan(IGNISI.lat)
  })
  it('poligon tertutup dengan 48 titik unik', () => {
    const ring = hitungPoligon({ ...IGNISI, U: 3, theta: 200, t: 3 }).coordinates[0]
    expect(ring).toHaveLength(49)
    expect(ring[0]).toEqual(ring[48])
  })
})

describe('zona bersarang', () => {
  const kasus = [
    { U: 0, theta: 0, jenisLahan: 'hutan' },
    { U: 5, theta: 90, jenisLahan: 'semak' },
    { U: 12, theta: 250, jenisLahan: 'gambut' },
    { U: 20, theta: 359, jenisLahan: 'pertanian' },
  ]
  kasus.forEach((k) => {
    it(`3 jam di dalam 6 jam, 6 jam di dalam 12 jam (${JSON.stringify(k)})`, () => {
      const z = hitungZona({ ...IGNISI, ...k })
      expect(booleanWithin(feat(z[3].poligon), feat(z[6].poligon))).toBe(true)
      expect(booleanWithin(feat(z[6].poligon), feat(z[12].poligon))).toBe(true)
      expect(z[3].luasHa).toBeLessThan(z[6].luasHa)
      expect(z[6].luasHa).toBeLessThan(z[12].luasHa)
    })
  })
})

describe('waktu kontinu dan performa', () => {
  it('t di luar 0-12 dijepit', () => {
    expect(hitungKontinu({ ...IGNISI, U: 5, theta: 0 }, 99).t).toBe(12)
    expect(hitungKontinu({ ...IGNISI, U: 5, theta: 0 }, -3).t).toBe(0)
  })
  it('hitungZona berjalan < 50 ms', () => {
    const t0 = performance.now()
    hitungZona({ ...IGNISI, U: 5, theta: 90 })
    expect(performance.now() - t0).toBeLessThan(50)
  })
})
