import { kurangiGerak } from './gerak'

// Getar halus di ponsel sebagai umpan balik aksi penting (jawab kuis, laporan tersimpan, gagal masuk).
// Diam bila perangkat tak mendukung, bila pengguna memilih gerak dihemat, atau di desktop.
export const POLA = { ok: 14, salah: [26, 60, 26], sukses: [12, 40, 22] }
export function sentuhan(pola = POLA.ok) {
  if (kurangiGerak() || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  try { return navigator.vibrate(pola) } catch { return false }
}
