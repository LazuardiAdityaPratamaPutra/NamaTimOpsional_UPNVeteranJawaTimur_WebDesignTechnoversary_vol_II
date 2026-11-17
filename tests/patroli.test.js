import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { PATROLI } from '../src/data/patroli'
import { KUIS } from '../src/data/kuis'

const VISUAL = ['api', 'bakar', 'gambut', 'hotspot', 'angin']

describe('data game Patroli Hutan', () => {
  it('punya situasi dengan id unik dan visual yang dikenal adegan', () => {
    expect(PATROLI.length).toBeGreaterThanOrEqual(3)
    expect(new Set(PATROLI.map((p) => p.id)).size).toBe(PATROLI.length)
    PATROLI.forEach((p) => expect(VISUAL).toContain(p.visual))
  })
  it.each(PATROLI.map((p) => [p.id, p]))('%s: tiga opsi, jawaban benar valid, dua bahasa setara', (_, p) => {
    expect(p.opsi).toHaveLength(3)
    expect(p.benar).toBeGreaterThanOrEqual(0); expect(p.benar).toBeLessThan(3)
    expect(p.en.opsi).toHaveLength(3)
    ;['judul', 'cerita', 'jelasan'].forEach((k) => { expect(p[k].length).toBeGreaterThan(10); expect(p.en[k].length).toBeGreaterThan(10); expect(p.en[k]).not.toBe(p[k]) })
  })
  it('posisi jawaban benar tersebar (tidak selalu sama)', () => {
    expect(new Set(PATROLI.map((p) => p.benar)).size).toBeGreaterThanOrEqual(2)
  })
  it('setiap situasi bersumber dari soal kuis yang punya rujukan (bisa diverifikasi)', () => {
    PATROLI.forEach((p) => {
      const k = KUIS.find((x) => x.id === p.dari)
      expect(k, `soal kuis ${p.dari} tidak ada`).toBeTruthy()
      expect(k.sumber.length).toBeGreaterThan(5)
      expect(k.en.sumber.length).toBeGreaterThan(5)
    })
  })
  it('rute /patroli terpasang dan memuat halaman secara lazy', () => {
    const app = readFileSync('src/App.jsx', 'utf8')
    expect(app).toMatch(/path="\/patroli"/)
    expect(app).toMatch(/import\('\.\/pages\/Patroli'\)/)
  })
})
