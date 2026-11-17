import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button, Pill } from './ui'
import { ambilBriefing, labelAI, labelCadangan } from '../lib/briefing'
import { useTr } from '../i18n'

// Tombol "Buat Briefing": AI bila tersedia, templat lokal bila gagal atau lambat
export default function BriefingPanel({ payload }) {
  const tr = useTr()
  const kunci = JSON.stringify(payload) // memuat bahasa: ganti bahasa = ringkasan lama dianggap kedaluwarsa
  const [br, setBr] = useState(null) // { kunci, status, hasil }

  const buat = async () => {
    setBr({ kunci, status: 'memuat' })
    const hasil = await ambilBriefing(payload)
    setBr({ kunci, status: 'selesai', hasil })
  }
  const memuat = br?.status === 'memuat'
  const kadaluarsa = br?.status === 'selesai' && br.kunci !== kunci

  return (
    <section aria-label={tr('Briefing situasi', 'Situation briefing')} className="rounded-lg border border-line p-3">
      <h3 className="text-sm font-bold">{tr('Briefing situasi', 'Situation briefing')}</h3>
      <p className="mt-0.5 text-xs text-ink-2">{tr('Ringkasan bahasa awam dari hasil hitungan di atas.', 'A plain-language summary of the calculation above.')}</p>
      <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={buat} disabled={memuat}>
        <Sparkles size={14} aria-hidden="true" /> {memuat ? tr('Menyusun briefing…', 'Preparing briefing…') : br ? tr('Buat ulang briefing', 'Regenerate briefing') : tr('Buat briefing', 'Create briefing')}
      </Button>
      <div role="status" aria-live="polite">
        {memuat && <p className="mt-2 text-xs text-ink-2">{tr('Menghubungi asisten AI…', 'Contacting the AI assistant…')}</p>}
        {br?.status === 'selesai' && (
          <div className="mt-3 text-sm">
            {kadaluarsa && <p className="mb-2 text-xs text-ink-2">{tr('Skenario atau bahasa sudah berubah sejak briefing ini dibuat. Buat ulang untuk memperbarui.', 'The scenario or language has changed since this briefing was made. Regenerate it to update.')}</p>}
            <p className="whitespace-pre-line">{br.hasil.teks}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-2">
              {br.hasil.sumber === 'cadangan' && <Pill variant="offline">{tr('Mode cadangan', 'Fallback mode')}</Pill>}
              <span>{br.hasil.sumber === 'ai' ? labelAI(payload.bahasa) : labelCadangan(payload.bahasa)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
