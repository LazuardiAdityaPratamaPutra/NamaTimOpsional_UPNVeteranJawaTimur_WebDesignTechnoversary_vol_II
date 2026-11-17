// @vitest-environment jsdom
// Perbedaan nyata tamu vs akun: ruang penyimpanan terpisah untuk progres, checklist, dan artikel tersimpan.
import { describe, it, expect, beforeEach } from 'vitest'
import { setRuang, hapusRuang, kunciRuang } from '../src/lib/ruang'
import { muatBaca, tandaiBaca, muatSkor, simpanSkor, hitungCentang } from '../src/lib/progres'
import { simpanCentang } from '../src/lib/checklist'
import { alihSimpan, muatSimpan } from '../src/lib/simpan'

const A = 'user@pyraops.id'
beforeEach(() => { localStorage.clear(); setRuang(null) })

describe('ruang penyimpanan', () => {
  it('tamu memakai kunci lama; akun memakai kunci bernama email', () => {
    expect(kunciRuang('pyraops-baca')).toBe('pyraops-baca')
    setRuang('User@PyraOps.id')
    expect(kunciRuang('pyraops-baca')).toBe(`pyraops-baca::${A}`)
  })
  it('progres tamu dan akun tidak saling bocor', () => {
    tandaiBaca('gambut'); simpanSkor(2, 5)
    setRuang(A)
    expect(muatBaca()).toEqual([])
    expect(muatSkor()).toBeNull()
    tandaiBaca('asap'); simpanSkor(4, 5)
    expect(muatBaca()).toEqual(['asap'])
    setRuang(null)
    expect(muatBaca()).toEqual(['gambut'])
    expect(muatSkor()).toEqual({ skor: 2, total: 5 })
  })
  it('skor hanya naik bila lebih baik, per ruang', () => {
    setRuang(A)
    simpanSkor(3, 5); simpanSkor(1, 5); simpanSkor(4, 5)
    expect(muatSkor()).toEqual({ skor: 4, total: 5 })
  })
  it('centang checklist terpisah per ruang', () => {
    simpanCentang('keluarga', ['k1'])
    setRuang(A)
    expect(hitungCentang()).toBe(0)
    simpanCentang('keluarga', ['k1', 'k2'])
    expect(hitungCentang()).toBe(2)
    setRuang(null)
    expect(hitungCentang()).toBe(1)
  })
  it('hapusRuang hanya menghapus data akun itu', () => {
    tandaiBaca('gambut')
    setRuang(A); tandaiBaca('asap'); alihSimpan('asap')
    hapusRuang(A)
    expect(muatBaca()).toEqual([]); expect(muatSimpan()).toEqual([])
    setRuang(null)
    expect(muatBaca()).toEqual(['gambut'])
  })
})

describe('artikel tersimpan', () => {
  it('tamu tidak bisa menyimpan', () => {
    expect(alihSimpan('gambut')).toEqual([]); expect(muatSimpan()).toEqual([])
  })
  it('akun bisa menyimpan dan mencabut', () => {
    setRuang(A)
    expect(alihSimpan('gambut')).toEqual(['gambut'])
    expect(alihSimpan('asap')).toEqual(['gambut', 'asap'])
    expect(alihSimpan('gambut')).toEqual(['asap'])
    expect(muatSimpan()).toEqual(['asap'])
  })
  it('data rusak tidak membuat galat', () => {
    setRuang(A)
    localStorage.setItem(`pyraops-simpan::${A}`, '{bukan json')
    expect(muatSimpan()).toEqual([])
  })
})
