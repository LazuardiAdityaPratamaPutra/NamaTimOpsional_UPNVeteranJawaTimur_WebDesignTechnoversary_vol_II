# Maskot PyraOps: TORA

TORA adalah **harimau sumatra yang ramah**, wajah (Forest Companion) PyraOps: berompi pemandu hutan hijau dengan lambang daun, membawa tablet tahan banting berisi peta. Wataknya hangat, cerdas, membantu, dan tenang saat membahas risiko lingkungan. Ia dimaksudkan memperkuat pengenalan merek tanpa membuat situs terkesan kekanak-kanakan.

Ilustrasinya dari tim (`src/assets/maskot/harimau.webp`, latar transparan). **Aset tidak diubah:** warna, proporsi, dan wujudnya dipakai apa adanya (hanya latar yang dibuat transparan). Pembuat dan lisensinya perlu dicatat di `src/data/kredit.js` (baris "Maskot TORA" masih berisi placeholder).

## Hero beranda: tanpa TORA

TORA **tidak** tampil di hero Beranda (dihapus atas permintaan tim). Kolom kanan hero (`data-ruang-adegan` di `HeroMalam.jsx`) dibiarkan kosong agar medan hutan 3D yang tampil di sana; kamera 3D membaca elemen itu untuk menempatkan adegan. Hero cadangan tanpa WebGL (`HeroDatar.jsx`) juga tanpa maskot. Tes `tests/maskot.test.jsx` menjaga agar `HeroMalam.jsx` tidak memakai maskot.

## Penempatan kedua: asisten melayang "Pos Jaga TORA"

Asisten belajar karhutla (`ChatEdukasi.jsx`) kini melayang di **pojok kanan bawah seluruh situs publik**, khusus pengunjung dan pengguna (admin diarahkan ke dasbor, jadi tidak pernah melihatnya). Tombol peluncurnya berupa "pos" hijau hutan bertuliskan *Tanya TORA*, dengan kepala TORA (`harimau-kepala.webp`, dekoratif) mengintip dari tepi atas; panelnya memakai token `.hutan` agar kontras dengan kertas situs di dua tema, dan TORA mengintip lagi dari tepi atas panel (di ponsel wajahnya ada di kepala panel, dan panel menjadi lembar layar penuh). Percakapan bertahan selama tab terbuka (sessionStorage). Tersembunyi di `/peta`, `/kuis`, dan `/masuk`. Halaman Edukasi tidak lagi memuat kartu chat inline; ia punya ajakan yang membuka asisten lewat peristiwa `buka-tora`.

Di halaman Edukasi, kartu ajakan **"Pos Jaga TORA"** (`AjakTora`, ekspor kedua `ChatEdukasi.jsx` agar maskot tetap hanya dipakai di satu berkas) memakai TORA ukuran penuh yang naik dari tepi kartu, latar peta kontur, dan tiga baris pertanyaan; mengklik baris mengirim pertanyaan itu langsung ke asisten (`window.dispatchEvent(new CustomEvent('buka-tora', { detail: { tanya } }))`). Parallax kursor hanya untuk mouse dan mati saat gerak dikurangi.

Logika chat, batasan topik, dan API tidak diubah (`lib/chat.js` -> `/api/chat` -> Gemini). Tombol "kembali ke atas" bergeser naik di atas peluncur, dan peluncur naik sedikit saat footer terlihat agar tidak menutup tombol footer.

Game layar penuh (`/kuis` dan `/patroli`, lihat `AdeganKuis.jsx` dan `AdeganPatroli.jsx`) memakai TORA sebagai tokoh permainannya, jadi asisten melayang disembunyikan di kedua halaman itu agar tidak menimpa permainan.

## Kuis: tiga ilustrasi dan panggung yang menempel

Di kuis (`/kuis`) TORA memakai tiga ilustrasi: **ramah** (`harimau.webp`) selagi soal belum dijawab, **ceria** bermata terpejam (`harimau-ceria.webp`) saat jawaban benar (ia juga melompat), dan **sedih** (`harimau-sedih.webp`) saat jawaban salah (ia menggeleng lalu lesu). Ketiganya dimuat lebih dulu agar tidak ada jeda kosong saat berganti. Bila berkas `harimau-sedih.webp` dihapus, kode jatuh kembali ke ilustrasi ramah dengan awan hujan kecil di atas kepala TORA. Pembuat dan lisensi ketiga ilustrasi dicatat pada satu baris di `src/data/kredit.js` (masih `[ISI ...]`, tolong dilengkapi). Di layar lebar, panggung adegan (`lekat`) menempel di layar selagi kolom soal digulir, sehingga TORA tidak tertinggal di dasar kolom yang memanjang setelah penjelasan muncul.

## Momen kemajuan (hanya setelah ada kemajuan nyata)

TORA kecil (96–112px, tanpa kartu atau konfeti) muncul di tiga momen, semuanya dihitung dari keadaan sebenarnya:

| Tempat | Syarat | Ekspresi |
|---|---|---|
| Hasil kuis (`KuisGame.jsx`, fase hasil) | Setelah soal terakhir dijawab; tidak pernah saat soal berlangsung. Skor, statistik, dan tinjauan jawaban tetap isi utama. | ≥75%: merayakan · 50–74%: menyemangati · <50%: menenangkan (pesan memakai `pesanHasil` yang sudah ada) |
| Checklist Persiapan (`Checklist.jsx`) | Semua butir pada tab itu dicentang (selesai = jumlah butir). Melepas satu centang atau "Hapus semua centang" langsung menghilangkannya. Tidak ikut tercetak. | merayakan |
| Konfirmasi laporan (`KonfirmasiLaporan.jsx`, di bawah formulir Lapor) | Status dibaca dari catatan laporan (`lib/laporStatus.js`). TORA hanya untuk laporan yang **dikonfirmasi server**; keadaan lain hanya teks status. | berterima kasih |

Status laporan: *lokal* (offline, tersimpan di perangkat), *menunggu* (online, belum selesai dikirim), *gagal* (akan dicoba lagi), *demo* (hosting tanpa server penerima: `sync.js` menandainya `synced` + `modeDemo`, jadi belum diterima server mana pun), dan *terkonfirmasi* (server menjawab ok).

**Keterbatasan aset:** tim baru menyediakan dua ekspresi, "ramah" (mata terbuka) dan "ceria" (tertawa). Ekspresi menyemangati, menenangkan, dan berterima kasih sementara memakai "ramah"; bangga dan merayakan memakai "ceria". Bila ilustrasi baru tersedia, cukup ganti peta `EKSPRESI` di `Maskot.jsx`.

## Di mana TORA tidak muncul

Peta, simulasi, dasbor, artikel, navigasi, kondisi kosong, notifikasi, dan halaman lain. Tidak ada tombol asisten melayang di pojok kanan bawah: avatar hanya dipakai pada chat Edukasi yang sudah ada. `tests/maskot.test.jsx` memeriksa daftar berkas yang boleh memakai maskot, sehingga penambahan yang tidak disengaja akan gagal di tes.

## Mengganti nama atau gambar

- Nama dan teks alternatif gambar: `src/data/maskot.js`.
- Gambar: ganti `src/assets/maskot/harimau.webp` (webp, latar transparan; ukuran sekarang 900×880, sesuaikan `MASKOT_LEBAR` dan `MASKOT_TINGGI` di `Maskot.jsx` bila berubah).
