// Menyimpan centang checklist per ruang (tamu atau akun), aman bila penyimpanan tidak tersedia
import { bacaJson, tulisJson } from './ruang'

const kunci = (grup) => `pyraops-checklist-${grup}`

export const muatCentang = (grup) => { const v = bacaJson(kunci(grup), []); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [] }
export const simpanCentang = (grup, ids) => tulisJson(kunci(grup), ids)

// Catatan rencana per grup (saat ini: titik kumpul). Ikut tercetak bersama checklist.
const kunciCatatan = (grup) => `pyraops-checklist-catatan-${grup}`
export const muatCatatan = (grup) => { const v = bacaJson(kunciCatatan(grup), {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {} }
export const simpanCatatan = (grup, catatan) => tulisJson(kunciCatatan(grup), catatan)

/** Kartu kontak (vCard 3.0) berisi nomor darurat 112, untuk disimpan ke buku kontak ponsel. */
export function vcardDarurat(en = false) {
  return ['BEGIN:VCARD', 'VERSION:3.0', `FN:${en ? 'Emergency 112' : 'Darurat 112'}`, 'N:;112;;;', 'TEL;TYPE=VOICE:112',
    `NOTE:${en ? 'Indonesia emergency number. Add your local BPBD and neighborhood head as well.' : 'Nomor darurat Indonesia. Tambahkan juga kontak BPBD dan ketua RT setempat.'}`, 'END:VCARD', ''].join('\r\n')
}

/** Pesan ajakan untuk tetangga, siap dibagikan lewat WhatsApp. */
export function pesanTetangga(en = false) {
  return en
    ? 'Hi neighbors, the dry season is coming. Let us agree: no burning of waste or land, and we alert each other as soon as we see smoke or fire. Emergency: 112.'
    : 'Halo tetangga, musim kemarau sudah dekat. Yuk kita sepakat: tidak membakar sampah atau lahan, dan saling mengabari begitu melihat asap atau api. Darurat: 112.'
}

// ---- Mini game "Kemas tas siaga" ----
// Lima barang penting (empat dari butir checklist tas siaga, masker dari butir masker) dan lima pengecoh.
export const BARANG_TAS = [
  { id: 'air', benar: true, nama: ['Air minum', 'Drinking water'], alasan: ['Air minum wajib. Saat mengungsi, air bersih belum tentu ada.', 'Water is a must. Clean water may not be available when you evacuate.'] },
  { id: 'obat', benar: true, nama: ['Obat pribadi', 'Personal medicine'], alasan: ['Obat rutin tidak bisa ditunda, apalagi untuk anggota keluarga yang rentan asap.', 'Regular medicine cannot wait, especially for family members sensitive to smoke.'] },
  { id: 'senter', benar: true, nama: ['Senter', 'Flashlight'], alasan: ['Asap tebal membuat pandangan gelap dan terbatas. Senter menuntun jalan.', 'Thick smoke makes it dark and hard to see. A flashlight shows the way.'] },
  { id: 'dokumen', benar: true, nama: ['Dokumen dalam kantong tahan air', 'Documents in a waterproof pouch'], alasan: ['Salinan KTP, KK, dan surat penting sulit diurus ulang bila hilang.', 'Copies of ID and family papers are hard to replace if lost.'] },
  { id: 'masker', benar: true, nama: ['Masker N95', 'N95 mask'], alasan: ['Selama perjalanan kamu tetap menghirup asap. Masker N95 menyaring partikel halus.', 'You keep breathing smoke on the way. An N95 mask filters fine particles.'] },
  { id: 'bantal', benar: false, nama: ['Bantal besar', 'Big pillow'], alasan: ['Bantal makan tempat. Tas siaga harus ringan dan muat barang penting.', 'A pillow takes too much room. The bag must stay light and fit the essentials.'] },
  { id: 'konsol', benar: false, nama: ['Konsol game', 'Game console'], alasan: ['Seru, tapi tidak membantu saat darurat. Simpan tempatnya untuk barang penting.', 'Fun, but no help in an emergency. Save the space for essentials.'] },
  { id: 'gitar', benar: false, nama: ['Gitar', 'Guitar'], alasan: ['Terlalu besar dan berat untuk dibawa berlari.', 'Too big and heavy to carry while hurrying.'] },
  { id: 'panci', benar: false, nama: ['Panci', 'Cooking pot'], alasan: ['Berat dan jarang dibutuhkan di hari pertama mengungsi.', 'Heavy and rarely needed on the first day away.'] },
  { id: 'pot', benar: false, nama: ['Pot bunga', 'Flower pot'], alasan: ['Tanaman bisa menunggu. Keselamatanmu yang utama.', 'Plants can wait. Your safety comes first.'] },
]
export const KAPASITAS_TAS = BARANG_TAS.filter((x) => x.benar).length

/** Satu langkah permainan: barang benar masuk tas, pengecoh ditolak. Mengembalikan keadaan baru dan hasil langkah. */
export function masukkanBarang(keadaan, id) {
  const b = BARANG_TAS.find((x) => x.id === id)
  if (!b || keadaan.isi.includes(id)) return { keadaan, hasil: 'abaikan' }
  if (!b.benar) return { keadaan: { ...keadaan, salah: [...new Set([...keadaan.salah, id])] }, hasil: 'tolak' }
  const isi = [...keadaan.isi, id]
  return { keadaan: { ...keadaan, isi }, hasil: isi.length === KAPASITAS_TAS ? 'selesai' : 'masuk' }
}
