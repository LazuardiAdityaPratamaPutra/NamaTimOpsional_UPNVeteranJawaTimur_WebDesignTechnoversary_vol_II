// Statistik halaman Home. JANGAN mengarang angka: isi angka, periode, dan sumber yang bisa diverifikasi.
// Selama `angka` masih null, kartu tampil sebagai kerangka dan `npm run cek:rilis` akan gagal.
// Angka 2026 dikutip dari SIPONGI KEMENHUT (data_karhut.xlsx baris 1.1) dan SiPongi yang dikutip Antara (baris 1.2). Skala nasional. Penggunaan data wajib mencantumkan sumber SIPONGI KEMENHUT.
// Angka diambil apa adanya; periksa ulang di tautan sumber sebelum rilis karena SiPongi memperbarui datanya.
export const STATISTIK = [
  {
    id: 'luas', label: 'Luas hutan dan lahan terbakar di Indonesia', angka: '202.004', satuan: 'hektare',
    periode: 'Januari–Juli 2026 (202.004,30 ha), naik 69% (82.791,04 ha) dibanding 2025',
    sumber: 'SIPONGI KEMENHUT, Indikasi Luas Kebakaran',
    url: 'https://sipongi.gakkum.kehutanan.go.id/indikasi-luas-kebakaran',
    en: { angka: '202,004', label: 'Forest and land area burned in Indonesia', satuan: 'hectares', periode: 'January–July 2026 (202,004.30 ha), up 69% (82,791.04 ha) compared with 2025', sumber: 'SIPONGI KEMENHUT, Fire Area Indication' },
  },
  {
    id: 'tahunan', label: 'Luas hutan dan lahan terbakar di Indonesia sepanjang tahun', angka: '359.619', satuan: 'hektare',
    periode: 'Sepanjang 2025, turun dari 376.805 ha pada 2024',
    banding: { sebelum: 376805, sesudah: 359619, labelSebelum: '2024', labelSesudah: '2025' },
    sumber: 'SiPongi, dikutip Antara',
    url: 'https://en.antaranews.com/news/403742/homepage-v2.html',
    en: { angka: '359,619', label: 'Forest and land area burned in Indonesia over a full year', satuan: 'hectares', periode: 'Throughout 2025, down from 376,805 ha in 2024', sumber: 'SiPongi, quoted by Antara' },
  },
]
