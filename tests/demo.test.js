import { describe, it, expect } from 'vitest'
import { DEMO } from '../src/data/demo'
import { LANGKAH_TUR } from '../src/data/tur'
import hotspots from '../src/data/hotspot.json'
import pemukiman from '../src/data/pemukiman.json'
import { SIM } from '../src/lib/config'
import { hitungZona } from '../src/lib/simulasi'
import { hitungRisiko } from '../src/lib/risiko'
import { sudahLihatTur, tandaiTur } from '../src/lib/tur'

describe('skenario demo', () => {
  const h = hotspots.find((x) => x.id === DEMO.hotspotId)
  it('merujuk data yang ada dan parameter valid', () => {
    expect(h).toBeTruthy()
    expect(SIM.faktorLahan[DEMO.jenisLahan]).toBeDefined()
    expect(DEMO.U).toBeGreaterThanOrEqual(0)
    expect(DEMO.t).toBeGreaterThan(0)
    expect(DEMO.t).toBeLessThanOrEqual(SIM.maksJam)
  })
  it('menghasilkan daftar risiko yang informatif (ada Kritis dan Tinggi)', () => {
    const zona = hitungZona({ lat: h.lat, lon: h.lon, U: DEMO.U, theta: DEMO.theta, jenisLahan: DEMO.jenisLahan })
    const kategori = hitungRisiko(pemukiman, zona).map((r) => r.kategori)
    expect(kategori).toContain('kritis')
    expect(kategori).toContain('tinggi')
  })
})

describe('tur terpandu', () => {
  it('punya 5 langkah lengkap dan langkah terakhir menaut ke Lapor', () => {
    expect(LANGKAH_TUR).toHaveLength(6)
    LANGKAH_TUR.forEach((s) => { expect(s.selector).toMatch(/^\[data-tur="/); expect(s.judul).toBeTruthy(); expect(s.isi).toBeTruthy() })
    expect(LANGKAH_TUR.at(-1).tautan.ke).toBe('/lapor')
  })
  it('penyimpanan flag aman bila localStorage tidak ada', () => {
    expect(sudahLihatTur()).toBe(false)
    expect(() => tandaiTur()).not.toThrow()
  })
})
