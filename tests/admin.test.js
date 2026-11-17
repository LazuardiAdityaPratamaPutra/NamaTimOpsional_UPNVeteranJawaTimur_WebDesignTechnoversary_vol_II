// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { AKUN, bacaSesi, cocokkan, hapusSesi, simpanSesi, tujuanSetelahMasuk, validasiMasuk } from '../src/lib/auth'
import {
  catat, gabungLaporan, hapusPesan, hitungLaporan, jarakKm, LAPORAN_DEMO, potret, risikoSemua, setelUlang, setTerbit, setTindak,
  statusTindak, tambahPesan, tandaiBaca, terbit, terdekat, BATAS_LOG,
} from '../src/lib/admin'

beforeEach(() => { localStorage.clear(); setelUlang() })

describe('auth demo', () => {
  it('mencocokkan akun tanpa membocorkan kata sandi; email tidak peka huruf besar', () => {
    const a = cocokkan('  ADMIN@pyraops.id ', 'Admin#2026')
    expect(a).toEqual({ email: 'admin@pyraops.id', nama: 'Admin PyraOps', peran: 'admin' })
    expect(a.sandi).toBeUndefined()
    expect(cocokkan('admin@pyraops.id', 'salah')).toBeNull()
    expect(cocokkan('', '')).toBeNull()
    expect(cocokkan('user@pyraops.id', 'Pengguna#2026').peran).toBe('pengguna')
  })
  it('tepat satu admin dan satu pengguna demo', () => {
    expect(AKUN.filter((x) => x.peran === 'admin')).toHaveLength(1)
    expect(AKUN.filter((x) => x.peran === 'pengguna')).toHaveLength(1)
  })
  it('validasi isian dalam dua bahasa', () => {
    expect(Object.keys(validasiMasuk({ email: 'x', sandi: '' }))).toEqual(['email', 'sandi'])
    expect(validasiMasuk({ email: 'a@b.co', sandi: 'x' })).toEqual({})
    expect(validasiMasuk({ email: 'x', sandi: '' }, 'en').sandi).toMatch(/password/)
  })
  it('sesi disimpan, dibaca, dan dihapus; data rusak diabaikan', () => {
    expect(bacaSesi()).toBeNull()
    const s = simpanSesi(cocokkan('admin@pyraops.id', 'Admin#2026'))
    expect(bacaSesi()).toEqual(s)
    expect(JSON.stringify(s)).not.toMatch(/Admin#2026/)
    hapusSesi()
    expect(bacaSesi()).toBeNull()
    localStorage.setItem('pyraops-sesi', '{"peran":"root","email":"x","nama":"y"}')
    expect(bacaSesi()).toBeNull() // peran tidak dikenal
    localStorage.setItem('pyraops-sesi', 'bukan json')
    expect(bacaSesi()).toBeNull()
  })
  it('tujuan setelah masuk: admin selalu ke dashboard; user hanya ke jalur internal yang aman', () => {
    expect(tujuanSetelahMasuk('admin', '/lapor')).toBe('/admin')
    expect(tujuanSetelahMasuk('pengguna', '/lapor')).toBe('/lapor')
    expect(tujuanSetelahMasuk('pengguna', undefined)).toBe('/')
    expect(tujuanSetelahMasuk('pengguna', '//evil.example')).toBe('/')
    expect(tujuanSetelahMasuk('pengguna', 'https://evil.example')).toBe('/')
    expect(tujuanSetelahMasuk('pengguna', '/admin/pesan')).toBe('/')
    expect(tujuanSetelahMasuk('pengguna', '/masuk')).toBe('/')
  })
})

describe('data admin', () => {
  it('status tindak lanjut: bawaan demo, ubah, dan tolak nilai asing', () => {
    expect(statusTindak('demo-r1')).toBe('verifikasi')
    expect(statusTindak('id-baru')).toBe('baru')
    setTindak('demo-r1', 'selesai')
    expect(statusTindak('demo-r1')).toBe('selesai')
    setTindak('demo-r1', 'ngawur')
    expect(statusTindak('demo-r1')).toBe('selesai')
    setelUlang() // simulasi muat ulang halaman: harus bertahan dari localStorage
    expect(statusTindak('demo-r1')).toBe('selesai')
  })
  it('log: terbaru di atas dan dibatasi jumlahnya', () => {
    for (let i = 0; i < BATAS_LOG + 10; i++) catat([`a${i}`, `b${i}`], 'Admin')
    const l = potret().log
    expect(l).toHaveLength(BATAS_LOG)
    expect(l[0].id).toBe(`a${BATAS_LOG + 9}`)
    expect(l[0]).toMatchObject({ en: `b${BATAS_LOG + 9}`, oleh: 'Admin' })
  })
  it('pesan: tambah, tandai baca, hapus', () => {
    const awal = potret().pesan.length
    const p = tambahPesan({ nama: ' Sari ', email: 'sari@contoh.id', topik: 'saran', pesan: ' Halo ' })
    expect(p).toMatchObject({ nama: 'Sari', pesan: 'Halo', baca: false })
    expect(potret().pesan).toHaveLength(awal + 1)
    expect(potret().pesan[0].id).toBe(p.id)
    tandaiBaca(p.id)
    expect(potret().pesan[0].baca).toBe(true)
    tandaiBaca(p.id, false)
    expect(potret().pesan[0].baca).toBe(false)
    hapusPesan(p.id)
    expect(potret().pesan).toHaveLength(awal)
  })
  it('status terbit konten: bawaan terbit, bisa ditarik ke draf', () => {
    expect(terbit('artikel-gambut')).toBe(true)
    setTerbit('artikel-gambut', false)
    expect(terbit('artikel-gambut')).toBe(false)
  })
  it('gabungLaporan: laporan sungguhan dan demo bercampur, terbaru di atas, demo bertanda', () => {
    const g = gabungLaporan([{ id: 'x1', createdAt: Date.now(), lat: -2.2, lon: 113.9, severity: 'berat', note: 'uji', status: 'pending', photo: new Blob(['a']) }])
    expect(g).toHaveLength(LAPORAN_DEMO.length + 1)
    expect(g[0]).toMatchObject({ id: 'x1', demo: false, sync: 'pending', hasFoto: true })
    expect(g.filter((r) => r.demo)).toHaveLength(LAPORAN_DEMO.length)
    for (let i = 1; i < g.length; i++) expect(g[i - 1].createdAt).toBeGreaterThanOrEqual(g[i].createdAt)
    expect(LAPORAN_DEMO.every((r) => r.en?.note)).toBe(true) // semua catatan demo punya versi Inggris
  })
  it('hitungLaporan menjumlah per tingkat dan status', () => {
    const g = gabungLaporan([])
    const { tingkat, status } = hitungLaporan(g, potret().tindak)
    expect(tingkat.ringan + tingkat.sedang + tingkat.berat).toBe(g.length)
    expect(Object.values(status).reduce((a, b) => a + b, 0)).toBe(g.length)
  })
  it('jarak dan pemukiman terdekat masuk akal', () => {
    expect(jarakKm({ lat: 0, lon: 0 }, { lat: 0, lon: 1 })).toBeCloseTo(111.19, 1)
    const t = terdekat(-2.19, 113.8)
    expect(t.nama).toBe('Desa Tanjung Asri')
    expect(t.km).toBeLessThan(1)
  })
  it('risikoSemua: satu baris per pemukiman, skor tertinggi lebih dulu', () => {
    const r = risikoSemua()
    expect(r.length).toBeGreaterThan(0)
    expect(new Set(r.map((x) => x.nama)).size).toBe(r.length)
    for (let i = 1; i < r.length; i++) expect(r[i - 1].skor).toBeGreaterThanOrEqual(r[i].skor)
    expect(r[0]).toHaveProperty('hotspotId')
  })
})
