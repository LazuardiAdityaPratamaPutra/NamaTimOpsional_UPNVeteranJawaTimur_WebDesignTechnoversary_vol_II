# Daftar periksa pengumpulan

Menurut guidebook Web Design Competition Techno Versary Vol. II, karya dikumpulkan sebagai **repository GitHub** lewat Google Form, paling lambat pada tenggat yang tertera di guidebook (cek tanggal dan jam terbaru di grup peserta).

## 1. Isi repository

- [ ] Folder proyek bernama `webdesign_PyraOps_technoversary_vol.II` (format `webdesign_namaTim_technoversary_vol.II`).
- [ ] `README.md` memuat judul website, deskripsi, petunjuk instalasi dan cara menjalankan, serta nama tim dan anggota (sudah ada).
- [ ] Baris **Demo online** di README diisi URL deploy, atau dihapus bila tidak ada hosting (hosting opsional).
- [ ] `src/data/kredit.js`: baris *Maskot TORA* dan *Foto* tidak lagi berisi `[ISI ...]` (pembuat, lisensi, tautan). Isi dari `docs/KREDIT-FOTO.md`.
- [ ] `npm run cek:rilis` menyatakan **Siap rilis**.

## 2. Rahasia

- [ ] `.env` **tidak** ikut ter-commit (sudah ada di `.gitignore`; hanya `.env.example` yang boleh masuk).
- [ ] Bila berkas `.env` berisi kunci asli pernah terkirim (zip, chat, atau commit), **putar ulang kuncinya** di Google AI Studio.

## 3. Perintah

```bash
cd webdesign_PyraOps_technoversary_vol.II
git init
git add .
git status                      # pastikan .env dan node_modules tidak ada dalam daftar
git commit -m "PyraOps: edukasi dan simulasi karhutla"
git branch -M main
git remote add origin https://github.com/<akun>/webdesign_PyraOps_technoversary_vol.II.git
git push -u origin main
```

Jadikan repository **public** (atau beri akses kepada panitia) agar juri dapat membukanya, lalu tempel tautan repository pada Google Form pengumpulan.

## 4. Deploy (opsional, disarankan)

Ikuti bagian *Deploy ke Vercel* di README. Setelah deploy, uji di perangkat bersih: `/`, `/edukasi`, `/peta?demo=1`, `/contact`, dan mode offline di `/lapor`.

## 5. Uji terakhir

```bash
npm install
npm run lint
npm test
npm run build
```

Lalu ulangi `docs/QA.md` pada versi rilis.
