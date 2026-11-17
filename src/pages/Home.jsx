import { Suspense, useMemo } from 'react'
import { lazyRetry } from '../lib/lazyRetry'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Container, SectionHeading } from '../components/ui'
import HeroMalam from '../components/HeroMalam'
import { dukungWebGL } from '../components/hero3d/dataDemo'
import HeroDatar from '../components/HeroDatar'
import PilarFitur from '../components/PilarFitur'
import ArtikelKartu from '../components/ArtikelKartu'
import StatCard from '../components/StatCard'
import { STATISTIK } from '../data/statistik'
import { daftarArtikel } from '../lib/artikel'
import { useJudul } from '../lib/useJudul'
import { useApp } from '../components/appContext'
import { lokal, useBahasa, useTr } from '../i18n'
import { kurangiGerak } from '../lib/gerak'

const LatarGaris = lazyRetry(() => import('../components/hero3d/LatarGaris'))

// Tiga bacaan pilihan. Bila salah satunya belum terbit (admin menyembunyikannya), diganti artikel terbit lain agar bento tetap utuh.
const PILIHAN = ['penyebab', 'gambut', 'pencegahan']
function bacaanPilihan(semua) {
  const dipilih = PILIHAN.map((slug) => semua.find((a) => a.slug === slug)).filter(Boolean)
  for (const a of semua) if (dipilih.length < 3 && !dipilih.includes(a)) dipilih.push(a)
  return dipilih
}

export default function Home() {
  useJudul('')
  const b = useBahasa()
  const tr = useTr()
  const { theme } = useApp()
  const terang = theme === 'light'
  const webgl = useMemo(() => dukungWebGL(), [])
  const gerakKurang = useMemo(() => kurangiGerak(), [])

  const lapis = terang ? 'bg-surface/75 backdrop-blur-[6px]' : 'bg-bg/75 backdrop-blur-[6px]'
  return (
    <div className={webgl ? `${terang ? '' : 'malam-token '}relative isolate` : undefined}>
      {webgl && (
        <>
          {/* Adegan 3D tetap di belakang seluruh halaman; kamera bergeser mengikuti gulir */}
          <Suspense fallback={null}>
            <LatarGaris gerakKurang={gerakKurang} terang={terang}
              aria={tr('Latar ilustrasi: hutan konifer bergaya garis dengan satu garis api oranye di kejauhan.', 'Illustrative backdrop: a line-art conifer forest with a single orange fire line in the distance.')} />
          </Suspense>
          <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-bg/90 via-bg/55 to-bg/10" aria-hidden="true" />
          {terang && <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_45%_at_70%_78%,color-mix(in_oklab,var(--ember)_30%,transparent),transparent)]" aria-hidden="true" />}
        </>
      )}
      <div className="relative">
      {webgl ? <HeroMalam /> : <HeroDatar />}

      <section aria-labelledby="masalah-judul" className={`relative overflow-hidden py-20 md:py-28 ${webgl ? lapis : ''}`}>
        <Container className="relative grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <SectionHeading title={tr('Peta titik panas tidak menjawab ke mana api pergi', 'A hotspot map can’t tell where fire goes')} id="masalah-judul">
            {tr('Angka di samping menunjukkan skala kebakaran yang dipantau. Arah penjalarannya yang belum terlihat, dan itu yang coba dijawab simulasi.', 'These figures show the scale of the fires being monitored. Where they spread next is still invisible, and that is what the simulation answers.')}
          </SectionHeading>
          <div data-gulir className="lg:[translate:0_calc(var(--gy,0)*20px)]">
            {STATISTIK.map((s) => { const x = lokal(s, b); return <StatCard key={s.id} label={x.label} angka={x.angka} satuan={x.satuan} periode={x.periode} sumber={x.sumber} url={x.url} banding={s.banding} /> })}
          </div>
        </Container>
      </section>

      <section aria-labelledby="pilar-judul" className={`relative overflow-hidden border-t border-line py-20 md:py-28 ${webgl ? lapis : ''}`}>
        <Container className="relative">
          <SectionHeading title={tr('Apa yang bisa dikerjakan di PyraOps', 'What you can do in PyraOps')} id="pilar-judul" />
          <div className="mt-12"><PilarFitur glass={webgl} /></div>
        </Container>
      </section>

      <section aria-labelledby="artikel-judul" className={`relative overflow-hidden border-t border-line py-20 md:py-28 ${webgl ? lapis : ''}`}>
        <Container className="relative">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <SectionHeading title={tr('Mulai dari sini', 'Start here')} id="artikel-judul">{tr('Bacaan singkat tentang karhutla, dari penyebab sampai pencegahan.', 'Short reads on wildfires, from causes to prevention.')}</SectionHeading>
            <Link to="/edukasi" className="group inline-flex items-center gap-2 text-sm font-semibold text-ember-ink">
              <span className="underline decoration-transparent underline-offset-4 transition-colors duration-150 ease-snap group-hover:decoration-current">{tr('Semua materi', 'All materials')}</span>
              <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="mt-12">
            <ArtikelKartu daftar={bacaanPilihan(daftarArtikel(b))} />
          </div>
        </Container>
      </section>
      </div>
    </div>
  )
}
