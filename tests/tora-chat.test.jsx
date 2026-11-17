// @vitest-environment jsdom
// Asisten TORA melayang (pojok kanan bawah, khusus situs publik): peluncur, panel, kirim pertanyaan, penyimpanan sesi, dan aksesibilitas.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import ChatEdukasi, { AjakTora } from '../src/components/ChatEdukasi'
import { blokJawaban } from '../src/lib/chat'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 60) => new Promise((r) => setTimeout(r, ms))
beforeAll(() => { window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) })

let akar, wadah
const pasang = async (el) => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter>{el}</MemoryRouter>); await tunggu() }
afterEach(() => { akar?.unmount(); wadah?.remove(); sessionStorage.clear(); vi.restoreAllMocks() })

const peluncur = () => wadah.querySelector('button.tora-peluncur')
const panel = () => wadah.querySelector('[role="dialog"]')
const isiKolom = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
const kirimForm = () => wadah.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
const balasan = (teks) => vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, teks }) }))

describe('peluncur dan panel', () => {
  it('awalnya hanya tombol di dalam landmark aside; klik membuka dialog, Esc dan tombol tutup menutupnya', async () => {
    await pasang(<ChatEdukasi />)
    expect(wadah.querySelector('aside[aria-label]')).not.toBeNull()
    expect(peluncur()).not.toBeNull()
    expect(panel()).toBeNull()
    peluncur().click(); await tunggu()
    expect(panel()).not.toBeNull()
    expect(panel().getAttribute('aria-labelledby')).toBeTruthy()
    expect(peluncur()).toBeNull() // panel menggantikan tombol di pojok yang sama
    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await tunggu()
    expect(panel()).toBeNull()
    expect(document.activeElement).toBe(peluncur()) // fokus kembali ke tombol
    peluncur().click(); await tunggu()
    wadah.querySelector('button[aria-label="Tutup asisten"]').click(); await tunggu()
    expect(panel()).toBeNull()
  })
  it('peristiwa buka-tora (dari halaman Edukasi) membuka panel', async () => {
    await pasang(<ChatEdukasi />)
    window.dispatchEvent(new Event('buka-tora')); await tunggu()
    expect(panel()).not.toBeNull()
  })
  it('disembunyikan sepenuhnya di layar penuh (peta, kuis, masuk)', async () => {
    await pasang(<ChatEdukasi sembunyi />)
    expect(wadah.textContent).toBe('')
  })
  it('panel terbuka lolos axe (kontras diuji terpisah di designsystem.test.js)', async () => {
    await pasang(<ChatEdukasi />)
    peluncur().click(); await tunggu()
    const { violations } = await axe.run(wadah, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }, rules: { 'color-contrast': { enabled: false } } })
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
  })
})

describe('percakapan', () => {
  it('saran pertanyaan terkirim ke /api/chat, jawaban tampil dengan format, dan sisa saran hilang', async () => {
    globalThis.fetch = balasan('Karhutla dipicu **kemarau** panjang.\n\n- Lahan dibuka dengan api\n- Gambut kering')
    await pasang(<ChatEdukasi />)
    peluncur().click(); await tunggu()
    const saran = wadah.querySelectorAll('[role="dialog"] ul button')
    expect(saran.length).toBe(3)
    saran[0].click(); await tunggu(120)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toBe('/api/chat')
    expect(JSON.parse(init.body).pesan).toBe('Apa penyebab karhutla?')
    expect(wadah.querySelector('[role="log"] strong').textContent).toBe('kemarau')
    expect(wadah.querySelectorAll('[role="log"] li li').length).toBe(2) // dua butir daftar
    expect(wadah.textContent).not.toContain('Mulai dari sini')
  })
  it('kolom tulis mengirim lewat formulir, dan tombol kirim mati saat kosong', async () => {
    globalThis.fetch = balasan('Ringkas saja.')
    await pasang(<ChatEdukasi />)
    peluncur().click(); await tunggu()
    const kirim = wadah.querySelector('button[type="submit"]')
    expect(kirim.disabled).toBe(true)
    isiKolom(wadah.querySelector('input'), 'Apa itu gambut?'); await tunggu()
    expect(kirim.disabled).toBe(false)
    kirimForm(); await tunggu(120)
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).pesan).toBe('Apa itu gambut?')
    expect(wadah.querySelector('input').value).toBe('')
  })
  it('server gagal: jawaban cadangan bertaut ke artikel, dan percakapan bertahan setelah panel dipasang ulang', async () => {
    globalThis.fetch = vi.fn(async () => { throw new Error('offline') })
    await pasang(<ChatEdukasi />)
    peluncur().click(); await tunggu()
    isiKolom(wadah.querySelector('input'), 'Bagaimana dengan gambut?'); await tunggu()
    kirimForm(); await tunggu(120)
    expect(wadah.textContent).toContain('Mode cadangan')
    expect(wadah.querySelector('[role="log"] a[href="/edukasi/gambut"]')).not.toBeNull()
    akar.unmount(); wadah.remove()
    await pasang(<ChatEdukasi />)
    peluncur().click(); await tunggu()
    expect(wadah.textContent).toContain('Bagaimana dengan gambut?') // dari sessionStorage
    wadah.querySelector('button[aria-label="Mulai percakapan baru"]').click(); await tunggu()
    expect(wadah.textContent).not.toContain('Bagaimana dengan gambut?')
    expect(wadah.textContent).toContain('Mulai dari sini')
  })
})

describe('blokJawaban', () => {
  it('mengenali paragraf, judul, daftar berbutir (-, *, •) dan bernomor, tanpa HTML mentah', () => {
    const b = blokJawaban('## Ringkas\nBaris satu\nBaris dua\n\n* satu\n* dua\n1. langkah\n2) langkah lagi\n<script>x</script>')
    expect(b.map((x) => x.t)).toEqual(['h', 'p', 'ul', 'ul', 'p'])
    expect(b[1].v).toBe('Baris satu\nBaris dua')
    expect(b[2]).toMatchObject({ urut: false, item: ['satu', 'dua'] })
    expect(b[3]).toMatchObject({ urut: true, item: ['langkah', 'langkah lagi'] })
    expect(b[4].v).toBe('<script>x</script>') // tetap teks; React yang meloloskannya sebagai teks
    expect(blokJawaban('')).toEqual([])
  })
})

describe('kartu ajakan TORA di Edukasi', () => {
  it('klik sebuah pertanyaan membuka asisten dan langsung mengirimnya', async () => {
    globalThis.fetch = balasan('Jawaban singkat.')
    await pasang(<><AjakTora /><ChatEdukasi /></>)
    const baris = wadah.querySelectorAll('.tora-tanya')
    expect(baris.length).toBe(3)
    expect(panel()).toBeNull()
    baris[1].click(); await tunggu(150)
    expect(panel()).not.toBeNull()
    expect(JSON.parse(globalThis.fetch.mock.calls[0][1].body).pesan).toBe('Bagaimana melindungi diri dari asap?')
    expect(wadah.querySelector('[role="log"]').textContent).toContain('Jawaban singkat.')
  })
  it('"Tulis pertanyaanmu" hanya membuka panel tanpa mengirim apa pun', async () => {
    globalThis.fetch = balasan('tidak dipakai')
    await pasang(<><AjakTora /><ChatEdukasi /></>)
    ;[...wadah.querySelectorAll('.tora-ajak button')].find((t) => t.textContent.includes('Tulis pertanyaanmu')).click(); await tunggu(150)
    expect(panel()).not.toBeNull()
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })
  it('kartu punya judul bernama, TORA dekoratif, dan lolos axe', async () => {
    await pasang(<AjakTora />)
    const sec = wadah.querySelector('section')
    expect(document.getElementById(sec.getAttribute('aria-labelledby')).tagName).toBe('H2')
    expect(wadah.querySelector('img').getAttribute('alt')).toBe('')
    const { violations } = await axe.run(wadah, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] }, rules: { 'color-contrast': { enabled: false } } })
    expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([])
  })
})
