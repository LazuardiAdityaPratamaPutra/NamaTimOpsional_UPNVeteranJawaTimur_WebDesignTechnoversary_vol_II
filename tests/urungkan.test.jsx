// @vitest-environment jsdom
// Toast dengan tombol aksi (Urungkan), pintasan Ctrl+Z, kunci pengganti, dan pengembalian pesan yang dihapus.
import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import { createRoot } from 'react-dom/client'
import { act, useEffect } from 'react'
import { ToastProvider } from '../src/components/ui'
import { useToast } from '../src/components/ui/toastContext'
import { hapusPesan, kembalikanPesan, potret, setelUlang } from '../src/lib/admin'

globalThis.IS_REACT_ACT_ENVIRONMENT = true
beforeAll(() => { window.matchMedia ??= (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) })
let root
afterEach(() => { act(() => root?.unmount()); document.body.innerHTML = ''; localStorage.clear(); setelUlang() })

const pegang = {}
function Tangkap() { const t = useToast(); useEffect(() => { pegang.api = t }); return null }
function pasang() {
  const el = document.createElement('div'); document.body.appendChild(el)
  root = createRoot(el)
  act(() => root.render(<ToastProvider><Tangkap /></ToastProvider>))
}
const toasts = () => [...document.querySelectorAll('[role=status] > div')].filter((d) => !d.className.includes('toast-keluar'))

describe('toast dengan aksi', () => {
  it('tombol Urungkan menjalankan aksi lalu menutup toast', () => {
    pasang()
    let n = 0
    act(() => { pegang.api.show('Status diubah.', 'sukses', { aksi: { label: 'Urungkan', urungkan: true, jalankan: () => { n++ } } }) })
    const btn = [...document.querySelectorAll('[role=status] button')].find((b) => b.textContent.startsWith('Urungkan'))
    expect(btn).toBeTruthy()
    act(() => btn.click())
    expect(n).toBe(1)
    expect(toasts()).toHaveLength(0)
  })

  it('Ctrl+Z menjalankan urungkan terbaru, tetapi tidak saat mengetik di isian', () => {
    pasang()
    const jejak = []
    act(() => {
      pegang.api.show('A', 'info', { aksi: { label: 'Urungkan', urungkan: true, jalankan: () => jejak.push('a') } })
      pegang.api.show('B', 'info', { aksi: { label: 'Urungkan', urungkan: true, jalankan: () => jejak.push('b') } })
    })
    const input = document.createElement('input'); document.body.appendChild(input)
    act(() => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })) })
    expect(jejak).toEqual([])
    act(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true })) })
    expect(jejak).toEqual(['b'])
  })

  it('kunci yang sama mengganti toast lama (tidak menumpuk)', () => {
    pasang()
    act(() => { pegang.api.show('Satu', 'info', { kunci: 'x' }); pegang.api.show('Dua', 'info', { kunci: 'x' }) })
    expect(toasts().map((d) => d.textContent)).toEqual(['Dua'])
  })
})

describe('kembalikanPesan', () => {
  it('mengembalikan pesan ke posisi semula dan tidak menggandakan', () => {
    const awal = potret().pesan
    const p = awal[1]
    hapusPesan(p.id)
    expect(potret().pesan.some((x) => x.id === p.id)).toBe(false)
    kembalikanPesan(p, 1)
    expect(potret().pesan.map((x) => x.id)).toEqual(awal.map((x) => x.id))
    kembalikanPesan(p, 0)
    expect(potret().pesan.filter((x) => x.id === p.id)).toHaveLength(1)
  })
})
