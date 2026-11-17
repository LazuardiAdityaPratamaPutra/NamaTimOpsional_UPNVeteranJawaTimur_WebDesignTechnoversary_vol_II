import { Suspense } from 'react'
import { lazyRetry } from './lib/lazyRetry'
import { useEffect } from 'react'
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './components/authContext'
import Navbar from './components/Navbar'
import ErrorBoundary from './components/ErrorBoundary'
import { Button } from './components/ui'
import { useJudul } from './lib/useJudul'
import { useTr } from './i18n'
import { kurangiGerak } from './lib/gerak'
import Terkunci from './components/Terkunci'
import { Siren, Target } from 'lucide-react'
import Footer from './components/Footer'
import AsapKursor from './components/AsapKursor'
import ProgresGulir from './components/ProgresGulir'
import KeAtas from './components/KeAtas'
import ChatEdukasi from './components/ChatEdukasi'
import PitaPratinjau from './components/PitaPratinjau'
import { sedangPratinjau } from './lib/pratinjau'
import { useMunculSaatGulir, useKursorInteraktif, useGulirVars } from './lib/interaksi'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'

// Peta dimuat lazy supaya bundel awal kecil (target < 250 KB gzip)
const Peta = lazyRetry(() => import('./pages/Peta'))
const Lapor = lazyRetry(() => import('./pages/Lapor'))
const Edukasi = lazyRetry(() => import('./pages/Edukasi'))
const ArtikelDetail = lazyRetry(() => import('./pages/ArtikelDetail'))
const KuisGame = lazyRetry(() => import('./pages/KuisGame'))
const Patroli = lazyRetry(() => import('./pages/Patroli'))
const Styleguide = lazyRetry(() => import('./pages/Styleguide'))
const Masuk = lazyRetry(() => import('./pages/Masuk'))
const Akun = lazyRetry(() => import('./pages/Akun'))
const AdminLayout = lazyRetry(() => import('./pages/admin/AdminLayout'))
const Ringkasan = lazyRetry(() => import('./pages/admin/Ringkasan'))
const LaporanAdmin = lazyRetry(() => import('./pages/admin/Laporan'))
const PetaAdmin = lazyRetry(() => import('./pages/admin/PetaAdmin'))
const KontenAdmin = lazyRetry(() => import('./pages/admin/Konten'))
const PesanAdmin = lazyRetry(() => import('./pages/admin/Pesan'))
const Aktivitas = lazyRetry(() => import('./pages/admin/Aktivitas'))

// Gulir ke atas saat pindah halaman, atau ke bagian #hash bila ada
function GulirOtomatis() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: kurangiGerak() ? 'auto' : 'smooth' })
    else window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}

function HalamanTerkunci({ alasan }) {
  const tr = useTr()
  const [ikon, judul, isi] = alasan === 'lapor'
    ? [Siren, tr('Lapor titik api khusus pengguna masuk', 'Reporting a fire point needs an account'), <>{tr('Masuk dulu agar laporanmu tercatat di akunmu dan bisa kamu pantau statusnya.', 'Sign in so your report is saved to your account and you can follow its status.')} <a href="tel:112" className="font-bold text-ember-ink underline underline-offset-4">{tr('Bahaya langsung? Telepon 112 sekarang, tanpa masuk.', 'Immediate danger? Call 112 now, no sign-in needed.')}</a></>]
    : [Target, tr('Kuis khusus pengguna masuk', 'The quiz is for signed-in users'), tr('Masuk untuk memainkan kuis dan menyimpan skormu di akun.', 'Sign in to play the quiz and keep your score on your account.')]
  useJudul(judul)
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-6xl flex-col justify-center px-4 py-12">
      <Terkunci h1 alasan={alasan} ikon={ikon} judul={judul} isi={isi} />
    </section>
  )
}

function NotFound() {
  const tr = useTr()
  useJudul(tr('Halaman tidak ditemukan', 'Page not found'))
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{tr('Halaman tidak ditemukan', 'Page not found')}</h1>
      <p className="mt-2 text-ink-2">{tr('Alamat yang kamu tuju tidak ada atau sudah dipindahkan.', 'The address you requested does not exist or has been moved.')}</p>
      <Button as={Link} to="/" className="mt-5">{tr('Kembali ke beranda', 'Back to home')}</Button>
    </section>
  )
}

export default function App() {
  const { pathname } = useLocation()
  const { admin, sesi, sambut, tutupSambut } = useAuth()
  const tr = useTr()
  useMunculSaatGulir(pathname)
  useGulirVars(pathname)
  useKursorInteraktif()
  // Selama halaman dimuat, wadahnya tetap setinggi layar agar footer tidak muncul lalu melompat turun (layout shift).
  // Kuis tampil sebagai lapisan layar penuh (fixed) sehingga tak memberi tinggi pada <main>; fallback-nya harus sama agar footer tidak melompat.
  const muat = <div className={(pathname === '/kuis' || pathname === '/patroli') ? 'fixed inset-0 z-[100] bg-bg p-8' : 'min-h-[100svh] p-8'} role="status"><p className="m-0 text-ink-2">{tr('Memuat…', 'Loading…')}</p></div>

  // Muat bagian halaman yang sering dibuka saat peramban sedang menganggur, supaya berpindah halaman terasa langsung.
  // Peta (Leaflet) sengaja tidak ikut: berat, dan hanya dibuka sebagian pengunjung.
  useEffect(() => {
    const muatDulu = () => { [() => import('./pages/Lapor'), () => import('./pages/Edukasi'), () => import('./pages/KuisGame'), () => import('./pages/Masuk'), () => import('./pages/Akun')].forEach((f) => f().catch(() => {})) }
    if (navigator.connection?.saveData) return
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(muatDulu, { timeout: 4000 }) : window.setTimeout(muatDulu, 2500)
    return () => { if ('cancelIdleCallback' in window) window.cancelIdleCallback(id); else window.clearTimeout(id) }
  }, [])

  // Muat bagian halaman begitu kursor/jari mendekati tautannya (hover, fokus, sentuh), sebelum diklik. Termasuk Peta yang berat.
  useEffect(() => {
    const PRA = { '/peta': () => import('./pages/Peta'), '/lapor': () => import('./pages/Lapor'), '/edukasi': () => import('./pages/Edukasi'), '/kuis': () => import('./pages/KuisGame'), '/patroli': () => import('./pages/Patroli'), '/masuk': () => import('./pages/Masuk'), '/akun': () => import('./pages/Akun') }
    const dekat = (e) => {
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!a || a.origin !== window.location.origin || navigator.connection?.saveData) return
      const f = a.pathname.startsWith('/edukasi/') ? () => import('./pages/ArtikelDetail') : PRA[a.pathname]
      f?.().catch(() => {})
    }
    const ev = ['pointerover', 'focusin', 'touchstart']
    ev.forEach((n) => document.addEventListener(n, dekat, { passive: true }))
    return () => ev.forEach((n) => document.removeEventListener(n, dekat))
  }, [])

  useEffect(() => { if (pathname !== '/masuk') tutupSambut() }, [pathname, tutupSambut]) // sambutan hanya hidup di /masuk

  // Admin hanya punya dashboard: situs publik diarahkan ke sana. Selain admin tidak boleh membuka /admin.
  // Pengecualian: mode pratinjau dari dashboard Konten (admin melihat situs seperti pengunjung, dengan pita "Kembali ke dashboard").
  const pratinjau = admin && sedangPratinjau()
  if (admin && !pratinjau && !pathname.startsWith('/admin') && !(pathname === '/masuk' && sambut)) return <Navigate to="/admin" replace />
  if (pathname.startsWith('/admin')) {
    if (!admin) return <Navigate to="/masuk" replace state={{ next: pathname }} />
    return (
      <Suspense fallback={muat}>
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Ringkasan />} />
              <Route path="laporan" element={<LaporanAdmin />} />
              <Route path="peta" element={<PetaAdmin />} />
              <Route path="konten" element={<KontenAdmin />} />
              <Route path="pesan" element={<PesanAdmin />} />
              <Route path="aktivitas" element={<Aktivitas />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </Suspense>
    )
  }

  return (
    <>
      <ProgresGulir />
      {pathname !== '/peta' && pathname !== '/kuis' && pathname !== '/patroli' && pathname !== '/masuk' && <KeAtas />}
      {pathname !== '/peta' && pathname !== '/kuis' && pathname !== '/patroli' && pathname !== '/masuk' && <AsapKursor />}
      <GulirOtomatis />
      {pratinjau && <PitaPratinjau />}
      <a href="#utama" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-surface focus:p-3">{tr('Lewati ke konten', 'Skip to content')}</a>
      <Navbar />
      <main id="utama" tabIndex={-1} className="outline-none">
        {/* Suspense di luar ErrorBoundary dan wadah ber-key: batas Suspense yang sudah tampil tidak diganti fallback saat pindah halaman
            (navigasi berjalan dalam transition), jadi halaman lama tetap terlihat sampai halaman baru siap, tanpa layar "Memuat" di antaranya. */}
        <Suspense fallback={muat}>
        <ErrorBoundary key={`${pathname}|${sesi?.email ?? 'tamu'}`}>
        <div key={pathname} className={pathname === '/kuis' || pathname === '/patroli' ? undefined : 'halaman-masuk'}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/edukasi" element={<Edukasi />} />
            <Route path="/edukasi/:slug" element={<ArtikelDetail />} />
            <Route path="/kuis" element={sesi ? <KuisGame /> : <HalamanTerkunci alasan="kuis" />} />
            <Route path="/patroli" element={<Patroli />} />
            <Route path="/peta" element={<Peta />} />
            <Route path="/lapor" element={sesi ? <Lapor /> : <HalamanTerkunci alasan="lapor" />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/masuk" element={<Masuk />} />
            <Route path="/akun" element={sesi ? <Akun /> : <Navigate to="/masuk" replace state={{ next: '/akun' }} />} />
            <Route path="/styleguide" element={<Styleguide />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        </ErrorBoundary>
        </Suspense>
      </main>
      {pathname !== '/masuk' && <Footer />}
      {/* Asisten TORA hanya untuk pengunjung/pengguna (admin diarahkan ke dasbor sebelum sampai sini). Tetap terpasang saat berpindah halaman supaya percakapan tidak terputus; disembunyikan di layar penuh. */}
      <ChatEdukasi sembunyi={pathname === '/peta' || pathname === '/kuis' || pathname === '/patroli' || pathname === '/masuk'} />
    </>
  )
}
