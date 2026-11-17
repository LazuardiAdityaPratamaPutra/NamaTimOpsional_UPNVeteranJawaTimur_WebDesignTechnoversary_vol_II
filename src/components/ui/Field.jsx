import { useId } from 'react'
import { CircleAlert } from 'lucide-react'

// Kolom form: label terhubung, petunjuk, dan pesan galat yang dibacakan pembaca layar
export default function Field({ label, error, hint, as: Tag = 'input', className = '', ...rest }) {
  const id = useId()
  const desc = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      <Tag id={id} aria-invalid={error ? true : undefined} aria-describedby={desc}
        className={`mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm ${error ? 'border-flame' : 'border-line'}`} {...rest} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-ink-2">{hint}</p>}
      {error && (
        <p id={`${id}-err`} className="mt-1 flex items-start gap-1.5 text-sm">
          <CircleAlert size={16} className="mt-0.5 shrink-0 text-flame" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  )
}
