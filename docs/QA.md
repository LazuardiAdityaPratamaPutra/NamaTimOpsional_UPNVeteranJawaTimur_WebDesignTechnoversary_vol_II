# Checklist QA manual PyraOps

Isi setiap kotak dengan ✅ (lolos), ❌ (gagal, catat di kolom catatan), atau ➖ (tidak berlaku). Ulangi seluruh daftar pada **versi rilis** sebelum dikirim.

Persiapan: `npm run build && npm run preview` (atau URL deploy Vercel). Gunakan jendela penyamaran/profil bersih untuk bagian 4.

## 1. Matriks lintas peramban dan perangkat

| Perangkat / peramban | Home | About | Edukasi | Peta + simulasi | Lapor | Contact | Catatan |
|---|---|---|---|---|---|---|---|
| Chrome desktop | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Edge desktop | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Firefox desktop | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Safari iOS (iPhone) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| Chrome Android, HP 1 (lebar: ___ px) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| HP 2 (lebar: ___ px) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

Pada tiap baris pastikan: tidak ada galat di konsol, tidak ada scroll horizontal pada halaman, tema terang dan gelap sama-sama terbaca, navbar (hamburger di HP) berfungsi, lebar 360 px tidak memotong konten.

## 2. Fitur inti (Chrome desktop, lalu satu HP)

- [ ] **Home:** tombol "Coba Simulasi Demo" membuka peta dengan skenario siap; "Pelajari Karhutla" membuka Edukasi; statistik berisi angka + sumber (tidak ada `[ANGKA]`).
- [ ] **Peta:** hotspot tampil dan berdenyut; klik hotspot membuka detail (koordinat, kepercayaan, waktu, angin) berlabel *Data demo*; layer dapat dinyalakan/dimatikan; atribusi OSM terlihat.
- [ ] **Simulasi:** pilih hotspot → *Jalankan simulasi* → tiga zona (solid / putus-putus / titik-titik) + luas hektare.
- [ ] **Slider waktu** 0–12 jam menggeser garis tebal; *Putar animasi* berjalan (tidak tampil bila reduced-motion aktif).
- [ ] **What-if:** putar kompas dan geser kecepatan angin → zona dan daftar risiko berubah langsung tanpa tombol.
- [ ] **Risiko:** daftar terurut skor; klik item memusatkan peta; ikon *i* menjelaskan skor; warna penanda pemukiman berubah menurut kategori.
- [ ] **Demo Skenario** dan `/peta?demo=1`: simulasi otomatis jalan, daftar risiko terbuka.
- [ ] **Tur:** 5 langkah, sorotan pas pada elemen, tombol Lanjut/Kembali/Lewati, Esc menutup, dapat diulang lewat tombol *Tur*; kartu tur **tidak menutupi kontrol penting** (cek di HP dan jendela pendek).
- [ ] **Edukasi:** 4 artikel terbaca nyaman di HP; galeri + lightbox (Esc, panah); kuis memberi skor dan penjelasan, *Ulangi* berfungsi; checklist tercentang tersimpan setelah muat ulang, *Cetak* hanya mencetak checklist.
- [ ] **Contact:** validasi menampilkan pesan ramah; kirim membuka aplikasi email dengan isi benar.

## 2b. Dua bahasa (ID/EN)

- [ ] Tombol **ID | EN** di navbar (juga di HP) mengganti bahasa seluruh halaman tanpa memuat ulang; pilihan bertahan setelah muat ulang dan setelah menutup peramban.
- [ ] Mode **EN** pada **setiap** halaman (Home, About, Edukasi semua tab, artikel, Peta, Lapor, Contact, 404): tidak ada teks campur bahasa Indonesia (periksa juga tooltip peta, toast, pesan galat form, dan pesan kosong).
- [ ] Artikel, kuis (urutan soal dan kunci jawaban sama), checklist, galeri, dan tur terpandu tampil dalam bahasa terpilih; mengganti bahasa di tengah kuis tidak mengacaukan jawaban.
- [ ] Briefing dan chatbot menjawab dalam bahasa terpilih (dengan dan tanpa kunci Gemini); label *Mode cadangan* dan disclaimer ikut berbahasa sama.
- [ ] Cetak checklist dalam bahasa Inggris tampil benar. Format tanggal dan angka (1,952 ha vs 1.952 ha) mengikuti bahasa.
- [ ] Pembaca layar mengumumkan bahasa yang benar setelah berganti (atribut `lang`).

## 3. Uji offline dan PWA

1. [ ] Kunjungi `/lapor` saat **online** sekali (service worker aktif; muncul toast "Aplikasi siap dipakai offline").
2. [ ] Matikan jaringan (DevTools → Offline, atau mode pesawat di HP) lalu muat ulang: aplikasi tetap terbuka (Home, Lapor, Edukasi, dan peta basemap cadangan).
3. [ ] Pada `/peta` yang pernah dibuka saat online, tile area yang sudah dilihat tetap tampil; area baru menampilkan basemap cadangan + pesan "Peta dasar tidak termuat".
4. [ ] Isi laporan offline (GPS atau koordinat manual, tingkat, catatan, foto): tersimpan, status **Menunggu**, badge antrean bertambah, pill **Offline**.
5. [ ] Nyalakan jaringan: status berubah menjadi **Tersinkron** otomatis (tanpa menekan tombol); titik muncul di layer *Laporan lapangan*.
6. [ ] Tombol **Sinkronkan sekarang** berfungsi.
7. [ ] **Demo Skenario berjalan saat offline.**
8. [ ] Ulangi langkah 4–5 di **Firefox** dan **Safari iOS** (tanpa Background Sync).
9. [ ] Pasang aplikasi: Android/Chrome (prompt *Pasang aplikasi*), iOS (Bagikan → Tambahkan ke Layar Utama); ikon dan nama benar, terbuka tanpa bilah alamat.

## 4. Perangkat bersih (tanpa cache)

- [ ] Profil baru atau *Clear site data*: kunjungan pertama memuat Home < ~3 detik di 4G; tidak ada galat konsol.
- [ ] Peta tampil < 3 detik di 4G (throttling DevTools "Fast 4G").
- [ ] Muat ulang keras setelah deploy baru: service worker memperbarui diri (tidak menyajikan versi lama terus-menerus).

## 5. Tanpa dan dengan `GEMINI_API_KEY`

- [ ] **Tanpa kunci** (`.env` kosong / variabel Vercel dihapus): *Buat briefing* menampilkan ringkasan templat berlabel **Mode cadangan**; chatbot memberi jawaban cadangan + tautan artikel; tidak ada galat tak tertangani.
- [ ] **Dengan kunci:** *Buat briefing* berlabel *Dibuat otomatis oleh AI · bukan keputusan operasional*; ringkasan ≤ ~120 kata dan **tidak memuat angka di luar data** (bandingkan dengan panel); chatbot menolak topik non-karhutla dengan sopan dan menyebut 112 untuk darurat.
- [ ] Nama model valid: bila `GEMINI_MODEL` salah, tampilan tetap aman (mode cadangan), tapi perbaiki sebelum hari juri.
- [ ] Jaringan lambat (Slow 3G): briefing beralih ke cadangan setelah ~6 detik.
- [ ] Kunci **tidak** terlihat di DevTools → Network/Sources, maupun di hasil build (`grep -r GEMINI dist/` kosong).

## 6. Aksesibilitas manual

- [ ] **Keyboard saja:** seluruh alur (navbar, simulasi, kompas dengan panah, daftar risiko, kuis, lapor, tur) dapat dipakai; fokus selalu terlihat; tidak ada jebakan fokus; Esc menutup modal/lightbox/tur.
- [ ] Zoom 200%: tidak ada konten terpotong.
- [ ] Pembaca layar (NVDA/VoiceOver/TalkBack) pada Home, Peta (hotspot, panel, daftar risiko), dan Lapor: judul, label, dan status terbaca masuk akal.
- [ ] Reduced motion aktif (pengaturan OS): denyut hotspot, goyang api, dan animasi slider berhenti.
- [ ] Zona prediksi dapat dibedakan **tanpa warna** (pola garis berbeda).

## 7. Lighthouse (Mobile, jendela penyamaran, tanpa ekstensi)

Target: Performance ≥ 90 · Accessibility, Best Practices, SEO ≥ 95. Catat skor dan penyebab bila kurang.

| Halaman | Performance | Accessibility | Best Practices | SEO | Catatan |
|---|---|---|---|---|---|
| `/` | | | | | |
| `/peta?demo=1` | | | | | |
| `/lapor` | | | | | |
| `/edukasi` | | | | | |

## 8. Kepatuhan lomba

- [ ] `npm run cek:rilis` → **"Siap rilis"** (tidak ada placeholder, rahasia, atau pelanggaran lain).
- [ ] `npm run lint`, `npm test`, dan `npm run build` lolos pada versi yang dikirim.
- [ ] Folder repository bernama **`webdesign_namaTim_technoversary_vol.II`**.
- [ ] README lengkap (judul, deskripsi, instalasi, cara menjalankan, tim dan anggota, tautan demo, kredit), tangkapan layar terpasang.
- [ ] Tidak ada template/tema/komponen premium; semua font, ikon, foto, dan data berlisensi bebas dan teratribusi (halaman Kredit).
- [ ] Tidak ada `.env` atau kunci API di repository maupun riwayat git (`.env.example` saja).
- [ ] Tidak ada konten SARA, pornografi, kekerasan, atau hoaks; statistik bersumber.
- [ ] Riwayat commit dimulai pada atau setelah **5 November 2026**.
- [ ] Karya orisinal, belum dipublikasikan atau diikutkan lomba lain.
- [ ] Penggunaan alat bantu pengembangan sudah dikonfirmasi ke panitia dan dijelaskan jujur di README.
- [ ] Dikirim lewat Google Form **sebelum 15 November 2026 pukul 23.59 WIB** (target: sore hari, bukan menit terakhir). Waktu kirim: ______

## 9. Persiapan presentasi final (24 November)

- [ ] Video demo cadangan tiga momen (simulasi + what-if, laporan offline, briefing).
- [ ] Data sudah dimuat dan situs sudah dibuka sekali di perangkat presentasi (cache hangat).
- [ ] Hotspot internet cadangan tersedia; tidak bergantung pada wifi lokasi.
- [ ] Baterai penuh, mode jangan ganggu aktif, layar tidak mati otomatis.
- [ ] Setiap anggota mampu menjelaskan rumus simulasi dan alur sinkronisasi offline.
