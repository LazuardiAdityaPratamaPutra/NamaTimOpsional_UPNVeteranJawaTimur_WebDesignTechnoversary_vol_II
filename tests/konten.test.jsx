// @vitest-environment jsdom
// CRUD artikel (lib + antarmuka admin) dan pencarian global di topbar admin.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import AppProvider from '../src/components/AppProvider'
import SyncProvider from '../src/components/SyncProvider'
import AuthProvider from '../src/components/AuthProvider'
import { ToastProvider } from '../src/components/ui'
import App from '../src/App'
import { ARTIKEL, BATAS_ARTIKEL, bacaArtikelLengkap, buatSlug, cariArtikel, daftarArtikel, hapusArtikel, kembalikanArtikel, pulihkanArtikel, simpanArtikel, validasiArtikel } from '../src/lib/artikel'
import { setelUlangArtikel } from '../src/lib/artikelStore'
import { setTerbit, setelUlang, LAPORAN_DEMO, gabungLaporan } from '../src/lib/admin'
import { bangunIndeks, cari, normal } from '../src/lib/cariAdmin'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const ISI = '## Bagian satu\n\nIni isi artikel uji yang cukup panjang untuk lolos validasi.\n\n- poin satu\n- poin dua'
const ID = { judul: 'Panduan Sekat Bakar Warga', ringkas: 'Langkah membuat sekat bakar sederhana di kebun.', isi: ISI }
const reset = () => { localStorage.clear(); setelUlang(); setelUlangArtikel() }

beforeAll(() => {
  window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  for (const sisi of ['clientWidth', 'offsetWidth']) Object.defineProperty(HTMLElement.prototype, sisi, { configurable: true, get: () => 800 })
  for (const sisi of ['clientHeight', 'offsetHeight']) Object.defineProperty(HTMLElement.prototype, sisi, { configurable: true, get: () => 600 })
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
})
beforeEach(reset)

describe('CRUD artikel (lib)', () => {
  it('tanpa suntingan, daftar sama dengan artikel bawaan (identitas sama)', () => {
    expect(daftarArtikel('id')).toBe(ARTIKEL)
  })
  it('validasi: wajib, batas panjang, dan terjemahan Inggris harus lengkap bila diisi', () => {
    expect(Object.keys(validasiArtikel({ id: { judul: '', ringkas: '', isi: '' }, en: null }))).toEqual(['judul', 'ringkas', 'isi'])
    expect(validasiArtikel({ id: ID, en: null })).toEqual({})
    expect(validasiArtikel({ id: { ...ID, judul: 'x'.repeat(BATAS_ARTIKEL.judul + 1) } }).judul).toMatch(/maksimal/)
    expect(Object.keys(validasiArtikel({ id: ID, en: { judul: 'Only a title', ringkas: '', isi: '' } }))).toEqual(['enRingkas', 'enIsi'])
    expect(validasiArtikel({ id: { judul: '', ringkas: '', isi: '' } }, 'en').judul).toBe('A title is required.')
  })
  it('membuat artikel: slug unik dari judul, tampil di daftar, urutan di belakang artikel bawaan', () => {
    const slug = simpanArtikel({ id: ID })
    expect(slug).toBe('panduan-sekat-bakar-warga')
    const daftar = daftarArtikel('id')
    expect(daftar.map((a) => a.slug)).toEqual([...ARTIKEL.map((a) => a.slug), slug])
    expect(daftar.at(-1)).toMatchObject({ kustom: true, judul: ID.judul, menit: 1 })
    expect(cariArtikel(slug)).toBeTruthy()
    // judul sama menghasilkan slug lain, bukan menimpa
    expect(simpanArtikel({ id: ID })).toBe('panduan-sekat-bakar-warga-2')
    expect(buatSlug('Penyebab')).toBe('penyebab-2') // tidak bentrok dengan slug bawaan
    expect(simpanArtikel({ id: { ...ID, judul: '' } })).toBeNull() // tidak sah tidak disimpan
  })
  it('tahan reload: data dibaca ulang dari localStorage', () => {
    const slug = simpanArtikel({ id: ID })
    setelUlangArtikel() // seolah halaman dimuat ulang
    expect(daftarArtikel('id').some((a) => a.slug === slug)).toBe(true)
  })
  it('bahasa Inggris memakai terjemahan bila ada, jika tidak jatuh ke teks Indonesia', () => {
    const a = simpanArtikel({ id: ID })
    expect(daftarArtikel('en').at(-1).judul).toBe(ID.judul)
    const en = { judul: 'Community firebreak guide', ringkas: 'How to build a simple firebreak.', isi: 'Body in English that is long enough to be valid here.' }
    simpanArtikel({ slug: a, id: ID, en })
    expect(daftarArtikel('en').at(-1).judul).toBe(en.judul)
    expect(daftarArtikel('id').at(-1).judul).toBe(ID.judul)
    expect(bacaArtikelLengkap(a).en.judul).toBe(en.judul)
  })
  it('menyunting artikel bawaan hanya mengubah bahasa yang disunting, dan bisa dipulihkan', () => {
    const asli = ARTIKEL[0]
    simpanArtikel({ slug: asli.slug, id: { ...ID, judul: 'Judul baru' }, en: null })
    expect(cariArtikel(asli.slug, 'id')).toMatchObject({ judul: 'Judul baru', diubah: true, kustom: false })
    expect(cariArtikel(asli.slug, 'en').judul).not.toBe('Judul baru') // Inggris tetap asli
    expect(pulihkanArtikel(asli.slug)).toBe(true)
    expect(daftarArtikel('id')).toBe(ARTIKEL)
  })
  it('artikel bawaan tidak bisa dihapus; artikel buatan bisa dihapus dan dikembalikan', () => {
    expect(hapusArtikel(ARTIKEL[0].slug)).toBeNull()
    const slug = simpanArtikel({ id: ID })
    const data = hapusArtikel(slug)
    expect(data.slug).toBe(slug)
    expect(cariArtikel(slug)).toBeUndefined()
    kembalikanArtikel(data)
    expect(cariArtikel(slug)).toBeTruthy()
    expect(simpanArtikel({ slug: 'tidak-ada', id: ID })).toBeNull() // tidak bisa menyunting slug asing
  })
  it('draf tidak tampil di daftar publik tetapi ada di daftar admin; artikel bawaan pun bisa ditarik', () => {
    const slug = simpanArtikel({ id: ID })
    setTerbit(`artikel-${slug}`, false)
    expect(cariArtikel(slug)).toBeUndefined()
    expect(daftarArtikel('id', { draf: true }).some((a) => a.slug === slug)).toBe(true)
    setTerbit(`artikel-${ARTIKEL[1].slug}`, false)
    expect(daftarArtikel('id').map((a) => a.slug)).not.toContain(ARTIKEL[1].slug)
    expect(daftarArtikel('id')).toBe(daftarArtikel('id')) // identitas stabil antar-panggilan
    setTerbit(`artikel-${slug}`, true)
    expect(cariArtikel(slug)).toBeTruthy()
  })
})

describe('pencarian admin (lib)', () => {
  const indeks = (extra = {}) => bangunIndeks({ bahasa: 'id', laporan: gabungLaporan([]), pesan: [{ id: 'p1', nama: 'Rina Kusuma', email: 'rina@contoh.id', topik: 'saran', baca: false, pesan: 'Tolong tambah legenda warna.' }], topik: { saran: 'Saran' }, ...extra })
  it('normalisasi: huruf besar dan diakritik diabaikan', () => { expect(normal('  PÉTA   Risiko ')).toBe('peta risiko') })
  it('kueri kosong hanya menampilkan halaman dan aksi', () => {
    const h = cari(indeks(), '', [{ id: 'a', grup: 'aksi', judul: 'Keluar', kata: 'keluar' }])
    expect(new Set(h.map((x) => x.grup))).toEqual(new Set(['halaman', 'aksi']))
  })
  it('semua kata harus cocok; judul lebih tinggi daripada isi; dikelompokkan menurut jenis', () => {
    const h = cari(indeks(), 'peta')
    expect(h[0]).toMatchObject({ grup: 'halaman', judul: 'Peta risiko' })
    expect(cari(indeks(), 'rina kusuma')[0]).toMatchObject({ grup: 'pesan', judul: 'Rina Kusuma' })
    expect(cari(indeks(), 'rina xyz')).toEqual([])
    const lap = cari(indeks(), 'gambut kering')
    expect(lap.some((x) => x.grup === 'laporan')).toBe(true)
  })
  it('laporan menuju ?r=id dan menyorot barisnya; pesan membawa id yang dibuka', () => {
    const l = cari(indeks(), LAPORAN_DEMO[0].note.slice(0, 20)).find((x) => x.grup === 'laporan')
    expect(l.ke).toEqual({ to: `/admin/laporan?r=${LAPORAN_DEMO[0].id}`, state: { sorot: `lap-${LAPORAN_DEMO[0].id}` } })
    expect(cari(indeks(), 'rina')[0].ke.state).toEqual({ sorot: 'pesan-p1', buka: 'p1' })
  })
  it('isi artikel ikut dicari, termasuk draf dan artikel buatan admin', () => {
    const slug = simpanArtikel({ id: { ...ID, isi: `${ISI}\n\nKata kunci unik: zebrakuning.` } })
    setTerbit(`artikel-${slug}`, false)
    const h = cari(indeks(), 'zebrakuning')
    expect(h).toHaveLength(1)
    expect(h[0].ke.state.sorot).toBe(`konten-artikel-${slug}`)
  })
  it('hasil dibatasi per grup', () => {
    expect(cari(indeks(), 'a').filter((x) => x.grup === 'laporan').length).toBeLessThanOrEqual(4)
  })
})

// ---------- Antarmuka ----------
const ADMIN = { email: 'admin@pyraops.id', nama: 'Admin PyraOps', peran: 'admin', masuk: 1 }
let root
afterEach(() => { root?.unmount(); document.body.innerHTML = ''; vi.restoreAllMocks() })
const tunggu = async (kondisi, batas = 3000) => {
  const mulai = Date.now()
  while (!kondisi()) { if (Date.now() - mulai > batas) throw new Error(`Tidak tercapai: ${kondisi}`); await new Promise((r) => setTimeout(r, 20)) }
}
async function render(url, bahasa = 'id') {
  localStorage.setItem('pyraops-sesi', JSON.stringify(ADMIN))
  localStorage.setItem('pyraops-lang', bahasa)
  window.history.replaceState({}, '', url)
  const el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  root.render(<MemoryRouter initialEntries={[url]}><AppProvider><AuthProvider><ToastProvider><SyncProvider><App /></SyncProvider></ToastProvider></AuthProvider></AppProvider></MemoryRouter>)
  await tunggu(() => document.querySelector('main h1'))
  await new Promise((r) => setTimeout(r, 60))
}
async function renderPublik(url) {
  window.history.replaceState({}, '', url)
  const el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  root.render(<MemoryRouter initialEntries={[url]}><AppProvider><AuthProvider><ToastProvider><SyncProvider><App /></SyncProvider></ToastProvider></AuthProvider></AppProvider></MemoryRouter>)
  await tunggu(() => document.querySelector('main h1'))
  await new Promise((r) => setTimeout(r, 60))
}
const ketik = (el, v) => { Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
const tekan = (el, key, opsi = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opsi }))
const tombol = (re) => [...document.querySelectorAll('button')].find((x) => re.test(x.getAttribute('aria-label') ?? x.textContent))
const cariInput = () => document.querySelector('input[role="combobox"]')
const AXE = { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] }, rules: { 'color-contrast': { enabled: false } } }
const pelanggaran = async () => (await axe.run(document, AXE)).violations.map((v) => `${v.id}: ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n   ')}`)

describe('pencarian di topbar admin', () => {
  it('combobox terkait listbox, panah dan Enter membuka laporan yang dicari, axe bersih', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await render('/admin')
    const input = cariInput()
    expect(input).toBeTruthy()
    input.focus()
    await tunggu(() => document.querySelector('[role="listbox"]'))
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(document.getElementById(input.getAttribute('aria-controls'))).toBeTruthy()
    expect(document.getElementById(input.getAttribute('aria-activedescendant')).getAttribute('role')).toBe('option')
    expect(await pelanggaran(), 'panel terbuka (kueri kosong)').toEqual([])
    ketik(input, 'api setinggi pinggang')
    await tunggu(() => [...document.querySelectorAll('[role="option"]')].some((o) => /pinggang/.test(o.textContent)))
    expect(document.querySelector('[role="status"].sr-only').textContent).toMatch(/hasil/)
    expect(await pelanggaran(), 'panel dengan hasil').toEqual([])
    tekan(input, 'Enter')
    await tunggu(() => document.querySelector('h1')?.textContent.includes('Laporan lapangan'))
    expect(document.querySelector('[role="listbox"]')).toBeNull() // panel menutup setelah memilih
    expect(document.getElementById(`lap-${LAPORAN_DEMO[0].id}`).getAttribute('aria-pressed')).toBe('true')
  })
  it('Ctrl+K memfokuskan, "/" juga, Esc menghapus lalu menutup; tanpa hasil ada pesan', async () => {
    await render('/admin')
    const input = cariInput()
    tekan(document.body, 'k', { ctrlKey: true })
    expect(document.activeElement).toBe(input)
    input.blur()
    tekan(document.body, '/')
    expect(document.activeElement).toBe(input)
    ketik(input, 'qqqzzz')
    await tunggu(() => /Tidak ada hasil/.test(document.body.textContent))
    expect(input.getAttribute('aria-activedescendant')).toBeNull()
    tekan(input, 'Escape')
    await tunggu(() => input.value === '')
    tekan(input, 'Escape')
    await tunggu(() => !document.querySelector('[role="listbox"]'))
  })
  it('aksi cepat: ganti tema lewat pencarian', async () => {
    await render('/admin')
    const awal = document.documentElement.dataset.theme ?? document.documentElement.className
    const input = cariInput()
    input.focus()
    ketik(input, 'tema')
    await tunggu(() => [...document.querySelectorAll('[role="option"]')].some((o) => /tema/i.test(o.textContent)))
    tekan(input, 'Enter')
    await new Promise((r) => setTimeout(r, 60))
    expect(document.documentElement.dataset.theme ?? document.documentElement.className).not.toBe(awal)
  })
})

describe('artikel buatan admin di situs publik', () => {
  it('tampil di daftar Edukasi dan halaman detailnya; draf tidak', async () => {
    const slug = simpanArtikel({ id: ID })
    localStorage.setItem('pyraops-sesi', JSON.stringify({ ...ADMIN, peran: 'pengguna', email: 'user@pyraops.id', nama: 'Pengguna Demo' }))
    await renderPublik('/edukasi')
    expect(document.body.textContent).toContain(ID.judul)
    root.unmount(); document.body.innerHTML = ''
    await renderPublik(`/edukasi/${slug}`)
    expect(document.querySelector('h1').textContent).toBe(ID.judul)
    expect(document.body.textContent).toContain('Bagian satu')
    root.unmount(); document.body.innerHTML = ''
    setTerbit(`artikel-${slug}`, false)
    await renderPublik(`/edukasi/${slug}`)
    expect(document.querySelector('h1').textContent).toMatch(/tidak ditemukan/)
  })
})

describe('CRUD artikel di halaman Konten', () => {
  it('buat → tampil di Edukasi publik → sunting → hapus dengan urungkan; semua tercatat di log', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await render('/admin/konten')
    tombol(/Tambah konten/).click()
    await tunggu(() => tombol(/Artikel \(buku/))
    tombol(/Artikel \(buku/).click()
    await tunggu(() => document.getElementById('ed-judul'))
    // validasi: kirim kosong memunculkan galat dan fokus ke isian pertama
    tombol(/^Terbitkan$/).click()
    await tunggu(() => document.getElementById('ed-judul-g'))
    expect(document.getElementById('ed-judul').getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement.id).toBe('ed-judul')
    expect(await pelanggaran(), 'editor dengan galat').toEqual([])
    ketik(document.getElementById('ed-judul'), ID.judul)
    ketik(document.getElementById('ed-ringkas'), ID.ringkas)
    ketik(document.getElementById('ed-isi'), ISI)
    await tunggu(() => /Bagian satu/.test(document.querySelector('aside[aria-label="Pratinjau artikel"]').textContent))
    expect(await pelanggaran(), 'editor terisi + pratinjau').toEqual([])
    tombol(/^Terbitkan$/).click()
    await tunggu(() => document.getElementById('konten-artikel-panduan-sekat-bakar-warga'))
    await tunggu(() => /terbit/.test(document.querySelector('main p[role="status"]')?.textContent ?? ''))
    expect(cariArtikel('panduan-sekat-bakar-warga')).toBeTruthy()
    // sunting
    tombol(/Sunting: Panduan Sekat/).click()
    await tunggu(() => document.getElementById('ed-judul'))
    expect(document.getElementById('ed-judul').value).toBe(ID.judul)
    ketik(document.getElementById('ed-judul'), 'Panduan Sekat Bakar Warga (revisi)')
    tombol(/Simpan perubahan/).click()
    await tunggu(() => /revisi/.test(document.getElementById('konten-artikel-panduan-sekat-bakar-warga')?.textContent ?? ''))
    // hapus + urungkan
    tombol(/Hapus: Panduan/).click()
    await tunggu(() => document.querySelector('[role="alert"]'))
    tombol(/Ya, hapus/).click()
    await tunggu(() => !document.getElementById('konten-artikel-panduan-sekat-bakar-warga'))
    expect(cariArtikel('panduan-sekat-bakar-warga')).toBeUndefined()
    tombol(/Urungkan/).click()
    await tunggu(() => document.getElementById('konten-artikel-panduan-sekat-bakar-warga'))
    expect(cariArtikel('panduan-sekat-bakar-warga')).toBeTruthy()
    const log = JSON.parse(localStorage.getItem('pyraops-log')).map((l) => l.id)
    expect(log.some((t) => /Menerbitkan artikel/.test(t))).toBe(true)
    expect(log.some((t) => /Mengubah artikel/.test(t))).toBe(true)
    expect(log.some((t) => /Menghapus artikel/.test(t))).toBe(true)
    expect(log.some((t) => /Mengembalikan artikel/.test(t))).toBe(true)
  })
  it('simpan sebagai draf: tidak tampil di daftar publik sampai disakelar terbit', async () => {
    await render('/admin/konten')
    tombol(/Tambah konten/).click()
    await tunggu(() => tombol(/Artikel \(buku/))
    tombol(/Artikel \(buku/).click()
    await tunggu(() => document.getElementById('ed-judul'))
    ketik(document.getElementById('ed-judul'), ID.judul); ketik(document.getElementById('ed-ringkas'), ID.ringkas); ketik(document.getElementById('ed-isi'), ISI)
    tombol(/Simpan sebagai draf/).click()
    await tunggu(() => document.getElementById('konten-artikel-panduan-sekat-bakar-warga'))
    expect(cariArtikel('panduan-sekat-bakar-warga')).toBeUndefined()
    document.querySelector('[role="switch"][aria-label$="Panduan Sekat Bakar Warga"]').click()
    await tunggu(() => cariArtikel('panduan-sekat-bakar-warga'))
  })
  it('editor dan daftar tanpa kata Indonesia pada versi Inggris, axe bersih', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    simpanArtikel({ id: ID })
    await render('/admin/konten', 'en')
    expect(await pelanggaran(), 'daftar EN').toEqual([])
    tombol(/Edit: Panduan/).click()
    await tunggu(() => document.getElementById('ed-judul'))
    expect(document.body.textContent).toMatch(/Save changes/)
    expect(await pelanggaran(), 'editor EN').toEqual([])
  })
  it('dari pencarian, "Tulis artikel baru" membuka editor dan butir konten menyorot kartunya', async () => {
    await render('/admin')
    const input = cariInput()
    input.focus()
    ketik(input, 'artikel baru')
    await tunggu(() => [...document.querySelectorAll('[role="option"]')].some((o) => /Tulis artikel baru/.test(o.textContent)))
    tekan(input, 'Enter')
    await tunggu(() => document.getElementById('ed-judul'))
  })
})
