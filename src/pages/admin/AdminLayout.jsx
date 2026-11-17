import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { Activity, ChevronsLeft, FileText, Inbox, LayoutDashboard, LogOut, Map as PetaIkon, NotebookText } from 'lucide-react'
import { useAuth } from '../../components/authContext'
import { useAdmin } from '../../components/useAdmin'
import { useSinkron } from '../../components/syncContext'
import { BahasaToggle, TemaToggle } from '../../components/Navbar'
import { gabungLaporan, statusTindak } from '../../lib/admin'
import { useBahasa, useTr } from '../../i18n'
import CariAdmin from './CariAdmin'

// Jam WIB yang berdetak tiap 30 detik, untuk bilah status "ruang kendali".
function useJam() {
  const [t, setT] = useState(Date.now)
  useEffect(() => { const i = setInterval(() => setT(Date.now()), 30_000); return () => clearInterval(i) }, [])
  return t
}

const KUNCI_REL = 'pyraops-admin-rel'
// Rel navigasi bisa dilipat jadi deretan ikon; pilihan diingat di perangkat. Pintasan: tombol [ (di luar kolom isian).
function useRel() {
  const [tutup, setTutup] = useState(() => { try { return localStorage.getItem(KUNCI_REL) === 'tutup' } catch { return false } })
  const alih = () => setTutup((v) => { const n = !v; try { localStorage.setItem(KUNCI_REL, n ? 'tutup' : 'buka') } catch { /* abaikan */ } return n })
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '[' || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target
      if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      alih()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return [tutup, alih]
}

// Kerangka dashboard: rel navigasi tetap di desktop, bar tab di bawah pada ponsel. Satu elemen <nav> untuk keduanya.
export default function AdminLayout() {
  const tr = useTr()
  const b = useBahasa()
  const { sesi, keluar } = useAuth()
  const { pesan, tindak } = useAdmin()
  const { online, laporan: dariDb, antrean } = useSinkron()
  const t = useJam()
  const [tutup, alih] = useRel()
  const { pathname } = useLocation()
  const belumBaca = pesan.filter((p) => !p.baca).length
  const baru = gabungLaporan(dariDb ?? []).filter((r) => statusTindak(r.id, tindak) === 'baru').length
  const menu = [
    ['/admin', LayoutDashboard, tr('Ringkasan', 'Overview'), tr('Ringkasan', 'Overview'), true],
    ['/admin/laporan', FileText, tr('Laporan', 'Reports'), tr('Laporan', 'Reports'), false, baru],
    ['/admin/peta', PetaIkon, tr('Peta risiko', 'Risk map'), tr('Peta', 'Map')],
    ['/admin/konten', NotebookText, tr('Konten edukasi', 'Education content'), tr('Konten', 'Content')],
    ['/admin/pesan', Inbox, tr('Pesan', 'Messages'), tr('Pesan', 'Inbox'), false, belumBaca],
    ['/admin/aktivitas', Activity, tr('Aktivitas', 'Activity'), tr('Log', 'Log')],
  ]
  const jam = new Date(t).toLocaleTimeString(b === 'en' ? 'en-GB' : 'id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }).replace('.', ':')

  const aktif = Math.max(0, menu.findIndex(([to, , , , end]) => (end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`))))
  const awal = sesi?.nama?.trim()[0]?.toUpperCase()
  // Teks yang menyusut ke nol lebarnya saat rel dilipat
  const teks = `overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 ease-snap max-lg:hidden ${tutup ? 'max-w-0 opacity-0' : 'max-w-44 opacity-100'}`

  return (
    <div className="min-h-dvh bg-bg" style={{ '--rel': tutup ? '4.75rem' : '16rem' }}>
      <aside id="rel-admin" data-tutup={tutup ? 'ya' : undefined} className="transition-[width] duration-300 ease-snap lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[var(--rel)] lg:flex-col lg:border-r lg:border-line lg:bg-band lg:px-3 lg:py-4 max-lg:contents">
        {/* Pegangan di tepi rel: melipat/membuka, ikon berbalik arah */}
        <button type="button" onClick={alih} aria-expanded={!tutup} aria-controls="rel-admin" aria-keyshortcuts="["
          aria-label={tutup ? tr('Buka rel navigasi', 'Expand navigation rail') : tr('Lipat rel navigasi', 'Collapse navigation rail')}
          className="group/lipat absolute -right-3.5 top-7 z-10 hidden size-7 items-center justify-center rounded-full border border-line bg-surface text-ink-2 shadow-sm transition-[color,border-color,scale] duration-200 ease-snap hover:border-ember-ink hover:text-ember-ink active:scale-90 lg:flex">
          <ChevronsLeft size={15} aria-hidden="true" className={`transition-transform duration-500 ease-snap ${tutup ? 'rotate-180' : ''}`} />
          <span role="tooltip" className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-semibold text-bg opacity-0 transition-opacity duration-150 group-hover/lipat:opacity-100 group-focus-visible/lipat:opacity-100">{tutup ? tr('Buka', 'Expand') : tr('Lipat', 'Collapse')} <kbd className="ml-1 rounded bg-bg/20 px-1 font-mono">[</kbd></span>
        </button>

        <Link to="/admin" className="mb-6 mt-1 flex items-center gap-3 px-1.5 font-display text-2xl font-extrabold [font-stretch:76%] max-lg:hidden">
          <img src="/icons/logo-pyraops.png" alt="" aria-hidden="true" className="h-11 w-auto shrink-0 transition-transform duration-300 ease-snap hover:rotate-6" />
          <span className={`leading-none ${teks}`}>PyraOps<span className="mt-1 block font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-ember-ink [font-stretch:100%]">{tr('Ruang kendali', 'Control room')}</span></span>
        </Link>

        <nav aria-label={tr('Navigasi dashboard', 'Dashboard navigation')} className="max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-40 max-lg:border-t max-lg:border-line max-lg:bg-bg/95 max-lg:pb-[env(safe-area-inset-bottom)] max-lg:backdrop-blur-md">
          <ul className="relative m-0 grid list-none grid-cols-6 gap-0.5 p-1 lg:grid-cols-1 lg:p-0" style={{ '--i': aktif }}>
            {/* Sorotan yang meluncur ke menu aktif (desktop): tinggi baris 2.75rem + jarak 0.125rem */}
            <span aria-hidden="true" className="pointer-events-none absolute left-0 top-0 hidden h-11 w-full rounded-xl bg-ember/12 shadow-[inset_3px_0_0_var(--ember)] transition-transform duration-500 ease-snap [transform:translateY(calc(var(--i)*2.875rem))] lg:block" />
            {menu.map(([to, Ikon, label, pendek, end, lencana]) => (
              <li key={to}>
                <NavLink to={to} end={end}
                  className={({ isActive }) => `group relative flex items-center gap-3 rounded-xl text-[11px] font-semibold transition-[color] duration-200 ease-snap max-lg:min-h-14 max-lg:flex-col max-lg:justify-center max-lg:gap-0.5 lg:h-11 lg:px-[0.9rem] lg:text-sm ${isActive ? 'text-ink' : 'text-ink-2 hover:text-ink'}`}>
                  {({ isActive }) => (
                    <>
                      <span aria-hidden="true" className={`absolute rounded-full bg-ember transition-[scale,opacity] duration-300 ease-snap max-lg:inset-x-4 max-lg:top-0 max-lg:h-0.5 lg:hidden ${isActive ? 'opacity-100' : 'scale-0 opacity-0'}`} />
                      <span className="relative shrink-0">
                        <Ikon size={20} aria-hidden="true" className={`transition-[color,transform] duration-300 ease-snap lg:group-hover:scale-110 ${isActive ? 'text-ember-ink' : ''}`} />
                        {lencana > 0 && <span aria-hidden="true" className={`absolute -right-2 -top-1.5 min-w-4 rounded-full bg-flame px-1 text-center text-[11px] font-bold leading-4 text-on-ember ${tutup ? '' : 'lg:hidden'}`}>{lencana}</span>}
                      </span>
                      <span className="lg:hidden">{pendek}</span>
                      <span className={`max-lg:hidden ${teks}`}>{label}</span>
                      {lencana > 0 && <span className="sr-only"> ({lencana})</span>}
                      {lencana > 0 && <span aria-hidden="true" className={`ml-auto min-w-5 rounded-full bg-flame px-1.5 text-center text-[11px] font-bold leading-5 text-on-ember transition-opacity duration-200 max-lg:hidden ${tutup ? 'hidden' : ''}`}>{lencana}</span>}
                      {/* Tooltip saat rel terlipat */}
                      {tutup && <span role="tooltip" aria-hidden="true" style={{ transitionDelay: '80ms' }} className="pointer-events-none absolute left-full ml-4 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-bg opacity-0 shadow-lg transition-[opacity,translate] duration-150 [translate:-4px_0] group-hover:opacity-100 group-hover:[translate:0] group-focus-visible:opacity-100 group-focus-visible:[translate:0] lg:block">{label}{lencana > 0 ? ` · ${lencana}` : ''}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto flex flex-col gap-3 max-lg:hidden">
          <p className={`m-0 flex items-start gap-2 px-1.5 text-xs leading-relaxed text-ink-2 ${teks} ${tutup ? 'max-h-0' : 'max-h-24'}`}><span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber" /><span className="whitespace-normal">{tr('Mode demo: data laporan, pesan, dan status tersimpan di perangkat ini.', 'Demo mode: report data, messages, and statuses are kept on this device.')}</span></p>
          <div className={`flex items-center gap-3 rounded-2xl border border-line bg-bg p-2 ${tutup ? "flex-col gap-2" : ""}`}>
            <span aria-hidden="true" title={sesi?.nama} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canopy text-base font-bold text-on-ember">{awal}</span>
            <span className={`min-w-0 flex-1 ${teks} ${tutup ? "hidden" : ""}`}><span className="block truncate text-sm font-semibold">{sesi?.nama}</span><span className="block truncate text-xs text-ink-2">{sesi?.email}</span></span>
            <button type="button" onClick={keluar} aria-label={tr('Keluar', 'Sign out')} title={tr('Keluar', 'Sign out')} className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line text-ink-2 transition-[color,border-color,scale] duration-150 ease-snap hover:border-flame hover:text-flame active:scale-90"><LogOut size={16} aria-hidden="true" /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 transition-[padding] duration-300 ease-snap lg:pl-[var(--rel)]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur-md sm:px-6 xl:px-10">
          <Link to="/admin" className="flex items-center gap-2 font-display text-xl font-extrabold [font-stretch:76%] lg:hidden"><img src="/icons/logo-pyraops.png" alt="" aria-hidden="true" className="h-8 w-auto" />PyraOps</Link>
          <p className="m-0 hidden items-center gap-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 xl:flex" aria-label={tr('Status sistem', 'System status')}>
            <span className="flex items-center gap-2 text-ink"><span aria-hidden="true" className="relative flex size-2"><span className="absolute inset-0 rounded-full bg-canopy opacity-70 motion-safe:animate-ping" /><span className="relative size-2 rounded-full bg-canopy" /></span>{tr('Demo aktif', 'Demo live')}</span>
            <span>{jam} WIB</span>
            <span className={online ? '' : 'text-amber'}>{online ? 'Online' : 'Offline'}{antrean > 0 ? ` · ${antrean}` : ''}</span>
          </p>
          <CariAdmin />
          <div className="flex items-center gap-2 sm:ml-auto">
            <BahasaToggle />
            <TemaToggle />
            <button type="button" onClick={keluar} aria-label={tr('Keluar', 'Sign out')} className="flex size-9 items-center justify-center rounded-lg border border-line text-ink-2 transition-[color,border-color] duration-150 ease-snap hover:border-flame hover:text-flame lg:hidden"><LogOut size={16} aria-hidden="true" /></button>
          </div>
        </header>
        <main id="utama" className="min-w-0 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:pb-12 xl:px-10"><div key={pathname} className="admin-masuk"><Outlet /></div></main>
      </div>
    </div>
  )
}
