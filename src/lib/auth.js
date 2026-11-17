// Login DEMO tanpa server: akun contoh dan sesi tersimpan di perangkat ini.
// Ini peragaan alur masuk/keluar dan pemisahan tampilan user vs admin, BUKAN keamanan sungguhan:
// kata sandi ada di kode klien sehingga siapa pun bisa membacanya. Untuk produksi, ganti dengan autentikasi server.
export const AKUN = [
  { email: 'admin@pyraops.id', sandi: 'Admin#2026', peran: 'admin', nama: 'Admin PyraOps' },
  { email: 'user@pyraops.id', sandi: 'Pengguna#2026', peran: 'pengguna', nama: 'Pengguna Demo' },
]
export const PERAN = ['admin', 'pengguna']
const KUNCI = 'pyraops-sesi'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const PESAN = {
  id: { email: 'Alamat email belum lengkap. Contoh: nama@contoh.com', sandi: 'Kata sandi belum diisi.', salah: 'Email atau kata sandi tidak cocok. Coba lagi atau pakai akun demo di bawah.' },
  en: { email: 'The email address looks incomplete. Example: name@example.com', sandi: 'Please enter your password.', salah: 'The email or password does not match. Try again or use a demo account below.' },
}
export const pesanMasuk = (kunci, bahasa = 'id') => PESAN[bahasa][kunci]

/** Galat isian (sebelum dicocokkan ke akun). */
export function validasiMasuk({ email, sandi }, bahasa = 'id') {
  const galat = {}
  if (!EMAIL.test(String(email ?? '').trim())) galat.email = PESAN[bahasa].email
  if (!String(sandi ?? '')) galat.sandi = PESAN[bahasa].sandi
  return galat
}

/** Akun yang cocok (tanpa kata sandi), atau null. Email tidak peka huruf besar-kecil. */
export function cocokkan(email, sandi) {
  const e = String(email ?? '').trim().toLowerCase()
  const a = AKUN.find((x) => x.email === e && x.sandi === String(sandi ?? ''))
  return a ? { email: a.email, nama: a.nama, peran: a.peran } : null
}

export function bacaSesi() {
  try {
    const s = JSON.parse(localStorage.getItem(KUNCI))
    if (s && PERAN.includes(s.peran) && typeof s.email === 'string' && typeof s.nama === 'string') return s
  } catch { /* penyimpanan tidak tersedia atau rusak */ }
  return null
}
export function simpanSesi(akun) {
  const sesi = { email: akun.email, nama: akun.nama, peran: akun.peran, masuk: Date.now() }
  try { localStorage.setItem(KUNCI, JSON.stringify(sesi)) } catch { /* abaikan */ }
  return sesi
}
export function hapusSesi() { try { localStorage.removeItem(KUNCI) } catch { /* abaikan */ } }

/** Tujuan sesudah masuk: admin selalu ke dashboard; user kembali ke halaman asal (hanya jalur internal yang aman). */
export function tujuanSetelahMasuk(peran, next) {
  if (peran === 'admin') return '/admin'
  return typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/admin') && next !== '/masuk' ? next : '/'
}

// Catatan "pernah masuk" per email (perangkat ini saja): membedakan sambutan pertama kali dari sambutan kembali.
const K_PERNAH = 'pyraops-pernah'
const bacaPeta = () => { try { const v = JSON.parse(localStorage.getItem(K_PERNAH)); return v && typeof v === 'object' ? v : {} } catch { return {} } }
/** Waktu (ms) masuk terakhir untuk email ini, atau null bila belum pernah masuk di perangkat ini. */
export const bacaPernah = (email) => { const t = bacaPeta()[String(email ?? '').trim().toLowerCase()]; return Number.isFinite(t) ? t : null }
export function catatPernah(email, waktu = Date.now()) {
  try { localStorage.setItem(K_PERNAH, JSON.stringify({ ...bacaPeta(), [String(email ?? '').trim().toLowerCase()]: waktu })) } catch { /* abaikan */ }
}
/** Sapaan menurut jam: pagi, siang, sore, malam. */
export function sapaanJam(jam, bahasa = 'id') {
  const k = jam >= 4 && jam < 11 ? 0 : jam >= 11 && jam < 15 ? 1 : jam >= 15 && jam < 18 ? 2 : 3
  return (bahasa === 'en' ? ['Good morning', 'Good afternoon', 'Good evening', 'Good evening'] : ['Selamat pagi', 'Selamat siang', 'Selamat sore', 'Selamat malam'])[k]
}
/** "3 hari yang lalu" / "3 days ago" dari selisih waktu. */
export function lalu(ms, bahasa = 'id', sekarang = Date.now()) {
  const d = Math.max(0, sekarang - ms) / 1000
  const [n, u] = d < 3600 ? [Math.max(1, Math.round(d / 60)), 'minute'] : d < 86400 ? [Math.round(d / 3600), 'hour'] : [Math.round(d / 86400), 'day']
  return new Intl.RelativeTimeFormat(bahasa === 'en' ? 'en' : 'id', { numeric: 'always' }).format(-n, u)
}
