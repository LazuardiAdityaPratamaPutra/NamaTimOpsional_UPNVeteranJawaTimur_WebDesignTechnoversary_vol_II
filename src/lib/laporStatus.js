/**
 * Status konfirmasi sebuah laporan, dibaca dari catatan sebenarnya (bukan dari tombol yang baru ditekan).
 *  - lokal         : tersimpan di perangkat, belum online
 *  - menunggu      : tersimpan di perangkat, pengiriman ke server belum selesai
 *  - gagal         : percobaan kirim gagal, akan dicoba lagi
 *  - demo          : hosting tanpa server penerima (sync.js menandai synced + modeDemo); BELUM diterima server mana pun
 *  - terkonfirmasi : server menjawab ok untuk laporan ini
 */
export function statusKonfirmasi(laporan, online) {
  if (!laporan) return null
  if (laporan.status === 'synced') return laporan.modeDemo ? 'demo' : 'terkonfirmasi'
  if (laporan.status === 'failed') return 'gagal'
  return online ? 'menunggu' : 'lokal'
}
