// Gerak dikurangi: animasi tak berujung yang dipercepat ke .01ms akan berkedip bila tetap berulang.
// Kedua aturan global (preferensi sistem dan tombol "Efek gerak: hemat") harus menghentikan perulangannya.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

describe('aturan gerak dikurangi', () => {
  it('preferensi sistem: durasi seketika dan tidak berulang', () => {
    const blok = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce) {\n  html:not([data-gerak="penuh"]) *'))
    const aturan = blok.slice(0, blok.indexOf('}') + 1)
    expect(aturan).toMatch(/animation-duration: \.01ms !important/)
    expect(aturan).toMatch(/animation-iteration-count: 1 !important/)
  })
  it('mode hemat: durasi seketika dan tidak berulang', () => {
    const awal = css.indexOf('html[data-gerak="hemat"] *, html[data-gerak="hemat"] *::before')
    const aturan = css.slice(awal, css.indexOf('}', awal) + 1)
    expect(aturan).toMatch(/animation-iteration-count: 1 !important/)
  })
})
