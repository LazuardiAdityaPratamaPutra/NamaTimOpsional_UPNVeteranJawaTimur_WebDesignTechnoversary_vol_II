// Kompresi foto di sisi klien agar penyimpanan offline hemat

/** Ukuran baru dengan sisi terpanjang <= maks, rasio dipertahankan. */
export function ukuranTarget(w, h, maks = 800) {
  const sisi = Math.max(w, h)
  if (sisi <= maks) return { w, h }
  const k = maks / sisi
  return { w: Math.round(w * k), h: Math.round(h * k) }
}

/** Mengompres berkas gambar menjadi Blob JPEG (maks 800px). */
export async function kompresFoto(file, maks = 800, kualitas = 0.7) {
  if (!file.type.startsWith('image/')) throw new Error('Berkas bukan gambar')
  let bmp
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }) } // hormati rotasi EXIF
  catch { bmp = await createImageBitmap(file) }
  const { w, h } = ukuranTarget(bmp.width, bmp.height, maks)
  const kanvas = document.createElement('canvas')
  kanvas.width = w; kanvas.height = h
  kanvas.getContext('2d').drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return new Promise((ok, gagal) => kanvas.toBlob((b) => (b ? ok(b) : gagal(new Error('Gagal mengompres foto'))), 'image/jpeg', kualitas))
}
