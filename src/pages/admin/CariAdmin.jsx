import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, CornerDownLeft, FileText, Inbox, Languages, LayoutDashboard, LogOut, Map as PetaIkon, Moon, NotebookText, PencilLine, Search, Sun, X, Zap } from 'lucide-react'
import { useApp } from '../../components/appContext'
import { useAuth } from '../../components/authContext'
import { useAdmin, useArtikelSimpan } from '../../components/useAdmin'
import { useSinkron } from '../../components/syncContext'
import { gabungLaporan } from '../../lib/admin'
import { bangunIndeks, cari, GRUP, normal, pecah } from '../../lib/cariAdmin'
import { SEV } from './kit'
import { useBahasa, useTr } from '../../i18n'

const MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const IKON_HALAMAN = { '/admin': LayoutDashboard, '/admin/laporan': FileText, '/admin/peta': PetaIkon, '/admin/konten': NotebookText, '/admin/pesan': Inbox, '/admin/aktivitas': Activity }
const IKON_GRUP = { laporan: FileText, pesan: Inbox, konten: NotebookText, aksi: Zap }
const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Menandai bagian teks yang cocok dengan kata kunci (tanpa membedakan huruf besar/kecil).
function Tanda({ teks, token }) {
  if (!token.length) return teks
  const bagian = teks.split(new RegExp(`(${token.map(esc).join('|')})`, 'gi'))
  return bagian.map((p, i) => (i % 2 ? <mark key={i} className="rounded-sm bg-ember/25 px-px text-ink">{p}</mark> : p))
}

// Pencarian global di topbar admin: halaman, laporan, pesan, konten, dan aksi cepat dalam satu kolom (pola combobox + listbox).
export default function CariAdmin() {
  const tr = useTr()
  const b = useBahasa()
  const navigate = useNavigate()
  const { theme, setTheme, setBahasa } = useApp()
  const { keluar } = useAuth()
  const { pesan, tindak, konten } = useAdmin()
  const { laporan: dariDb } = useSinkron()
  const simpan = useArtikelSimpan()
  const [q, setQ] = useState('')
  const [buka, setBuka] = useState(false)
  const [aktif, setAktif] = useState(0)
  const [lipat, setLipat] = useState(false) // ponsel: kolom melebar menutupi topbar
  const input = useRef(null)
  const panel = useRef(null)
  const idPanel = useId()

  const TOPIK = { saran: tr('Saran', 'Suggestion'), galat: tr('Laporan galat', 'Bug report'), kolaborasi: tr('Kolaborasi', 'Collaboration'), lain: tr('Lainnya', 'Other') }
  const tingkat = Object.fromEntries(Object.entries(SEV).map(([k, v]) => [k, tr(v[0], v[1])]))
  const indeks = useMemo(
    () => bangunIndeks({ bahasa: b, laporan: gabungLaporan(dariDb ?? []), tindak, pesan, topik: TOPIK, ringkasanTingkat: tingkat }),
    // simpan dan konten tidak dipakai langsung, tetapi mengubah daftar artikel yang dibaca bangunIndeks
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [b, dariDb, tindak, pesan, simpan, konten],
  )
  const aksi = [
    { id: 'aksi-baru', grup: 'aksi', judul: tr('Tulis artikel baru', 'Write a new article'), ket: tr('Buka editor di Konten edukasi', 'Open the editor in Education content'), kata: normal('buat tambah baru artikel new create write'), ke: { to: '/admin/konten', state: { baru: true } } },
    { id: 'aksi-tema', grup: 'aksi', judul: theme === 'dark' ? tr('Pakai tema terang', 'Use light theme') : tr('Pakai tema gelap', 'Use dark theme'), ket: tr('Ganti tampilan', 'Switch appearance'), kata: normal('tema theme gelap terang dark light mode'), jalankan: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { id: 'aksi-bahasa', grup: 'aksi', judul: b === 'en' ? 'Bahasa Indonesia' : 'English', ket: tr('Ganti bahasa antarmuka', 'Switch interface language'), kata: normal('bahasa language english indonesia inggris'), jalankan: () => setBahasa(b === 'en' ? 'id' : 'en') },
    { id: 'aksi-keluar', grup: 'aksi', judul: tr('Keluar', 'Sign out'), ket: tr('Akhiri sesi admin', 'End the admin session'), kata: normal('keluar logout sign out'), jalankan: keluar },
  ]
  const hasil = cari(indeks, q, aksi)
  const n = hasil.length
  const idx = Math.min(aktif, Math.max(0, n - 1))
  const token = pecah(q)
  const idOpsi = (i) => `${idPanel}-o${i}`

  const tutup = () => { setBuka(false); setLipat(false) }
  const pilih = (butir) => {
    tutup(); setQ(''); setAktif(0); input.current?.blur()
    if (butir.jalankan) butir.jalankan()
    else navigate(butir.ke.to, { state: butir.ke.state })
  }

  // Pintasan global: Ctrl/⌘+K atau "/" (di luar kolom isian) memfokuskan pencarian
  useEffect(() => {
    const onKey = (e) => {
      const el = e.target
      const mengetik = el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
      const kombinasi = (e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey
      if (!kombinasi && !(e.key === '/' && !mengetik && !e.ctrlKey && !e.metaKey && !e.altKey)) return
      e.preventDefault()
      if (window.matchMedia?.('(max-width: 639px)').matches) setLipat(true)
      input.current?.focus()
      input.current?.select()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => { if (lipat) input.current?.focus() }, [lipat])
  useEffect(() => { if (buka) panel.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [idx, buka, q])

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      setBuka(true)
      if (n) setAktif((idx + (e.key === 'ArrowDown' ? 1 : n - 1)) % n)
    } else if (e.key === 'Enter') {
      if (buka && hasil[idx]) { e.preventDefault(); pilih(hasil[idx]) }
    } else if (e.key === 'Escape') {
      if (q) setQ('')
      else { tutup(); input.current?.blur() }
    } else if (e.key === 'Tab') setBuka(false)
  }

  const bagian = GRUP.map((g) => [g, hasil.filter((x) => x.grup === g)]).filter(([, s]) => s.length)
  const NAMA = { halaman: tr('Halaman', 'Pages'), aksi: tr('Aksi cepat', 'Quick actions'), laporan: tr('Laporan', 'Reports'), pesan: tr('Pesan', 'Messages'), konten: tr('Konten', 'Content') }
  const tampilPanel = buka

  return (
    <>
      <button type="button" onClick={() => setLipat(true)} aria-label={tr('Cari di dashboard', 'Search the dashboard')} aria-keyshortcuts="Control+K Meta+K /"
        className={`ml-auto flex size-10 items-center justify-center rounded-lg border border-line text-ink-2 transition-[color,border-color,scale] duration-150 ease-snap hover:border-ink-2 hover:text-ink active:scale-95 sm:hidden ${lipat ? 'hidden' : ''}`}>
        <Search size={18} aria-hidden="true" />
      </button>

      <div className={`${lipat ? 'max-sm:absolute max-sm:inset-0 max-sm:z-10 max-sm:flex max-sm:items-center max-sm:gap-2 max-sm:bg-bg max-sm:px-4' : 'max-sm:hidden'} sm:min-w-0 sm:max-w-md sm:flex-1`}>
        <div className="relative min-w-0 flex-1">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-2" />
          <input ref={input} type="text" role="combobox" name="cari-admin" autoComplete="off" spellCheck={false} enterKeyHint="go"
            aria-label={tr('Cari laporan, pesan, konten, atau halaman', 'Search reports, messages, content, or pages')}
            aria-expanded={tampilPanel && n > 0} aria-controls={tampilPanel && n > 0 ? idPanel : undefined} aria-autocomplete="list" aria-haspopup="listbox"
            aria-activedescendant={tampilPanel && n > 0 ? idOpsi(idx) : undefined} aria-keyshortcuts="Control+K Meta+K /"
            value={q} placeholder={tr('Cari laporan, pesan, konten…', 'Search reports, messages, content…')}
            onChange={(e) => { setQ(e.target.value); setAktif(0); setBuka(true) }} onFocus={() => setBuka(true)} onBlur={() => setBuka(false)} onKeyDown={onKeyDown}
            className="min-h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-14 text-sm text-ink placeholder:text-ink-2 transition-[border-color] duration-150 ease-snap hover:border-ink-2 focus:border-ember-ink" />
          {q ? (
            <button type="button" aria-label={tr('Hapus kata kunci', 'Clear search')} onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(''); setAktif(0); input.current?.focus() }}
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-2 transition-[color,scale] duration-150 ease-snap hover:text-ink active:scale-90"><X size={15} aria-hidden="true" /></button>
          ) : (
            <kbd aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-ink-2 lg:block">{MAC ? '⌘K' : 'Ctrl K'}</kbd>
          )}

          {tampilPanel && (
            <div ref={panel} onMouseDown={(e) => e.preventDefault()}
              className="menu-turun absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-[min(30rem,calc(100dvh-5.5rem))] w-[calc(100vw-2rem)] sembunyi-gulir overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-surface p-1.5 shadow-xl sm:w-[min(30rem,calc(100vw-9.5rem))]">
              {n > 0 ? (
                <div role="listbox" id={idPanel} aria-label={tr('Hasil pencarian', 'Search results')}>
                  {bagian.map(([g, daftar]) => (
                    <div key={g} role="group" aria-labelledby={`${idPanel}-g-${g}`} className="[&+&]:mt-1">
                      <p id={`${idPanel}-g-${g}`} className="m-0 px-2.5 pb-1 pt-2 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-ink-2">{NAMA[g]}{q && <span className="ml-1.5 tabular-nums">{daftar.length}</span>}</p>
                      {daftar.map((x) => {
                        const i = hasil.indexOf(x)
                        const Ikon = IKON_HALAMAN[x.ke?.to] && g === 'halaman' ? IKON_HALAMAN[x.ke.to] : x.id === 'aksi-baru' ? PencilLine : x.id === 'aksi-tema' ? (theme === 'dark' ? Sun : Moon) : x.id === 'aksi-bahasa' ? Languages : x.id === 'aksi-keluar' ? LogOut : (IKON_GRUP[g] ?? Search)
                        const on = i === idx
                        return (
                          <div key={x.id} id={idOpsi(i)} role="option" aria-selected={on} onClick={() => pilih(x)} onMouseMove={() => { if (!on) setAktif(i) }}
                            className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 transition-colors duration-100 ${on ? 'bg-ember/12 shadow-[inset_3px_0_0_var(--ember)]' : ''}`}>
                            <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${on ? 'border-ember-ink text-ember-ink' : 'border-line text-ink-2'}`}><Ikon size={16} /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink"><Tanda teks={x.judul} token={token} /></span>
                              {x.ket && <span className="block truncate text-xs text-ink-2"><Tanda teks={x.ket} token={token} /></span>}
                            </span>
                            {on && <CornerDownLeft size={14} aria-hidden="true" className="shrink-0 text-ink-2 max-sm:hidden" />}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 px-3 py-6 text-center text-sm text-ink-2">{tr(`Tidak ada hasil untuk “${q.trim()}”. Coba nama desa, nama pengirim, atau judul artikel.`, `No results for “${q.trim()}”. Try a village, a sender, or an article title.`)}</p>
              )}
              <p aria-hidden="true" className="m-0 mt-1 hidden items-center gap-3 border-t border-line px-2.5 pb-1 pt-2 text-[11px] text-ink-2 sm:flex">
                <span><kbd className="font-mono">↑↓</kbd> {tr('pilih', 'select')}</span><span><kbd className="font-mono">↵</kbd> {tr('buka', 'open')}</span><span><kbd className="font-mono">esc</kbd> {tr('tutup', 'close')}</span>
              </p>
            </div>
          )}
          <p role="status" className="sr-only">{buka && q.trim() ? (n ? tr(`${n} hasil`, `${n} results`) : tr('Tidak ada hasil', 'No results')) : ''}</p>
        </div>
        <button type="button" onClick={() => { setLipat(false); setBuka(false); setQ('') }} className="min-h-10 shrink-0 rounded-lg px-2 text-sm font-semibold text-ink-2 hover:text-ink sm:hidden">{tr('Batal', 'Cancel')}</button>
      </div>
    </>
  )
}
