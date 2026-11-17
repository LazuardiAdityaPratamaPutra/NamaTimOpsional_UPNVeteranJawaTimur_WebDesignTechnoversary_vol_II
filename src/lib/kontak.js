// Validasi dan pembuatan tautan mailto untuk form kontak (tanpa backend, tanpa menyimpan data)
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const BATAS = { nama: [2, 80], pesan: [10, 1000] }

// Buang karakter kontrol (selain tab dan baris baru) dan spasi di tepi
const bersih = (s) => [...String(s ?? '')]
  .filter((ch) => { const c = ch.charCodeAt(0); return c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127) })
  .join('').trim()

const PESAN = {
  id: {
    nama: 'Mohon tulis namamu (minimal 2 huruf).', namaPanjang: (m) => `Nama terlalu panjang (maksimal ${m} karakter).`,
    email: 'Alamat email belum lengkap. Contoh: nama@contoh.com',
    pesan: 'Pesannya terlalu singkat. Ceritakan sedikit lebih banyak (minimal 10 karakter).', pesanPanjang: (m) => `Pesan terlalu panjang (maksimal ${m} karakter).`,
  },
  en: {
    nama: 'Please enter your name (at least 2 characters).', namaPanjang: (m) => `Name is too long (maximum ${m} characters).`,
    email: 'The email address looks incomplete. Example: name@example.com',
    pesan: 'Your message is too short. Tell us a bit more (at least 10 characters).', pesanPanjang: (m) => `Message is too long (maximum ${m} characters).`,
  },
}

export function validasiKontak({ nama, email, pesan }, bahasa = 'id') {
  const galat = {}
  const p = PESAN[bahasa]
  const n = bersih(nama), m = bersih(pesan)
  if (n.length < BATAS.nama[0]) galat.nama = p.nama
  else if (n.length > BATAS.nama[1]) galat.nama = p.namaPanjang(BATAS.nama[1])
  if (!EMAIL.test(bersih(email))) galat.email = p.email
  if (m.length < BATAS.pesan[0]) galat.pesan = p.pesan
  else if (m.length > BATAS.pesan[1]) galat.pesan = p.pesanPanjang(BATAS.pesan[1])
  return galat
}

export function buatMailto(tujuan, { nama, email, pesan }, bahasa = 'id') {
  const n = bersih(nama).replace(/\s+/g, ' ')
  const subjek = bahasa === 'en' ? `Message from ${n} (PyraOps)` : `Pesan dari ${n} (PyraOps)`
  const isi = `${bersih(pesan)}\n\n--\n${n} <${bersih(email)}>`
  return `mailto:${tujuan}?subject=${encodeURIComponent(subjek)}&body=${encodeURIComponent(isi)}`
}
