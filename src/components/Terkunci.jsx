import { Link, useLocation } from 'react-router-dom'
import { ArrowUpRight, Lock } from 'lucide-react'
import { useTr } from '../i18n'

/** Pengganti isi tab yang perlu akun: menjelaskan apa yang terkunci dan membawa tamu masuk lalu kembali ke tab ini. */
export default function Terkunci({ alasan, judul, isi, ikon: Ikon, h1 = false }) {
  const tr = useTr()
  const { pathname, search } = useLocation()
  const Judul = h1 ? 'h1' : 'h2'
  return (
    <div className="grid items-center gap-8 border-y border-line py-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-10 md:py-14">
      <span aria-hidden="true" className="relative flex size-20 items-center justify-center rounded-full border border-ink-2/40 text-ink">
        <Ikon size={32} /><span className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full bg-ember text-on-ember"><Lock size={15} /></span>
      </span>
      <div>
        <Judul className="judul-display m-0 text-4xl leading-none sm:text-5xl">{judul}</Judul>
        <p className="m-0 mt-3 max-w-[52ch] text-base leading-relaxed text-ink-2">{isi}</p>
      </div>
      <Link to="/masuk" state={{ next: pathname + search, alasan }} className="group/btn inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ember px-8 text-lg font-bold text-on-ember transition-[translate,filter,scale] duration-200 ease-snap hover:-translate-y-0.5 hover:brightness-110 active:scale-95">
        {tr('Masuk untuk membuka', 'Sign in to unlock')}<ArrowUpRight size={18} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
      </Link>
    </div>
  )
}
