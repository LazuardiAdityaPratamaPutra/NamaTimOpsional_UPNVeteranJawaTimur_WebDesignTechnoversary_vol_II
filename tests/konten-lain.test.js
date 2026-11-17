// @vitest-environment jsdom
// Konten edukasi selain artikel (galeri, kuis, checklist), status terbit di sisi pengunjung, gambar sampul, dan data pengguna di admin.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setTerbit, setelUlang } from '../src/lib/admin'
import { setelUlangArtikel } from '../src/lib/artikelStore'
import { setelUlangKonten, simpanGambar } from '../src/lib/kontenStore'
import { bacaFormKonten, daftarChecklist, daftarGaleri, daftarKuis, hapusKonten, kembalikanKonten, pulihkanKonten, simpanKonten, validasiKuis } from '../src/lib/kontenEdukasi'
import { sampul } from '../src/data/sampul'
import { hitungCentang } from '../src/lib/progres'
import { simpanCentang } from '../src/lib/checklist'
import { belajarPerangkat, ringkasSipongi } from '../src/lib/dataPengguna'
import { sedangPratinjau } from '../src/lib/pratinjau'

const GAMBAR = 'data:image/webp;base64,UklGRg=='
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); setelUlang(); setelUlangArtikel(); setelUlangKonten() })

describe('galeri dari admin', () => {
  it('lukisan baru wajib bergambar dan berkredit; setelah terbit tampil di galeri pengunjung', () => {
    const f = bacaFormKonten('galeri', null)
    f.id = { judul: 'Uji lukisan', alt: 'Gambar uji untuk tes otomatis', keterangan: 'Keterangan uji untuk plakat.' }
    expect(simpanKonten('galeri', null, f).galat.gambar).toBeTruthy()
    f.gambar = GAMBAR
    expect(simpanKonten('galeri', null, f).galat.atribusi).toBeTruthy()
    f.atribusi = 'Ilustrasi uji'
    const { id } = simpanKonten('galeri', null, f)
    const g = daftarGaleri('id').find((x) => x.id === id)
    expect(g.src).toBe(GAMBAR)
    expect(g.atribusi).toBe('Ilustrasi uji')
    setTerbit(`galeri-${id}`, false)
    expect(daftarGaleri('id').some((x) => x.id === id)).toBe(false)
    expect(daftarGaleri('id', { draf: true }).some((x) => x.id === id)).toBe(true)
  })
  it('lukisan bawaan bisa disunting, diganti gambarnya, lalu dipulihkan', () => {
    const f = bacaFormKonten('galeri', 'angin')
    f.id.judul = 'Api dan angin (revisi)'; f.gambar = GAMBAR
    simpanKonten('galeri', 'angin', f)
    expect(daftarGaleri('id').find((x) => x.id === 'angin')).toMatchObject({ judul: 'Api dan angin (revisi)', src: GAMBAR, diubah: true })
    pulihkanKonten('galeri', 'angin')
    expect(daftarGaleri('id').find((x) => x.id === 'angin')).toMatchObject({ judul: 'Api dan angin', src: '/foto/galeri-angin.webp' })
  })
  it('lukisan bawaan yang dijadikan draf hilang dari galeri pengunjung', () => {
    setTerbit('galeri-segitiga', false)
    expect(daftarGaleri('id').map((g) => g.id)).not.toContain('segitiga')
  })
})

describe('kuis dari admin', () => {
  it('soal baru tampil di kuis; pilihan kembar ditolak; hapus bisa diurungkan', () => {
    const f = bacaFormKonten('kuis', null)
    f.id = { topik: 'Uji', tanya: 'Pertanyaan uji?', opsi: ['Satu', 'Satu', 'Tiga', 'Empat'], jelasan: 'Penjelasan uji.', sumber: 'Sumber uji' }
    expect(validasiKuis(f).opsi0).toBeTruthy()
    f.id.opsi[1] = 'Dua'; f.benar = 2
    const { id } = simpanKonten('kuis', null, f)
    const n = daftarKuis('id').length
    expect(daftarKuis('id').at(-1)).toMatchObject({ id, benar: 2, topik: 'Uji' })
    const data = hapusKonten('kuis', id)
    expect(daftarKuis('id').length).toBe(n - 1)
    kembalikanKonten(data)
    expect(daftarKuis('id').length).toBe(n)
  })
  it('soal bawaan berstatus draf tidak ikut dimainkan', () => {
    const n = daftarKuis('id').length
    setTerbit('kuis-hotspot', false)
    expect(daftarKuis('id').length).toBe(n - 1)
  })
})

describe('checklist dari admin', () => {
  it('butir baru masuk tahap yang dipilih; butir draf tidak dihitung', () => {
    const f = bacaFormKonten('checklist', null, { grup: 'sekolah' })
    f.id.teks = 'Butir uji persiapan sekolah.'; f.tahap = 'asap'
    const { id } = simpanKonten('checklist', null, f)
    expect(daftarChecklist('sekolah', 'id').find((d) => d.id === id)).toMatchObject({ tahap: 'asap', kustom: true })
    simpanCentang('keluarga', ['k1', 'k2'])
    expect(hitungCentang()).toBe(2)
    setTerbit('checklist-k2', false)
    expect(daftarChecklist('keluarga', 'id').some((d) => d.id === 'k2')).toBe(false)
    expect(hitungCentang()).toBe(1)
  })
})

describe('sampul dan penyimpanan', () => {
  it('sampul unggahan menggantikan sampul bawaan dan bisa dikembalikan', () => {
    expect(sampul('gambut').src).toBe('/foto/edu-gambut.webp')
    simpanGambar('artikel-gambut', GAMBAR)
    expect(sampul('gambut').src).toBe(GAMBAR)
    simpanGambar('artikel-gambut', null)
    expect(sampul('gambut').src).toBe('/foto/edu-gambut.webp')
  })
  it('penyimpanan penuh dilaporkan, bukan diam-diam gagal', () => {
    const f = bacaFormKonten('checklist', null); f.id.teks = 'Butir uji.'
    const asli = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (k, v) { if (String(k).startsWith('pyraops-checklist-admin')) throw new Error('QuotaExceeded'); return asli.call(this, k, v) })
    expect(simpanKonten('checklist', null, f)).toEqual({ penuh: true })
    vi.restoreAllMocks()
  })
})

describe('data pengguna di admin', () => {
  it('SiPongi sama dengan data Peta: total per tanggal cocok', () => {
    const d = ringkasSipongi()
    expect(d.perTanggal.reduce((n, x) => n + x.kaltim, 0)).toBe(d.totalKaltim)
    expect(d.kabKaltim[0].n).toBeGreaterThanOrEqual(d.kabKaltim.at(-1).n)
  })
  it('kemajuan belajar dibaca dari ruang tiap akun di perangkat ini (admin tidak ikut)', () => {
    localStorage.setItem('pyraops-baca::user@pyraops.id', JSON.stringify(['gambut', 'tidak-ada']))
    localStorage.setItem('pyraops-skor-kuis::user@pyraops.id', JSON.stringify({ skor: 5, total: 8 }))
    localStorage.setItem('pyraops-baca::admin@pyraops.id', JSON.stringify(['gambut']))
    const d = belajarPerangkat('id')
    expect(d.ruang).toHaveLength(1)
    expect(d.ruang[0]).toMatchObject({ nama: 'Pengguna Demo', bacaan: ['gambut'], skor: { skor: 5, total: 8 } })
    expect(d.artikel.find((a) => a.slug === 'gambut').n).toBe(1)
  })
  it('mode pratinjau hanya aktif bila ditandai di tab ini', () => {
    expect(sedangPratinjau()).toBe(false)
    sessionStorage.setItem('pyraops-pratinjau', '1')
    expect(sedangPratinjau()).toBe(true)
  })
})
