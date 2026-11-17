// Perpustakaan PyraOps (tab Artikel): warna buku, kalimat TORA pustakawan, glosarium sentuh, dan widget perumpamaan.
// Semua definisi glosarium diringkas dari kalimat di artikel Edukasi sendiri (slug `artikel`); tidak ada klaim baru.

// Warna punggung buku bawaan (nilai tetap agar sama di dua tema; teks krem di atasnya >= 4,5:1).
export const WARNA_BUKU = {
  penyebab: 'rgb(150 44 30)',
  gambut: 'rgb(98 62 34)',
  dampak: 'rgb(48 74 92)',
  pencegahan: 'rgb(30 92 64)',
}
// Buku buatan admin mendapat warna dari palet ini menurut slug (stabil, tidak berganti saat buku lain ditambah).
const PALET = ['rgb(112 52 92)', 'rgb(60 70 120)', 'rgb(122 76 22)', 'rgb(40 96 100)', 'rgb(100 40 48)', 'rgb(64 84 40)']
export const warnaBuku = (slug) => WARNA_BUKU[slug] ?? PALET[[...slug].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % PALET.length]

export const TORA_PUSTAKAWAN = {
  sapa: ['Halo! Aku TORA, penjaga perpustakaan ini. Ambil satu buku dari rak, ya.', 'Hi! I am TORA, keeper of this library. Take a book from the shelf.'],
  mulai: ['Kalau bingung mulai dari mana, coba buku ini dulu:', 'Not sure where to start? Try this one first:'],
  pilih: ['Pilihan bagus! Buku ini sekitar {m} menit dibaca.', 'Good pick! This one takes about {m} minutes.'],
  tamat: ['Wah, semua buku sudah kamu kembalikan. Uji pemahamanmu di Kuis, yuk!', 'Wow, you have returned every book. Test what you learned in the Quiz!'],
}

// Glosarium sentuh: istilah pertama di tiap artikel bisa diketuk. `pola` = ekspresi reguler per bahasa.
export const GLOSARIUM = [
  { id: 'pm25', istilah: 'PM2.5', pola: { id: /PM2\.5/, en: /PM2\.5/ }, artikel: 'dampak',
    teks: 'Partikel halus dalam asap yang jauh lebih kecil daripada lebar sehelai rambut. Menurut WHO, partikel ini dapat menembus jauh ke paru dan masuk ke aliran darah.',
    en: { istilah: 'PM2.5', teks: 'Fine particles in smoke, far smaller than the width of a hair. According to WHO, they can reach deep into the lungs and enter the bloodstream.' } },
  { id: 'titik', istilah: 'Titik panas', pola: { id: /titik panas/i, en: /hotspots?/i }, artikel: 'pencegahan',
    teks: 'Piksel citra satelit dengan anomali suhu. Menurut NASA, titik tengah piksel belum tentu lokasi api sebenarnya.',
    en: { istilah: 'Hotspot', teks: 'A satellite image pixel with a temperature anomaly. According to NASA, the centre of the pixel is not necessarily where the fire is.' } },
  { id: 'sekat', istilah: 'Sekat kanal', pola: { id: /sekat kanal/i, en: /canal blocks?/i }, artikel: 'pencegahan',
    teks: 'Penyumbat pada kanal di lahan gambut agar air tidak terus mengalir keluar, seperti menyumbat bak mandi.',
    en: { istilah: 'Canal block', teks: 'A barrier in a peatland canal that stops water from draining away, like plugging a bathtub.' } },
  { id: 'muka', istilah: 'Muka air tanah', pola: { id: /muka air tanah/i, en: /water table/i }, artikel: 'gambut',
    teks: 'Batas atas air di dalam tanah. Kanal drainase menurunkan muka air sehingga gambut mengering; pemerintah memakai 0,4 meter di bawah permukaan sebagai ambang (PP 57/2016).',
    en: { istilah: 'Water table', teks: 'The top of the water inside the ground. Drainage canals lower it so peat dries out; the government uses 0.4 meters below the surface as a threshold (Government Regulation 57/2016).' } },
  { id: 'zombie', istilah: 'Zombie fires', pola: { id: /zombie fires/i, en: /zombie fires/i }, artikel: 'gambut',
    teks: 'Sebutan Prof. Guillermo Rein dan rekan untuk api gambut yang membara tanpa terlihat di bawah tanah, lalu bisa muncul kembali di permukaan.',
    en: { istilah: 'Zombie fires', teks: 'The name Prof. Guillermo Rein and colleagues use for peat fires that smolder unseen underground and can re-emerge at the surface.' } },
  { id: 'elnino', istilah: 'El Niño', pola: { id: /El Niño/, en: /El Niño/ }, artikel: 'penyebab',
    teks: 'Fenomena iklim yang menurut BMKG membuat periode tanpa hujan lebih panjang, sehingga bahan bakar di hutan dan lahan makin kering.',
    en: { istilah: 'El Niño', teks: 'A climate pattern that, according to BMKG, brings longer periods without rain, so fuel in forests and fields gets drier.' } },
  { id: 'mpa', istilah: 'Masyarakat Peduli Api', pola: { id: /Masyarakat Peduli Api/, en: /Fire-Aware Community/ }, artikel: 'pencegahan',
    teks: 'Warga yang mengenali bahaya, memantau kondisi, dan melaporkan tanda api sedini mungkin; ujung tombak pencegahan di tingkat desa.',
    en: { istilah: 'Fire-Aware Community', teks: 'Masyarakat Peduli Api: residents who recognize the danger, watch conditions, and report signs of fire as early as possible; the spearhead of village-level prevention.' } },
  { id: 'paludi', istilah: 'Paludikultur', pola: { id: /paludikultur/i, en: /paludiculture/i }, artikel: 'pencegahan',
    teks: 'Bertani tanpa mengeringkan gambut, misalnya dengan jelutung, sagu, atau purun.',
    en: { istilah: 'Paludiculture', teks: 'Farming without draining the peat, for example with jelutung, sago, or purun.' } },
  { id: '3r', istilah: '3R', pola: { id: /\b3R\b/, en: /\b3R\b/ }, artikel: 'gambut',
    teks: 'Strategi Badan Restorasi Gambut: pembasahan kembali (rewetting), penanaman kembali (revegetasi), dan revitalisasi penghidupan warga.',
    en: { istilah: '3R', teks: 'The Peatland Restoration Agency strategy: rewetting, revegetation, and revitalizing local livelihoods.' } },
]

// Widget perumpamaan: disisipkan tepat setelah paragraf artikel yang memuat perumpamaannya.
// Bila paragraf itu disunting admin dan perumpamaannya hilang, widget otomatis tidak tampil.
export const PERUMPAMAAN = [
  { id: 'spons', artikel: 'gambut', cocok: { id: /spons/i, en: /sponge/i } },
  { id: 'bara', artikel: 'gambut', cocok: { id: /obat nyamuk bakar/i, en: /mosquito coil/i } },
  { id: 'sekat', artikel: 'pencegahan', cocok: { id: /menyumbat bak mandi/i, en: /bath ?tub/i } },
]
