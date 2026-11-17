// @vitest-environment jsdom
// Checklist persiapan: tahap, alasan "Kenapa?", aksi yang ikut mencentang, Rumah Siaga, dan mini game tas siaga.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { existsSync } from 'node:fs'
import Checklist from '../src/components/Checklist'
import { CHECKLIST, TAHAP } from '../src/data/checklist'
import { BARANG_TAS, KAPASITAS_TAS, masukkanBarang, muatCatatan, muatCentang, pesanTetangga, vcardDarurat } from '../src/lib/checklist'
import { JANGKAR } from '../src/components/RumahSiaga'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 40) => new Promise((r) => setTimeout(r, ms))
beforeAll(() => {
  window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close ??= function () { this.removeAttribute('open') }
  Element.prototype.scrollIntoView ??= function () {}
})
let akar, wadah
const pasang = async () => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter><Checklist /></MemoryRouter>); await tunggu() }
afterEach(() => { akar?.unmount(); wadah?.remove(); localStorage.clear() })
const tombol = (re) => [...wadah.querySelectorAll('button')].find((b) => re.test(b.textContent))

describe('data checklist', () => {
  const semua = [...CHECKLIST.keluarga, ...CHECKLIST.sekolah]
  it('setiap butir punya tahap sah, alasan dua bahasa, dan rujukan artikel yang ada', () => {
    const tahap = TAHAP.map((t) => t.id)
    for (const d of semua) {
      expect(tahap).toContain(d.tahap)
      expect(d.kenapa.teks.length).toBeGreaterThan(30)
      expect(d.en.kenapa.teks.length).toBeGreaterThan(30)
      if (d.kenapa.artikel) expect(existsSync(`src/data/artikel/${d.kenapa.artikel}.md`)).toBe(true)
      expect(JANGKAR[d.id]).toBeTruthy() // setiap butir punya benda di Rumah Siaga
    }
  })
  it('setiap tahap berisi butir di kedua grup', () => {
    for (const g of ['keluarga', 'sekolah']) for (const t of TAHAP) expect(CHECKLIST[g].some((d) => d.tahap === t.id)).toBe(true)
  })
  it('kartu kontak dan pesan tetangga', () => {
    const v = vcardDarurat()
    expect(v).toMatch(/^BEGIN:VCARD\r\nVERSION:3\.0/); expect(v).toContain('TEL;TYPE=VOICE:112'); expect(v.trim().endsWith('END:VCARD')).toBe(true)
    expect(pesanTetangga()).toContain('112'); expect(pesanTetangga(true)).toMatch(/neighbors/)
  })
})

describe('mini game tas siaga', () => {
  it('barang penting masuk, pengecoh ditolak, selesai saat lima barang penting terkumpul', () => {
    expect(KAPASITAS_TAS).toBe(5)
    expect(BARANG_TAS.filter((b) => !b.benar)).toHaveLength(5)
    let s = { isi: [], salah: [] }
    let r = masukkanBarang(s, 'gitar'); expect(r.hasil).toBe('tolak'); s = r.keadaan
    expect(s.isi).toEqual([]); expect(s.salah).toEqual(['gitar'])
    const benar = BARANG_TAS.filter((b) => b.benar).map((b) => b.id)
    benar.slice(0, -1).forEach((id) => { r = masukkanBarang(s, id); expect(r.hasil).toBe('masuk'); s = r.keadaan })
    expect(masukkanBarang(s, benar[0]).hasil).toBe('abaikan') // tidak masuk dua kali
    r = masukkanBarang(s, benar.at(-1)); expect(r.hasil).toBe('selesai'); expect(r.keadaan.isi).toHaveLength(5)
  })
})

describe('komponen checklist', () => {
  it('dikelompokkan per tahap dan Rumah Siaga menghitung kemajuan', async () => {
    await pasang()
    const judul = [...wadah.querySelectorAll('[role="tabpanel"] h3')].map((h) => h.textContent)
    expect(judul).toEqual(TAHAP.map((t) => t.judul))
    expect(wadah.querySelector('svg[role="img"]').getAttribute('aria-label')).toContain(`0 dari ${CHECKLIST.keluarga.length}`)
    wadah.querySelector('#butir-k5 input[type=checkbox]').click(); await tunggu()
    expect(wadah.querySelector('svg[role="img"]').getAttribute('aria-label')).toContain(`1 dari ${CHECKLIST.keluarga.length}`)
    expect(muatCentang('keluarga')).toEqual(['k5'])
  })
  it('"Kenapa?" membuka alasan dan tautan ke artikel rujukannya', async () => {
    await pasang()
    const t = wadah.querySelector('#butir-k2 button[aria-expanded]')
    expect(t.getAttribute('aria-expanded')).toBe('false')
    t.click(); await tunggu()
    expect(t.getAttribute('aria-expanded')).toBe('true')
    expect(wadah.querySelector('#kenapa-k2').textContent).toContain('N95')
    expect(wadah.querySelector('#kenapa-k2 a').getAttribute('href')).toBe('/edukasi/dampak')
  })
  it('menulis titik kumpul menyimpannya dan ikut mencentang butirnya', async () => {
    await pasang()
    tombol(/Tulis titik kumpul/).click(); await tunggu()
    const isian = wadah.querySelector('#titik-keluarga')
    isian.value = 'Lapangan voli RT 03'
    isian.form.requestSubmit(); await tunggu()
    expect(muatCatatan('keluarga')).toEqual({ titik: 'Lapangan voli RT 03' })
    expect(muatCentang('keluarga')).toContain('k3')
    expect(wadah.querySelector('#butir-k3').textContent).toContain('Lapangan voli RT 03')
  })
  it('mini game: menyelesaikan tas siaga mencentang butirnya', async () => {
    await pasang()
    tombol(/kemas tas/i).click(); await tunggu()
    const dlg = wadah.querySelector('dialog[open]')
    expect(dlg).toBeTruthy()
    const barang = (nama) => [...dlg.querySelectorAll('ul[aria-label="Barang di rumah"] button')].find((b) => b.getAttribute('aria-label').startsWith(nama))
    barang('Bantal besar').click(); await tunggu()
    expect(barang('Bantal besar').getAttribute('aria-label')).toContain('tidak perlu')
    for (const n of ['Air minum', 'Obat pribadi', 'Senter', 'Dokumen dalam kantong tahan air', 'Masker N95']) { barang(n).click(); await tunggu(10) }
    expect(dlg.textContent).toContain('5/5')
    tombol(/Tandai tas siaga selesai/).click(); await tunggu()
    expect(muatCentang('keluarga')).toContain('k4')
  })
})
