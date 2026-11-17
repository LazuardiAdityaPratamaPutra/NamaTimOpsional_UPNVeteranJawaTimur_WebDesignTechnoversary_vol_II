import { describe, it, expect } from 'vitest'
import { zonaTercepat, hitungSkor, kategoriRisiko, hitungRisiko } from '../src/lib/risiko'
import { hitungZona } from '../src/lib/simulasi'
import hotspots from '../src/data/hotspot.json'
import pemukiman from '../src/data/pemukiman.json'

// Zona buatan: kotak bersarang di sekitar (0,0) dengan setengah sisi 1, 2, 3 derajat
const kotak = (h) => ({ type: 'Polygon', coordinates: [[[-h, -h], [h, -h], [h, h], [-h, h], [-h, -h]]] })
const ZONA = { 3: { poligon: kotak(1) }, 6: { poligon: kotak(2) }, 12: { poligon: kotak(3) } }
const P = (lon, lat, tipe, kelasPopulasi, nama = 'X') => ({ nama, lon, lat, tipe, kelasPopulasi })

describe('zona tercepat', () => {
  it('mengambil zona terkecil yang memuat titik', () => {
    expect(zonaTercepat(0.5, 0.5, ZONA)).toBe(3)
    expect(zonaTercepat(1.5, 0, ZONA)).toBe(6)
    expect(zonaTercepat(2.5, 0, ZONA)).toBe(12)
    expect(zonaTercepat(5, 5, ZONA)).toBeNull()
  })
})

describe('skor', () => {
  it('skor zona x faktor kerentanan', () => {
    expect(hitungSkor(3, P(0, 0, 'desa', 'kecil'))).toBe(80)
    expect(hitungSkor(3, P(0, 0, 'desa', 'sedang'))).toBe(100)
    expect(hitungSkor(6, P(0, 0, 'desa', 'sedang'))).toBe(70)
    expect(hitungSkor(6, P(0, 0, 'desa', 'kecil'))).toBe(56)
    expect(hitungSkor(6, P(0, 0, 'desa', 'besar'))).toBe(84)
    expect(hitungSkor(12, P(0, 0, 'desa', 'sedang'))).toBe(40)
  })
  it('dibatasi maksimum 100', () => {
    expect(hitungSkor(3, P(0, 0, 'desa', 'besar'))).toBe(100)
  })
  it('sekolah dan faskes memakai faktor 1,2 apa pun kelasnya', () => {
    expect(hitungSkor(12, P(0, 0, 'sekolah', 'kecil'))).toBe(48)
    expect(hitungSkor(6, P(0, 0, 'faskes', 'kecil'))).toBe(84)
  })
})

describe('kategori', () => {
  it('batas kategori', () => {
    expect(kategoriRisiko(100)).toBe('kritis')
    expect(kategoriRisiko(80)).toBe('kritis')
    expect(kategoriRisiko(79.9)).toBe('tinggi')
    expect(kategoriRisiko(50)).toBe('tinggi')
    expect(kategoriRisiko(49.9)).toBe('waspada')
  })
})

describe('hitungRisiko', () => {
  const daftar = [
    P(2.5, 0, 'desa', 'sedang', 'Luar-12'),
    P(0.5, 0, 'desa', 'kecil', 'Dalam-3'),
    P(1.5, 0, 'desa', 'besar', 'Zona-6'),
    P(9, 9, 'desa', 'besar', 'Aman'),
  ]
  it('hanya memuat yang di dalam zona dan urut skor tertinggi', () => {
    const r = hitungRisiko(daftar, ZONA)
    expect(r.map((x) => x.nama)).toEqual(['Zona-6', 'Dalam-3', 'Luar-12'])
    expect(r.map((x) => x.kategori)).toEqual(['kritis', 'kritis', 'waspada'])
  })
})

describe('data sampel + simulasi', () => {
  it('ada hotspot yang mengancam pemukiman, kategori selalu valid', () => {
    let total = 0
    hotspots.forEach((h) => {
      const zona = hitungZona({ lat: h.lat, lon: h.lon, U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan })
      const r = hitungRisiko(pemukiman, zona)
      total += r.length
      r.forEach((x) => expect(['kritis', 'tinggi', 'waspada']).toContain(x.kategori))
    })
    expect(total).toBeGreaterThan(0)
  })
})
