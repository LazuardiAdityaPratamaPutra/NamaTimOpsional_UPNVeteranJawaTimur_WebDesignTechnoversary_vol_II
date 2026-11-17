import { Component } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui'
import { useTr } from '../i18n'

function PesanGalat({ galat }) {
  const tr = useTr()
  return (
    <section role="alert" className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{tr('Halaman gagal dimuat', 'The page failed to load')}</h1>
      <p className="mt-2 text-ink-2">
        {tr('Terjadi masalah saat memuat halaman ini. Jika kamu sedang offline, buka halaman yang pernah dikunjungi atau periksa koneksi, lalu coba lagi.',
          'Something went wrong while loading this page. If you are offline, open a page you have visited before or check your connection, then try again.')}
      </p>
      <div className="mt-5 flex justify-center gap-3">
        <Button onClick={muatUlang}>{tr('Muat ulang', 'Reload')}</Button>
        <Button as={Link} to="/" variant="secondary">{tr('Ke beranda', 'Go home')}</Button>
      </div>
      {import.meta.env.DEV && galat && <details className="mt-6 text-left text-xs text-ink-2"><summary className="cursor-pointer">{tr('Detail galat (mode pengembangan)', 'Error details (dev mode)')}</summary><pre className="mt-2 whitespace-pre-wrap break-words">{String(galat?.stack || galat)}</pre></details>}
    </section>
  )
}

// Muat ulang yang sungguh-sungguh: buang cache service worker lebih dulu agar tidak kembali ke berkas lama
async function muatUlang() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.()
    await Promise.all((regs ?? []).map((r) => r.unregister()))
    if (window.caches) await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
  } catch { /* abaikan */ }
  window.location.reload()
}

// Menangkap galat tampilan (termasuk gagal memuat potongan halaman saat offline) agar tidak layar kosong
export default class ErrorBoundary extends Component {
  state = { galat: null }
  static getDerivedStateFromError(galat) { return { galat } }
  componentDidCatch(galat) { console.error('Galat tampilan:', galat) }
  render() { return this.state.galat ? <PesanGalat galat={this.state.galat} /> : this.props.children }
}
