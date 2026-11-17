import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const css = readFileSync('src/index.css', 'utf8')

const ambil = (re) => Object.fromEntries(
  [...css.match(re)[1].matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2]]))
const TEMA = {
  terang: ambil(/:root, \[data-theme="light"\] \{([^}]*)\}/),
  gelap: ambil(/\[data-theme="dark"\] \{([^}]*)\}/),
}

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const kontras = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

// Pasangan teks/latar yang benar-benar dipakai komponen (WCAG AA teks normal = 4,5)
const PASANGAN = [
  ['text', 'bg'], ['text', 'surface'], ['text-2', 'bg'], ['text-2', 'surface'],
  ['ember-ink', 'bg'], ['ember-ink', 'surface'], ['on-ember', 'ember-ink'],
]

describe('kontras WCAG AA', () => {
  Object.entries(TEMA).forEach(([nama, t]) => {
    PASANGAN.forEach(([fg, bg]) => {
      it(`${nama}: ${fg} di atas ${bg} >= 4,5`, () => {
        expect(kontras(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5)
      })
    })
  })
})

describe('tanpa warna tertulis langsung di komponen', () => {
  const kumpul = (dir) => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? kumpul(p) : /\.jsx$/.test(f) ? [p] : []
  })
  const file = [...kumpul('src/components'), ...kumpul('src/pages')]
  it('tidak memuat hex atau text-white/bg-white/bg-black', () => {
    const pelanggar = file.filter((f) => /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\b(text|bg|border)-(white|black)\b/.test(readFileSync(f, 'utf8')))
    expect(pelanggar).toEqual([])
  })
})
