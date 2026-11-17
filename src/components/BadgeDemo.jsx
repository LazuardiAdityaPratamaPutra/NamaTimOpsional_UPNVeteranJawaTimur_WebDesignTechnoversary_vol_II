import { useTr } from '../i18n'

// Lencana wajib pada semua panel data (demo / ilustrasi / arsip)
export default function BadgeDemo({ children }) {
  const tr = useTr()
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber bg-amber/15 px-2 py-0.5 text-xs font-medium text-ink">
      <span className="size-1.5 rounded-full bg-amber" aria-hidden="true" />
      {children ?? tr('Data demo', 'Demo data')}
    </span>
  )
}
