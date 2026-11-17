import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui'
import { useTr } from '../i18n'

// Tur terpandu buatan sendiri: sorotan elemen + kartu penjelasan.
// Tidak memblokir halaman (sorotan pointer-events: none) dan kartu tidak diletakkan di atas target.
export default function Tur({ aktif, langkah, steps, onLangkah, onTutup, onSelesai }) {
  const tr = useTr()
  const [rect, setRect] = useState(null)
  const kartu = useRef(null)
  const idJudul = useId()
  const idIsi = useId()
  const step = steps[langkah]

  // Pantau posisi target tiap frame: ikut bergeser saat panel muncul, berubah ukuran, atau di-scroll
  useEffect(() => {
    if (!aktif) return
    let raf, terakhir = '', sudahGulir = false
    const loop = () => {
      const el = document.querySelector(step.selector)
      let r = null
      if (el) {
        if (!sudahGulir) { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); sudahGulir = true }
        const b = el.getBoundingClientRect()
        if (b.width > 0 && b.height > 0) r = { top: b.top, left: b.left, width: b.width, height: b.height }
      }
      const kunci = r ? `${r.top | 0},${r.left | 0},${r.width | 0},${r.height | 0}` : 'x'
      if (kunci !== terakhir) { terakhir = kunci; setRect(r) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [aktif, step.selector])

  // Fokus berpindah ke kartu pada tiap langkah agar pembaca layar membacakan judul dan isinya
  useEffect(() => { if (aktif) kartu.current?.focus() }, [aktif, langkah])

  useEffect(() => {
    if (!aktif) return
    const tombol = (e) => { if (e.key === 'Escape') onTutup() }
    document.addEventListener('keydown', tombol)
    return () => document.removeEventListener('keydown', tombol)
  }, [aktif, onTutup])

  if (!aktif) return null

  const terakhirLangkah = langkah === steps.length - 1
  // Di layar kecil kartu menjauh dari target (target di atas -> kartu di bawah, dan sebaliknya)
  const kartuDiBawah = !rect || rect.top + rect.height / 2 < window.innerHeight / 2
  const posisi = `inset-x-3 ${kartuDiBawah ? 'bottom-3' : 'top-16'} md:inset-x-auto md:bottom-20 md:left-4 md:top-auto md:w-96`

  const onKey = (e) => {
    if (e.key === 'ArrowRight' && !terakhirLangkah) { e.preventDefault(); onLangkah(langkah + 1) }
    if (e.key === 'ArrowLeft' && langkah > 0) { e.preventDefault(); onLangkah(langkah - 1) }
  }

  return (
    <>
      {rect && (
        <div aria-hidden="true" className="pointer-events-none fixed z-[1500] rounded-xl transition-[top,left,width,height]"
          style={{
            top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12,
            boxShadow: '0 0 0 9999px color-mix(in srgb, var(--bg) 60%, transparent), 0 0 0 3px var(--ember-ink)',
          }} />
      )}
      <div ref={kartu} role="dialog" aria-modal="false" aria-labelledby={idJudul} aria-describedby={idIsi} tabIndex={-1} onKeyDown={onKey}
        className={`fixed z-[1600] rounded-xl border border-line bg-surface p-4 shadow-xl ${posisi}`}>
        <p className="font-mono text-xs text-ink-2">{tr(`Langkah ${langkah + 1} dari ${steps.length}`, `Step ${langkah + 1} of ${steps.length}`)}</p>
        <h2 id={idJudul} className="mt-1 text-lg font-bold">{step.judul}</h2>
        <p id={idIsi} className="mt-1 text-sm text-ink-2">{step.isi}</p>
        {step.tautan && (
          <Link to={step.tautan.ke} onClick={onSelesai} className="mt-2 inline-block text-sm font-semibold text-ember-ink underline">{step.tautan.label}</Link>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onTutup}>{tr('Lewati', 'Skip')}</Button>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={langkah === 0} onClick={() => onLangkah(langkah - 1)}>{tr('Kembali', 'Back')}</Button>
            <Button size="sm" onClick={() => (terakhirLangkah ? onSelesai() : onLangkah(langkah + 1))}>{terakhirLangkah ? tr('Selesai', 'Done') : tr('Lanjut', 'Next')}</Button>
          </div>
        </div>
      </div>
    </>
  )
}
