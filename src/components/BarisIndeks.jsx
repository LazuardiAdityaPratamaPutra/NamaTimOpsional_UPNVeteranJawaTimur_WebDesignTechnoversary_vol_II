import { Link } from 'react-router-dom'

// Baris indeks yang seluruhnya bisa diklik: judul, penjelasan, tujuan. Garis oranye tumbuh dari bawah saat disorot.
export default function BarisIndeks({ to, judul, teks, cta, ariaLabel, kompak = false, as: H = 'h3' }) {
  return (
    <Link to={to} aria-label={ariaLabel} className={`baris-indeks group relative grid gap-2 border-t border-line py-7 pl-5 transition-colors duration-150 ease-snap last:border-b hover:bg-surface ${kompak ? 'gap-3' : 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_8rem] md:items-baseline md:gap-8 md:pr-4'}`}>
      <span className="garis-indeks absolute inset-y-0 left-0 w-[3px] bg-ember-ink" aria-hidden="true" />
      <H className={`${kompak ? 'text-2xl' : 'text-3xl sm:text-4xl'} leading-none`}>{judul}</H>
      <p className="m-0 max-w-[56ch] text-base leading-relaxed text-ink-2">{teks}</p>
      <span className={`text-sm font-semibold text-ember-ink underline decoration-transparent underline-offset-4 transition-colors duration-150 ease-snap group-hover:decoration-current ${kompak ? '' : 'md:text-right'}`}>{cta}</span>
    </Link>
  )
}
