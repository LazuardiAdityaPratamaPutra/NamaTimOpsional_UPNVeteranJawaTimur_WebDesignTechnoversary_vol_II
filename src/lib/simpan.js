// Artikel tersimpan: hanya untuk pengguna yang login (disimpan di ruang akunnya).
import { bacaJson, ruangAktif, tulisJson } from './ruang'

const K = 'pyraops-simpan'
export const muatSimpan = () => { const v = bacaJson(K, []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [] }
/** Tambah atau cabut slug dari daftar; mengembalikan daftar baru. Tamu tidak bisa menyimpan. */
export function alihSimpan(slug) {
  if (!ruangAktif()) return []
  const v = muatSimpan()
  const baru = v.includes(slug) ? v.filter((x) => x !== slug) : [...v, slug]
  tulisJson(K, baru)
  return baru
}
