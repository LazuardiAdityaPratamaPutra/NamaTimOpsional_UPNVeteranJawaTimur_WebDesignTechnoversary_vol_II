import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Lock, UserRound } from 'lucide-react'
import { useAuth } from './authContext'
import { useTr } from '../i18n'

/** Pita kecil di halaman publik: untuk tamu mengajak masuk dan menyebut manfaatnya; untuk akun menegaskan data tersimpan di akun. */
export default function AjakMasuk({ manfaat, butir, className = '' }) {
  const { sesi } = useAuth()
  const { pathname } = useLocation()
  const tr = useTr()
  if (sesi) {
    return (
      <div role="status" className={`group relative isolate flex flex-wrap items-center gap-x-4 gap-y-3 overflow-hidden rounded-3xl border border-canopy/50 bg-surface p-4 text-ink sm:px-6 ${className}`}>
        <div aria-hidden="true" className="absolute -left-16 -top-20 -z-10 size-56 rounded-full bg-canopy/25 blur-3xl transition-[scale] duration-700 ease-snap group-hover:scale-125" />
        <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-canopy/15 text-canopy"><BadgeCheck size={22} /></span>
        <p className="m-0 min-w-[14rem] flex-1 text-base leading-snug"><span className="text-ink-2">{tr('Masuk sebagai', 'Signed in as')}</span> <strong className="text-lg font-bold">{sesi.nama}</strong><br /><span className="text-ink-2">{manfaat.sudah}</span></p>
        <Link to="/akun" className="group/btn inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line bg-bg/60 px-4 text-sm font-semibold text-ember-ink transition-[translate,background-color] duration-200 ease-snap hover:-translate-y-0.5 hover:bg-bg active:scale-95">
          {tr('Akun saya', 'My account')}<ArrowRight size={15} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover/btn:translate-x-1" />
        </Link>
      </div>
    )
  }
  return (
    <div className={`group relative isolate overflow-hidden rounded-3xl border border-line bg-surface p-5 text-ink sm:p-6 ${className}`}>
      <div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 size-64 rounded-full bg-ember/20 blur-3xl transition-[scale,opacity] duration-700 ease-snap group-hover:scale-125" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-ember/60 to-transparent" />
      <div className="grid items-center gap-x-6 gap-y-5 md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span aria-hidden="true" className="relative hidden size-16 items-center justify-center rounded-full bg-ink/10 text-ink md:flex">
          <UserRound size={26} />
          <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-ember text-on-ember"><Lock size={12} /></span>
        </span>
        <div className="min-w-0">
          <p className="m-0 text-lg leading-snug sm:text-xl"><strong className="font-bold">{tr('Kamu sedang sebagai tamu.', 'You are browsing as a guest.')}</strong> <span className="text-base text-ink-2 sm:text-lg">{manfaat.belum}</span></p>
          {butir?.length > 0 && (
            <ul className="m-0 mt-3.5 flex list-none flex-wrap gap-2 p-0">
              {butir.map(([Ik, label]) => (
                <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/60 px-3 py-1 text-xs font-semibold text-ink-2"><Ik size={13} aria-hidden="true" className="text-ember-ink" />{label}</li>
              ))}
            </ul>
          )}
        </div>
        <Link to="/masuk" state={{ next: pathname }} className="group/btn inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-ember px-6 font-semibold text-on-ember shadow-[0_12px_28px_-12px_var(--ember)] transition-[translate,filter,scale] duration-200 ease-snap hover:-translate-y-0.5 hover:brightness-110 active:scale-95">
          {tr('Masuk', 'Sign in')}<ArrowRight size={16} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}
