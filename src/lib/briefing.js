// Briefing situasi: dari hasil hitungan -> Gemini lewat /api/briefing, dengan templat lokal sebagai cadangan.
import { namaArah, formatHa } from './format'
import { angkaAsing } from './angkaAsing'

const LABEL = {
  id: { ai: 'Dibuat otomatis oleh AI · bukan keputusan operasional', cadangan: 'Mode cadangan: ringkasan dari templat lokal · bukan keputusan operasional' },
  en: { ai: 'Generated automatically by AI · not an operational decision', cadangan: 'Fallback mode: summary from a local template · not an operational decision' },
}
export const labelAI = (bahasa = 'id') => LABEL[bahasa].ai
export const labelCadangan = (bahasa = 'id') => LABEL[bahasa].cadangan
export const LABEL_AI = LABEL.id.ai
export const LABEL_CADANGAN = LABEL.id.cadangan

const LAHAN_EN = { hutan: 'forest', semak: 'shrubland', gambut: 'peat (surface)', pertanian: 'farmland' }
const KATEGORI_EN = { kritis: 'critical', tinggi: 'high', waspada: 'watch' }

/** Ringkasan terstruktur hasil simulasi yang dikirim ke server. Hanya data hitungan, tanpa data pribadi. */
export function susunPayloadBriefing({ hotspot, params, zona, risiko, bahasa = 'id' }) {
  const waktu = new Date(hotspot.acq_datetime).toLocaleString(bahasa === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
  return {
    bahasa,
    lokasi: { id: hotspot.id, lat: Number(hotspot.lat.toFixed(3)), lon: Number(hotspot.lon.toFixed(3)) },
    waktuDeteksi: `${waktu} WIB`,
    angin: { kecepatanMs: params.U, asalDerajat: params.theta, asalArah: namaArah(params.theta, bahasa) },
    jenisLahan: params.jenisLahan,
    luasHa: { 3: Math.round(zona[3].luasHa), 6: Math.round(zona[6].luasHa), 12: Math.round(zona[12].luasHa) },
    desaTerancam: risiko.slice(0, 10).map((r) => ({ nama: r.nama, tipe: r.tipe, zona: r.zona, skor: r.skor, kategori: r.kategori })),
  }
}

/** Templat lokal: deterministik, tanpa jaringan, dan hanya memakai angka dari data masukan. */
export function buatBriefingLokal(d, bahasa = d.bahasa ?? 'id') {
  const { lokasi: l, angin: a, luasHa: h, desaTerancam: desa } = d
  const en = bahasa === 'en'
  const skor = (x) => (en ? String(x) : String(x).replace('.', ','))
  const teratas = desa.slice(0, 2).map((x) => (en
    ? `${x.nama} (${x.zona} h zone, score ${skor(x.skor)}, ${KATEGORI_EN[x.kategori]})`
    : `${x.nama} (zona ${x.zona} jam, skor ${skor(x.skor)}, ${x.kategori})`))
  if (en) {
    return [
      `Situation: Fire point ${l.id} (${l.lat.toFixed(3)}, ${l.lon.toFixed(3)}) detected ${d.waktuDeteksi}. Wind from the ${a.asalArah} ${a.kecepatanMs} m/s, ${LAHAN_EN[d.jenisLahan] ?? d.jenisLahan} terrain. Estimated area: ${formatHa(h[3], 'en')} ha (3 h), ${formatHa(h[6], 'en')} ha (6 h), ${formatHa(h[12], 'en')} ha (12 h).`,
      desa.length ? `Threat: ${desa.length} settlements at risk. Highest: ${teratas.join('; ')}.` : 'Threat: no sample settlements inside the predicted zones.',
      `Recommendations: 1. Verify the fire point on the ground. 2. ${desa.length ? `Warn ${desa[0].nama} first.` : 'Keep monitoring the fire point and its surroundings.'} 3. Monitor the wind and rerun the simulation if it changes.`,
      'Note: estimate from a simplified educational model.',
      'Automated summary, not an operational decision.',
    ].join('\n')
  }
  return [
    `Situasi: Titik api ${l.id} (${l.lat.toFixed(3)}, ${l.lon.toFixed(3)}) terdeteksi ${d.waktuDeteksi}. Angin dari ${a.asalArah} ${a.kecepatanMs} m/s, lahan ${d.jenisLahan}. Estimasi luas: ${formatHa(h[3])} ha (3 jam), ${formatHa(h[6])} ha (6 jam), ${formatHa(h[12])} ha (12 jam).`,
    desa.length ? `Ancaman: ${desa.length} pemukiman terancam. Tertinggi: ${teratas.join('; ')}.` : 'Ancaman: tidak ada pemukiman sampel di dalam zona prediksi.',
    `Rekomendasi: 1. Verifikasi titik api di lapangan. 2. ${desa.length ? `Beri peringatan lebih dulu kepada ${desa[0].nama}.` : 'Pantau titik api dan sekitarnya.'} 3. Pantau angin dan jalankan ulang simulasi bila berubah.`,
    'Catatan: estimasi dari model edukatif yang disederhanakan.',
    'Ringkasan otomatis, bukan keputusan operasional.',
  ].join('\n')
}

/** Meminta briefing ke server; gagal, lambat (> 6 dtk), atau memuat angka asing -> templat lokal. */
export async function ambilBriefing(payload, { fetchFn = (...a) => fetch(...a), timeoutMs = 6000 } = {}) {
  const kontrol = new AbortController()
  const timer = setTimeout(() => kontrol.abort(), timeoutMs)
  try {
    const res = await fetchFn('/api/briefing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: kontrol.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    if (!j.ok || typeof j.teks !== 'string' || !j.teks.trim()) throw new Error('Respons tidak valid')
    if (angkaAsing(j.teks, payload).length) throw new Error('Memuat angka di luar data')
    return { teks: j.teks.trim(), sumber: 'ai' }
  } catch (e) {
    return { teks: buatBriefingLokal(payload), sumber: 'cadangan', alasan: e.name === 'AbortError' ? 'timeout' : e.message }
  } finally { clearTimeout(timer) }
}
