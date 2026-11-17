import { useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useTr } from '../i18n'
import { useGesek } from '../lib/interaksi'

// Lightbox buatan sendiri di atas <dialog>: fokus terkunci, Esc menutup, panah kiri/kanan berpindah.
export default function Lightbox({ item, indeks, total, onClose, onPrev, onNext, children }) {
  const ref = useRef(null)
  const tr = useTr()
  const gesek = useGesek(() => onNext(), () => onPrev())
  useEffect(() => {
    const d = ref.current
    if (item && !d.open) d.showModal()
    if (!item && d.open) d.close()
  }, [item])

  const tombol = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); onPrev() }
    if (e.key === 'ArrowRight') { e.preventDefault(); onNext() }
  }

  return (
    <dialog ref={ref} onClose={onClose} onKeyDown={tombol} aria-label={item ? `${tr('Gambar', 'Image')}: ${item.judul}` : tr('Gambar', 'Image')}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[min(94vw,64rem)] rounded-xl border border-line bg-surface p-0 text-ink overscroll-contain backdrop:bg-ink/60">
      {item && (
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{item.judul}</h2>
            <button onClick={onClose} aria-label={tr('Tutup', 'Close')} className="rounded-md p-1.5 text-ink-2 hover:text-ink"><X size={18} /></button>
          </div>
          <div key={indeks} {...gesek} className="lb-ganti mt-3 touch-pan-y select-none">{children}</div>
          <p className="mt-3 text-sm">{item.keterangan}</p>
          <p className="mt-1 text-xs text-ink-2">{item.atribusi} · {tr('Lisensi', 'License')}: {item.lisensi}</p>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={onPrev} aria-label={tr('Gambar sebelumnya', 'Previous image')} className="rounded-md border border-line p-2 hover:border-ember-ink"><ChevronLeft size={18} /></button>
            <span className="font-mono text-xs text-ink-2" aria-live="polite">{tr(`${indeks + 1} dari ${total}`, `${indeks + 1} of ${total}`)}</span>
            <button onClick={onNext} aria-label={tr('Gambar berikutnya', 'Next image')} className="rounded-md border border-line p-2 hover:border-ember-ink"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </dialog>
  )
}
