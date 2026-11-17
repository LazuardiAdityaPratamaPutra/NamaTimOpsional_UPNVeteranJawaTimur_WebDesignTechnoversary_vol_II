// @vitest-environment jsdom
// Maskot TORA: aturan penempatan (asisten melayang "Pos Jaga TORA" di pojok kanan bawah situs publik, dan tiga momen kemajuan; tidak di hero beranda dan bukan hiasan di mana-mana).
import { describe, it, expect, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { MaskotAvatar } from '../src/components/Maskot'
import { MASKOT } from '../src/data/maskot'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 40) => new Promise((r) => setTimeout(r, ms))

describe('komponen Maskot', () => {
  let akar, wadah
  const pasang = async (el) => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter>{el}</MemoryRouter>); await tunggu() }
  afterEach(() => { akar?.unmount(); wadah?.remove() })

  it('avatar kepala: dekoratif, ukuran tetap, tanpa bingkai atau bayangan', async () => {
    await pasang(<MaskotAvatar className="size-12" />)
    const img = wadah.querySelector('img')
    expect(img.getAttribute('alt')).toBe('')
    expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual(['192', '192'])
    expect(img.className).not.toMatch(/shadow|border|rounded|animate/)
  })
  it('berkas gambar ada, berformat webp, dan ringan; tanpa sisa avatar atau aset maskot lain', () => {
    for (const n of ['harimau', 'harimau-ceria', 'harimau-sedih', 'harimau-belakang']) {
      const f = `src/assets/maskot/${n}.webp`
      const b = readFileSync(f)
      expect(b.subarray(0, 4).toString()).toBe('RIFF'); expect(b.subarray(8, 12).toString()).toBe('WEBP')
      expect(statSync(f).size).toBeLessThan(200 * 1024)
    }
    expect(readdirSync('src/assets/maskot').sort()).toEqual(['harimau-belakang.webp', 'harimau-ceria.webp', 'harimau-kepala.webp', 'harimau-sedih.webp', 'harimau.webp'])
    expect(statSync('src/assets/maskot/harimau-kepala.webp').size).toBeLessThan(30 * 1024)
  })
  it('identitas: bernama TORA dengan teks alt dua bahasa', () => {
    expect(MASKOT.nama).toBe('TORA')
    expect(MASKOT.en.alt).toBeTruthy(); expect(MASKOT.en.alt).not.toBe(MASKOT.alt)
  })
})

// Aturan penempatan: asisten melayang di ChatEdukasi (pojok kanan bawah, atas permintaan), tiga momen kemajuan, dan adegan permainan di tab Kuis game /kuis (components/AdeganKuis.jsx), game /patroli (components/AdeganPatroli.jsx), dan mini game tas siaga di checklist (components/KemasTas.jsx), semuanya atas permintaan. Galeri museum memakai ilustrasi TORA tampak belakang dari tim (MaskotBelakang), dan TORA pustakawan di rak Perpustakaan (tab Artikel, bukan di halaman artikel), atas permintaan. Peta, simulasi, dasbor, artikel, navigasi, kondisi kosong, dan notifikasi tidak boleh memakai maskot.
describe('aturan penempatan maskot', () => {
  const semua = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? semua(p) : [p] })
  const pemakai = semua('src').filter((f) => /\.jsx?$/.test(f) && /\b(Maskot|MASKOT)\b/.test(readFileSync(f, 'utf8')) && !/components\/Maskot\.jsx$/.test(f.replace(/\\/g, '/'))).map((f) => f.replace(/\\/g, '/')).sort()
  it('hanya chat Edukasi, tab dan hasil kuis, checklist selesai, konfirmasi laporan, dan datanya', () => {
    expect(pemakai).toEqual(['src/components/Checklist.jsx', 'src/components/ChatEdukasi.jsx', 'src/components/Galeri.jsx', 'src/components/Perpustakaan.jsx', 'src/components/KonfirmasiLaporan.jsx', 'src/components/AdeganKuis.jsx', 'src/components/AdeganPatroli.jsx', 'src/components/KemasTas.jsx', 'src/data/kredit.js', 'src/data/maskot.js'].sort())
  })
  it('tidak menyentuh peta, panel data, navigasi, artikel, dan halaman lain', () => {
    ;['MapView', 'HotspotDetail', 'PanelPrioritas', 'WindCompass', 'BriefingPanel', 'PetaTeaser', 'StatCard', 'HeroMalam', 'AnginNyata', 'SimulationPanel', 'RiskList', 'Tur', 'HeroDatar', 'ArtikelKartu'].forEach((n) => {
      expect(readFileSync(`src/components/${n}.jsx`, 'utf8')).not.toMatch(/Maskot/)
    })
    ;['About', 'Edukasi', 'Artikel', 'Peta', 'Lapor', 'Akun', 'Styleguide', 'Contact'].forEach((n) => {
      const f = `src/pages/${n}.jsx`
      if (existsSync(f)) expect(readFileSync(f, 'utf8')).not.toMatch(/Maskot/)
    })
    ;['Sapaan', 'TipMaskot', 'KondisiKosong'].forEach((n) => expect(existsSync(`src/components/${n}.jsx`)).toBe(false))
  })
})
