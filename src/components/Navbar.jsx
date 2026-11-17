import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, LogIn, LogOut } from 'lucide-react'
import { useApp } from './appContext'
import { useAuth } from './authContext'
import { useKamus, useTr } from '../i18n'
import { kurangiGerak } from '../lib/gerak'

const rute = [
  ['/', 'home'], ['/about', 'about'], ['/edukasi', 'edukasi'],
  ['/peta', 'peta'], ['/lapor', 'lapor'], ['/contact', 'contact'],
]

// Tombol masuk untuk pengunjung; untuk user yang sudah masuk: inisial, nama, dan tombol keluar.
function AkunMenu({ penuh = false, onPilih }) {
  const { sesi, keluar } = useAuth()
  const tr = useTr()
  if (!sesi) {
    return (
      <Link to="/masuk" onClick={onPilih} data-mag
        className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-ember-ink px-3 text-xs font-semibold text-on-ember transition-[filter,transform] duration-150 ease-snap hover:brightness-110 active:scale-[0.96] ${penuh ? 'w-full py-2.5 text-sm' : ''}`}>
        <LogIn size={15} aria-hidden="true" />{tr('Masuk', 'Sign in')}
      </Link>
    )
  }
  return (
    <div className={`flex items-center gap-1.5 ${penuh ? 'justify-between rounded-lg border border-line p-1.5' : ''}`}>
      <Link to={sesi.peran === 'admin' ? '/admin' : '/akun'} onClick={onPilih} title={sesi.email} className="flex items-center gap-2 rounded-lg py-0.5 pl-1 pr-2 text-xs font-semibold transition-colors duration-150 ease-snap hover:bg-ink/10">
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-canopy text-[13px] font-bold text-on-ember">{sesi.nama.trim()[0]?.toUpperCase()}</span>
        <span className={penuh ? '' : 'sr-only xl:not-sr-only'}>{sesi.nama.split(' ')[0]}</span><span className="sr-only">, {tr('akun saya', 'my account')}</span>
      </Link>
      <button type="button" onClick={() => { keluar(); onPilih?.() }} aria-label={tr('Keluar dari akun', 'Sign out')}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink-2 transition-[color,border-color,transform] duration-150 ease-snap hover:border-ember-ink hover:text-ink active:scale-[0.96]">
        <LogOut size={15} aria-hidden="true" /><span className="max-sm:hidden">{tr('Keluar', 'Sign out')}</span>
      </button>
    </div>
  )
}

// Pilihan bahasa: ID / EN. Pilihan disimpan dan atribut lang pada <html> ikut berubah.
export function BahasaToggle() {
  const { bahasa, setBahasa } = useApp()
  const tr = useTr()
  return (
    <div role="group" aria-label={tr('Bahasa', 'Language')} className="flex rounded-lg border border-line p-0.5">
      {[['id', 'Bahasa Indonesia'], ['en', 'English']].map(([b, nama]) => (
        <button key={b} onClick={() => setBahasa(b)} aria-pressed={bahasa === b} aria-label={`${b.toUpperCase()}: ${nama}`} lang={b}
          className={`min-h-8 rounded-md px-2 text-xs font-semibold transition-colors duration-150 ease-snap ${bahasa === b ? 'bg-ember-ink text-on-ember' : 'text-ink-2 hover:text-ink'}`}>
          {b.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

export function TemaToggle() {
  const { theme, setTheme } = useApp()
  const tr = useTr()
  const gelap = theme === 'dark'
  const ikon = 'absolute inset-0 transition-[rotate,scale,opacity] duration-500 ease-snap'
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? tr('Pakai tema terang', 'Use light theme') : tr('Pakai tema gelap', 'Use dark theme')}
      className="rounded-md p-2 text-ink-2 transition-[color,transform] duration-150 ease-snap hover:text-ink active:scale-[0.92]">
      {/* Dua ikon bertumpuk: yang keluar berputar mengecil, yang masuk berputar membesar */}
      <span aria-hidden="true" className="relative block size-5">
        <Sun size={20} className={`${ikon} ${gelap ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-50 opacity-0'}`} />
        <Moon size={20} className={`${ikon} ${gelap ? '-rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
      </span>
    </button>
  )
}

// Garis oranye yang meluncur ke tautan yang disorot kursor atau fokus, dan kembali ke halaman aktif saat dilepas.
// Posisi ditulis langsung ke elemen (tanpa render ulang) supaya geraknya tetap mulus.
function useGarisNav() {
  const ul = useRef(null), garis = useRef(null), sudah = useRef(false)
  const { pathname } = useLocation()
  const aktif = useCallback(() => ul.current?.querySelector('a[aria-current="page"]') ?? null, [])
  const taruh = useCallback((a, animasi = true) => {
    const g = garis.current, u = ul.current
    if (!g || !u) return
    const p = u.getBoundingClientRect()
    if (!a || !p.width) { g.style.opacity = '0'; return }
    const r = a.getBoundingClientRect()
    g.style.transition = animasi && sudah.current && !kurangiGerak() ? '' : 'none'
    g.style.opacity = '1'
    g.style.width = `${Math.max(r.width - 24, 8)}px`
    g.style.transform = `translateX(${r.left - p.left + 12}px)`
    sudah.current = true
  }, [])
  useEffect(() => { taruh(aktif()) }, [pathname, aktif, taruh]) // pindah halaman: garis meluncur ke tautan baru
  useEffect(() => {
    const u = ul.current
    if (!u || typeof ResizeObserver !== 'function') return
    const ro = new ResizeObserver(() => taruh(aktif(), false))
    ro.observe(u)
    document.fonts?.ready.then(() => taruh(aktif(), false))
    return () => ro.disconnect()
  }, [aktif, taruh])
  const sorot = (e) => { const a = e.target.closest?.('a'); if (a) taruh(a) }
  return { ul, garis, sorot, lepas: () => taruh(aktif()) }
}

export default function Navbar() {
  const [buka, setBuka] = useState(false)
  // Menu ponsel: Escape menutup dan mengembalikan fokus ke tombol menu (pola disclosure yang lazim)
  const tombolMenu = useRef(null)
  useEffect(() => {
    if (!buka) return undefined
    const tekan = (e) => { if (e.key === 'Escape') { setBuka(false); tombolMenu.current?.focus() } }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [buka])
  const { ul, garis, sorot, lepas } = useGarisNav()
  const kepala = useRef(null)
  // Bayangan tipis muncul di bawah bilah begitu halaman tergulir (tanpa mengubah tinggi, jadi isi tidak melompat)
  useEffect(() => {
    const ubah = () => kepala.current?.toggleAttribute('data-gulir', window.scrollY > 8)
    ubah(); window.addEventListener('scroll', ubah, { passive: true })
    return () => window.removeEventListener('scroll', ubah)
  }, [])
  const t = useKamus()
  const tr = useTr()
  const linkCls = ({ isActive }) =>
    `block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ease-snap ${isActive ? 'text-ember-ink' : 'text-ink-2 hover:text-ink'}`

  return (
    <header ref={kepala} className="sticky top-0 z-40 border-b border-line bg-bg/95 backdrop-blur-md transition-shadow duration-300 ease-snap data-[gulir]:shadow-[0_12px_24px_-18px_rgb(0_0_0/0.5)]">
      <nav aria-label={tr('Navigasi utama', 'Main navigation')} className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="mr-auto flex items-center gap-2 font-display text-xl font-extrabold [font-stretch:76%]">
          <img src="/icons/logo-pyraops.png" alt="" aria-hidden="true" className="h-9 w-auto" /> PyraOps
        </Link>
        <ul ref={ul} onPointerOver={sorot} onPointerLeave={lepas} onFocus={sorot} onBlur={lepas} className="relative hidden items-center lg:flex">
          {rute.map(([to, k]) => (
            <li key={to}><NavLink to={to} end={to === '/'} className={linkCls} data-tur={to === '/lapor' ? 'lapor' : undefined}>{t.nav[k]}</NavLink></li>
          ))}
          <li aria-hidden="true" ref={garis} className="pointer-events-none absolute bottom-0.5 left-0 h-0.5 rounded-full bg-ember-ink opacity-0 transition-[transform,width,opacity] duration-[380ms] ease-snap" />
        </ul>
        <BahasaToggle />
        <TemaToggle />
        <div className="max-lg:hidden"><AkunMenu /></div>
        <button ref={tombolMenu} onClick={() => setBuka(!buka)} aria-expanded={buka} aria-controls="menu-mobile"
          aria-label="Menu" className="rounded-md p-2 text-ink-2 lg:hidden">
          {buka ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {buka && (
        <div id="menu-mobile" className="menu-turun border-t border-line px-4 pb-4 lg:hidden">
          <ul className="py-2">
            {rute.map(([to, k]) => (
              <li key={to}><NavLink to={to} end={to === '/'} onClick={() => setBuka(false)} className={linkCls}>{t.nav[k]}</NavLink></li>
            ))}
          </ul>
          <AkunMenu penuh onPilih={() => setBuka(false)} />
        </div>
      )}
    </header>
  )
}
