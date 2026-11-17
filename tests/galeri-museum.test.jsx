// @vitest-environment jsdom
// Galeri museum: data interaksi lengkap dua bahasa, bersumber dari artikel, dan ilustrasi TORA tampak belakang hanya dipakai di Galeri.
import { describe, it, expect, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import Galeri from '../src/components/Galeri'
import { BAB_GALERI, GALERI, TITIK_GAMBUT, UNSUR_API } from '../src/data/galeri'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 40) => new Promise((r) => setTimeout(r, ms))

describe('data galeri museum', () => {
  it('setiap lukisan bawaan punya bab dan kalimat TORA dua bahasa', () => {
    GALERI.forEach((g) => { const d = BAB_GALERI[g.id]; expect(d, g.id).toBeTruthy(); expect(d.en.tora).not.toBe(d.tora); expect(d.en.bab).toBeTruthy() })
  })
  it('unsur segitiga dan titik gambut: dua bahasa, artikel rujukan ada, koordinat di dalam gambar', () => {
    UNSUR_API.forEach((u) => { expect(u.en.teks).not.toBe(u.teks); expect(existsSync(`src/data/artikel/${u.artikel}.md`)).toBe(true); expect(u.zona.length).toBeGreaterThan(0) })
    TITIK_GAMBUT.forEach((t) => { expect(t.en.judul).not.toBe(t.judul); expect(t.x).toBeGreaterThan(0); expect(t.x).toBeLessThan(100); expect(t.y).toBeGreaterThan(0); expect(t.y).toBeLessThan(100) })
  })
})

describe('komponen galeri museum', () => {
  let akar, wadah
  const pasang = async () => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter><Galeri /></MemoryRouter>); await tunggu() }
  afterEach(() => { akar?.unmount(); wadah?.remove() })
  const tombol = (re) => [...wadah.querySelectorAll('button')].find((b) => re.test(b.textContent + ' ' + (b.getAttribute('aria-label') ?? '')))

  it('menghilangkan satu unsur memadamkan api dan menampilkan penjelasannya', async () => {
    await pasang()
    expect(wadah.querySelector('img.tora-belakang')).toBeTruthy()
    tombol(/^Oksigen/).click(); await tunggu()
    expect(tombol(/^Oksigen/).getAttribute('aria-pressed')).toBe('true')
    expect(wadah.textContent).toMatch(/Api padam/)
    expect(wadah.querySelector('a[href="/edukasi/penyebab"]')).toBeTruthy()
  })
  it('pindah ruang: denah, titik gambut, dan tautan simulasi', async () => {
    await pasang()
    tombol(/Lukisan berikutnya/).click(); await tunggu()
    expect(wadah.textContent).toMatch(/Ruang 2 dari 4/)
    wadah.querySelector('.titik-gambut').click(); await tunggu()
    expect(wadah.textContent).toMatch(/Permukaan tampak biasa/)
    wadah.querySelector('nav button[aria-label^="3. "]').click(); await tunggu()
    expect(wadah.querySelector('a[href="/peta?demo=1"]')).toBeTruthy()
  })
})

describe('TORA tampak belakang', () => {
  it('ilustrasi tim (webp) hanya dipakai lewat MaskotBelakang di Galeri', () => {
    const semua = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? semua(p) : [p] })
    const pemakai = semua('src').filter((f) => /\.jsx?$/.test(f) && /MaskotBelakang|harimau-belakang/.test(readFileSync(f, 'utf8'))).map((f) => f.replace(/\\/g, '/')).sort()
    expect(pemakai).toEqual(['src/components/Galeri.jsx', 'src/components/Maskot.jsx'])
    expect(existsSync('src/components/ToraBelakang.jsx')).toBe(false)
  })
})
