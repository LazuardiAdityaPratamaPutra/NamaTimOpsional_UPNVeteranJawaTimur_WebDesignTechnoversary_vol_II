// Menyimpan apakah tur sudah pernah dilihat (agar tidak muncul otomatis berulang)
const KUNCI = 'pyraops-tur-selesai'

export const sudahLihatTur = () => {
  try { return localStorage.getItem(KUNCI) === '1' } catch { return false }
}
export const tandaiTur = () => {
  try { localStorage.setItem(KUNCI, '1') } catch { /* penyimpanan tidak tersedia: abaikan */ }
}
