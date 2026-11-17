/** Menghitung skor. `jawaban` berisi indeks opsi terpilih per soal (undefined bila belum dijawab). */
export function nilaiKuis(soal, jawaban) {
  const skor = soal.reduce((s, q, i) => s + (jawaban[i] === q.benar ? 1 : 0), 0)
  return { skor, total: soal.length, persen: Math.round((skor / soal.length) * 100) }
}

const PESAN = {
  id: ['Sempurna! Kamu siap menjadi duta pencegahan karhutla.', 'Bagus sekali! Pemahamanmu sudah kuat.', 'Lumayan. Baca kembali artikel untuk memperdalam.', 'Jangan menyerah. Baca artikelnya, lalu coba lagi.'],
  en: ['Perfect! You are ready to be a wildfire prevention ambassador.', 'Great job! Your understanding is strong.', 'Not bad. Re-read the articles to go deeper.', 'Do not give up. Read the articles, then try again.'],
}
export function pesanHasil(persen, bahasa = 'id') {
  const p = PESAN[bahasa]
  if (persen === 100) return p[0]
  if (persen >= 75) return p[1]
  if (persen >= 50) return p[2]
  return p[3]
}

/** Ekspresi TORA menurut hasil: >=75 merayakan, 50-74 menyemangati, di bawahnya menenangkan. */
export function ekspresiHasil(persen) {
  if (persen >= 75) return 'merayakan'
  if (persen >= 50) return 'menyemangati'
  return 'menenangkan'
}
