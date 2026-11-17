// Angin per jam di sekitar Tanjung Batu, Pulau Derawan, Berau (Kalimantan Timur), 19–21 Agustus 2026.
// DATA NYATA, disalin apa adanya dari respons Open-Meteo Historical Weather API (tanpa pembulatan atau penghalusan).
// Jangan diubah tangan: bila perlu diperbarui, ambil ulang dari URL di `SUMBER_ANGIN.permintaan` dan tempel kedua larik.
// Atribusi wajib (CC BY 4.0): ditampilkan di panel simulasi dan halaman About.
export const SUMBER_ANGIN = {
  nama: 'Open-Meteo Historical Weather API',
  tautan: 'https://open-meteo.com',
  lisensi: 'CC BY 4.0',
  permintaan: 'https://archive-api.open-meteo.com/v1/archive?latitude=2.26&longitude=118.00&start_date=2026-08-19&end_date=2026-08-21&hourly=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=Asia%2FJakarta',
  lokasi: 'Sekitar Tanjung Batu, Pulau Derawan, Berau',
  en: { lokasi: 'Near Tanjung Batu, Derawan Island, Berau' },
  lintangDiminta: 2.26, bujurDiminta: 118.0, // koordinat pada permintaan
  lintang: 2.28471, bujur: 118.03514, // petak grid yang dikembalikan Open-Meteo
  elevasi: 57, // meter
  zonaWaktu: 'Asia/Jakarta', // UTC+7 (WIB)
  satuanKecepatan: 'm/s',
  tinggi: '10 m',
}

// Waktu lokal WIB ("YYYY-MM-DDTHH:00"), 72 jam berurutan.
export const WAKTU_ANGIN = [
  '2026-08-19T00:00', '2026-08-19T01:00', '2026-08-19T02:00', '2026-08-19T03:00', '2026-08-19T04:00', '2026-08-19T05:00',
  '2026-08-19T06:00', '2026-08-19T07:00', '2026-08-19T08:00', '2026-08-19T09:00', '2026-08-19T10:00', '2026-08-19T11:00',
  '2026-08-19T12:00', '2026-08-19T13:00', '2026-08-19T14:00', '2026-08-19T15:00', '2026-08-19T16:00', '2026-08-19T17:00',
  '2026-08-19T18:00', '2026-08-19T19:00', '2026-08-19T20:00', '2026-08-19T21:00', '2026-08-19T22:00', '2026-08-19T23:00',
  '2026-08-20T00:00', '2026-08-20T01:00', '2026-08-20T02:00', '2026-08-20T03:00', '2026-08-20T04:00', '2026-08-20T05:00',
  '2026-08-20T06:00', '2026-08-20T07:00', '2026-08-20T08:00', '2026-08-20T09:00', '2026-08-20T10:00', '2026-08-20T11:00',
  '2026-08-20T12:00', '2026-08-20T13:00', '2026-08-20T14:00', '2026-08-20T15:00', '2026-08-20T16:00', '2026-08-20T17:00',
  '2026-08-20T18:00', '2026-08-20T19:00', '2026-08-20T20:00', '2026-08-20T21:00', '2026-08-20T22:00', '2026-08-20T23:00',
  '2026-08-21T00:00', '2026-08-21T01:00', '2026-08-21T02:00', '2026-08-21T03:00', '2026-08-21T04:00', '2026-08-21T05:00',
  '2026-08-21T06:00', '2026-08-21T07:00', '2026-08-21T08:00', '2026-08-21T09:00', '2026-08-21T10:00', '2026-08-21T11:00',
  '2026-08-21T12:00', '2026-08-21T13:00', '2026-08-21T14:00', '2026-08-21T15:00', '2026-08-21T16:00', '2026-08-21T17:00',
  '2026-08-21T18:00', '2026-08-21T19:00', '2026-08-21T20:00', '2026-08-21T21:00', '2026-08-21T22:00', '2026-08-21T23:00',
]

// wind_speed_10m (m/s)
export const KECEPATAN_ANGIN = [
  4.34, 4.42, 4.19, 3.82, 3.82, 3.50, 4.06, 4.45, 4.55, 4.35, 4.52, 4.80,
  4.45, 3.46, 3.70, 4.37, 3.88, 3.46, 3.42, 4.09, 3.74, 3.90, 3.61, 3.01,
  2.67, 2.76, 2.65, 2.66, 2.82, 2.72, 2.40, 3.11, 3.75, 3.73, 3.51, 3.70,
  3.74, 4.61, 4.21, 3.99, 4.15, 4.33, 4.19, 4.07, 3.91, 3.92, 3.62, 2.77,
  3.00, 2.51, 2.84, 2.55, 2.62, 2.50, 2.70, 2.84, 2.36, 1.85, 0.28, 2.02,
  2.79, 3.24, 4.01, 3.77, 3.30, 2.90, 2.65, 3.08, 2.58, 2.44, 2.42, 2.18,
]

// wind_direction_10m (derajat; arah ASAL angin, 0 = utara)
export const ARAH_ANGIN = [
  172, 170, 172, 174, 175, 178, 176, 178, 177, 178, 175, 169,
  155, 143, 111, 103, 105, 95, 102, 117, 118, 123, 133, 137,
  142, 138, 148, 154, 163, 174, 192, 174, 171, 173, 175, 167,
  146, 117, 110, 105, 105, 112, 113, 115, 111, 109, 116, 141,
  154, 149, 279, 296, 294, 290, 273, 284, 275, 273, 315, 67,
  75, 124, 129, 129, 129, 135, 134, 133, 137, 145, 156, 160,
]
