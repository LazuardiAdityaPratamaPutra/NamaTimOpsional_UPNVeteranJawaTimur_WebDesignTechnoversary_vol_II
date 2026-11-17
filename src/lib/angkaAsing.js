// Memeriksa bahwa teks hanya memuat angka yang ada pada data masukan (tidak ada angka karangan).
// Tanpa impor: dipakai di server (Vercel, ESM) maupun klien.
const POLA = /\d+(?:[.,]\d+)*/g

// "1.234" bisa berarti 1234 (format Indonesia) atau 1,234; "1,952" bisa berarti 1952 (format Inggris).
// Semua tafsiran yang masuk akal diterima.
function varian(token) {
  const hasil = [Number(token.replace(',', '.'))]
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(token)) hasil.push(Number(token.replace(/\./g, '').replace(',', '.')))
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(token)) hasil.push(Number(token.replace(/,/g, '')))
  return hasil.filter(Number.isFinite)
}
const semuaVarian = (teks) => (String(teks).match(POLA) || []).map((t) => ({ t, v: varian(t) }))

/** Daftar angka pada `teks` yang tidak ada di `data` (kosong = aman). Nomor urut 1-3 selalu diizinkan. */
export function angkaAsing(teks, data) {
  const boleh = new Set([1, 2, 3])
  for (const { v } of semuaVarian(JSON.stringify(data))) {
    for (const x of v) { boleh.add(x); boleh.add(Math.round(x)); boleh.add(Math.round(x * 10) / 10) }
  }
  return semuaVarian(teks).filter(({ v }) => !v.some((x) => boleh.has(x) || boleh.has(Math.round(x * 10) / 10))).map(({ t }) => t)
}
