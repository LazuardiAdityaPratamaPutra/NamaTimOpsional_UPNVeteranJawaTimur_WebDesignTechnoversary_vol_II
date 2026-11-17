import { describe, it, expect } from 'vitest'
import hotspots from '../src/data/hotspot.json'
import pemukiman from '../src/data/pemukiman.json'
import basemapRaw from '../src/data/basemap.geojson?raw'
import { hitungZona } from '../src/lib/simulasi'

describe('data sampel', () => {
  it('hotspot lengkap, unik, dan berlabel demo', () => {
    expect(new Set(hotspots.map((h) => h.id)).size).toBe(hotspots.length)
    hotspots.forEach((h) => {
      expect(['high', 'nominal', 'low']).toContain(h.confidence)
      expect(h.sumber).toBe('Data demo')
      expect(h.lat).toBeLessThan(-2); expect(h.lat).toBeGreaterThan(-2.5)
      expect(h.angin.U).toBeGreaterThanOrEqual(0)
      expect(Number.isNaN(Date.parse(h.acq_datetime))).toBe(false)
    })
  })
  it('pemukiman valid dan berlabel ilustrasi', () => {
    pemukiman.forEach((p) => {
      expect(['kecil', 'sedang', 'besar']).toContain(p.kelasPopulasi)
      expect(['desa', 'sekolah', 'faskes']).toContain(p.tipe)
      expect(p.sumber).toBe('Data ilustrasi')
    })
  })
  it('basemap berupa GeoJSON valid', () => {
    expect(JSON.parse(basemapRaw).type).toBe('FeatureCollection')
  })
  it('setiap hotspot bisa disimulasikan', () => {
    hotspots.forEach((h) => {
      const z = hitungZona({ lat: h.lat, lon: h.lon, U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan })
      expect(z[12].luasHa).toBeGreaterThan(z[3].luasHa)
    })
  })
})
