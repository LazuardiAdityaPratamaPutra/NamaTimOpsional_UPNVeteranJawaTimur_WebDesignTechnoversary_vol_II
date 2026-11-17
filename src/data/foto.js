// Foto halaman Tentang. Berkas ada di public/foto/. Isi `kredit` (nama fotografer) dan `tautan` bila diketahui:
// bila `kredit` terisi, namanya tampil otomatis di halaman. Nama fotografer ketiga foto belum diketahui.
export const FOTO = {
  hero: {
    src: '/foto/hutan-kabut.webp',
    alt: ['Hutan konifer diselimuti kabut tebal yang disinari cahaya pagi', 'Conifer forest wrapped in thick fog lit by morning light'],
    kredit: null, sumber: null, tautan: null,
  },
  // latar tiga panel gulir-samping (01, 02, 03); posisi = object-position
  panel: [
    { src: '/foto/hutan-udara.webp', posisi: '30% 70%' },
    { src: '/foto/hutan-jalan-gelap.webp', posisi: '50% 50%' },
    { src: '/foto/hutan-musim-gugur.webp', posisi: '50% 50%' },
  ],
}
