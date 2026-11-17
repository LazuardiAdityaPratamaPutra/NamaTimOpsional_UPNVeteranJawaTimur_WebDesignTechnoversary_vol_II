// @vitest-environment jsdom
// Gerbang akun: Kuis, Persiapan, dan Lapor hanya untuk pengguna yang masuk; tamu diarahkan ke /masuk atau melihat panel terkunci.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import AppProvider from '../src/components/AppProvider'
import SyncProvider from '../src/components/SyncProvider'
import AuthProvider from '../src/components/AuthProvider'
import { ToastProvider } from '../src/components/ui'
import App from '../src/App'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
beforeAll(() => {
  window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
  window.scrollTo = () => {}
  Element.prototype.scrollIntoView = () => {}
})
let root
afterEach(() => { root?.unmount(); document.body.innerHTML = ''; localStorage.clear(); vi.restoreAllMocks() })

async function render(url, masuk) {
  if (masuk) localStorage.setItem('pyraops-sesi', JSON.stringify({ email: 'user@pyraops.id', nama: 'Pengguna Demo', peran: 'pengguna' }))
  const el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  root.render(<MemoryRouter initialEntries={[url]}><AppProvider><AuthProvider><ToastProvider><SyncProvider><App /></SyncProvider></ToastProvider></AuthProvider></AppProvider></MemoryRouter>)
  for (let i = 0; i < 80 && !document.querySelector('main h1, [role=region] h1'); i++) await new Promise((r) => setTimeout(r, 25))
  await new Promise((r) => setTimeout(r, 60))
}
const judul = () => document.querySelector('h1')?.textContent ?? ''

describe('gerbang akun', () => {
  it('tamu yang membuka /lapor melihat panel terkunci dengan tautan masuk dan jalur 112 (tanpa pindah halaman)', async () => {
    await render('/lapor', false)
    expect(judul()).toMatch(/Lapor titik api khusus pengguna masuk/)
    expect(document.body.textContent).toMatch(/112/)
    expect(document.querySelector('a[href="/masuk"]')).not.toBeNull()
    expect(document.querySelector('#masuk-email')).toBeNull()
  })
  it('tamu yang membuka /kuis melihat panel terkunci', async () => {
    await render('/kuis', false)
    expect(judul()).toMatch(/Kuis khusus pengguna masuk/)
    expect(document.querySelector('#masuk-email')).toBeNull()
  })
  it('tab kuis dan persiapan terkunci untuk tamu, tab bacaan dan galeri tetap terbuka', async () => {
    await render('/edukasi?tab=kuis', false)
    expect(document.body.textContent).toMatch(/Kuis khusus pengguna masuk/)
    expect(document.querySelector('a[href="/kuis"]')).toBeNull()
    root.unmount(); document.body.innerHTML = ''
    await render('/edukasi?tab=checklist', false)
    expect(document.body.textContent).toMatch(/Persiapan khusus pengguna masuk/)
    root.unmount(); document.body.innerHTML = ''
    await render('/edukasi?tab=galeri', false)
    expect(document.body.textContent).not.toMatch(/khusus pengguna masuk/)
  })
  it('pengguna yang masuk membuka semuanya tanpa panel terkunci', async () => {
    await render('/edukasi?tab=kuis', true)
    expect(document.body.textContent).not.toMatch(/khusus pengguna masuk/)
    expect(document.querySelector('a[href="/kuis"]')).not.toBeNull()
    root.unmount(); document.body.innerHTML = ''
    await render('/lapor', true)
    expect(judul()).not.toMatch(/Masuk ke PyraOps/)
  })
})
