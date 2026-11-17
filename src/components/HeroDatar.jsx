import { Link } from 'react-router-dom'
import { Button, Container } from './ui'
import SimulasiHero from './SimulasiHero'
import { useTr } from '../i18n'

// Hero cadangan tanpa WebGL: lembar peta 2D dengan simulasi yang sama.
export default function HeroDatar() {
  const tr = useTr()
  return (
    <section aria-labelledby="hero-judul" className="border-b border-line">
      <Container className="grid items-start gap-10 pb-14 pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14 lg:pb-20 lg:pt-16">
        <div className="lg:sticky lg:top-24">
          <h1 id="hero-judul" className="text-[clamp(3.5rem,9vw,7rem)] leading-[1.02]">
            {tr('Ke mana api akan menjalar?', 'Where will the fire spread?')}
          </h1>
          <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-ink-2">
            {tr('Titik panas hanya menunjukkan di mana api muncul. PyraOps memperkirakan arah dan luas sebarannya 3, 6, dan 12 jam ke depan, dan pemukiman mana yang terkena lebih dulu.',
              'A hotspot only shows where a fire started. PyraOps estimates its direction and reach over the next 3, 6, and 12 hours, and which settlements it hits first.')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Button as={Link} to="/peta?demo=1">{tr('Buka peta simulasi', 'Open the simulation map')}</Button>
            <Link to="/edukasi" className="text-sm font-semibold underline decoration-line underline-offset-4 transition-colors duration-150 ease-snap hover:decoration-ember-ink">{tr('Pelajari karhutla', 'Learn about wildfires')}</Link>
          </div>
          <p className="mt-6 max-w-[44ch] text-xs leading-relaxed text-ink-2">{tr('Simulasi adalah model edukatif yang disederhanakan, bukan alat keputusan operasional.', 'The simulation is a simplified educational model, not an operational decision tool.')}</p>
        </div>
        <SimulasiHero />
      </Container>
    </section>
  )
}
