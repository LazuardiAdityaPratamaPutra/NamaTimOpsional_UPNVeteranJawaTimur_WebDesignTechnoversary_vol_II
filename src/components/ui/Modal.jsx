import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import { useTr } from '../../i18n'

// Modal memakai elemen <dialog> bawaan: fokus terkunci, Esc menutup, latar di-inert oleh browser
export default function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)
  const id = useId()
  const tr = useTr()
  useEffect(() => {
    const d = ref.current
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby={id}
      onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto w-[min(92vw,32rem)] rounded-xl border border-line bg-surface p-0 text-ink backdrop:bg-ink/50">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={id} className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} aria-label={tr('Tutup', 'Close')} className="rounded-md p-1.5 text-ink-2 hover:text-ink"><X size={18} /></button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  )
}
