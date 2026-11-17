// Ringkasan data sisi pengunjung untuk dashboard admin, dari sumber yang sama dengan halaman publik:
// - titik panas nyata SiPongi (snapshot yang sama dengan layer SiPongi di halaman Peta)
// - kemajuan belajar tiap ruang penyimpanan di perangkat ini (tamu + akun yang pernah masuk), lihat ruang.js
import sipongi from '../data/sipongi-kaltim.json'
import sipongiLuar from '../data/sipongi-indonesia.json'
import { daftarArtikel } from './artikel'
import { daftarKuis, semuaChecklist } from './kontenEdukasi'
import { AKUN } from './auth'

export { sipongi, sipongiLuar }

/** Hitungan titik panas SiPongi: per tanggal (Kaltim dan nasional di luar Kaltim) dan kabupaten terbanyak. */
export function ringkasSipongi() {
  const perTanggal = sipongi.tanggal.map((t) => ({ t, kaltim: sipongi.titik.filter((x) => x[2] === t).length, luar: sipongiLuar.titik.filter((x) => x[2] === t).length }))
  const hitungKab = (titik) => {
    const m = new Map()
    for (const x of titik) m.set(x[5], (m.get(x[5]) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([nama, n]) => ({ nama, n }))
  }
  return {
    perTanggal,
    totalKaltim: sipongi.titik.length,
    totalLuar: sipongiLuar.titik.length,
    kabKaltim: hitungKab(sipongi.titik).slice(0, 5),
    kabLuar: hitungKab(sipongiLuar.titik).slice(0, 5),
    sumber: sipongi.sumber, url: sipongi.url,
  }
}

const baca = (k, awal) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? awal } catch { return awal } }

/** Kemajuan belajar per ruang (tamu + tiap akun) yang tersimpan di perangkat ini. */
export function belajarPerangkat(bahasa = 'id') {
  let kunci
  try { kunci = Object.keys(localStorage) } catch { return { ruang: [], artikel: [], nArtikel: 0, nKuis: 0, nCentang: 0 } }
  const email = new Set()
  for (const k of kunci) { const m = k.match(/^pyraops-(?:baca|skor-kuis|skor-patroli|checklist-(?:keluarga|sekolah)|simpan)::(.+)$/); if (m) email.add(m[1]) }
  const artikel = daftarArtikel(bahasa)
  const slugAda = new Set(artikel.map((a) => a.slug))
  const butir = new Set(semuaChecklist(bahasa).map((d) => d.id))
  const satu = (akhiran, nama, peran) => {
    const bacaan = (baca(`pyraops-baca${akhiran}`, []) || []).filter((s) => slugAda.has(s))
    const centang = ['keluarga', 'sekolah'].flatMap((g) => baca(`pyraops-checklist-${g}${akhiran}`, []) || []).filter((id) => butir.has(id))
    const skor = baca(`pyraops-skor-kuis${akhiran}`, null)
    const patroli = baca(`pyraops-skor-patroli${akhiran}`, null)
    const simpan = (baca(`pyraops-simpan${akhiran}`, []) || []).filter((s) => slugAda.has(s))
    return { nama, peran, bacaan, centang: centang.length, skor: skor && Number.isFinite(skor.skor) ? skor : null, patroli: patroli && Number.isFinite(patroli.skor) ? patroli : null, simpan: simpan.length }
  }
  const ruang = [...email].sort().map((e) => { const a = AKUN.find((x) => x.email === e); return satu(`::${e}`, a?.nama ?? e, a?.peran ?? 'pengguna') }).filter((r) => r.peran !== 'admin')
  const tamu = satu('', null, 'tamu')
  if (tamu.bacaan.length || tamu.centang || tamu.skor || tamu.patroli) ruang.push(tamu)
  return {
    ruang,
    artikel: artikel.map((a) => ({ slug: a.slug, judul: a.judul, n: ruang.filter((r) => r.bacaan.includes(a.slug)).length })),
    nArtikel: artikel.length, nKuis: daftarKuis(bahasa).length, nCentang: butir.size,
  }
}
