import { useId } from 'react'

// Tab dengan navigasi keyboard: panah kiri/kanan, Home, End
export default function Tabs({ label, tabs, value, onChange, className = '' }) {
  const id = useId()
  const idx = tabs.findIndex((t) => t.id === value)
  const aktif = tabs[idx]

  const onKey = (e) => {
    const arah = { ArrowRight: (idx + 1) % tabs.length, ArrowLeft: (idx - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }
    const n = arah[e.key]
    if (n === undefined) return
    e.preventDefault()
    onChange(tabs[n].id)
    document.getElementById(`${id}-tab-${tabs[n].id}`)?.focus()
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="flex gap-1 rounded-lg border border-line p-0.5 text-sm">
        {tabs.map((t) => (
          <button key={t.id} id={`${id}-tab-${t.id}`} role="tab" aria-selected={t.id === value}
            aria-controls={`${id}-panel`} tabIndex={t.id === value ? 0 : -1} onClick={() => onChange(t.id)}
            className={`min-h-9 flex-1 rounded-md py-2 font-medium ${t.id === value ? 'bg-ember-ink text-on-ember' : 'text-ink-2 hover:text-ink'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div key={value} id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${value}`} className="tab-ganti mt-3">
        {aktif?.panel}
      </div>
    </div>
  )
}
