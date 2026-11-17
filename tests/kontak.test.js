import { describe, it, expect } from 'vitest'
import { validasiKontak, buatMailto } from '../src/lib/kontak'
import { adalahPlaceholder } from '../src/lib/format'

const ok = { nama: 'Sari', email: 'sari@contoh.com', pesan: 'Halo, aplikasinya bagus sekali!' }

describe('validasiKontak', () => {
  it('lolos untuk isian benar', () => expect(validasiKontak(ok)).toEqual({}))
  it('menolak isian kosong dengan pesan ramah', () => {
    const g = validasiKontak({ nama: '', email: '', pesan: '' })
    expect(Object.keys(g)).toEqual(['nama', 'email', 'pesan'])
  })
  it('menolak email tidak valid', () => {
    expect(validasiKontak({ ...ok, email: 'sari@' }).email).toBeTruthy()
    expect(validasiKontak({ ...ok, email: 'sari contoh@a.com' }).email).toBeTruthy()
  })
  it('membatasi panjang', () => {
    expect(validasiKontak({ ...ok, pesan: 'x'.repeat(1001) }).pesan).toBeTruthy()
    expect(validasiKontak({ ...ok, pesan: 'singkat' }).pesan).toBeTruthy()
  })
})

describe('buatMailto', () => {
  it('meng-encode subjek dan isi, tanpa menyisipkan header lewat baris baru', () => {
    const url = buatMailto('tim@contoh.com', { ...ok, nama: 'Sari\r\nBcc: x@y.com' })
    expect(url.startsWith('mailto:tim@contoh.com?subject=')).toBe(true)
    expect(decodeURIComponent(url.split('subject=')[1].split('&body=')[0])).not.toMatch(/[\r\n]/)
  })
})

describe('adalahPlaceholder', () => {
  it('mendeteksi [placeholder]', () => {
    expect(adalahPlaceholder('[NAMA TIM]')).toBe(true)
    expect(adalahPlaceholder('Tim Api')).toBe(false)
  })
})
