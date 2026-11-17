import { describe, it, expect } from 'vitest'
import { tanganiSinkron } from '../src/lib/syncServer'

const id = '3f2b8c1e-9a4d-4e6b-8c1d-2a3b4c5d6e7f'
const ok = { id, lat: -2.2, lon: 113.9, severity: 'berat' }

describe('endpoint sinkronisasi demo', () => {
  it('menerima laporan valid dan idempoten (id sama -> serverId sama)', () => {
    const a = tanganiSinkron(ok), b = tanganiSinkron(ok)
    expect(a.status).toBe(200); expect(a.json).toEqual({ ok: true, serverId: 'srv-3f2b8c1e' })
    expect(b.json.serverId).toBe(a.json.serverId)
  })
  it('menolak masukan tidak valid', () => {
    expect(tanganiSinkron(null).status).toBe(400)
    expect(tanganiSinkron({ ...ok, id: 'bukan-uuid' }).status).toBe(400)
    expect(tanganiSinkron({ ...ok, lat: 200 }).status).toBe(400)
    expect(tanganiSinkron({ ...ok, lon: '113' }).status).toBe(400)
    expect(tanganiSinkron({ ...ok, severity: 'x' }).status).toBe(400)
  })
})
