// Mode pratinjau admin: admin boleh membuka situs publik untuk mengecek hasil konten (terbit/draf, galeri, kuis, checklist),
// lalu kembali ke dashboard. Disimpan di sessionStorage, jadi hanya berlaku di tab ini dan hilang saat tab ditutup.
const K = 'pyraops-pratinjau'
export const sedangPratinjau = () => { try { return sessionStorage.getItem(K) === '1' } catch { return false } }
export function mulaiPratinjau(navigate, ke = '/') { try { sessionStorage.setItem(K, '1') } catch { /* abaikan */ } navigate(ke) }
export function akhiriPratinjau(navigate, ke = '/admin/konten') { try { sessionStorage.removeItem(K) } catch { /* abaikan */ } navigate(ke) }
