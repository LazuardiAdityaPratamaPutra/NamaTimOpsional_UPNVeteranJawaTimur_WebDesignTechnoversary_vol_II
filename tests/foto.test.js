import { describe, it, expect } from 'vitest'
import { ukuranTarget } from '../src/lib/foto'

describe('ukuranTarget', () => {
  it('memperkecil sisi terpanjang ke 800 dengan rasio tetap', () => {
    expect(ukuranTarget(4000, 3000)).toEqual({ w: 800, h: 600 })
    expect(ukuranTarget(3000, 4000)).toEqual({ w: 600, h: 800 })
  })
  it('tidak memperbesar gambar kecil', () => {
    expect(ukuranTarget(640, 480)).toEqual({ w: 640, h: 480 })
  })
})
