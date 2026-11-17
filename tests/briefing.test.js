import { describe, it, expect, vi } from 'vitest'
import { susunPayloadBriefing, buatBriefingLokal, ambilBriefing } from '../src/lib/briefing'
import { jawabanCadangan, susunRiwayat, kirimChat } from '../src/lib/chat'
import { angkaAsing } from '../src/lib/angkaAsing'
import { hitungZona } from '../src/lib/simulasi'
import { hitungRisiko } from '../src/lib/risiko'
import { validasiBriefing } from '../src/lib/gemini'
import { DEMO } from '../src/data/demo'
import hotspots from '../src/data/hotspot.json'
import pemukiman from '../src/data/pemukiman.json'

// Payload nyata dari skenario demo (mesin simulasi + risiko sungguhan)
const hotspot = hotspots.find((h) => h.id === DEMO.hotspotId)
const params = { U: DEMO.U, theta: DEMO.theta, jenisLahan: DEMO.jenisLahan }
const zona = hitungZona({ lat: hotspot.lat, lon: hotspot.lon, ...params })
const payload = susunPayloadBriefing({ hotspot, params, zona, risiko: hitungRisiko(pemukiman, zona) })
const respons = (status, json) => ({ ok: status < 300, status, json: async () => json })
const lambat = () => vi.fn((u, init) => new Promise((_, tolak) => init.signal.addEventListener('abort', () => tolak(Object.assign(new Error('x'), { name: 'AbortError' })))))

describe('payload briefing', () => {
  it('lolos validasi server dan berisi desa terancam dari demo', () => {
    expect(validasiBriefing(payload).ok).toBe(true)
    expect(payload.desaTerancam.length).toBeGreaterThanOrEqual(2)
    expect(payload.waktuDeteksi).toMatch(/WIB$/)
  })
})

describe('templat lokal (cadangan)', () => {
  const teks = buatBriefingLokal(payload)
  it('memuat semua bagian dan kalimat penutup wajib', () => {
    ;['Situasi:', 'Ancaman:', 'Rekomendasi:', 'Catatan:'].forEach((b) => expect(teks).toContain(b))
    expect(teks.trim().endsWith('Ringkasan otomatis, bukan keputusan operasional.')).toBe(true)
  })
  it('tidak memuat angka di luar data masukan', () => expect(angkaAsing(teks, payload)).toEqual([]))
  it('maksimal 120 kata', () => expect(teks.split(/\s+/).length).toBeLessThanOrEqual(120))
  it('menangani kasus tanpa pemukiman terancam', () => {
    const kosong = { ...payload, desaTerancam: [] }
    const t = buatBriefingLokal(kosong)
    expect(t).toContain('tidak ada pemukiman'); expect(angkaAsing(t, kosong)).toEqual([])
  })
})

describe('ambilBriefing: AI bila bisa, cadangan bila tidak', () => {
  const BAIK = 'Situasi: angin 8 m/s. Rekomendasi: 1. a 2. b 3. c. Ringkasan otomatis, bukan keputusan operasional.'
  it('sukses dari server -> sumber ai', async () => {
    const r = await ambilBriefing(payload, { fetchFn: vi.fn(async () => respons(200, { ok: true, teks: BAIK })) })
    expect(r.sumber).toBe('ai'); expect(r.teks).toBe(BAIK)
  })
  it.each([
    ['server 503 (kunci kosong)', () => vi.fn(async () => respons(503, { ok: false }))],
    ['404 (hosting statis tanpa fungsi)', () => vi.fn(async () => respons(404, {}))],
    ['jaringan putus', () => vi.fn(async () => { throw new TypeError('offline') })],
    ['respons bukan format yang diharapkan', () => vi.fn(async () => respons(200, { ok: true }))],
    ['angka karangan dari AI', () => vi.fn(async () => respons(200, { ok: true, teks: 'Ada 7777 korban.' }))],
  ])('%s -> templat lokal berlabel cadangan', async (_n, buat) => {
    const r = await ambilBriefing(payload, { fetchFn: buat() })
    expect(r.sumber).toBe('cadangan'); expect(r.teks).toContain('Situasi:'); expect(r.alasan).toBeTruthy()
  })
  it('lambat melewati batas waktu -> cadangan (alasan timeout)', async () => {
    const r = await ambilBriefing(payload, { fetchFn: lambat(), timeoutMs: 30 })
    expect(r.sumber).toBe('cadangan'); expect(r.alasan).toBe('timeout')
  })
})

describe('chat klien', () => {
  it('jawaban cadangan menaut ke artikel relevan dan menyebut 112 untuk darurat', () => {
    expect(jawabanCadangan('Mengapa gambut sulit padam?').tautan.ke).toBe('/edukasi/gambut')
    expect(jawabanCadangan('Bagaimana masker untuk asap?').tautan.ke).toBe('/edukasi/dampak')
    expect(jawabanCadangan('tolong ada api besar').teks).toContain('112')
    expect(jawabanCadangan('resep nasi goreng').tautan.ke).toBe('/edukasi')
  })
  it('riwayat hanya pasangan pertanyaan + jawaban AI, awal selalu pengguna', () => {
    const r = susunRiwayat([
      { peran: 'user', teks: 'a' }, { peran: 'model', teks: 'b', sumber: 'ai' },
      { peran: 'user', teks: 'c' }, { peran: 'model', teks: 'd', sumber: 'cadangan' },
      { peran: 'user', teks: 'e' }, { peran: 'model', teks: 'f', sumber: 'ai' },
    ])
    expect(r.map((x) => x.teks)).toEqual(['a', 'b', 'e', 'f']); expect(r[0].peran).toBe('user')
  })
  it('kirimChat: sukses, 429, dan gagal -> cadangan', async () => {
    expect((await kirimChat('hai', [], { fetchFn: vi.fn(async () => respons(200, { ok: true, teks: 'Halo' })) })).sumber).toBe('ai')
    expect((await kirimChat('hai', [], { fetchFn: vi.fn(async () => respons(429, {})) })).sumber).toBe('batas')
    const c = await kirimChat('asap', [], { fetchFn: vi.fn(async () => respons(500, {})) })
    expect(c.sumber).toBe('cadangan'); expect(c.tautan).toBeTruthy()
  })
})
