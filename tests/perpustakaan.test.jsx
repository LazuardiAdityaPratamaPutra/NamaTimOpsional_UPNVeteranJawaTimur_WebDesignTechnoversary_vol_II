// @vitest-environment jsdom
// Perpustakaan (tab Artikel), glosarium sentuh, widget perumpamaan, dan kartu peminjaman.
import { describe, it, expect, afterEach, beforeAll } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { existsSync } from 'node:fs'
import Perpustakaan, { KartuPinjam } from '../src/components/Perpustakaan'
import Markdown from '../src/components/Markdown'
import { WIDGET_PERUMPAMAAN } from '../src/components/Perumpamaan'
import { GLOSARIUM, PERUMPAMAAN, warnaBuku } from '../src/data/perpustakaan'
import { ARTIKEL, ARTIKEL_EN } from '../src/lib/artikel'
import { parseMarkdown } from '../src/lib/markdown'
import { muatTanggalBaca, tandaiBaca } from '../src/lib/progres'
import { lokal } from '../src/i18n'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 40) => new Promise((r) => setTimeout(r, ms))
beforeAll(() => { Element.prototype.scrollIntoView = () => {}; window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) })

describe('data perpustakaan', () => {
  it('setiap istilah glosarium muncul di artikel kedua bahasa dan punya terjemahan', () => {
    const teks = (daftar) => daftar.map((a) => a.isi).join('\n')
    GLOSARIUM.forEach((g) => {
      expect(g.pola.id.test(teks(ARTIKEL)), g.id).toBe(true)
      expect(g.pola.en.test(teks(ARTIKEL_EN)), g.id).toBe(true)
      expect(g.en.teks).not.toBe(g.teks)
      expect(existsSync(`src/data/artikel/${g.artikel}.md`)).toBe(true)
    })
  })
  it('setiap perumpamaan cocok dengan satu paragraf di artikelnya (dua bahasa) dan widgetnya ada', () => {
    PERUMPAMAAN.forEach((p) => {
      for (const [daftar, k] of [[ARTIKEL, 'id'], [ARTIKEL_EN, 'en']]) {
        const a = daftar.find((x) => x.slug === p.artikel)
        expect(parseMarkdown(a.isi).some((x) => x.tipe === 'p' && p.cocok[k].test(x.teks)), `${p.id} ${k}`).toBe(true)
      }
      expect(WIDGET_PERUMPAMAAN[p.id]).toBeTypeOf('function')
    })
  })
  it('warna buku stabil, termasuk untuk buku buatan admin', () => {
    expect(warnaBuku('gambut')).toBe(warnaBuku('gambut'))
    expect(warnaBuku('artikel-baru-1')).toBe(warnaBuku('artikel-baru-1'))
    expect(warnaBuku('artikel-baru-1')).toMatch(/^rgb\(/)
  })
  it('tanggal selesai baca tersimpan sekali (tanggal pertama dipertahankan)', () => {
    localStorage.clear()
    tandaiBaca('gambut'); const pertama = muatTanggalBaca().gambut
    expect(pertama).toBeTruthy()
    tandaiBaca('gambut'); expect(muatTanggalBaca().gambut).toBe(pertama)
  })
})

describe('komponen perpustakaan', () => {
  let akar, wadah
  const pasang = async (el) => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter>{el}</MemoryRouter>); await tunggu() }
  afterEach(() => { akar?.unmount(); wadah?.remove(); localStorage.clear() })

  it('rak menampilkan semua buku; pita untuk yang sudah dibaca; memilih buku membuka meja baca dengan cap', async () => {
    localStorage.setItem('pyraops-baca', JSON.stringify(['penyebab'])); localStorage.setItem('pyraops-baca-tgl', JSON.stringify({ penyebab: '2026-11-15T03:00:00.000Z' }))
    await pasang(<Perpustakaan pilihTab={() => {}} />)
    const buku = wadah.querySelectorAll('button.buku')
    expect(buku.length).toBe(ARTIKEL.length)
    expect(wadah.querySelectorAll('.buku-pita').length).toBe(1)
    expect(buku[0].getAttribute('aria-label')).toMatch(/sudah dibaca/)
    buku[0].click(); await tunggu()
    expect(buku[0].getAttribute('aria-pressed')).toBe('true')
    expect(wadah.querySelector('#meja-baca .cap-pinjam').textContent).toMatch(/Dikembalikan/)
    expect(wadah.querySelector('#meja-baca a[href="/edukasi/penyebab"]')).toBeTruthy()
  })
  it('kartu pinjam tanpa tanggal menampilkan status dipinjam', async () => {
    await pasang(<KartuPinjam judul="Uji" nomor="01" tanggal={null} />)
    expect(wadah.textContent).toMatch(/Sedang dipinjam/)
    expect(wadah.querySelector('.cap-pinjam')).toBeNull()
  })
  it('glosarium: kemunculan pertama bisa diketuk, definisi muncul', async () => {
    const a = ARTIKEL.find((x) => x.slug === 'dampak')
    const glos = GLOSARIUM.map((g) => ({ ...lokal(g, 'id'), re: g.pola.id }))
    await pasang(<Markdown sumber={a.isi} glosarium={glos} slugIni="dampak" />)
    const t = [...wadah.querySelectorAll('button.istilah')]
    expect(t.map((x) => x.textContent)).toContain('PM2.5')
    expect(t.filter((x) => x.textContent === 'PM2.5').length).toBe(1)
    t.find((x) => x.textContent === 'PM2.5').click(); await tunggu()
    expect(wadah.querySelector('[role="note"]').textContent).toMatch(/sehelai rambut/)
  })
})
