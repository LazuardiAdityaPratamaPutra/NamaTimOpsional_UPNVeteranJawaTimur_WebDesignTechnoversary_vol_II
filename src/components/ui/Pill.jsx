import { useTr } from '../../i18n'

// Pill status: selalu memuat teks, jadi tidak bergantung pada warna saja
const VARIAN = {
  online: { cls: 'border-canopy bg-canopy/15', dot: 'bg-canopy', label: ['Online', 'Online'] },
  offline: { cls: 'border-amber bg-amber/15', dot: 'bg-amber', label: ['Offline', 'Offline'] },
  kritis: { cls: 'border-flame bg-flame/15', dot: 'bg-flame', label: ['Kritis', 'Critical'] },
  tinggi: { cls: 'border-ember bg-ember/15', dot: 'bg-ember', label: ['Tinggi', 'High'] },
  waspada: { cls: 'border-amber bg-amber/15', dot: 'bg-amber', label: ['Waspada', 'Watch'] },
  pending: { cls: 'border-amber bg-amber/15', dot: 'bg-amber', label: ['Menunggu', 'Pending'] },
  synced: { cls: 'border-canopy bg-canopy/15', dot: 'bg-canopy', label: ['Tersinkron', 'Synced'] },
  gagal: { cls: 'border-flame bg-flame/15', dot: 'bg-flame', label: ['Gagal', 'Failed'] },
}

export default function Pill({ variant, children }) {
  const tr = useTr()
  const v = VARIAN[variant]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${v.cls}`}>
      <span className={`size-1.5 rounded-full ${v.dot}`} aria-hidden="true" />
      {children ?? tr(...v.label)}
    </span>
  )
}
