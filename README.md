# PyraOps — Edukasi dan Simulasi Kebakaran Hutan dan Lahan

> Bukan hanya melihat api, tapi tahu ke mana api akan pergi.

## 1. Deskripsi Website

PyraOps merupakan website edukasi lingkungan yang berfokus pada kebakaran hutan dan lahan (karhutla) di Indonesia. Website ini dikembangkan untuk membantu masyarakat memahami penyebab, dampak, pencegahan, serta potensi penyebaran kebakaran melalui materi edukasi dan simulasi interaktif.

PyraOps menggabungkan informasi, edukasi, dan simulasi dalam satu platform agar masyarakat tidak hanya mengetahui bahaya karhutla, tetapi juga memahami langkah-langkah yang dapat dilakukan untuk mengurangi risikonya.

### Fitur Utama

- **Peta dan Simulasi Karhutla:** Menampilkan titik panas dan simulasi penyebaran api berdasarkan skenario tertentu.
- **Informasi Risiko:** Menampilkan area permukiman yang berpotensi terdampak berdasarkan hasil simulasi.
- **Edukasi Lingkungan:** Menyediakan artikel, galeri edukasi, dan informasi mengenai karhutla.
- **Kuis Edukasi:** Menguji pemahaman pengguna mengenai kebakaran hutan dan lahan.
- **Patroli Hutan:** Game edukasi untuk mengenali tindakan yang tepat dalam menghadapi risiko karhutla.
- **Pelaporan Lapangan:** Memungkinkan pengguna mengirimkan laporan terkait kejadian karhutla.
- **Tanya TORA:** Asisten edukasi untuk membantu pengguna memahami informasi seputar karhutla.
- **Dashboard Admin:** Mengelola laporan, konten edukasi, pesan, dan aktivitas website.
- **Progressive Web App (PWA):** Mendukung instalasi website pada perangkat dan akses offline untuk sebagian konten.
- **Multi Bahasa:** Mendukung Bahasa Indonesia dan Bahasa Inggris.

**Catatan:** Simulasi PyraOps merupakan model edukatif yang disederhanakan, bukan alat prediksi operasional atau pengganti informasi resmi dari instansi berwenang. Data ilustrasi dalam simulasi perlu dibedakan dari data kejadian aktual.

## 2. Petunjuk Instalasi

### Persyaratan Sistem

Sebelum menjalankan project, pastikan perangkat telah memiliki:

- Node.js versi 20 atau lebih baru.
- npm (Node Package Manager).
- Web browser seperti Google Chrome, Microsoft Edge, atau Mozilla Firefox.

Periksa instalasi Node.js dan npm melalui terminal:

```bash
node -v
npm -v
```

### Langkah Instalasi

1. Ekstrak file project.
2. Buka terminal atau PowerShell pada direktori project.
3. Instal seluruh dependency yang dibutuhkan:

```bash
npm install
```

4. Salin file konfigurasi environment:

**Windows PowerShell:**
```powershell
Copy-Item .env.example .env
```

**Linux/macOS:**
```bash
cp .env.example .env
```

5. Konfigurasi API Gemini (opsional).

Apabila ingin menggunakan fitur AI berbasis Gemini, masukkan API key ke dalam file `.env`:

```env
GEMINI_API_KEY=masukkan_api_key
GEMINI_MODEL=nama_model
```

API key dapat diperoleh melalui Google AI Studio.

## 3. Cara Menjalankan Project

Setelah seluruh dependency berhasil diinstal, jalankan perintah berikut:

```bash
npm run dev
```

Tunggu hingga Vite menampilkan alamat server lokal pada terminal.

Buka browser dan akses:

```text
http://localhost:5173
```

Website PyraOps sekarang dapat digunakan melalui browser.

Untuk menghentikan server, tekan:

```text
Ctrl + C
```

### Menjalankan Build Production

Untuk membuat versi production:

```bash
npm run build
```

Untuk menjalankan pratinjau hasil build:

```bash
npm run preview
```

### Perintah Tambahan

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Menjalankan server pengembangan. |
| `npm run build` | Membuat build production. |
| `npm run preview` | Menjalankan pratinjau build production. |
| `npm test` | Menjalankan pengujian project. |
| `npm run lint` | Memeriksa kualitas kode menggunakan ESLint. |

## 4. Teknologi yang Digunakan

- React.js
- Vite
- Tailwind CSS
- React Router
- Leaflet dan React Leaflet
- Turf.js
- Three.js
- Dexie.js
- IndexedDB
- Progressive Web App (PWA)
- Gemini API (opsional)

## 5. Informasi Tim

**Nama Project:** PyraOps  
**Kategori:** Web Design Competition  
**Kompetisi:** Techno Versary Vol. II

### Anggota Tim

| Nama | Tanggung Jawab |
|---|---|
| Muhamad Musyaffa' Hadzaz Zaman | UI, Peta, dan Simulasi |
| Lazuardi Aditya Pratama Putra | PWA, AI, dan Konten |

---

**PyraOps — Bersama memahami risiko, bersama menjaga lingkungan.**