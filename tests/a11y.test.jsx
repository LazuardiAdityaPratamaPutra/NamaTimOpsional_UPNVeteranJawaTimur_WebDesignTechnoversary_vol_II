// @vitest-environment jsdom
// Audit aksesibilitas otomatis: merender aplikasi sungguhan per rute di jsdom lalu menjalankan axe-core.
// Catatan: jsdom tidak punya tata letak, jadi kontras warna diuji terpisah (tests/designsystem.test.js).
import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import AppProvider from '../src/components/AppProvider'
import SyncProvider from '../src/components/SyncProvider'
import AuthProvider from '../src/components/AuthProvider'
import { ToastProvider } from '../src/components/ui'
import App from '../src/App'
import pemukiman from '../src/data/pemukiman.json'

globalThis.IS_REACT_ACT_ENVIRONMENT = false

beforeAll(() => {
  window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  document.documentElement.lang = 'id' // di aplikasi nyata ditetapkan oleh index.html (diverifikasi di bawah)
  // Leaflet butuh ukuran kontainer; jsdom tidak punya tata letak, jadi disediakan ukuran tetap
  for (const sisi of ['clientWidth', 'offsetWidth']) Object.defineProperty(HTMLElement.prototype, sisi, { configurable: true, get: () => 800 })
  for (const sisi of ['clientHeight', 'offsetHeight']) Object.defineProperty(HTMLElement.prototype, sisi, { configurable: true, get: () => 600 })
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
})

let root
afterEach(() => { root?.unmount(); document.body.innerHTML = ''; document.title = ''; localStorage.clear(); document.documentElement.lang = 'id'; vi.restoreAllMocks() })

const tunggu = async (kondisi, batas = 3000) => {
  const mulai = Date.now()
  while (!kondisi()) {
    if (Date.now() - mulai > batas) throw new Error('Halaman tidak selesai dimuat')
    await new Promise((r) => setTimeout(r, 20))
  }
}

async function render(url, masuk = false) {
  if (masuk) localStorage.setItem('pyraops-sesi', JSON.stringify({ email: 'user@pyraops.id', nama: 'Pengguna Demo', peran: 'pengguna' }))
  window.history.replaceState({}, '', url) // Peta membaca ?demo=1 dari window.location
  const el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  root.render(
    <MemoryRouter initialEntries={[url]}>
      <AppProvider><AuthProvider><ToastProvider><SyncProvider><App /></SyncProvider></ToastProvider></AuthProvider></AppProvider>
    </MemoryRouter>,
  )
  await tunggu(() => document.querySelector('main h1'))
  await new Promise((r) => setTimeout(r, 60)) // biarkan efek (judul, liveQuery) selesai
}

const RUTE = [
  '/', '/about', '/contact', '/lapor', '/styleguide', '/edukasi', '/edukasi?tab=galeri', '/edukasi?tab=kuis',
  '/edukasi?tab=checklist', '/edukasi/gambut', '/edukasi/tidak-ada', '/rute-ngawur',
  '/peta', '/peta?demo=1', '/masuk', '/patroli',
]

// Rute yang hanya terbuka setelah masuk diuji dua kali: sebagai tamu (terkunci/diarahkan ke /masuk) dan sebagai pengguna masuk
const RUTE_AKUN = ['/lapor', '/kuis', '/edukasi?tab=kuis', '/edukasi?tab=checklist']
const KASUS = [...RUTE.map((u) => [u, false]), ...RUTE_AKUN.map((u) => [u, true])]

describe.each(KASUS)('rute %s (masuk: %s)', (url, masuk) => {
  it('tanpa pelanggaran axe (WCAG 2.x A/AA + praktik terbaik)', async () => {
    const galat = vi.spyOn(console, 'error').mockImplementation(() => {})
    await render(url, masuk)
    const hasil = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      rules: { 'color-contrast': { enabled: false } }, // jsdom tanpa layout
    })
    const ringkas = hasil.violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n   ')}`)
    expect(ringkas, ringkas.join('\n')).toEqual([])
    // "Not implemented" = keterbatasan jsdom (canvas), dipicu internal axe-core, bukan galat aplikasi
    const pesanGalat = galat.mock.calls.map((c) => c.map((x) => String(x)).join(' ').slice(0, 300)).filter((m) => !m.startsWith('Not implemented'))
    expect(pesanGalat, `galat konsol:\n${pesanGalat.join('\n')}`).toEqual([])
  })

  it('punya judul halaman unik dan tepat satu h1', async () => {
    await render(url, masuk)
    expect(document.title.length).toBeGreaterThan(2)
    expect(document.querySelectorAll('h1')).toHaveLength(1)
  })
})

describe('index.html', () => {
  const html = readFileSync('index.html', 'utf8')
  it('mendeklarasikan bahasa, viewport, deskripsi, dan tema warna', () => {
    expect(html).toMatch(/<html lang="id"/)
    expect(html).toMatch(/name="viewport" content="width=device-width, initial-scale=1"/)
    expect(html).toMatch(/name="description" content="[^"]{30,}"/)
    expect(html).toMatch(/name="theme-color"/)
  })
  it('font di-host sendiri (tanpa stylesheet pemblokir render) dan memakai font-display swap', () => {
    expect(html).not.toMatch(/rel="stylesheet"[^>]*fonts\.googleapis/)
    const css = readFileSync('node_modules/@fontsource-variable/archivo/wdth.css', 'utf8')
    expect(css).toMatch(/font-display:\s*swap/)
  })
})

describe('mode demo di peta (benar-benar aktif, bukan hanya lolos)', () => {
  it('menampilkan panel simulasi, daftar risiko, briefing, dan tur terpandu', async () => {
    await render('/peta?demo=1')
    expect(document.querySelector('[data-tur="panel"]')).toBeTruthy()
    expect(document.querySelector('[data-tur="angin"]')).toBeTruthy()
    expect(document.querySelector('[data-tur="risiko"]')).toBeTruthy()
    expect(document.body.textContent).toContain('Kritis')
    expect(document.body.textContent).toContain('Buat briefing')
    const tur = document.querySelector('[role="dialog"][aria-labelledby]')
    expect(tur?.textContent).toContain('Langkah 1 dari 6')
  })
})

// ---------- Versi Inggris: axe + tidak ada teks Indonesia yang bocor ----------
const KATA_ID = ['yang', 'dan', 'untuk', 'dengan', 'tidak', 'atau', 'pada', 'dari', 'adalah', 'saat', 'sudah', 'belum', 'kamu', 'kami', 'halaman', 'laporan', 'peta', 'simulasi', 'angin',
  'silakan', 'coba', 'lagi', 'bisa', 'akan', 'dapat', 'juga', 'karena', 'jika', 'bila', 'semua', 'setiap', 'hasil', 'buka', 'tutup', 'kembali', 'lanjut', 'selesai', 'tentang', 'kontak',
  'beranda', 'pesan', 'kirim', 'tersimpan', 'menunggu', 'tersinkron', 'gagal', 'nama', 'kritis', 'tinggi', 'waspada', 'sedang', 'ringan', 'berat']

// Semua teks yang terlihat atau dibacakan: isi halaman + atribut aria-label, alt, title, placeholder
function teksTampak() {
  const bagian = [document.body.textContent]
  const atribut = ['aria-label', 'alt', 'title', 'placeholder', 'aria-valuetext']
  document.body.querySelectorAll(atribut.map((a) => `[${a}]`).join(',')).forEach((el) => atribut.forEach((a) => { const v = el.getAttribute(a); if (v) bagian.push(v) }))
  return bagian.join('\n')
}
function kebocoran() {
  let t = teksTampak().replace(/\[[^\]]*\]/g, ' ') // placeholder [..] diisi tim, bukan teks antarmuka
  for (const p of pemukiman) t = t.split(p.nama).join(' ') // nama tempat adalah data, bukan terjemahan
  return [...new Set((t.toLowerCase().match(/[a-zà-ÿ]+/g) ?? []).filter((k) => KATA_ID.includes(k)))]
}

const RUTE_EN = RUTE.filter((r) => r !== '/styleguide') // styleguide adalah halaman internal pengembang
describe.each(RUTE_EN)('EN rute %s', (url) => {
  it('axe bersih dan tidak ada kata Indonesia pada teks yang tampil', async () => {
    localStorage.setItem('pyraops-lang', 'en')
    const galat = vi.spyOn(console, 'error').mockImplementation(() => {})
    await render(url)
    expect(document.documentElement.lang).toBe('en')
    const hasil = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
      rules: { 'color-contrast': { enabled: false } },
    })
    const ringkas = hasil.violations.map((v) => `${v.id}: ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n   ')}`)
    expect(ringkas, ringkas.join('\n')).toEqual([])
    expect(kebocoran(), `kata Indonesia pada ${url}`).toEqual([])
    expect(galat.mock.calls.map((c) => String(c[0])).filter((m) => !m.startsWith('Not implemented'))).toEqual([])
  })
})

describe('toggle bahasa', () => {
  const tombol = (awal) => [...document.querySelectorAll('nav button')].find((b) => b.getAttribute('aria-label')?.startsWith(awal))

  it('mengganti teks, atribut lang, judul tab, dan tersimpan; bisa kembali ke Indonesia', async () => {
    await render('/edukasi')
    expect(document.documentElement.lang).toBe('id')
    expect(document.querySelector('h1').textContent).toContain('Kenali api')
    tombol('EN').click()
    await tunggu(() => document.documentElement.lang === 'en')
    await tunggu(() => /Know the fire before it spreads/.test(document.querySelector('h1').textContent))
    expect(localStorage.getItem('pyraops-lang')).toBe('en')
    expect(document.title).toBe('Learn · PyraOps')
    expect(tombol('EN').getAttribute('aria-pressed')).toBe('true')
    tombol('ID').click()
    await tunggu(() => /Kenali api sebelum ia menyebar/.test(document.querySelector('h1').textContent))
    expect(document.documentElement.lang).toBe('id')
  })
  it('bahasa tersimpan dipakai saat halaman dibuka kembali', async () => {
    localStorage.setItem('pyraops-lang', 'en')
    await render('/about')
    expect(document.querySelector('h1').textContent).toBe('About PyraOps')
  })
  it('artikel mengikuti bahasa dengan slug yang sama', async () => {
    localStorage.setItem('pyraops-lang', 'en')
    await render('/edukasi/gambut')
    expect(document.querySelector('h1').textContent).toMatch(/peat/i)
    expect(document.body.textContent).toContain('min read')
  })
})

describe('validitas uji kebocoran', () => {
  it('kontrol negatif: halaman berbahasa Indonesia memang memicu detektor', async () => {
    await render('/')
    expect(kebocoran().length).toBeGreaterThan(8)
  })
  it('demo peta berbahasa Inggris memuat panel, daftar risiko, briefing, dan tur dalam bahasa Inggris', async () => {
    localStorage.setItem('pyraops-lang', 'en')
    await render('/peta?demo=1')
    const teks = document.body.textContent
    expect(teks).toContain('Critical')
    expect(teks).toContain('Settlements at risk')
    expect(teks).toContain('Create briefing')
    expect(teks).toContain('Run again and focus the map')
    expect(document.querySelector('[role="dialog"][aria-labelledby]')?.textContent).toContain('Step 1 of 6')
    expect(document.querySelector('[role="slider"]').getAttribute('aria-valuetext')).toMatch(/^Wind from the east/)
    expect(kebocoran()).toEqual([])
  })
})

// ---------- Login dan dashboard admin ----------
const ADMIN = { email: 'admin@pyraops.id', nama: 'Admin PyraOps', peran: 'admin', masuk: 1 }
const RUTE_ADMIN = ['/admin', '/admin/laporan', '/admin/peta', '/admin/konten', '/admin/pesan', '/admin/aktivitas']
const jalurAkhir = () => document.querySelector('main')?.getAttribute('id')

describe('akses berdasarkan peran', () => {
  it('tamu yang membuka /admin diarahkan ke halaman masuk', async () => {
    await render('/admin/laporan')
    expect(document.querySelector('h1').textContent).toContain('Masuk ke PyraOps')
  })
  it('user biasa tidak bisa membuka dashboard dan tetap melihat situs publik', async () => {
    localStorage.setItem('pyraops-sesi', JSON.stringify({ ...ADMIN, peran: 'pengguna', email: 'user@pyraops.id', nama: 'Pengguna Demo' }))
    await render('/admin')
    expect(document.querySelector('h1').textContent).not.toContain('Halo') // dikembalikan ke /masuk, lalu /masuk mengirim user ke beranda
    expect(document.querySelector('nav[aria-label="Navigasi dashboard"]')).toBeNull()
    expect(document.querySelector('nav[aria-label="Navigasi utama"]')).toBeTruthy()
  })
  it('admin yang membuka situs publik langsung diarahkan ke dashboard', async () => {
    localStorage.setItem('pyraops-sesi', JSON.stringify(ADMIN))
    await render('/about')
    expect(document.querySelector('h1').textContent).toContain('Halo, Admin')
    expect(document.querySelector('header nav')).toBeNull() // tanpa navigasi situs publik
    expect(jalurAkhir()).toBe('utama')
  })
  it('halaman masuk: login admin salah memunculkan galat, login benar membuka dashboard', async () => {
    await render('/masuk')
    const isi = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
    isi(document.getElementById('masuk-email'), 'admin@pyraops.id')
    isi(document.getElementById('masuk-sandi'), 'salah')
    document.querySelector('form').requestSubmit()
    await tunggu(() => document.querySelector('[role="alert"]'))
    expect(document.querySelector('[role="alert"]').textContent).toMatch(/tidak cocok/)
    isi(document.getElementById('masuk-sandi'), 'Admin#2026')
    document.querySelector('form').requestSubmit()
    // TORA menyambut dulu (pertama kali masuk), baru pindah ke dashboard lewat tombol
    await tunggu(() => /Selamat datang, Admin/.test(document.querySelector('h1')?.textContent ?? ''))
    expect(document.querySelector('h1').textContent).not.toMatch(/kembali/)
    ;[...document.querySelectorAll('button')].find((x) => /Buka dashboard/.test(x.textContent)).click()
    await tunggu(() => /Halo, Admin/.test(document.querySelector('h1')?.textContent ?? ''))
    expect(JSON.parse(localStorage.getItem('pyraops-sesi')).peran).toBe('admin')
  })
  it('sambutan TORA: pertama kali menunjuk titik mulai; sudah pernah menampilkan sapaan kembali dan progres akun', async () => {
    const isi = (el, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) }
    const masukSebagaiUser = async () => {
      await render('/masuk')
      isi(document.getElementById('masuk-email'), 'user@pyraops.id')
      isi(document.getElementById('masuk-sandi'), 'Pengguna#2026')
      document.querySelector('form').requestSubmit()
      await tunggu(() => /Selamat datang/.test(document.querySelector('h1')?.textContent ?? ''))
    }
    await masukSebagaiUser()
    expect(document.querySelector('h1').textContent).toBe('Selamat datang, Pengguna!')
    expect(document.body.textContent).toContain('Mulai dari mana?')
    expect(document.querySelector('a[href="/edukasi"]')).toBeTruthy()
    // keluar, masuk lagi: kini dikenali sebagai pengguna lama
    root.unmount(); document.body.innerHTML = ''
    localStorage.removeItem('pyraops-sesi')
    localStorage.setItem('pyraops-baca::user@pyraops.id', JSON.stringify(['gambut']))
    await masukSebagaiUser()
    expect(document.querySelector('h1').textContent).toBe('Selamat datang kembali, Pengguna!')
    expect(document.body.textContent).toMatch(/terakhir masuk/)
    expect(document.body.textContent).toContain('artikel dibaca')
    expect(document.body.textContent).not.toContain('Mulai dari mana?')
  })
})

const USER = { email: 'user@pyraops.id', nama: 'Pengguna Demo', peran: 'pengguna', masuk: 1 }
describe('halaman Akun', () => {
  it('tamu yang membuka /akun diarahkan ke halaman masuk', async () => {
    await render('/akun')
    expect(document.querySelector('h1').textContent).toContain('Masuk ke PyraOps')
  })
  it('tamu melihat ajakan masuk dan tombol simpan artikel terkunci; akun melihat tombol simpan sungguhan', async () => {
    await render('/edukasi/gambut')
    expect(document.body.textContent).toContain('Masuk untuk menyimpan')
    root.unmount(); document.body.innerHTML = ''
    localStorage.setItem('pyraops-sesi', JSON.stringify(USER))
    await render('/edukasi/gambut')
    const tombol = [...document.querySelectorAll('button[aria-pressed]')].find((x) => /Simpan artikel/.test(x.textContent))
    expect(tombol).toBeTruthy()
    tombol.click()
    await tunggu(() => /Tersimpan/.test(document.body.textContent))
    expect(JSON.parse(localStorage.getItem('pyraops-simpan::user@pyraops.id'))).toEqual(['gambut'])
    expect(localStorage.getItem('pyraops-simpan')).toBeNull() // tidak bocor ke ruang tamu
  })
  for (const bahasa of ['id', 'en']) {
    it(`/akun: satu h1, axe bersih, tanpa kata Indonesia pada versi ${bahasa}`, async () => {
      localStorage.setItem('pyraops-sesi', JSON.stringify(USER))
      localStorage.setItem('pyraops-lang', bahasa)
      const galat = vi.spyOn(console, 'error').mockImplementation(() => {})
      await render('/akun')
      expect(document.querySelectorAll('h1')).toHaveLength(1)
      expect(document.querySelector('h1').textContent).toContain(bahasa === 'id' ? 'Halo, Pengguna' : 'Hi, Pengguna')
      const hasil = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        rules: { 'color-contrast': { enabled: false } },
      })
      const ringkas = hasil.violations.map((v) => `${v.id}: ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n   ')}`)
      expect(ringkas, ringkas.join('\n')).toEqual([])
      expect(galat.mock.calls.map((c) => String(c[0])).filter((m) => !m.startsWith('Not implemented'))).toEqual([])
    })
  }
})

describe.each(RUTE_ADMIN)('dashboard %s', (url) => {
  for (const bahasa of ['id', 'en']) {
    it(`axe bersih, satu h1, dan tanpa kata Indonesia pada versi ${bahasa}`, async () => {
      localStorage.setItem('pyraops-sesi', JSON.stringify(ADMIN))
      localStorage.setItem('pyraops-lang', bahasa)
      const galat = vi.spyOn(console, 'error').mockImplementation(() => {})
      await render(url)
      expect(document.querySelectorAll('h1')).toHaveLength(1)
      const hasil = await axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
        rules: { 'color-contrast': { enabled: false } },
      })
      const ringkas = hasil.violations.map((v) => `${v.id}: ${v.help}\n   ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join('\n   ')}`)
      expect(ringkas, ringkas.join('\n')).toEqual([])
      expect(galat.mock.calls.map((c) => String(c[0])).filter((m) => !m.startsWith('Not implemented'))).toEqual([])
    })
  }
})
