// Galeri (Indonesia + Inggris). Setiap item wajib memuat alt, keterangan, atribusi, dan lisensi.
// Untuk foto sungguhan: tambahkan berkas WebP (dimensi eksplisit, loading="lazy") dan catat di src/data/kredit.js.
const ATRIBUSI = 'Ilustrasi konsep untuk PyraOps', LISENSI = 'Ilustrasi skenario, bukan data nyata'
const ATRIBUSI_EN = 'Concept illustration for PyraOps', LISENSI_EN = 'Scenario illustration, not real data'
export const GALERI = [
  { id: 'segitiga', judul: 'Segitiga api', alt: 'Diagram segitiga api: tiga panah berwarna merah (panas), hijau (bahan bakar), dan biru (oksigen) bertemu di tengah, masing-masing dengan penjelasan singkat',
    keterangan: 'Api membutuhkan tiga unsur. Menghilangkan salah satunya memadamkan api.', atribusi: ATRIBUSI, lisensi: LISENSI,
    en: { judul: 'The fire triangle', alt: 'Fire triangle diagram: three arrows in red (heat), green (fuel), and blue (oxygen) meeting in the middle, each with a short explanation',
      keterangan: 'A fire needs three elements. Removing any one of them puts the fire out.', atribusi: ATRIBUSI_EN, lisensi: LISENSI_EN } },
  { id: 'gambut', judul: 'Api di lahan gambut', alt: 'Penampang tanah kebakaran gambut: lapisan gambut atas, tengah, dan dalam dengan api yang menjalar di bawah permukaan dan asap naik di sisi kanan',
    keterangan: 'Ilustrasi konsep: api dapat menjalar di lapisan gambut di bawah permukaan.', atribusi: ATRIBUSI, lisensi: LISENSI,
    en: { judul: 'Fire in peatland', alt: 'Soil cross-section of a peat fire: upper, middle, and deep peat layers with fire spreading below the surface and smoke rising on the right',
      keterangan: 'Concept illustration: fire can spread through the peat layer beneath the surface.', atribusi: ATRIBUSI_EN, lisensi: LISENSI_EN } },
  { id: 'angin', judul: 'Api dan angin', alt: 'Peta tampilan atas prediksi perluasan kebakaran hutan: area hangus gelap di timur, zona prediksi oranye memanjang ke barat searah angin, dengan legenda dan arah gerak api',
    keterangan: 'Ilustrasi konsep: angin membuat sebaran api memanjang searah angin. Ini dasar model simulasi PyraOps.', atribusi: ATRIBUSI, lisensi: LISENSI,
    en: { judul: 'Fire and wind', alt: 'Top-down map of predicted forest fire spread: a dark burned area in the east and orange predicted zones stretching west with the wind, with legend and fire direction arrows',
      keterangan: 'Concept illustration: wind stretches the fire spread downwind. This is the basis of the PyraOps simulation model.', atribusi: ATRIBUSI_EN, lisensi: LISENSI_EN } },
  { id: 'asap', judul: 'Asap terbawa angin', alt: 'Peta tampilan atas sebaran asap kebakaran hutan: asap abu-abu dari titik api di timur bergerak ke barat menuju permukiman, dengan panah arah polusi asap',
    keterangan: 'Ilustrasi konsep: asap dapat terbawa angin hingga ke permukiman yang jauh dari titik api.', atribusi: ATRIBUSI, lisensi: LISENSI,
    en: { judul: 'Smoke carried by the wind', alt: 'Top-down map of forest fire smoke: grey smoke from the fire in the east drifting west toward a settlement, with a wind direction arrow',
      keterangan: 'Concept illustration: smoke can be carried by the wind to settlements far from the fire point.', atribusi: ATRIBUSI_EN, lisensi: LISENSI_EN } },
]

// ===== Galeri museum: kalimat TORA (pemandu) dan interaksi per lukisan =====
// Semua teks diringkas dari artikel Edukasi yang sudah bersumber (slug di `artikel`); tidak ada klaim baru.
export const BAB_GALERI = {
  segitiga: { bab: 'Unsur', tora: 'Coba hilangkan satu unsur lewat plakat di samping. Apinya padam, kan?',
    en: { bab: 'Elements', tora: 'Try removing one element on the label next to it. The fire goes out, right?' } },
  gambut: { bab: 'Menjalar', tora: 'Di atas tampak tenang, padahal di bawah masih membara. Ketuk titik bernomor di lukisan.',
    en: { bab: 'Creeps', tora: 'It looks calm on top, but it is still smoldering below. Tap the numbered points on the painting.' } },
  angin: { bab: 'Meluas', tora: 'Lihat arahnya: api memanjang searah angin. Inilah yang dihitung simulasi PyraOps.',
    en: { bab: 'Spreads', tora: 'Look at the direction: the fire stretches downwind. That is what the PyraOps simulation calculates.' } },
  asap: { bab: 'Berdampak', tora: 'Asapnya sampai ke desa yang jauh dari api. Ayo siapkan diri dari sekarang.',
    en: { bab: 'Impact', tora: 'The smoke reaches a village far from the fire. Let us get ready now.' } },
}

// Lukisan 01: hilangkan satu unsur segitiga api. `zona` = poligon/persegi (koordinat gambar 1408×768) yang diredupkan.
export const UNSUR_API = [
  { id: 'panas', nama: 'Panas', zona: ['640,60 772,60 832,332 700,388 568,332', 'R775,140,240,125'],
    teks: 'Tanpa panas, api padam. Air mendinginkan bahan bakar, tetapi di gambut air bisa lolos melewati titik bara di dalam tanah.', artikel: 'gambut',
    en: { nama: 'Heat', teks: 'Without heat, the fire goes out. Water cools the fuel, but in peat the water can slip past the embers underground.' } },
  { id: 'bahan', nama: 'Bahan bakar', zona: ['545,330 615,345 702,420 702,582 428,578', 'R280,340,205,180', 'R345,555,130,90'],
    teks: 'Tanpa bahan bakar, api tidak bisa menjalar. Karena itu warga dianjurkan membersihkan bahan mudah terbakar di sekitar permukiman, dan gambut dijaga tetap basah lewat sekat kanal.', artikel: 'pencegahan',
    en: { nama: 'Fuel', teks: 'Without fuel, fire cannot spread. That is why residents are advised to clear flammable material around homes, and peat is kept wet with canal blocks.' } },
  { id: 'oksigen', nama: 'Oksigen', zona: ['830,330 992,578 702,582 702,420 790,350', 'R945,385,245,145', 'R930,568,125,80'],
    teks: 'Oksigen selalu ada di udara, jadi di alam terbuka unsur ini paling sulit dihilangkan. Angin justru memasok oksigen segar dan mendorong api ke bahan bakar berikutnya.', artikel: 'penyebab',
    en: { nama: 'Oxygen', teks: 'Oxygen is always in the air, so outdoors it is the hardest element to remove. Wind even supplies fresh oxygen and pushes the fire on to the next fuel.' } },
]

// Lukisan 02: titik sorot pada penampang gambut (x, y dalam persen gambar)
export const TITIK_GAMBUT = [
  { id: 'g1', x: 33, y: 40, judul: 'Permukaan tampak biasa', teks: 'Gambut kering jarang menyala dengan lidah api yang tinggi. Ia membara pelan di bawah tanah, seperti obat nyamuk bakar.',
    en: { judul: 'The surface looks normal', teks: 'Dry peat rarely burns with tall flames. It smolders slowly underground, like a mosquito coil.' } },
  { id: 'g2', x: 61, y: 58, judul: 'Bara di dalam tanah', teks: 'Para peneliti menyebutnya "zombie fires": membara tanpa terlihat selama berminggu-minggu hingga berbulan-bulan, dan banyak yang baru padam saat musim hujan.',
    en: { judul: 'Embers inside the ground', teks: 'Researchers call them "zombie fires": they smolder unseen for weeks or months, and many only go out when the rainy season comes.' } },
  { id: 'g3', x: 71, y: 27, judul: 'Muncul lagi ke permukaan', teks: 'Bara bawah tanah bisa muncul kembali di permukaan. Satelit sering melewatkannya, jadi laporan warga sangat berharga.',
    en: { judul: 'It comes back up', teks: 'Underground embers can re-emerge at the surface. Satellites often miss them, so reports from residents are valuable.' } },
  { id: 'g4', x: 89, y: 79, judul: 'Air adalah pengaman', teks: 'Gambut basah seperti spons penuh air: sulit terbakar. Kanal drainase menurunkan muka air, sehingga gambut mengering dan menjadi bahan bakar.',
    en: { judul: 'Water is the safeguard', teks: 'Wet peat is like a sponge full of water: hard to burn. Drainage canals lower the water table, so the peat dries out and turns into fuel.' } },
]
