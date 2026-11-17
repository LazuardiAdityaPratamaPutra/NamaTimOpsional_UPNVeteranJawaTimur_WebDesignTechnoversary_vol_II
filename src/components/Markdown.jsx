import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { parseMarkdown, parseInline, hrefAman } from '../lib/markdown'

export const idBagian = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Istilah glosarium: kata bergaris putus-putus; diketuk memunculkan definisi singkat di dekatnya. */
function Istilah({ teks, data, slugIni, labelArtikel }) {
  const [buka, setBuka] = useState(false)
  const [geser, setGeser] = useState(0)
  const id = useId()
  const ref = useRef(null)
  useEffect(() => {
    if (!buka) return undefined
    const luar = (e) => { if (!ref.current?.contains(e.target)) setBuka(false) }
    const esc = (e) => { if (e.key === 'Escape') { setBuka(false); ref.current?.querySelector('button')?.focus() } }
    document.addEventListener('pointerdown', luar); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', luar); document.removeEventListener('keydown', esc) }
  }, [buka])
  const alih = (e) => {
    // Jaga kartu tetap di dalam layar: hitung pergeseran dari posisi tombol saat dibuka
    const r = e.currentTarget.getBoundingClientRect(), lebar = Math.min(288, innerWidth - 32)
    const kiri = r.left + r.width / 2 - lebar / 2
    setGeser(Math.min(0, innerWidth - 16 - (kiri + lebar)) + Math.max(0, 16 - kiri))
    setBuka(!buka)
  }
  return (
    <span ref={ref} className="relative">
      <button type="button" onClick={alih} aria-expanded={buka} aria-controls={id}
        className="istilah cursor-help rounded-sm text-inherit underline decoration-ember-ink decoration-dotted decoration-2 underline-offset-[5px] transition-colors hover:bg-ember-ink/10">{teks}</button>
      {buka && (
        <span id={id} role="note" style={{ '--geser': `${geser}px` }}
          className="istilah-kartu absolute left-1/2 top-full z-30 mt-2 block w-[min(18rem,calc(100vw-2rem))] rounded-xl border-2 border-ink bg-surface p-3.5 text-left text-[15px] font-normal not-italic leading-relaxed text-ink shadow-[4px_4px_0_0_var(--line-strong)]">
          <span className="block font-mono text-[11px] uppercase tracking-[0.16em] text-ember-ink">{data.istilah}</span>
          <span className="mt-1 block">{data.teks}</span>
          {data.artikel !== slugIni && <Link to={`/edukasi/${data.artikel}`} className="mt-1.5 inline-block text-xs font-semibold text-ink-2 underline underline-offset-4 hover:text-ember-ink">{labelArtikel(data.artikel)}</Link>}
        </span>
      )}
    </span>
  )
}

/** Memecah satu potong teks pada kemunculan istilah yang ditugaskan ke unit ini (masing-masing sekali). */
function pecah(teks, daftar, sudah) {
  const out = []
  let sisa = teks
  for (;;) {
    let pilih = null
    for (const g of daftar) {
      if (sudah.has(g.id)) continue
      const m = g.re.exec(sisa)
      if (m && (!pilih || m.index < pilih.m.index)) pilih = { g, m }
    }
    if (!pilih) break
    sudah.add(pilih.g.id)
    if (pilih.m.index) out.push(sisa.slice(0, pilih.m.index))
    out.push({ g: pilih.g, teks: pilih.m[0] })
    sisa = sisa.slice(pilih.m.index + pilih.m[0].length)
  }
  if (sisa) out.push(sisa)
  return out
}

function Inline({ teks, istilah = [], ...lain }) {
  const sudah = new Set()
  return parseInline(teks).map((tk, i) => {
    if (tk.t === 'tebal') return <strong key={i}>{tk.v}</strong>
    if (tk.t === 'miring') return <em key={i}>{tk.v}</em>
    if (tk.t === 'tautan') {
      return hrefAman(tk.href)
        ? <a key={i} href={tk.href} className="text-ember-ink underline" {...(tk.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}>{tk.v}</a>
        : <span key={i}>{tk.v}</span>
    }
    if (!istilah.length) return <span key={i}>{tk.v}</span>
    return <span key={i}>{pecah(tk.v, istilah, sudah).map((p, j) => (typeof p === 'string' ? p : <Istilah key={j} teks={p.teks} data={p.g} {...lain} />))}</span>
  })
}

/** Teks polos per unit (paragraf, butir daftar, kutipan) tanpa tautan, untuk menentukan di mana istilah pertama muncul. */
const polos = (t) => parseInline(t).filter((x) => x.t !== 'tautan').map((x) => x.v).join(' ')

// Merender Markdown menjadi elemen React (tanpa HTML mentah).
// glosarium (opsional): [{ id, re, istilah, teks, artikel }] -> kemunculan pertama tiap istilah bisa diketuk.
// sisipan (opsional): fungsi (blok) => elemen yang ditaruh tepat setelah paragraf itu (widget perumpamaan).
export default function Markdown({ sumber, glosarium = [], sisipan, slugIni, labelArtikel = (s) => s }) {
  const blok = parseMarkdown(sumber)
  const iSumber = blok.findIndex((x) => x.tipe === 'h2' && /^(Sumber|Sources)$/i.test(x.teks)) // daftar rujukan tampil lebih kecil dan tenang
  // Tugaskan setiap istilah ke unit teks pertama yang memuatnya (di luar judul dan daftar sumber)
  const tugas = new Map()
  const dipakai = new Set()
  blok.forEach((b, i) => {
    if (iSumber >= 0 && i > iSumber) return
    const unit = b.tipe === 'ul' ? b.item.map((x, j) => [`${i}-${j}`, x]) : (b.tipe === 'p' || b.tipe === 'quote') ? [[`${i}`, b.teks]] : []
    for (const [k, t] of unit) {
      const isi = polos(t)
      const cocok = glosarium.filter((g) => !dipakai.has(g.id) && g.re.test(isi))
      cocok.forEach((g) => dipakai.add(g.id))
      if (cocok.length) tugas.set(k, cocok)
    }
  })
  const lain = { slugIni, labelArtikel }
  return (
    <div className="space-y-6 text-lg leading-[1.75]">
      {blok.map((b, i) => {
        if (b.tipe === 'ul' && iSumber >= 0 && i > iSumber) return <ul key={i} className="list-disc space-y-2.5 pl-6 text-[15px] leading-relaxed text-ink-2 marker:text-ink-2">{b.item.map((x, j) => <li key={j}><Inline teks={x} /></li>)}</ul>
        if (b.tipe === 'h2') return <h2 key={i} id={idBagian(b.teks)} className="scroll-mt-24 pb-1 pt-10 text-3xl font-bold leading-[1.2]">{b.teks}</h2>
        if (b.tipe === 'h3') return <h3 key={i} className="pb-0.5 pt-3 text-xl font-bold leading-snug">{b.teks}</h3>
        if (b.tipe === 'ul') return <ul key={i} className="list-disc space-y-1.5 pl-6">{b.item.map((x, j) => <li key={j}><Inline teks={x} istilah={tugas.get(`${i}-${j}`)} {...lain} /></li>)}</ul>
        if (b.tipe === 'quote') return <blockquote key={i} className="border-l-4 border-ember-ink pl-4 text-ink-2"><Inline teks={b.teks} istilah={tugas.get(`${i}`)} {...lain} /></blockquote>
        const ekstra = sisipan?.(b, i)
        const p = <p key={i}><Inline teks={b.teks} istilah={tugas.get(`${i}`)} {...lain} /></p>
        return ekstra ? [p, <div key={`s${i}`} className="not-prose">{ekstra}</div>] : p
      })}
    </div>
  )
}
