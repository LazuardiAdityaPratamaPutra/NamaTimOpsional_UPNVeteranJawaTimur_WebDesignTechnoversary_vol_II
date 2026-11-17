import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye } from 'lucide-react'
import { akhiriPratinjau } from '../lib/pratinjau'
import { useTr } from '../i18n'

/** Pita kecil saat admin melihat situs dalam mode pratinjau. */
export default function PitaPratinjau() {
  const tr = useTr()
  const navigate = useNavigate()
  return (
    <div role="region" aria-label={tr('Mode pratinjau admin', 'Admin preview mode')} className="fixed bottom-4 left-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-2xl border-2 border-ink bg-amber py-2 pl-3 pr-2 text-sm font-semibold text-[rgb(28_22_18)] shadow-[4px_4px_0_0_var(--text)]">
      <Eye size={16} aria-hidden="true" className="shrink-0" />
      <span className="leading-tight">{tr('Pratinjau: kamu melihat situs seperti pengunjung.', 'Preview: you are seeing the site as a visitor.')}</span>
      <button type="button" onClick={() => akhiriPratinjau(navigate)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-xl bg-[rgb(28_22_18)] px-3 text-[rgb(255_236_190)]"><ArrowLeft size={14} aria-hidden="true" />{tr('Dashboard', 'Dashboard')}</button>
    </div>
  )
}
