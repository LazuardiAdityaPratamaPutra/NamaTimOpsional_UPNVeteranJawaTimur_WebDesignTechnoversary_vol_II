// Sinkronisasi laporan offline -> server. Tidak bergantung pada Background Sync API:
// dipicu event online, saat aplikasi dibuka, interval, dan tombol manual.
import { db } from './db'

/** Jeda coba ulang eksponensial: 2 dtk, 4, 8, ... maksimum 5 menit. */
export const jedaBackoff = (tries) => Math.min(300000, 2000 * 2 ** Math.max(0, tries - 1))

/** Pending selalu dicoba; failed menunggu jeda backoff kecuali dipaksa (tombol manual). */
export const layakDicoba = (r, sekarang, paksa = false) =>
  r.status === 'pending' || (r.status === 'failed' && (paksa || sekarang - (r.lastTry ?? 0) >= jedaBackoff(r.tries)))

async function blobKeBase64(blob) {
  const byte = new Uint8Array(await blob.arrayBuffer())
  let s = ''
  for (let i = 0; i < byte.length; i += 0x8000) s += String.fromCharCode(...byte.subarray(i, i + 0x8000))
  return btoa(s)
}

async function kirimSatu(r, fetchFn) {
  const { id, createdAt, lat, lon, accuracy, severity, note, photo } = r
  const badan = { id, createdAt, lat, lon, accuracy, severity, note, foto: photo ? await blobKeBase64(photo) : null }
  const kontrol = new AbortController()
  const timer = setTimeout(() => kontrol.abort(), 8000)
  try {
    const res = await fetchFn('/api/sync', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(badan), signal: kontrol.signal,
    })
    // Hosting statis tanpa fungsi serverless (404/405): akui secara lokal dan tandai sebagai demo
    if (res.status === 404 || res.status === 405) return { serverId: `demo-${id.slice(0, 8)}`, demo: true }
    const json = await res.json()
    if (!res.ok || !json.ok) throw new Error(json.error || `HTTP ${res.status}`)
    return { serverId: json.serverId, demo: false }
  } finally {
    clearTimeout(timer)
  }
}

let berjalan = null // satu sinkronisasi pada satu waktu (mencegah kirim ganda)

/**
 * Menyinkronkan semua laporan pending/failed. Mengembalikan { berhasil, demo, gagal, dilewati }.
 * `berhasil` hanya untuk laporan yang benar-benar diakui server; `demo` = hosting tanpa server penerima (tercatat lokal saja).
 */
export function sinkronkan({ paksa = false, fetchFn = (...a) => fetch(...a), sekarang = Date.now() } = {}) {
  if (berjalan) return berjalan
  berjalan = (async () => {
    const hasil = { berhasil: 0, demo: 0, gagal: 0, dilewati: 0 }
    const antrean = await db.reports.where('status').anyOf('pending', 'failed').sortBy('createdAt')
    for (const r of antrean) {
      if (!layakDicoba(r, sekarang, paksa)) { hasil.dilewati++; continue }
      try {
        const { serverId, demo } = await kirimSatu(r, fetchFn)
        await db.reports.update(r.id, { status: 'synced', syncedAt: Date.now(), serverId, modeDemo: demo })
        if (demo) hasil.demo++; else hasil.berhasil++
      } catch {
        await db.reports.update(r.id, { status: 'failed', tries: r.tries + 1, lastTry: Date.now() })
        hasil.gagal++
      }
    }
    return hasil
  })().finally(() => { berjalan = null })
  return berjalan
}
