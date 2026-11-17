// @vitest-environment jsdom
// Kartu bocoran game Patroli di halaman Edukasi: ajakan yang terbaca, tautan ke /patroli, skor terbaik, dan aksesibilitas.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import { KartuPatroli } from '../src/components/AdeganPatroli'
import { PATROLI } from '../src/data/patroli'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 60) => new Promise((r) => setTimeout(r, ms))
beforeAll(() => { window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) })

let akar, wadah
const pasang = async (el) => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter>{el}</MemoryRouter>); await tunggu() }
afterEach(() => { akar?.unmount(); wadah?.remove() })

describe('KartuPatroli', () => {
  it('judul h2, tombol ke /patroli, dan ajakan "Mulai patroli" bila belum pernah main', async () => {
    await pasang(<KartuPatroli />)
    expect(wadah.querySelector('h2').textContent).toBe('Patroli hutan')
    const tombol = [...wadah.querySelectorAll('a[href="/patroli"]')].filter((a) => a.getAttribute('aria-hidden') !== 'true')
    expect(tombol.length).toBe(1) // satu tautan yang dibaca pembaca layar dan bisa difokus
    expect(tombol[0].textContent).toContain('Mulai patroli')
    expect(wadah.textContent).toContain('Belum pernah main')
    expect(wadah.textContent).toContain(`${PATROLI.length} titik api`)
  })
  it('menampilkan rekor dan mengubah ajakan menjadi "Main lagi" setelah pernah main', async () => {
    await pasang(<KartuPatroli skor={3} total={5} />)
    expect(wadah.textContent).toContain('Rekormu 3/5')
    expect(wadah.textContent).toContain('Main lagi')
    expect(wadah.textContent).not.toContain('Belum pernah main')
  })
  it('adegan demo dekoratif; tautan menimpa kartu tidak ikut tab dan tersembunyi dari pembaca layar', async () => {
    await pasang(<KartuPatroli />)
    expect(wadah.querySelector('.pt-adegan').getAttribute('aria-hidden')).toBe('true')
    const timpa = wadah.querySelector('a[aria-hidden="true"]')
    expect(timpa.getAttribute('tabindex')).toBe('-1')
    expect(wadah.querySelector('.pt-kartu-tanya').getAttribute('aria-hidden')).toBe('true')
  })
  it('pilihan ringkas cuplikan selaras dengan data game (jumlah dan indeks jawaban benar valid)', async () => {
    await pasang(<KartuPatroli />)
    expect(wadah.querySelectorAll('.pt-kartu-tanya li').length).toBe(3)
    expect(PATROLI.every((s) => s.benar >= 0 && s.benar < 3)).toBe(true)
  })
  it('lolos axe', async () => {
    await pasang(<KartuPatroli skor={2} total={5} />)
    const { violations } = await axe.run(wadah, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }, rules: { 'color-contrast': { enabled: false } } })
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
  })
})
