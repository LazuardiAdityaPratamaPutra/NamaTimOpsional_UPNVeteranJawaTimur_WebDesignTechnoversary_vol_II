import gambar from '../assets/maskot/harimau.webp'
import avatar from '../assets/maskot/harimau-kepala.webp'
import ceria from '../assets/maskot/harimau-ceria.webp'
import belakang from '../assets/maskot/harimau-belakang.webp'

// TORA, maskot PyraOps (Forest Companion): harimau sumatra ramah berompi hijau yang membawa tablet peta (ilustrasi dari tim, tidak diubah).
// Tidak dipakai di hero beranda (dihapus atas permintaan). Ukuran bawaan 900×880 dikunci lewat width/height agar tidak ada loncatan tata letak.
export const MASKOT_LEBAR = 900
export const MASKOT_TINGGI = 880

// Avatar kepala TORA (potongan dari ilustrasi yang sama) untuk identitas kecil asisten belajar di Edukasi.
// Dekoratif: nama TORA sudah tertulis di sebelahnya, jadi alt kosong agar pembaca layar tidak membaca nama dua kali.
export function MaskotAvatar({ className = '' }) {
  return <img src={avatar} width="192" height="192" alt="" decoding="async" draggable="false" className={`pointer-events-none block select-none ${className}`} />
}

// Ekspresi untuk momen kemajuan (hasil kuis, checklist selesai, laporan diterima). Hanya dua ilustrasi yang tersedia dari tim:
// "ramah" (mata terbuka) dan "ceria" (tertawa). Nama ekspresi dipetakan ke salah satunya; bila ilustrasi baru
// (mis. menyemangati atau berterima kasih) disediakan, cukup ganti entri di sini.
// Ilustrasi "sedih" belum disediakan tim. Begitu berkas src/assets/maskot/harimau-sedih.webp ditambahkan, otomatis dipakai (tanpa mengubah kode);
// sampai saat itu 'sedih' memakai ilustrasi ramah dan adegan menandainya dengan awan hujan + gerak lesu (aset tidak diubah).
const berkasSedih = Object.values(import.meta.glob('../assets/maskot/harimau-sedih.webp', { eager: true, import: 'default' }))[0]
export const ADA_GAMBAR_SEDIH = Boolean(berkasSedih)
export const EKSPRESI = { ramah: gambar, merayakan: ceria, bangga: ceria, menyemangati: gambar, menenangkan: gambar, 'berterima-kasih': gambar, sedih: berkasSedih ?? gambar }
export function MaskotEkspresi({ ekspresi = 'ramah', className = '' }) {
  return (
    <img src={EKSPRESI[ekspresi] ?? gambar} width={MASKOT_LEBAR} height={MASKOT_TINGGI} alt="" decoding="async" loading="lazy" draggable="false" data-ekspresi={ekspresi}
      className={`maskot-badan pointer-events-none block h-auto max-w-full select-none ${className}`} />
  )
}

// TORA tampak belakang (ilustrasi dari tim, latar krem dihapus agar bisa berdiri di dinding galeri; karakter tidak diubah).
// Hanya untuk Galeri museum: TORA memandangi lukisan. Dekoratif (alt kosong). Ukuran berkas 760×821.
export function MaskotBelakang({ className = '', jalan = false }) {
  return <img src={belakang} width="760" height="821" alt="" decoding="async" draggable="false"
    className={`tora-belakang pointer-events-none block select-none ${jalan ? 'tb-jalan' : ''} ${className}`} />
}
