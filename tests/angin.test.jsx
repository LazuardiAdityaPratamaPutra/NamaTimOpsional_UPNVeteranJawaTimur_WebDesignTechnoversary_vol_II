// @vitest-environment jsdom
// Angin Open-Meteo: arsip nyata 19–21 Agustus 2026, pengambilan angin langsung per lokasi, dan panelnya di simulasi.
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import axe from 'axe-core'
import { WAKTU_ANGIN, KECEPATAN_ANGIN, ARAH_ANGIN, SUMBER_ANGIN } from '../src/data/angin'
import { KREDIT } from '../src/data/kredit'
import { SERI_ARSIP, bacaJam, rataArah, ringkasHarian, samaDenganData, namaZona, seriDariRespons, ambilAnginLangsung, kosongkanCacheAngin, urlAnginLangsung } from '../src/lib/angin'
import AnginNyata from '../src/components/AnginNyata'

globalThis.IS_REACT_ACT_ENVIRONMENT = false
const tunggu = (ms = 60) => new Promise((r) => setTimeout(r, ms))

// Respons Open-Meteo buatan untuk 72 jam: 17–19 November 2026, Papua (WIT, UTC+9)
const responsPalsu = (ubah = {}) => {
  const time = Array.from({ length: 72 }, (_, i) => new Date(Date.UTC(2026, 10, 17, 0) + i * 3600e3).toISOString().slice(0, 13) + ':00')
  return {
    latitude: -4.2, longitude: 138.1, elevation: 1200, utc_offset_seconds: 32400, timezone: 'Asia/Jayapura',
    hourly_units: { time: 'iso8601', wind_speed_10m: 'm/s', wind_direction_10m: '°' },
    hourly: { time, wind_speed_10m: time.map((_, i) => 1 + (i % 7) * 0.5), wind_direction_10m: time.map((_, i) => (i * 5) % 360) },
    ...ubah,
  }
}
const fetchOk = (isi) => vi.fn(async () => ({ ok: true, status: 200, json: async () => isi }))

describe('arsip angin Open-Meteo (data nyata)', () => {
  it('72 jam berurutan (3 hari penuh), tiga larik sama panjang', () => {
    expect(KECEPATAN_ANGIN).toHaveLength(72)
    expect(ARAH_ANGIN).toHaveLength(72)
    WAKTU_ANGIN.forEach((w, i) => expect(new Date(`${w}:00+07:00`).getTime()).toBe(new Date('2026-08-19T00:00:00+07:00').getTime() + i * 3600e3))
    expect(WAKTU_ANGIN[71]).toBe('2026-08-21T23:00')
  })
  it('nilai sama dengan respons API pada titik acuan dan berada pada rentang fisik', () => {
    KECEPATAN_ANGIN.forEach((u) => { expect(u).toBeGreaterThanOrEqual(0); expect(u).toBeLessThan(20) })
    ARAH_ANGIN.forEach((d) => { expect(Number.isInteger(d)).toBe(true); expect(d).toBeLessThan(360) })
    expect([KECEPATAN_ANGIN[0], ARAH_ANGIN[0]]).toEqual([4.34, 172])
    expect([KECEPATAN_ANGIN[11], ARAH_ANGIN[11]]).toEqual([4.8, 169])
    expect([KECEPATAN_ANGIN[37], ARAH_ANGIN[37]]).toEqual([4.61, 117])
    expect([KECEPATAN_ANGIN[58], ARAH_ANGIN[58]]).toEqual([0.28, 315])
    expect([KECEPATAN_ANGIN[71], ARAH_ANGIN[71]]).toEqual([2.18, 160])
  })
  it('atribusi lengkap (CC BY 4.0 wajib menyebut sumber)', () => {
    expect(SUMBER_ANGIN.lisensi).toBe('CC BY 4.0')
    expect(KREDIT.some((k) => /Open-Meteo/.test(k.nama) && k.lisensi === 'CC BY 4.0')).toBe(true)
  })
})

describe('fungsi bantu angin', () => {
  it('bacaJam membaca indeks, menjepit, dan menyimpan waktu dinding lokal', () => {
    expect(bacaJam(SERI_ARSIP, 14)).toMatchObject({ waktu: '2026-08-19T14:00', jam: 14, U: 3.7, theta: 111 })
    expect(bacaJam(SERI_ARSIP, -5).indeks).toBe(0)
    expect(bacaJam(SERI_ARSIP, 999).indeks).toBe(71)
    expect(bacaJam(SERI_ARSIP, 14).instan.toISOString()).toBe('2026-08-19T14:00:00.000Z') // sengaja UTC: jam dinding
  })
  it('zona waktu Indonesia', () => {
    expect([namaZona(25200), namaZona(28800), namaZona(32400), namaZona(0)]).toEqual(['WIB', 'WITA', 'WIT', 'UTC+0'])
  })
  it('rata-rata arah melingkar: 350° dan 10° menjadi 0°, bukan 180°', () => {
    expect(rataArah([350, 10])).toBe(0)
    expect(rataArah([90, 90, 90])).toBe(90)
  })
  it('ringkasan harian cocok dengan hitungan langsung', () => {
    const h = ringkasHarian(SERI_ARSIP)
    expect(h.map((x) => x.tanggal)).toEqual(['2026-08-19', '2026-08-20', '2026-08-21'])
    h.forEach((x, k) => {
      const u = KECEPATAN_ANGIN.slice(k * 24, k * 24 + 24)
      expect(x.rata).toBeCloseTo(u.reduce((a, b) => a + b, 0) / 24, 10)
      expect(x.maks).toBe(Math.max(...u))
    })
  })
  it('samaDenganData mendeteksi perubahan manual', () => {
    expect(samaDenganData(SERI_ARSIP, 5, { U: 3.5, theta: 178 })).toBe(true)
    expect(samaDenganData(SERI_ARSIP, 5, { U: 3.6, theta: 178 })).toBe(false)
  })
})

describe('angin langsung per lokasi', () => {
  beforeEach(kosongkanCacheAngin)
  it('URL meminta 72 jam (kemarin, hari ini, besok), m/s, zona waktu lokal', () => {
    const u = urlAnginLangsung(-4.2, 138.1)
    expect(u).toContain('api.open-meteo.com/v1/forecast')
    expect(u).toContain('latitude=-4.2000&longitude=138.1000')
    expect(u).toContain('hourly=wind_speed_10m,wind_direction_10m')
    expect(u).toContain('wind_speed_unit=ms')
    expect(u).toContain('timezone=auto')
    expect(u).toContain('past_days=1&forecast_days=2')
  })
  it('respons valid diubah menjadi seri (berlaku untuk wilayah mana pun, bukan hanya Kalimantan)', () => {
    const s = seriDariRespons(responsPalsu())
    expect(s.waktu).toHaveLength(72)
    expect(s).toMatchObject({ lintang: -4.2, bujur: 138.1, offsetDetik: 32400, sumber: 'langsung' })
    expect(namaZona(s.offsetDetik)).toBe('WIT')
  })
  it('menolak respons yang bentuknya tidak masuk akal', () => {
    expect(seriDariRespons(null)).toBeNull()
    expect(seriDariRespons({})).toBeNull()
    expect(seriDariRespons(responsPalsu({ hourly_units: { wind_speed_10m: 'km/h' } }))).toBeNull()
    const r = responsPalsu(); r.hourly.wind_speed_10m[3] = null
    expect(seriDariRespons(r)).toBeNull()
    const s = responsPalsu(); s.hourly.wind_direction_10m.pop()
    expect(seriDariRespons(s)).toBeNull()
    const n = responsPalsu(); n.hourly.wind_speed_10m[0] = -1
    expect(seriDariRespons(n)).toBeNull()
  })
  it('ambilAnginLangsung memakai cache per koordinat dan melempar bila HTTP gagal', async () => {
    const f = fetchOk(responsPalsu())
    await ambilAnginLangsung(-4.2, 138.1, { fetchFn: f })
    await ambilAnginLangsung(-4.2001, 138.1004, { fetchFn: f }) // dibulatkan ke petak yang sama
    expect(f).toHaveBeenCalledTimes(1)
    await expect(ambilAnginLangsung(1, 100, { fetchFn: vi.fn(async () => ({ ok: false, status: 500 })) })).rejects.toThrow('HTTP 500')
    await expect(ambilAnginLangsung(2, 101, { fetchFn: fetchOk({ hourly: {} }) })).rejects.toThrow()
  })
})

describe('panel Angin nyata', () => {
  let akar, wadah
  const asli = globalThis.fetch
  beforeAll(() => { Element.prototype.scrollIntoView = () => {} })
  beforeEach(kosongkanCacheAngin)
  afterEach(() => { akar?.unmount(); wadah?.remove(); globalThis.fetch = asli })

  function Bungkus({ awal = null, onUbah, lat = -4.2, lon = 138.1 }) {
    const [params, setParams] = useState({ U: 8, theta: 80, jenisLahan: 'semak' })
    const [i, setI] = useState(awal)
    onUbah?.(params, i)
    return <AnginNyata lat={lat} lon={lon} params={params} onParams={setParams} indeks={i} onIndeks={setI} />
  }
  const pasang = async (props, fetchImpl) => {
    globalThis.fetch = fetchImpl
    wadah = document.createElement('div'); document.body.append(wadah)
    const log = { params: null, i: null }
    akar = createRoot(wadah)
    akar.render(<Bungkus {...props} onUbah={(p, i) => { log.params = p; log.i = i }} />)
    await tunggu(120)
    return log
  }
  const geser = async (nilai) => {
    const r = wadah.querySelector('input[type="range"]')
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(r, String(nilai))
    r.dispatchEvent(new Event('input', { bubbles: true })); await tunggu()
  }

  it('memuat angin langsung di koordinat titik api dan mengisi parameter simulasi dari jam terpilih', async () => {
    const f = fetchOk(responsPalsu())
    const log = await pasang({}, f)
    expect(f.mock.calls[0][0]).toContain('latitude=-4.2000&longitude=138.1000')
    expect(wadah.querySelectorAll('rect')).toHaveLength(72)
    await geser(14)
    const r = responsPalsu()
    expect(log.i).toBe(14)
    expect(log.params).toMatchObject({ U: r.hourly.wind_speed_10m[14], theta: (14 * 5) % 360, jenisLahan: 'semak' })
    expect(wadah.textContent).toMatch(/14\.00 WIT/)
  })
  it('gagal memuat: kembali ke arsip nyata, memberi tahu, dan bisa dicoba lagi', async () => {
    const log = await pasang({}, vi.fn(async () => { throw new Error('offline') }))
    expect(wadah.textContent).toMatch(/tidak bisa dimuat/)
    expect(wadah.textContent).toMatch(/Arsip nyata/)
    await geser(37)
    expect(log.params).toMatchObject({ U: 4.61, theta: 117 })
    expect(wadah.textContent).toMatch(/37 Agu|20 Agu/)
    expect([...wadah.querySelectorAll('button')].some((b) => /Coba lagi/.test(b.textContent))).toBe(true)
  })
  it('tombol Arsip memakai data 19–21 Agustus 2026 tanpa jaringan', async () => {
    const f = fetchOk(responsPalsu())
    const log = await pasang({}, f)
    ;[...wadah.querySelectorAll('button')].find((b) => /Arsip Agu 2026/.test(b.textContent)).click(); await tunggu()
    await geser(58)
    expect(log.params).toMatchObject({ U: 0.28, theta: 315 })
    expect(wadah.textContent).toMatch(/Open-Meteo Historical Weather API/)
  })
  it('tombol hari mempertahankan jam dan pindah hari', async () => {
    const log = await pasang({ awal: 14 }, fetchOk(responsPalsu()))
    const hari = [...wadah.querySelectorAll('[aria-pressed]')].filter((b) => !/Titik ini|Arsip/.test(b.textContent))
    expect(hari).toHaveLength(3)
    hari[2].click(); await tunggu()
    expect(log.i).toBe(62)
  })
  it('menawarkan pemulihan bila parameter tidak lagi sama dengan data', async () => {
    const log = await pasang({ awal: 11 }, fetchOk(responsPalsu()))
    const pulih = [...wadah.querySelectorAll('button')].find((x) => /Kembalikan ke data/.test(x.textContent))
    expect(pulih).toBeTruthy()
    pulih.click(); await tunggu()
    expect(log.params.U).toBe(responsPalsu().hourly.wind_speed_10m[11])
    expect([...wadah.querySelectorAll('button')].some((x) => /Kembalikan ke data/.test(x.textContent))).toBe(false)
  })
  it('lolos axe (kontras diuji di peramban nyata)', async () => {
    await pasang({ awal: 37 }, fetchOk(responsPalsu()))
    const { violations } = await axe.run(wadah, { rules: { 'color-contrast': { enabled: false } } })
    expect(violations.map((v) => v.id)).toEqual([])
  })
})
