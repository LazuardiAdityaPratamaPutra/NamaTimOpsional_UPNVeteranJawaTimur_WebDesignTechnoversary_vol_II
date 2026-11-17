// Snapshot SiPongi harus tetap sesuai berkas sumber tim: 260 titik High di Kaltim, 19–21 Agustus 2026,
// dengan jumlah per hari 103/79/78 (19 Agu: 77 di Berau, sama dengan catatan data_karhut.xlsx baris 2.4).
import { describe, it, expect } from 'vitest'
import sp from '../src/data/sipongi-kaltim.json'

describe('data SiPongi Kalimantan Timur', () => {
  it('jumlah dan rentang tanggal sesuai sumber', () => {
    expect(sp.titik).toHaveLength(260)
    const per = (d) => sp.titik.filter((t) => t[2] === d).length
    expect([per('2026-08-19'), per('2026-08-20'), per('2026-08-21')]).toEqual([103, 79, 78])
    expect(sp.titik.filter((t) => t[2] === '2026-08-19' && t[5] === 'Berau')).toHaveLength(77)
  })
  it('atribusi wajib dan koordinat di dalam batas', () => {
    expect(sp.sumber).toBe('SIPONGI KEMENHUT')
    const [[la0, lo0], [la1, lo1]] = sp.batas
    for (const [lat, lon] of sp.titik) { expect(lat).toBeGreaterThanOrEqual(la0); expect(lat).toBeLessThanOrEqual(la1); expect(lon).toBeGreaterThanOrEqual(lo0); expect(lon).toBeLessThanOrEqual(lo1) }
  })
})
