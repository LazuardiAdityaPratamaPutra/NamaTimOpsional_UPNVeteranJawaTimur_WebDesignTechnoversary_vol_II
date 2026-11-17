// Logika endpoint sinkronisasi DEMO. Dipakai oleh api/sync.js (Vercel) dan server dev Vite.
// Idempoten: id yang sama selalu menghasilkan serverId yang sama.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TINGKAT = ['ringan', 'sedang', 'berat']

export function tanganiSinkron(body) {
  const galat = (pesan) => ({ status: 400, json: { ok: false, error: pesan } })
  if (!body || typeof body !== 'object') return galat('Body tidak valid')
  const { id, lat, lon, severity } = body
  if (!UUID.test(String(id))) return galat('id harus UUID')
  if (!(typeof lat === 'number' && lat >= -90 && lat <= 90 && typeof lon === 'number' && lon >= -180 && lon <= 180)) return galat('Koordinat tidak valid')
  if (!TINGKAT.includes(severity)) return galat('Tingkat keparahan tidak valid')
  return { status: 200, json: { ok: true, serverId: `srv-${id.slice(0, 8)}` } }
}
