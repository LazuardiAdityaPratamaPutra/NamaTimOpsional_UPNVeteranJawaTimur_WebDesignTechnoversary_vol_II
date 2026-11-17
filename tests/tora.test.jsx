// @vitest-environment jsdom
// TORA di momen kemajuan: checklist selesai, laporan diterima, hasil kuis. Semua mengikuti keadaan sebenarnya.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axe from 'axe-core'
import Checklist from '../src/components/Checklist'
import KonfirmasiLaporan from '../src/components/KonfirmasiLaporan'
import { statusKonfirmasi } from '../src/lib/laporStatus'
import { ekspresiHasil, pesanHasil } from '../src/lib/kuis'
import { CHECKLIST } from '../src/data/checklist'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 40) => new Promise((r) => setTimeout(r, ms))
beforeAll(() => { window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }) })

let akar, wadah
const pasang = async (el) => { wadah = document.createElement('div'); document.body.append(wadah); akar = createRoot(wadah); akar.render(<MemoryRouter>{el}</MemoryRouter>); await tunggu() }
afterEach(() => { akar?.unmount(); wadah?.remove(); localStorage.clear() })

describe('checklist: TORA hanya saat 100%', () => {
  const kotak = () => [...wadah.querySelectorAll('[role="tabpanel"]:not([hidden]) input[type="checkbox"], .print-area input[type="checkbox"]')]
  const ada = () => wadah.querySelector('img[data-ekspresi]')
  it('muncul ketika semua butir dicentang dan hilang ketika satu dilepas', async () => {
    await pasang(<Checklist />)
    const semua = kotak().slice(0, CHECKLIST.keluarga.length)
    expect(semua.length).toBe(CHECKLIST.keluarga.length)
    expect(ada()).toBeNull()
    for (const k of semua.slice(0, -1)) { k.click(); await tunggu(10) }
    expect(ada()).toBeNull() // belum lengkap: tanpa maskot
    expect(wadah.textContent).not.toContain('Hebat! Semua persiapan')
    semua.at(-1).click(); await tunggu()
    expect(ada()?.getAttribute('data-ekspresi')).toBe('merayakan')
    expect(wadah.textContent).toContain('Hebat! Semua persiapan sudah kamu selesaikan. Tetap utamakan keselamatan dan peduli terhadap lingkungan, ya!')
    expect(wadah.textContent).toContain(`${semua.length} dari ${semua.length} selesai`)
    semua[0].click(); await tunggu() // melepas satu butir
    expect(ada()).toBeNull()
    expect(wadah.textContent).not.toContain('Hebat! Semua persiapan')
  })
  it('keadaan tersimpan penuh langsung menampilkan TORA, dan menghapus semua centang menghilangkannya', async () => {
    localStorage.setItem('pyraops-checklist-keluarga', JSON.stringify(CHECKLIST.keluarga.map((d) => d.id)))
    await pasang(<Checklist />)
    expect(ada()).not.toBeNull()
    ;[...wadah.querySelectorAll('button')].find((b) => /Hapus centang/.test(b.textContent)).click(); await tunggu()
    expect(ada()).toBeNull()
  })
})

describe('status konfirmasi laporan', () => {
  const lap = (o) => ({ id: 'a', status: 'pending', ...o })
  it('membedakan lokal, menunggu, gagal, demo, dan terkonfirmasi', () => {
    expect(statusKonfirmasi(null, true)).toBeNull()
    expect(statusKonfirmasi(lap({}), false)).toBe('lokal')
    expect(statusKonfirmasi(lap({}), true)).toBe('menunggu')
    expect(statusKonfirmasi(lap({ status: 'failed' }), true)).toBe('gagal')
    expect(statusKonfirmasi(lap({ status: 'synced', modeDemo: true }), true)).toBe('demo')
    expect(statusKonfirmasi(lap({ status: 'synced', modeDemo: false }), true)).toBe('terkonfirmasi')
  })
  it('TORA dan klaim "diterima" hanya untuk pengiriman yang dikonfirmasi server', async () => {
    const kasus = [[lap({}), false], [lap({}), true], [lap({ status: 'failed' }), true], [lap({ status: 'synced', modeDemo: true }), true]]
    for (const [l, on] of kasus) {
      await pasang(<KonfirmasiLaporan laporan={l} online={on} />)
      expect(wadah.querySelector('img')).toBeNull()
      expect(wadah.querySelector('p').textContent).not.toMatch(/Diterima server/)
      expect(wadah.textContent).not.toMatch(/Terima kasih/)
      expect(wadah.querySelectorAll('[data-langkah="selesai"]').length).toBe(1) // hanya "tersimpan di perangkat"
      akar.unmount(); wadah.remove()
    }
    await pasang(<KonfirmasiLaporan laporan={lap({ status: 'synced', modeDemo: false })} online />)
    expect(wadah.querySelector('img[data-ekspresi="berterima-kasih"]')).not.toBeNull()
    expect(wadah.querySelector('p').textContent).toBe('Diterima server')
    expect(wadah.querySelectorAll('[data-langkah="selesai"]').length).toBe(3)
    const { violations } = await axe.run(wadah, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
    expect(violations.map((v) => v.id)).toEqual([])
  })
  it('tidak menampilkan apa pun bila laporan belum ada', async () => {
    await pasang(<KonfirmasiLaporan laporan={undefined} online />)
    expect(wadah.textContent).toBe('')
  })
})

describe('hasil kuis: ekspresi mengikuti skor', () => {
  it('>=75 merayakan, 50-74 menyemangati, <50 menenangkan', () => {
    expect([100, 80, 75].map(ekspresiHasil)).toEqual(['merayakan', 'merayakan', 'merayakan'])
    expect([74, 60, 50].map(ekspresiHasil)).toEqual(['menyemangati', 'menyemangati', 'menyemangati'])
    expect([49, 20, 0].map(ekspresiHasil)).toEqual(['menenangkan', 'menenangkan', 'menenangkan'])
    expect(pesanHasil(100)).toBeTruthy()
  })
})
