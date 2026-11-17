import { describe, it, expect } from 'vitest'
import { namaArah, formatHa } from '../src/lib/format'

describe('format', () => {
  it('namaArah', () => {
    expect(namaArah(0)).toBe('utara')
    expect(namaArah(90)).toBe('timur')
    expect(namaArah(225)).toBe('barat daya')
    expect(namaArah(359)).toBe('utara')
    expect(namaArah(-90)).toBe('barat')
  })
  it('formatHa membulatkan', () => {
    expect(formatHa(508.9)).toBe('509')
  })
})
