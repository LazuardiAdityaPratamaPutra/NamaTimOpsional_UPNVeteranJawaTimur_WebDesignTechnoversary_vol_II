import { Link } from 'react-router-dom'
import { hitungZona } from '../lib/simulasi'
import { hitungRisiko } from '../lib/risiko'
import { namaArah } from '../lib/format'
import hotspots from '../data/hotspot.json'
import pemukiman from '../data/pemukiman.json'
import { Button } from './ui'
import BadgeDemo from './BadgeDemo'
import { useBahasa, useTr } from '../i18n'

// Pratinjau statis: dihitung dari mesin simulasi yang sama dengan peta, digambar sebagai SVG
const h = hotspots.find((x) => x.id === 'H-06')
const zona = hitungZona({ lat: h.lat, lon: h.lon, U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan })
const risiko = hitungRisiko(pemukiman, zona)
const kategori = Object.fromEntries(risiko.map((r) => [r.nama, r.kategori]))

const W = 400, H = 240, PAD = 18
const cincin = zona[12].poligon.coordinates[0]
const lons = cincin.map((c) => c[0]), lats = cincin.map((c) => c[1])
const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)]
const kmLon = 111.32 * Math.cos((h.lat * Math.PI) / 180)
const kmLat = 111.32
const skala = Math.min((W - 2 * PAD) / ((maxLon - minLon) * kmLon), (H - 2 * PAD) / ((maxLat - minLat) * kmLat))
const offX = (W - (maxLon - minLon) * kmLon * skala) / 2
const offY = (H - (maxLat - minLat) * kmLat * skala) / 2
const px = (lon) => offX + (lon - minLon) * kmLon * skala
const py = (lat) => offY + (maxLat - lat) * kmLat * skala
const titik = (poli) => poli.coordinates[0].map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(' ')
const terlihat = pemukiman.filter((p) => p.lon >= minLon && p.lon <= maxLon && p.lat >= minLat && p.lat <= maxLat)
const arahAsal = (h.angin.theta + 180) % 360 // arah penjalaran api

export default function PetaTeaser() {
  const b = useBahasa()
  const tr = useTr()
  const arahJalar = namaArah(arahAsal, b)
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-lg shadow-black/5 dark:shadow-black/30">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" className="h-auto w-full rounded-lg bg-bg"
        aria-label={tr(`Pratinjau simulasi data demo: api menjalar ke arah ${arahJalar} dan mengancam ${risiko.length} pemukiman ilustrasi dalam 12 jam.`, `Demo-data simulation preview: fire spreads ${arahJalar} and threatens ${risiko.length} illustrative settlements within 12 hours.`)}>
        {[12, 6, 3].map((j) => <polygon key={j} points={titik(zona[j].poligon)} className={`zona-${j}`} />)}
        {terlihat.map((p) => (
          <circle key={p.nama} cx={px(p.lon)} cy={py(p.lat)} r="4.5" strokeWidth="1.5"
            className={`pem-dot${kategori[p.nama] ? ` pem-${kategori[p.nama]}` : ''}`} />
        ))}
        <circle cx={px(h.lon)} cy={py(h.lat)} r="5.5" strokeWidth="2" className="fill-flame stroke-surface" />
      </svg>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-2">
          <BadgeDemo>{tr('Data demo · model edukatif', 'Demo data · educational model')}</BadgeDemo>
          <span>{tr(`Zona 3, 6, 12 jam; ${risiko.length} pemukiman terancam.`, `3, 6, 12 h zones; ${risiko.length} settlements at risk.`)}</span>
        </div>
        <Button as={Link} to="/peta?demo=1" variant="secondary" size="sm">{tr('Buka peta interaktif', 'Open the interactive map')}</Button>
      </div>
    </div>
  )
}
