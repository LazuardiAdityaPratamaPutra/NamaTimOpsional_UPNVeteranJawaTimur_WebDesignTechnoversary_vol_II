import { describe, it, expect } from 'vitest'
import hotspots from '../src/data/hotspot.json'
import pemukiman from '../src/data/pemukiman.json'
import { ancamanSimulasi, hitungPrioritas, nilaiFaktor, BOBOT_AWAL, FAKTOR, tingkatPrioritas } from '../src/lib/prioritas'

describe('prioritas hotspot', () => {
  it('setiap hotspot punya curah hujan ilustrasi', () => {
    hotspots.forEach((h) => expect(typeof h.curahHujan7h).toBe('number'))
  })
  it('semua hotspot terurut menurun dengan rank 1..n dan skor 0-100', () => {
    const r = hitungPrioritas(hotspots, pemukiman)
    expect(r).toHaveLength(hotspots.length)
    r.forEach((x, i) => { expect(x.rank).toBe(i + 1); expect(x.skor).toBeGreaterThanOrEqual(0); expect(x.skor).toBeLessThanOrEqual(100); if (i) expect(x.skor).toBeLessThanOrEqual(r[i - 1].skor) })
  })
  it('hujan lebih sedikit menaikkan skor, dengan faktor lain tetap', () => {
    const h = hotspots[0]
    expect(nilaiFaktor({ ...h, curahHujan7h: 0 }, pemukiman).hujan).toBe(100)
    expect(nilaiFaktor({ ...h, curahHujan7h: 80 }, pemukiman).hujan).toBe(0)
  })
  it('bobot nol menghilangkan pengaruh faktor; sumbangan berjumlah skor', () => {
    const r = hitungPrioritas(hotspots, pemukiman, { ...BOBOT_AWAL, hujan: 0 })
    r.forEach((x) => {
      expect(x.sumbang.hujan).toBe(0)
      const jml = FAKTOR.reduce((a, [k]) => a + x.sumbang[k], 0)
      expect(Math.abs(jml - x.skor)).toBeLessThan(0.1)
    })
  })
  it('semua bobot nol tidak menghasilkan NaN', () => {
    const nol = Object.fromEntries(FAKTOR.map(([k]) => [k, 0]))
    hitungPrioritas(hotspots, pemukiman, nol).forEach((x) => expect(x.skor).toBe(0))
  })
  it('jangkauan simulasi memakai model sebaran yang sama dan menaikkan skor', () => {
    const a = hotspots.map((h) => ancamanSimulasi(h, pemukiman))
    a.forEach((x) => { expect(x.jumlah).toBeGreaterThanOrEqual(0); expect(x.kritis).toBeLessThanOrEqual(x.jumlah) })
    expect(a.some((x) => x.jumlah > 0)).toBe(true)
    const maks = hotspots[a.findIndex((x) => x.skorTotal === Math.max(...a.map((y) => y.skorTotal)))]
    const hanya = Object.fromEntries(FAKTOR.map(([k]) => [k, k === 'simulasi' ? 50 : 0]))
    expect(hitungPrioritas(hotspots, pemukiman, hanya)[0].id).toBe(maks.id)
  })
  it('ambang tingkat', () => {
    expect(tingkatPrioritas(70)).toBe('utama'); expect(tingkatPrioritas(50)).toBe('sedang'); expect(tingkatPrioritas(10)).toBe('pantau')
  })
})
