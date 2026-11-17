import { describe, it, expect, vi } from 'vitest'
import { KUIS } from '../src/data/kuis'
import { CHECKLIST } from '../src/data/checklist'
import { GALERI } from '../src/data/galeri'
import { KREDIT } from '../src/data/kredit'
import { TIM } from '../src/data/tim'
import { STATISTIK } from '../src/data/statistik'
import { LANGKAH_TUR } from '../src/data/tur'
import { DEMO } from '../src/data/demo'
import hotspots from '../src/data/hotspot.json'
import pemukiman from '../src/data/pemukiman.json'
import { ARTIKEL, ARTIKEL_EN, daftarArtikel, cariArtikel } from '../src/lib/artikel'
import { lokal, KAMUS } from '../src/i18n'
import { namaArah, formatHa, desimal, namaLahan, namaTipe } from '../src/lib/format'
import { pesanHasil } from '../src/lib/kuis'
import { validasiKontak, buatMailto } from '../src/lib/kontak'
import { angkaAsing } from '../src/lib/angkaAsing'
import { susunPayloadBriefing, buatBriefingLokal, ambilBriefing, labelAI, labelCadangan } from '../src/lib/briefing'
import { jawabanCadangan, kirimChat } from '../src/lib/chat'
import { tanganiBriefing, tanganiChat, validasiBriefing, validasiChat, buatPembatas, SISTEM_BRIEFING_EN, SISTEM_CHAT_EN } from '../src/lib/gemini'
import { hitungZona } from '../src/lib/simulasi'
import { hitungRisiko } from '../src/lib/risiko'

// Kata Indonesia yang tidak boleh muncul pada keluaran berbahasa Inggris
const KATA_ID = ['yang', 'dan', 'untuk', 'dengan', 'tidak', 'atau', 'pada', 'dari', 'adalah', 'saat', 'sudah', 'belum', 'kamu', 'halaman', 'laporan', 'simulasi', 'angin', 'silakan', 'bisa', 'akan', 'dapat', 'karena', 'jika', 'bila', 'semua', 'setiap', 'hasil', 'kritis', 'tinggi', 'waspada', 'pemukiman', 'terancam']
const bocor = (teks) => [...new Set((teks.toLowerCase().match(/[a-zà-ÿ]+/g) ?? []).filter((k) => KATA_ID.includes(k)))]

describe('kamus dan lokal()', () => {
  it('kedua kamus punya struktur sama tetapi isi berbeda', () => {
    expect(Object.keys(KAMUS.id.nav)).toEqual(Object.keys(KAMUS.en.nav))
    expect(KAMUS.en.tagline).not.toBe(KAMUS.id.tagline)
    expect(KAMUS.en.disclaimer).toMatch(/educational model/)
    expect(bocor(KAMUS.en.disclaimer + KAMUS.en.tagline)).toEqual([])
  })
  it('lokal menimpa bidang bahasa Inggris dan mempertahankan sisanya', () => {
    const item = { id: 'x', judul: 'Satu', en: { judul: 'One' } }
    expect(lokal(item, 'en')).toEqual({ id: 'x', judul: 'One', en: { judul: 'One' } })
    expect(lokal(item, 'id').judul).toBe('Satu')
    expect(lokal({ id: 'y', judul: 'Dua' }, 'en').judul).toBe('Dua')
  })
})

describe('paritas data Indonesia dan Inggris', () => {
  it('kuis: 4 opsi, kunci jawaban sama, tidak ada kebocoran bahasa Indonesia', () => {
    KUIS.forEach((q) => {
      const e = lokal(q, 'en')
      expect(e.opsi).toHaveLength(4); expect(e.benar).toBe(q.benar)
      expect(e.tanya).not.toBe(q.tanya); expect(e.jelasan).not.toBe(q.jelasan)
      expect(bocor([e.tanya, ...e.opsi, e.jelasan].join(' ')), q.id).toEqual([])
    })
  })
  it('checklist: setiap butir punya terjemahan', () => {
    for (const d of [...CHECKLIST.keluarga, ...CHECKLIST.sekolah]) {
      expect(lokal(d, 'en').teks).not.toBe(d.teks)
      expect(bocor(lokal(d, 'en').teks), d.id).toEqual([])
    }
  })
  it('galeri, kredit, tim, statistik, tur: semua bidang tampil punya versi Inggris', () => {
    GALERI.forEach((g) => { const e = lokal(g, 'en'); for (const f of ['judul', 'alt', 'keterangan', 'atribusi', 'lisensi']) expect(e[f]).not.toBe(g[f]); expect(bocor(['judul', 'alt', 'keterangan', 'atribusi', 'lisensi'].map((f) => e[f]).join(' ')), g.id).toEqual([]) })
    KREDIT.forEach((r) => expect(lokal(r, 'en').jenis, r.nama).toBeTruthy())
    TIM.anggota.forEach((a) => expect(lokal(a, 'en').peran).toBeTruthy())
    STATISTIK.forEach((s) => expect(lokal(s, 'en').label).not.toBe(s.label))
    LANGKAH_TUR.forEach((s) => { const e = lokal(s, 'en'); expect(e.judul).not.toBe(s.judul); expect(bocor(e.judul + ' ' + e.isi), s.selector).toEqual([]) })
    expect(lokal(LANGKAH_TUR.at(-1), 'en').tautan).toEqual({ ke: '/lapor', label: 'Open the Report page' })
  })
  it('artikel: slug, urutan, jumlah placeholder dan heading sama di kedua bahasa', () => {
    expect(ARTIKEL_EN.map((a) => a.slug)).toEqual(ARTIKEL.map((a) => a.slug))
    ARTIKEL.forEach((a, i) => {
      const e = ARTIKEL_EN[i]
      expect(e.judul).not.toBe(a.judul); expect(e.ringkas).toBeTruthy()
      expect((e.isi.match(/\[ISI/g) || []).length, a.slug).toBe((a.isi.match(/\[ISI/g) || []).length)
      expect((e.isi.match(/^## /gm) || []).length, a.slug).toBe((a.isi.match(/^## /gm) || []).length)
      const teksTanpaPlaceholder = e.isi.replace(/\[ISI[^\]]*\]/g, '').replace(/\]\([^)]*\)/g, ']') // alamat tautan bukan teks bacaan
      expect(bocor(teksTanpaPlaceholder + e.judul + e.ringkas), a.slug).toEqual([])
      // tautan sumber sama di kedua bahasa
      expect((e.isi.match(/\]\(https:[^)]+\)/g) || []).length, a.slug).toBeGreaterThanOrEqual(3)
    })
    expect(daftarArtikel('en')).toBe(ARTIKEL_EN); expect(daftarArtikel('id')).toBe(ARTIKEL)
    expect(cariArtikel('gambut', 'en').judul).toMatch(/peat/i)
  })
})

describe('format dan pustaka sadar bahasa', () => {
  it('arah, luas, desimal, lahan, tipe', () => {
    expect(namaArah(90, 'en')).toBe('east'); expect(namaArah(225, 'en')).toBe('southwest'); expect(namaArah(90)).toBe('timur')
    expect(formatHa(1952, 'en')).toBe('1,952'); expect(formatHa(1952)).toBe('1.952')
    expect(desimal(0.3, 'en')).toBe('0.3'); expect(desimal(0.3)).toBe('0,3')
    expect(namaLahan('gambut', 'en')).toBe('Peat (surface)'); expect(namaTipe('faskes', 'en')).toBe('Health facility')
  })
  it('kuis dan kontak', () => {
    expect(pesanHasil(100, 'en')).toMatch(/Perfect/); expect(pesanHasil(10, 'en')).toMatch(/try again/i)
    const g = validasiKontak({ nama: '', email: 'x', pesan: '' }, 'en')
    expect(Object.values(g).every((m) => bocor(m).length === 0)).toBe(true); expect(g.nama).toMatch(/name/i)
    expect(validasiKontak({ nama: '', email: '', pesan: '' }).nama).toMatch(/nama/i)
    expect(decodeURIComponent(buatMailto('a@b.id', { nama: 'Sari', email: 's@x.id', pesan: 'halo' }, 'en').split('subject=')[1].split('&')[0])).toBe('Message from Sari (PyraOps)')
  })
  it('angkaAsing menerima format ribuan Inggris', () => {
    const data = { luasHa: { 12: 1952 } }
    expect(angkaAsing('Area 1,952 ha', data)).toEqual([]); expect(angkaAsing('Area 1.952 ha', data)).toEqual([])
    expect(angkaAsing('Area 9,999 ha', data)).toEqual(['9,999'])
  })
})

describe('briefing berbahasa Inggris', () => {
  const h = hotspots.find((x) => x.id === DEMO.hotspotId)
  const params = { U: DEMO.U, theta: DEMO.theta, jenisLahan: DEMO.jenisLahan }
  const zona = hitungZona({ lat: h.lat, lon: h.lon, ...params })
  const buat = (bahasa) => susunPayloadBriefing({ hotspot: h, params, zona, risiko: hitungRisiko(pemukiman, zona), bahasa })
  const en = buat('en'), id = buat('id')

  it('payload membawa bahasa, arah angin dan waktu berbahasa Inggris', () => {
    expect(en.bahasa).toBe('en'); expect(id.bahasa).toBe('id')
    expect(en.angin.asalArah).toBe('east'); expect(id.angin.asalArah).toBe('timur')
    expect(validasiBriefing(en).bahasa).toBe('en'); expect(validasiBriefing(id).bahasa).toBe('id')
  })
  it('templat Inggris: lengkap, <= 120 kata, tanpa angka asing, tanpa kata Indonesia', () => {
    const t = buatBriefingLokal(en)
    ;['Situation:', 'Threat:', 'Recommendations:', 'Note:'].forEach((b) => expect(t).toContain(b))
    expect(t.trim().endsWith('Automated summary, not an operational decision.')).toBe(true)
    expect(t.split(/\s+/).length).toBeLessThanOrEqual(120)
    expect(angkaAsing(t, en)).toEqual([])
    expect(bocor(t.replace(/SDN 1 Tanjung Asri|Desa Tanjung Asri/g, ''))).toEqual([])
  })
  it('fallback ambilBriefing memakai bahasa pada payload; label sesuai bahasa', async () => {
    const r = await ambilBriefing(en, { fetchFn: vi.fn(async () => { throw new TypeError('x') }) })
    expect(r.sumber).toBe('cadangan'); expect(r.teks).toContain('Situation:')
    expect(labelAI('en')).toMatch(/not an operational decision/); expect(labelCadangan('en')).toMatch(/Fallback mode/)
    expect(labelAI()).toMatch(/bukan keputusan operasional/)
  })
})

describe('chat berbahasa Inggris', () => {
  it('jawaban cadangan Inggris menaut ke artikel dan menyebut 112 untuk darurat', () => {
    const j = jawabanCadangan('Why is peat so hard to put out?', 'en')
    expect(j.tautan.ke).toBe('/edukasi/gambut'); expect(j.tautan.label).toMatch(/^Read:/); expect(bocor(j.teks)).toEqual([])
    expect(jawabanCadangan('emergency! big fire', 'en').teks).toContain('112')
    expect(jawabanCadangan('gambut', 'en').tautan.ke).toBe('/edukasi/gambut') // kata kunci Indonesia tetap dikenali
    expect(jawabanCadangan('cooking recipe', 'en').tautan.ke).toBe('/edukasi')
  })
  it('kirimChat mengirim bahasa dan pesan batas laju mengikuti bahasa', async () => {
    const f = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, teks: 'Hello' }) }))
    await kirimChat('hi', [], { bahasa: 'en', fetchFn: f })
    expect(JSON.parse(f.mock.calls[0][1].body).bahasa).toBe('en')
    const r = await kirimChat('hi', [], { bahasa: 'en', fetchFn: vi.fn(async () => ({ ok: false, status: 429, json: async () => ({}) })) })
    expect(r.sumber).toBe('batas'); expect(r.teks).toMatch(/Too many questions/)
  })
})

describe('server: prompt sistem mengikuti bahasa', () => {
  const ok = (teks) => ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: teks }] } }] }) })
  const payload = (bahasa) => ({
    bahasa, lokasi: { id: 'H-01', lat: -2.185, lon: 113.842 }, waktuDeteksi: '14 Sep 2026, 13:30 WIB', angin: { kecepatanMs: 8, asalDerajat: 80, asalArah: 'east' },
    jenisLahan: 'semak', luasHa: { 3: 120, 6: 480, 12: 1952 }, desaTerancam: [{ nama: 'Desa A', tipe: 'desa', zona: 6, skor: 70, kategori: 'tinggi' }],
  })
  const ctx = (f) => ({ apiKey: 'K', ip: 'x', pembatas: buatPembatas(), fetchFn: f })

  it('briefing EN memakai prompt Inggris dan lolos pemeriksa angka dengan format 1,952', async () => {
    const f = vi.fn(async () => ok('Situation: area 1,952 ha, wind 8 m/s. Threat: 1 settlement. Recommendations: 1. a 2. b 3. c. Note: estimate. Automated summary, not an operational decision.'))
    const r = await tanganiBriefing(payload('en'), ctx(f))
    expect(r.status).toBe(200)
    const body = JSON.parse(f.mock.calls[0][1].body)
    expect(body.system_instruction.parts[0].text).toBe(SISTEM_BRIEFING_EN)
    expect(body.contents[0].parts[0].text).toContain('Situation data')
  })
  it('briefing ID tetap memakai prompt Indonesia; angka karangan EN tetap ditolak', async () => {
    const f = vi.fn(async () => ok('Situation: 7777 people affected.'))
    expect((await tanganiBriefing(payload('en'), ctx(f))).json.error).toBe('angka-asing')
    const g = vi.fn(async () => ok('Situasi: aman.'))
    await tanganiBriefing(payload('id'), ctx(g))
    expect(JSON.parse(g.mock.calls[0][1].body).system_instruction.parts[0].text).toMatch(/Anda menyusun/)
  })
  it('chat EN memakai prompt Inggris; bahasa tak dikenal jatuh ke Indonesia', async () => {
    const f = vi.fn(async () => ok('Answer'))
    await tanganiChat({ pesan: 'hi', bahasa: 'en' }, ctx(f))
    expect(JSON.parse(f.mock.calls[0][1].body).system_instruction.parts[0].text).toBe(SISTEM_CHAT_EN)
    expect(validasiChat({ pesan: 'hi', bahasa: 'fr' }).bahasa).toBe('id')
  })
})
