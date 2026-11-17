// Gerak: hanya properti yang berubah yang ditransisikan (tanpa transition-all). Tekan = scale .97 dalam 150ms.
const VARIAN = {
  primary: 'bg-ember-ink text-on-ember shadow-sm hover:brightness-110',
  secondary: 'border border-line bg-surface text-ink hover:border-ember-ink/60 hover:bg-line/30',
  ghost: 'text-ink-2 hover:bg-line/50 hover:text-ink',
}
const UKURAN = { md: 'min-h-11 px-5 py-2.5 text-sm', sm: 'min-h-9 px-3 py-1.5 text-sm' }

// Tombol: primary, secondary, ghost. `as` memungkinkan Link atau a.
export default function Button({ as: Tag = 'button', variant = 'primary', size = 'md', className = '', ...rest }) {
  const tipe = Tag === 'button' ? { type: rest.type ?? 'button' } : {}
  return (
    <Tag {...tipe} data-mag {...rest}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-[background-color,border-color,color,filter,transform] duration-150 ease-snap active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 ${VARIAN[variant]} ${UKURAN[size]} ${className}`} />
  )
}
