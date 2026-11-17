import { Link } from 'react-router-dom'
import { ArrowUpRight, Clock } from 'lucide-react'
import { sampul } from '../data/sampul'
import { useTr } from '../i18n'

const Menit = ({ a, tr }) => <span className="inline-flex items-center gap-1.5 text-sm"><Clock size={13} aria-hidden="true" />{a.menit} {tr('menit', 'min')}</span>

// Bacaan pilihan sebagai bento: satu artikel utama berfoto besar, dua lainnya sebagai kartu mendatar yang ringkas.
export default function ArtikelKartu({ daftar }) {
  const tr = useTr()
  const [utama, ...lain] = daftar
  if (!utama) return null
  const fu = sampul(utama.slug)
  const tunggal = lain.length === 1 // hanya dua artikel terbit: kartu kedua mengisi tinggi penuh agar tak ada ruang kosong
  return (
    <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5" data-rv>
      <Link to={`/edukasi/${utama.slug}`} aria-label={`${tr('Baca', 'Read')}: ${utama.judul}`}
        className="hero-malam group relative isolate flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-3xl border border-line p-6 sm:p-8 lg:col-span-7 lg:row-span-2 lg:min-h-[30rem]">
        <img src={fu.src} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 -z-10 size-full object-cover transition-transform duration-[900ms] ease-snap group-hover:scale-105" style={{ objectPosition: fu.posisi }} />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-bg/95 via-bg/40 to-transparent" />
        <span className="mb-auto inline-flex w-fit items-center rounded-full bg-bg/80 px-3 py-1 text-xs font-semibold backdrop-blur-sm">{tr('Mulai dari sini', 'Start here')}</span>
        <span className="judul-display mt-16 block max-w-[14ch] text-4xl leading-[1.04] sm:text-5xl lg:text-6xl">{utama.judul}</span>
        <span className="mt-4 line-clamp-2 block max-w-md text-base leading-relaxed text-ink">{utama.ringkas}</span>
        <span className="mt-5 flex items-center justify-between text-ink-2"><Menit a={utama} tr={tr} />
          <span className="flex size-11 items-center justify-center rounded-full border border-ink-2/60 text-ink transition-[background-color,color,rotate] duration-300 ease-snap group-hover:rotate-45 group-hover:border-ember group-hover:bg-ember group-hover:text-on-ember"><ArrowUpRight size={20} aria-hidden="true" /></span>
        </span>
      </Link>
      {lain.map((a) => {
        const f = sampul(a.slug)
        return (
          <Link key={a.slug} to={`/edukasi/${a.slug}`} aria-label={`${tr('Baca', 'Read')}: ${a.judul}`}
            className={`group grid overflow-hidden rounded-3xl border border-line bg-surface transition-[border-color,translate] duration-300 ease-snap hover:-translate-y-1 hover:border-ember-ink lg:col-span-5 ${tunggal ? 'grid-rows-[12rem_minmax(0,1fr)] lg:row-span-2 lg:grid-rows-[minmax(0,1fr)_auto]' : 'grid-cols-[7rem_minmax(0,1fr)] sm:grid-cols-[10rem_minmax(0,1fr)]'}`}>
            <span className="relative block overflow-hidden" aria-hidden="true">
              <img src={f.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-snap group-hover:scale-110" style={{ objectPosition: f.posisi }} />
            </span>
            <span className={`flex min-w-0 flex-col gap-2 p-5 ${tunggal ? 'justify-end' : 'justify-center'}`}>
              <span className="judul-display text-2xl leading-[1.05] transition-colors duration-200 group-hover:text-ember-ink sm:text-3xl">{a.judul}</span>
              <span className="line-clamp-2 text-sm leading-relaxed text-ink-2">{a.ringkas}</span>
              <span className="flex items-center gap-1.5 text-ink-2"><Menit a={a} tr={tr} /></span>
            </span>
          </Link>
        )
      })}
    </div>
  )
}
