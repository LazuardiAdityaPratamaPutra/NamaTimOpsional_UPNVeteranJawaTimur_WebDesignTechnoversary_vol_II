import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Container } from './ui'
import { useTr } from '../i18n'
import { kurangiGerak } from '../lib/gerak'

// Judul hero berganti tiap beberapa detik (kata-kata naik satu per satu). Versi statis tetap ada untuk pembaca layar.

export default function HeroMalam() {
  const tr = useTr()
  const kalimat = [
    tr('Ke mana api akan menjalar?', 'Where will the fire spread?'),
    tr('Desa mana yang terkena lebih dulu?', 'Which village is hit first?'),
    tr('Berapa jam sebelum asap tiba?', 'How soon will the smoke arrive?'),
  ]
  const [aktif, setAktif] = useState(0)
  const [jeda, setJeda] = useState(false)

  useEffect(() => {
    if (jeda || kurangiGerak()) return
    const t = setInterval(() => setAktif((a) => (a + 1) % 3), 2000)
    return () => clearInterval(t)
  }, [jeda, aktif])

  return (
    <section aria-labelledby="hero-judul" className="relative isolate">
      {/* peredam di sisi teks agar judul tetap terbaca di atas medan */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg via-bg/55 to-transparent lg:via-bg/35" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-bg to-transparent" aria-hidden="true" />

      <Container className="pointer-events-none relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-between gap-10 py-10 sm:py-14 lg:grid lg:min-h-[min(calc(100svh-4rem),820px)] lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end lg:gap-10">
        <div className="pointer-events-auto max-w-[44rem] lg:self-center">
          <h1 id="hero-judul" className="sr-only">{kalimat[0]}</h1>
          <div data-no-rv className="grid text-[clamp(2.7rem,5.6vw,5.4rem)] font-extrabold leading-[0.86] tracking-tight [font-stretch:76%]" onMouseEnter={() => setJeda(true)} onMouseLeave={() => setJeda(false)} aria-hidden="true">
            {kalimat.map((k, i) => (
              <p key={i} className={`m-0 [grid-area:1/1] ${i === aktif ? '' : 'pointer-events-none'}`}>
                {k.split(' ').map((w, j) => (
                  <span key={j} className="inline-block overflow-hidden pb-[0.12em] align-top">
                    <span className="inline-block transition-[translate,opacity] duration-700 ease-snap"
                      style={{ translate: i === aktif ? '0 0' : (i === (aktif + 2) % 3 ? '0 -105%' : '0 105%'), opacity: i === aktif ? 1 : 0, transitionDelay: i === aktif ? `${j * 70 + 150}ms` : `${j * 30}ms` }}>
                      {w}{' '}
                    </span>
                  </span>
                ))}
              </p>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2" role="group" aria-label={tr('Pilih kalimat judul', 'Choose headline')}>
            {kalimat.map((k, i) => (
              <button key={i} type="button" onClick={() => setAktif(i)} aria-label={k} aria-current={i === aktif}
                className="group flex min-h-6 items-center px-1">
                <span className={`block h-[3px] rounded-full transition-[width,background-color] duration-300 ease-snap ${i === aktif ? 'w-10 bg-ember' : 'w-5 bg-line group-hover:bg-ink-2'}`} />
              </button>
            ))}
          </div>
          <p className="mt-6 max-w-[42ch] text-base leading-relaxed text-ink-2 sm:text-lg">
            {tr('Titik panas hanya menunjukkan di mana api muncul. PyraOps memperkirakan arah dan luas sebarannya 3, 6, dan 12 jam ke depan, dan pemukiman mana yang terkena lebih dulu.',
              'A hotspot only shows where a fire started. PyraOps estimates its direction and reach over the next 3, 6, and 12 hours, and which settlements it hits first.')}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button as={Link} to="/peta?demo=1">{tr('Buka peta simulasi', 'Open the simulation map')}</Button>
            <Link to="/edukasi" className="text-sm font-semibold underline decoration-line underline-offset-4 transition-colors duration-150 ease-snap hover:decoration-ember-ink">{tr('Pelajari karhutla', 'Learn about wildfires')}</Link>
          </div>
        </div>

        <div data-ruang-adegan className="h-[42svh] min-h-[300px] lg:hidden" aria-hidden="true" />

      </Container>
    </section>
  )
}
