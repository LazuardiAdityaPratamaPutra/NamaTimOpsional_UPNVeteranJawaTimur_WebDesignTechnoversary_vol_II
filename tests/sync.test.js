import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db, tambahLaporan } from '../src/lib/db'
import { sinkronkan, jedaBackoff, layakDicoba } from '../src/lib/sync'

const baru = (o = {}) => tambahLaporan({ lat: -2.2, lon: 113.9, severity: 'sedang', note: 'uji', ...o })
const respons = (status, json) => ({ ok: status >= 200 && status < 300, status, json: async () => json })
const sukses = () => vi.fn(async () => respons(200, { ok: true, serverId: 'srv-uji' }))

beforeEach(async () => { await db.reports.clear() })

describe('tambahLaporan', () => {
  it('menyimpan sebagai pending dengan UUID', async () => {
    const r = await baru()
    expect(r.status).toBe('pending'); expect(r.tries).toBe(0)
    expect(r.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(await db.reports.count()).toBe(1)
  })
  it('menolak koordinat dan tingkat tidak valid', async () => {
    await expect(baru({ lat: 99 })).rejects.toThrow()
    await expect(baru({ severity: 'dahsyat' })).rejects.toThrow()
  })
})

describe('sinkronkan', () => {
  it('pending -> synced dengan serverId dan syncedAt', async () => {
    const r = await baru()
    const hasil = await sinkronkan({ fetchFn: sukses() })
    expect(hasil).toEqual({ berhasil: 1, demo: 0, gagal: 0, dilewati: 0 })
    const s = await db.reports.get(r.id)
    expect(s.status).toBe('synced'); expect(s.serverId).toBe('srv-uji'); expect(s.syncedAt).toBeGreaterThan(0)
  })
  it('gagal -> failed, tries naik; backoff menunda; paksa tetap mencoba; lalu berhasil', async () => {
    const r = await baru()
    await sinkronkan({ fetchFn: vi.fn(async () => { throw new TypeError('jaringan putus') }) })
    let s = await db.reports.get(r.id)
    expect(s.status).toBe('failed'); expect(s.tries).toBe(1)

    const f = sukses()
    expect((await sinkronkan({ fetchFn: f })).dilewati).toBe(1) // masih dalam jeda backoff
    expect(f).not.toHaveBeenCalled()

    expect((await sinkronkan({ fetchFn: f, paksa: true })).berhasil).toBe(1) // tombol manual
    s = await db.reports.get(r.id)
    expect(s.status).toBe('synced')
  })
  it('server menolak (400) dihitung gagal', async () => {
    const r = await baru()
    await sinkronkan({ fetchFn: vi.fn(async () => respons(400, { ok: false, error: 'x' })) })
    expect((await db.reports.get(r.id)).status).toBe('failed')
  })
  it('hosting tanpa fungsi (404) diakui sebagai server demo lokal', async () => {
    const r = await baru()
    await sinkronkan({ fetchFn: vi.fn(async () => respons(404, {})) })
    const s = await db.reports.get(r.id)
    expect(s.status).toBe('synced'); expect(s.modeDemo).toBe(true); expect(s.serverId).toMatch(/^demo-/)
  })
  it('hosting demo tidak dihitung sebagai "berhasil" (tidak boleh diklaim diterima server)', async () => {
    await baru()
    const h = await sinkronkan({ fetchFn: vi.fn(async () => respons(404, {})) })
    expect(h.berhasil).toBe(0); expect(h.demo).toBe(1)
  })
  it('idempoten: laporan synced tidak dikirim lagi', async () => {
    await baru()
    const f = sukses()
    await sinkronkan({ fetchFn: f })
    await sinkronkan({ fetchFn: f })
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('dua pemicu bersamaan hanya mengirim sekali per laporan', async () => {
    await baru()
    const f = sukses()
    await Promise.all([sinkronkan({ fetchFn: f }), sinkronkan({ fetchFn: f })])
    expect(f).toHaveBeenCalledTimes(1)
  })
  it('mengirim foto sebagai base64', async () => {
    await baru({ photo: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }) })
    const f = sukses()
    await sinkronkan({ fetchFn: f })
    expect(JSON.parse(f.mock.calls[0][1].body).foto).toBe('AQID')
  })
})

describe('backoff', () => {
  it('eksponensial dan dibatasi 5 menit', () => {
    expect([1, 2, 3].map(jedaBackoff)).toEqual([2000, 4000, 8000])
    expect(jedaBackoff(30)).toBe(300000)
  })
  it('layakDicoba', () => {
    expect(layakDicoba({ status: 'pending', tries: 0 }, 0)).toBe(true)
    expect(layakDicoba({ status: 'failed', tries: 1, lastTry: 1000 }, 1500)).toBe(false)
    expect(layakDicoba({ status: 'failed', tries: 1, lastTry: 1000 }, 3000)).toBe(true)
    expect(layakDicoba({ status: 'synced', tries: 0 }, 0, true)).toBe(false)
  })
})
