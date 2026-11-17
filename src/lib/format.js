// Fungsi format kecil untuk UI
const ARAH = {
  id: ['utara', 'timur laut', 'timur', 'tenggara', 'selatan', 'barat daya', 'barat', 'barat laut'],
  en: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'],
}

/** Nama arah mata angin (8 penjuru) dari derajat; 0 = utara. */
export const namaArah = (derajat, bahasa = 'id') => ARAH[bahasa][Math.round((((derajat % 360) + 360) % 360) / 45) % 8]

/** Luas hektare dengan pemisah ribuan sesuai bahasa. */
export const formatHa = (ha, bahasa = 'id') => Math.round(ha).toLocaleString(bahasa === 'en' ? 'en-US' : 'id-ID')

/** True bila teks masih berupa placeholder [DALAM KURUNG] yang belum diisi. */
export const adalahPlaceholder = (s) => /^\[.*\]$/.test(String(s).trim())

const LAHAN = {
  id: { hutan: 'Hutan', semak: 'Semak / alang-alang', gambut: 'Gambut (permukaan)', pertanian: 'Lahan pertanian' },
  en: { hutan: 'Forest', semak: 'Shrubland / reeds', gambut: 'Peat (surface)', pertanian: 'Farmland' },
}
const TIPE = {
  id: { desa: 'Desa', sekolah: 'Sekolah', faskes: 'Fasilitas kesehatan' },
  en: { desa: 'Village', sekolah: 'School', faskes: 'Health facility' },
}
/** Label jenis lahan menurut bahasa. */
export const namaLahan = (kunci, bahasa = 'id') => LAHAN[bahasa][kunci] ?? kunci
/** Label tipe pemukiman (desa / sekolah / faskes) menurut bahasa. */
export const namaTipe = (kunci, bahasa = 'id') => TIPE[bahasa][kunci] ?? kunci
/** Angka dengan pemisah desimal sesuai bahasa (koma untuk Indonesia). */
export const desimal = (n, bahasa = 'id') => (bahasa === 'en' ? String(n) : String(n).replace('.', ','))
