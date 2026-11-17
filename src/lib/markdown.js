// Penguraian Markdown sederhana (cukup untuk artikel edukasi). Hasilnya struktur data, bukan HTML,
// sehingga dirender sebagai elemen React tanpa dangerouslySetInnerHTML.

/** Memisahkan front-matter (--- ... ---) dari isi. */
export function parseFrontmatter(mentah) {
  const m = mentah.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, isi: mentah }
  const meta = {}
  for (const baris of m[1].split(/\r?\n/)) {
    const i = baris.indexOf(':')
    if (i > 0) meta[baris.slice(0, i).trim()] = baris.slice(i + 1).trim()
  }
  return { meta, isi: m[2] }
}

/** Perkiraan waktu baca (menit), 200 kata per menit, minimal 1. */
export const waktuBaca = (teks) => Math.max(1, Math.ceil(teks.trim().split(/\s+/).length / 200))

/** Hanya tautan http(s), relatif, anchor, dan mailto yang dianggap aman. */
export const hrefAman = (h) => /^(https?:\/\/|\/|#|mailto:)/i.test(h)

/** Token inline: teks, tebal, miring, tautan. */
export function parseInline(teks) {
  const hasil = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  let akhir = 0, m
  while ((m = re.exec(teks))) {
    if (m.index > akhir) hasil.push({ t: 'teks', v: teks.slice(akhir, m.index) })
    const s = m[0]
    if (s.startsWith('**')) hasil.push({ t: 'tebal', v: s.slice(2, -2) })
    else if (s.startsWith('*')) hasil.push({ t: 'miring', v: s.slice(1, -1) })
    else {
      const mm = s.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      hasil.push({ t: 'tautan', v: mm[1], href: mm[2] })
    }
    akhir = m.index + s.length
  }
  if (akhir < teks.length) hasil.push({ t: 'teks', v: teks.slice(akhir) })
  return hasil
}

/** Blok: h2, h3, p, ul, quote. */
export function parseMarkdown(sumber) {
  const blok = []
  let para = [], daftar = []
  const tutupPara = () => { if (para.length) { blok.push({ tipe: 'p', teks: para.join(' ') }); para = [] } }
  const tutupDaftar = () => { if (daftar.length) { blok.push({ tipe: 'ul', item: daftar }); daftar = [] } }
  for (const mentah of sumber.split(/\r?\n/)) {
    const baris = mentah.trim()
    if (!baris) { tutupPara(); tutupDaftar(); continue }
    if (baris.startsWith('### ')) { tutupPara(); tutupDaftar(); blok.push({ tipe: 'h3', teks: baris.slice(4) }) }
    else if (baris.startsWith('## ')) { tutupPara(); tutupDaftar(); blok.push({ tipe: 'h2', teks: baris.slice(3) }) }
    else if (baris.startsWith('- ')) { tutupPara(); daftar.push(baris.slice(2)) }
    else if (baris.startsWith('> ')) { tutupPara(); tutupDaftar(); blok.push({ tipe: 'quote', teks: baris.slice(2) }) }
    else { tutupDaftar(); para.push(baris) }
  }
  tutupPara(); tutupDaftar()
  return blok
}
