// Parameter mesin simulasi. Nilai DEMO, bukan hasil kalibrasi lapangan.
// Dijelaskan di halaman About agar bisa dipertanggungjawabkan ke juri.
export const SIM = {
  R0: 0.2, // laju dasar penjalaran (km/jam)
  faktorLahan: {
    hutan: 1.0,
    semak: 1.3, // semak / alang-alang
    gambut: 0.6, // gambut permukaan (api bawah permukaan TIDAK dimodelkan)
    pertanian: 0.9,
  },
  koefAngin: 0.3, // tiap 1 m/s angin menambah laju 30%
  rasioBelakang: 0.2, // laju melawan angin = 20% laju searah angin
  koefLW: 0.2, // tiap 1 m/s angin menambah rasio panjang:lebar 0,2
  maksLW: 4, // rasio panjang:lebar maksimum
  titikPoligon: 48, // jumlah titik elips
  kmPerDerajat: 111.32, // 1 derajat lintang (km)
  zonaJam: [3, 6, 12],
  maksJam: 12,
}

// Aturan skor risiko pemukiman (berbasis aturan, bukan ML)
export const RISIKO = {
  skorZona: { 3: 100, 6: 70, 12: 40 }, // skor dasar menurut zona tercepat
  faktorKelas: { kecil: 0.8, sedang: 1.0, besar: 1.2 }, // kerentanan permukiman
  faktorKhusus: { sekolah: 1.2, faskes: 1.2 }, // sekolah / fasilitas kesehatan
  maks: 100,
  batasKritis: 80,
  batasTinggi: 50,
}
