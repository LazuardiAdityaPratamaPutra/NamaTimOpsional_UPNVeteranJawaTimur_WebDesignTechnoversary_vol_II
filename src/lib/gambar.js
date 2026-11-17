// Mengecilkan gambar unggahan di peramban (tanpa server): sisi terpanjang dibatasi, lalu dikodekan ulang ke WebP/JPEG.
// Hasilnya data URL yang cukup kecil untuk disimpan di perangkat (demo); EXIF dan metadata lain ikut terbuang.
export const JENIS_GAMBAR = ['image/jpeg', 'image/png', 'image/webp']
export const BATAS_BERKAS = 8 * 1024 * 1024

export async function kompresGambar(berkas, { maks = 1400, kualitas = 0.8 } = {}) {
  if (!JENIS_GAMBAR.includes(berkas.type)) throw new Error('jenis')
  if (berkas.size > BATAS_BERKAS) throw new Error('besar')
  const bmp = await createImageBitmap(berkas)
  const skala = Math.min(1, maks / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * skala), h = Math.round(bmp.height * skala)
  const kanvas = document.createElement('canvas')
  kanvas.width = w; kanvas.height = h
  kanvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  let url = kanvas.toDataURL('image/webp', kualitas)
  if (!url.startsWith('data:image/webp')) url = kanvas.toDataURL('image/jpeg', kualitas)
  return { url, w, h, kb: Math.round((url.length * 3) / 4 / 1024) }
}
