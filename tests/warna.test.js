import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Kontras token warna (WCAG 2.2): teks biasa >= 4,5:1, komponen UI dan batas kontrol >= 3:1.
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')

function token(blok) {
  const m = css.match(new RegExp(`${blok.replace(/[.[\]"=]/g, '\\$&')}\\s*\\{([^}]*)\\}`))
  const hasil = {}
  for (const [, k, v] of (m?.[1] ?? '').matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)) hasil[k] = v
  return hasil
}
const terang = { ...token(':root, [data-theme="light"]') }
const gelap = { ...terang, ...token('[data-theme="dark"]') }
const hutan = { ...gelap, ...token('.hutan') }

const lin = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16))); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
const kontras = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

const TEKS = ['text', 'text-2', 'ember-ink', 'flame', 'amber', 'canopy', 'mint']
const LATAR = ['bg', 'surface', 'band']

describe.each([['terang', terang], ['gelap', gelap], ['hutan (dua tema)', hutan]])('kontras warna: %s', (_, t) => {
  const latar = _ === 'hutan (dua tema)' ? ['bg', 'surface'] : LATAR
  for (const l of latar) {
    for (const f of TEKS) {
      it(`${f} di atas ${l} >= 4,5:1`, () => expect(kontras(t[f], t[l])).toBeGreaterThanOrEqual(4.5))
    }
  }
  it('teks di atas tombol ember >= 4,5:1', () => expect(kontras(t['on-ember'], t.ember)).toBeGreaterThanOrEqual(4.5))
})

describe('batas kontrol', () => {
  for (const [nama, t] of [['terang', terang], ['gelap', gelap]]) {
    for (const l of ['bg', 'surface', 'band']) {
      it(`${nama}: line-strong di atas ${l} >= 3:1`, () => expect(kontras(t['line-strong'], t[l])).toBeGreaterThanOrEqual(3))
    }
    it(`${nama}: ember (komponen UI) di atas bg >= 3:1`, () => expect(kontras(t.ember, t.bg)).toBeGreaterThanOrEqual(3))
  }
})

describe('aturan 60-30-10', () => {
  it('ada lapisan 60 (bg, surface), 30 (band, hutan), dan 10 (ember) di kedua tema', () => {
    for (const t of [terang, gelap]) for (const k of ['bg', 'surface', 'band', 'ember']) expect(t[k]).toMatch(/^#/)
    expect(hutan.bg).toMatch(/^#/)
  })
  it('band terbaca sebagai lapisan terpisah dari bg (sedikit lebih gelap/hijau, bukan warna sama)', () => {
    expect(terang.band).not.toBe(terang.bg)
    expect(gelap.band).not.toBe(gelap.bg)
  })
})
