import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export default function Accordion({ items }) {
  const id = useId()
  const [buka, setBuka] = useState(() => new Set())
  const ubah = (i) => setBuka((b) => { const n = new Set(b); if (n.has(i)) n.delete(i); else n.add(i); return n })

  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((it, i) => (
        <div key={it.judul}>
          <h3>
            <button onClick={() => ubah(i)} aria-expanded={buka.has(i)} aria-controls={`${id}-${i}`}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left font-medium">
              {it.judul}
              <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-ink-2 transition-transform ${buka.has(i) ? 'rotate-180' : ''}`} />
            </button>
          </h3>
          <div id={`${id}-${i}`} role="region" hidden={!buka.has(i)} className="px-4 pb-4 text-sm text-ink-2">{it.isi}</div>
        </div>
      ))}
    </div>
  )
}
