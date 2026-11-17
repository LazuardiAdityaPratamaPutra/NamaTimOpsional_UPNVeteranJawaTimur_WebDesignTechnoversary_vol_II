// Chatbot edukasi: Gemini lewat /api/chat; bila tidak tersedia, jawaban cadangan yang menaut ke artikel.

// [pola kata kunci (Indonesia + Inggris), tautan, label per bahasa]
const TOPIK = [
  [/gambut|peat/, '/edukasi/gambut', { id: 'Baca: Mengapa gambut sulit dipadamkan?', en: 'Read: Why is peat so hard to extinguish?' }],
  [/asap|sehat|masker|napas|dampak|smoke|health|mask|breath|impact/, '/edukasi/dampak', { id: 'Baca: Dampak kesehatan dan ekosistem', en: 'Read: Health and ecosystem impacts' }],
  [/cegah|bakar|lahan|prevent|burn|land clearing/, '/edukasi/pencegahan', { id: 'Baca: Langkah pencegahan', en: 'Read: Prevention steps' }],
  [/sebab|pemicu|kenapa|mengapa|kemarau|cause|trigger|why|dry season/, '/edukasi/penyebab', { id: 'Baca: Apa yang memicu karhutla?', en: 'Read: What triggers wildfires?' }],
]

/** Jawaban tanpa AI: arahkan ke artikel yang relevan. */
export function jawabanCadangan(pesan, bahasa = 'id') {
  const p = pesan.toLowerCase()
  const cocok = TOPIK.find(([re]) => re.test(p))
  const darurat = /darurat|tolong|terbakar|api besar|emergency|help|burning|big fire/.test(p)
  const en = bahasa === 'en'
  const sisipan = darurat ? (en ? ' For a real emergency, call 112 or your local disaster agency (BPBD) right away.' : ' Untuk kondisi darurat nyata, segera hubungi 112 atau BPBD setempat.') : ''
  const kalimat = en
    ? `The AI assistant is currently unavailable, so this is a fallback answer.${sisipan} ${cocok ? 'These materials may help:' : 'Please browse the articles, gallery, and quiz on this page.'}`
    : `Asisten AI sedang tidak tersedia, jadi ini jawaban cadangan.${sisipan} ${cocok ? 'Materi berikut bisa membantu:' : 'Silakan jelajahi artikel, galeri, dan kuis di halaman ini.'}`
  return {
    teks: kalimat,
    tautan: cocok ? { ke: cocok[1], label: cocok[2][bahasa] } : { ke: '/edukasi', label: en ? 'Open learning materials' : 'Buka materi edukasi' },
  }
}

/** Riwayat untuk server: hanya pasangan (pertanyaan, jawaban AI), maksimal 6 pesan, selalu diawali pesan pengguna. */
export function susunRiwayat(pesan) {
  const pasangan = []
  for (let i = 0; i < pesan.length - 1; i++) {
    if (pesan[i].peran === 'user' && pesan[i + 1].peran === 'model' && pesan[i + 1].sumber === 'ai') {
      pasangan.push({ peran: 'user', teks: pesan[i].teks }, { peran: 'model', teks: pesan[i + 1].teks })
    }
  }
  return pasangan.slice(-6)
}

export async function kirimChat(pesan, riwayat = [], { bahasa = 'id', fetchFn = (...a) => fetch(...a), timeoutMs = 20000 } = {}) {
  const kontrol = new AbortController()
  const timer = setTimeout(() => kontrol.abort(), timeoutMs)
  try {
    const res = await fetchFn('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pesan, riwayat, bahasa }), signal: kontrol.signal })
    if (res.status === 429) {
      return { teks: bahasa === 'en' ? 'Too many questions in a short time. Please wait a moment and try again.' : 'Terlalu banyak pertanyaan dalam waktu singkat. Tunggu sebentar lalu coba lagi.', sumber: 'batas' }
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = await res.json()
    if (!j.ok || typeof j.teks !== 'string' || !j.teks.trim()) throw new Error('Respons tidak valid')
    return { teks: j.teks.trim(), sumber: 'ai' }
  } catch (e) {
    return { ...jawabanCadangan(pesan, bahasa), sumber: 'cadangan', alasan: e.name === 'AbortError' ? 'timeout' : e.message }
  } finally { clearTimeout(timer) }
}

/**
 * Memecah jawaban AI menjadi blok yang aman dirender (tanpa HTML mentah): paragraf (baris baru dipertahankan),
 * judul (# ...), daftar berbutir (- * •) dan daftar bernomor (1. 1)). Gemini sering menjawab dengan "* butir", jadi itu ikut dikenali.
 */
export function blokJawaban(teks) {
  const blok = []
  let para = []
  let daftar = null
  const tutupPara = () => { if (para.length) blok.push({ t: 'p', v: para.join('\n') }); para = [] }
  const tutupDaftar = () => { if (daftar) blok.push(daftar); daftar = null }
  for (const mentah of String(teks ?? '').split(/\r?\n/)) {
    const b = mentah.trim()
    if (!b) { tutupPara(); tutupDaftar(); continue }
    const judul = b.match(/^#{1,4}\s+(.+)$/)
    if (judul) { tutupPara(); tutupDaftar(); blok.push({ t: 'h', v: judul[1] }); continue }
    const butir = b.match(/^([-*•]|\d+[.)])\s+(.+)$/)
    if (butir) {
      tutupPara()
      const urut = /\d/.test(butir[1])
      if (!daftar || daftar.urut !== urut) { tutupDaftar(); daftar = { t: 'ul', urut, item: [] } }
      daftar.item.push(butir[2])
    } else {
      tutupDaftar()
      para.push(b)
    }
  }
  tutupPara(); tutupDaftar()
  return blok
}
