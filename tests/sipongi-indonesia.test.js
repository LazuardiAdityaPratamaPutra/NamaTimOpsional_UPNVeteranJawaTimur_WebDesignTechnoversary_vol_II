// Titik panas nyata SiPongi di luar Kaltim (19-21 Agustus 2026): format sama dengan sipongi-kaltim.json
import { describe, it, expect } from 'vitest'
import luar from '../src/data/sipongi-indonesia.json'
import kaltim from '../src/data/sipongi-kaltim.json'

describe('data SiPongi se-Indonesia (di luar Kaltim)', () => {
  it('jumlah per tanggal sesuai berkas sumber tim dan atribusi wajib ada', () => {
    expect(luar.sumber).toBe('SIPONGI KEMENHUT')
    expect(luar.titik).toHaveLength(1978)
    const per = (d) => luar.titik.filter((t) => t[2] === d).length
    expect([per('2026-08-19'), per('2026-08-20'), per('2026-08-21')]).toEqual([892, 480, 606])
  })
  it('koordinat di wilayah Indonesia, baris lengkap, dan tidak menggandakan titik Kaltim', () => {
    const kunci = new Set(kaltim.titik.map((t) => `${t[0]}|${t[1]}|${t[2]}`))
    for (const t of luar.titik) {
      expect(t).toHaveLength(8)
      expect(t[0]).toBeGreaterThan(-11.5); expect(t[0]).toBeLessThan(6.5)
      expect(t[1]).toBeGreaterThan(94); expect(t[1]).toBeLessThan(142)
      expect(t[3]).toMatch(/^\d{2}:\d{2}$/)
      expect(kunci.has(`${t[0]}|${t[1]}|${t[2]}`)).toBe(false)
    }
  })
})
