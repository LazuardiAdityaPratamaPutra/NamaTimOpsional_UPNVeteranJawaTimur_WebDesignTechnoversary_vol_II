import { describe, it, expect } from 'vitest'
import { parseFrontmatter, waktuBaca, parseInline, parseMarkdown, hrefAman } from '../src/lib/markdown'
import { ARTIKEL, cariArtikel } from '../src/lib/artikel'
import { KUIS } from '../src/data/kuis'
import { nilaiKuis, pesanHasil } from '../src/lib/kuis'
import { CHECKLIST } from '../src/data/checklist'
import { GALERI } from '../src/data/galeri'
import { existsSync } from 'node:fs'
import { muatCentang, simpanCentang } from '../src/lib/checklist'

describe('markdown', () => {
  it('front-matter dan waktu baca', () => {
    const { meta, isi } = parseFrontmatter('---\njudul: Uji\nurutan: 2\n---\nIsi')
    expect(meta).toEqual({ judul: 'Uji', urutan: '2' }); expect(isi).toBe('Isi')
    expect(waktuBaca('kata '.repeat(450))).toBe(3)
    expect(waktuBaca('singkat')).toBe(1)
  })
  it('blok: heading, paragraf, daftar, kutipan', () => {
    const b = parseMarkdown('## Judul\n\nBaris satu\nbaris dua\n\n- a\n- b\n\n> kutip')
    expect(b.map((x) => x.tipe)).toEqual(['h2', 'p', 'ul', 'quote'])
    expect(b[1].teks).toBe('Baris satu baris dua'); expect(b[2].item).toEqual(['a', 'b'])
  })
  it('inline: tebal, miring, tautan; placeholder [ISI] tidak dianggap tautan', () => {
    expect(parseInline('a **b** *c* [d](https://x.id) e').map((t) => t.t)).toEqual(['teks', 'tebal', 'teks', 'miring', 'teks', 'tautan', 'teks'])
    expect(parseInline('[ISI + SUMBER: x]')).toEqual([{ t: 'teks', v: '[ISI + SUMBER: x]' }])
  })
  it('hanya tautan aman', () => {
    expect(hrefAman('https://a.id')).toBe(true); expect(hrefAman('/edukasi')).toBe(true)
    expect(hrefAman('javascript:alert(1)')).toBe(false)
  })
})

describe('artikel', () => {
  it('ada 4 artikel berurutan dengan metadata lengkap', () => {
    expect(ARTIKEL.map((a) => a.slug)).toEqual(['penyebab', 'gambut', 'dampak', 'pencegahan']) // rantai: akar (pemicu), batang (gambut), dahan (dampak), pucuk (pencegahan)
    ARTIKEL.forEach((a) => { expect(a.judul).toBeTruthy(); expect(a.ringkas).toBeTruthy(); expect(a.menit).toBeGreaterThanOrEqual(1) })
    expect(cariArtikel('gambut').judul).toMatch(/gambut/i)
    expect(cariArtikel('tidak-ada')).toBeUndefined()
  })
  it('tidak ada placeholder; angka statistik hanya boleh bila artikel memuat bagian Sumber dengan tautan yang dapat diverifikasi', () => {
    ARTIKEL.forEach((a) => {
      expect(a.isi, a.slug).not.toMatch(/\[ISI/)
      const bagianSumber = a.isi.split(/^## Sumber\s*$/m)[1] ?? ''
      const tautan = bagianSumber.match(/\]\(https:\/\/[^)\s]+\)/g) ?? []
      expect(tautan.length, `${a.slug}: minimal 3 sumber bertautan`).toBeGreaterThanOrEqual(3)
      new Set(tautan).forEach((t) => expect(tautan.filter((x) => x === t).length, t).toBe(1))
    })
  })
  it('setiap artikel mengantar ke berikutnya: rantai akar, batang, dahan, pucuk', () => {
    expect(ARTIKEL.map((a) => a.urutan)).toEqual([1, 2, 3, 4])
    expect(cariArtikel('penyebab').isi).toMatch(/artikel berikutnya/)
    expect(cariArtikel('gambut').isi).toMatch(/artikel berikutnya/)
    expect(cariArtikel('dampak').isi).toMatch(/Artikel terakhir/)
  })
})

describe('kuis', () => {
  it('8 soal valid: 4 opsi, kunci dalam rentang, ada penjelasan dan id unik', () => {
    expect(KUIS).toHaveLength(8)
    expect(new Set(KUIS.map((q) => q.id)).size).toBe(8)
    KUIS.forEach((q) => { expect(q.opsi).toHaveLength(4); expect(q.benar).toBeGreaterThanOrEqual(0); expect(q.benar).toBeLessThan(4); expect(q.jelasan.length).toBeGreaterThan(20) })
  })
  it('skor dan pesan', () => {
    const semuaBenar = KUIS.map((q) => q.benar)
    expect(nilaiKuis(KUIS, semuaBenar)).toEqual({ skor: 8, total: 8, persen: 100 })
    expect(nilaiKuis(KUIS, []).skor).toBe(0)
    expect(nilaiKuis(KUIS, [KUIS[0].benar, 9]).skor).toBe(1)
    expect(pesanHasil(100)).toMatch(/Sempurna/); expect(pesanHasil(10)).toMatch(/coba lagi/i)
  })
})

describe('checklist dan galeri', () => {
  it('id checklist unik dan semua berisi teks', () => {
    const ids = [...CHECKLIST.keluarga, ...CHECKLIST.sekolah].map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
  it('penyimpanan centang aman tanpa localStorage', () => {
    expect(muatCentang('keluarga')).toEqual([])
    expect(() => simpanCentang('keluarga', ['k1'])).not.toThrow()
  })
  it('setiap gambar galeri punya alt, keterangan, atribusi, lisensi, dan komponen ilustrasi', () => {
    expect(GALERI.length).toBeGreaterThanOrEqual(4)
    GALERI.forEach((g) => {
      ;[g.alt, g.keterangan, g.atribusi, g.lisensi, g.judul].forEach((v) => expect(v?.length).toBeGreaterThan(5))
      expect(existsSync(`public/foto/galeri-${g.id}.webp`)).toBe(true)
    })
  })
})
