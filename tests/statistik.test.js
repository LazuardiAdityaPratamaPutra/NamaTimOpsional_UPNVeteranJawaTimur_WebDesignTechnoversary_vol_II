import { describe, it, expect } from 'vitest'
import { STATISTIK } from '../src/data/statistik'

describe('statistik Home', () => {
  it('angka tidak boleh ada tanpa sumber dan periode (tidak ada statistik tanpa sumber)', () => {
    STATISTIK.forEach((s) => {
      if (s.angka != null) {
        expect(s.sumber, `${s.id} butuh sumber`).toBeTruthy()
        expect(s.periode, `${s.id} butuh periode`).toBeTruthy()
        expect(s.url, `${s.id} butuh tautan sumber`).toMatch(/^https?:\/\//)
      }
    })
  })
})
