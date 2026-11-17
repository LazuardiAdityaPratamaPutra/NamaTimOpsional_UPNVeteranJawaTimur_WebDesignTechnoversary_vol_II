import { useMemo, useState } from 'react'
import { hitungZona, hitungParameter } from '../lib/simulasi'
import { hitungRisiko } from '../lib/risiko'
import { formatHa, namaArah, desimal } from '../lib/format'
import hotspots from '../data/hotspot.json'
import pemukiman from '../data/pemukiman.json'
import WindCompass from './WindCompass'
import BadgeDemo from './BadgeDemo'
import { Slider } from './ui'
import { useBahasa, useTr } from '../i18n'

// Lembar peta interaktif di hero: mesin simulasi yang sama dengan halaman Peta, titik api demo H-06.
// Skala dikunci (px per km tetap) supaya orang melihat sendiri zona melebar saat angin menguat.
const h = hotspots.find((x) => x.id === 'H-06')
const AWAL = { U: h.angin.U, theta: h.angin.theta }
const U_MAKS = 10
const W = 720, H = 540, PAD = 28
const JANGKAU_MAKS = hitungParameter({ U: U_MAKS, jenisLahan: h.jenisLahan, t: 12 }).ah // km
const PX_KM = (H / 2 - PAD) / JANGKAU_MAKS
const KM_LON = 111.32 * Math.cos((h.lat * Math.PI) / 180)
const KM_LAT = 111.32
const px = (lon) => W / 2 + (lon - h.lon) * KM_LON * PX_KM
const py = (lat) => H / 2 - (lat - h.lat) * KM_LAT * PX_KM
const titik = (poli) => poli.coordinates[0].map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join(' ')
const terlihat = pemukiman.filter((p) => px(p.lon) > 8 && px(p.lon) < W - 8 && py(p.lat) > 8 && py(p.lat) < H - 8)
const GRID_KM = 5
const garisX = [], garisY = []
for (let k = -Math.floor(W / 2 / PX_KM / GRID_KM); k <= Math.floor(W / 2 / PX_KM / GRID_KM); k++) garisX.push(W / 2 + k * GRID_KM * PX_KM)
for (let k = -Math.floor(H / 2 / PX_KM / GRID_KM); k <= Math.floor(H / 2 / PX_KM / GRID_KM); k++) garisY.push(H / 2 + k * GRID_KM * PX_KM)

export default function SimulasiHero() {
  const b = useBahasa()
  const tr = useTr()
  const [angin, setAngin] = useState(AWAL)
  const zona = useMemo(() => hitungZona({ lat: h.lat, lon: h.lon, U: angin.U, theta: angin.theta, jenisLahan: h.jenisLahan }), [angin])
  const risiko = useMemo(() => hitungRisiko(pemukiman, zona), [zona])
  const tercepat = risiko.length ? [...risiko].sort((a, c) => a.zona - c.zona || c.skor - a.skor)[0] : null
  const berlabel = new Set(risiko.slice(0, 3).map((r) => r.nama))
  const kategori = Object.fromEntries(risiko.map((r) => [r.nama, r.kategori]))
  const asal = namaArah(angin.theta, b)
  const arahJalar = namaArah((angin.theta + 180) % 360, b)
  const koordinat = `${desimal(Math.abs(h.lat).toFixed(3), b)}° ${b === 'en' ? 'S' : 'LS'}, ${desimal(h.lon.toFixed(3), b)}° ${b === 'en' ? 'E' : 'BT'}`
  const bawah = H - 18

  return (
    <figure className="m-0">
      <div className="relative overflow-hidden rounded-sm border border-ink/80 bg-surface">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" className="block h-auto w-full"
          aria-label={tr(`Simulasi data demo: dengan angin dari ${asal}, api menjalar ke arah ${arahJalar} dan mengancam ${risiko.length} pemukiman ilustrasi dalam 12 jam.`,
            `Demo-data simulation: with the wind from the ${asal}, fire spreads ${arahJalar} and threatens ${risiko.length} illustrative settlements within 12 hours.`)}>
          {/* grid 5 km */}
          <g style={{ stroke: 'var(--border)' }} strokeWidth="1">
            {garisX.map((x) => <line key={`x${x}`} x1={x} x2={x} y1="0" y2={H} />)}
            {garisY.map((y) => <line key={`y${y}`} x1="0" x2={W} y1={y} y2={y} />)}
          </g>
          {/* zona 12 -> 6 -> 3 jam, tumbuh dari titik api saat dimuat */}
          {[12, 6, 3].map((j) => (
            <polygon key={j} points={titik(zona[j].poligon)} className={`zona-${j} zona-masuk`}
              style={{ '--j': j === 3 ? 0 : j === 6 ? 1 : 2, transformOrigin: `${W / 2}px ${H / 2}px` }} />
          ))}
          {terlihat.map((p) => (
            <g key={p.nama}>
              <circle cx={px(p.lon)} cy={py(p.lat)} r={kategori[p.nama] ? 5 : 3.5} strokeWidth="1.5"
                className={`pem-dot${kategori[p.nama] ? ` pem-${kategori[p.nama]}` : ''}`} />
              {berlabel.has(p.nama) && (
                <text x={px(p.lon) + (px(p.lon) < W / 2 ? -10 : 10)} y={py(p.lat) + 5} textAnchor={px(p.lon) < W / 2 ? 'end' : 'start'} fontSize="16" fontWeight="600"
                  style={{ fill: 'var(--text)', stroke: 'var(--surface)', strokeWidth: 4, paintOrder: 'stroke' }}>{p.nama}</text>
              )}
            </g>
          ))}
          {/* titik api */}
          <circle cx={W / 2} cy={H / 2} r="6" className="titik-api-cincin" style={{ fill: 'none', stroke: 'var(--flame)', strokeWidth: 2, transformOrigin: `${W / 2}px ${H / 2}px` }} />
          <circle cx={W / 2} cy={H / 2} r="6" strokeWidth="2.5" style={{ fill: 'var(--flame)', stroke: 'var(--surface)' }} />
          {/* skala 5 km */}
          <g transform={`translate(18 ${bawah})`} style={{ stroke: 'var(--text)', fill: 'var(--text)' }}>
            <line x1="0" x2={GRID_KM * PX_KM} y1="0" y2="0" strokeWidth="2.5" />
            <line x1="0" x2="0" y1="-5" y2="5" strokeWidth="2" /><line x1={GRID_KM * PX_KM} x2={GRID_KM * PX_KM} y1="-5" y2="5" strokeWidth="2" />
            <text x={GRID_KM * PX_KM + 8} y="5" fontSize="15" fontWeight="600" stroke="none">{GRID_KM} km</text>
          </g>
          {/* utara */}
          <g transform="translate(26 30)" style={{ fill: 'var(--text)' }}>
            <polygon points="0,-14 6,6 0,2 -6,6" />
            <text y="24" textAnchor="middle" fontSize="15" fontWeight="700">{b === 'en' ? 'N' : 'U'}</text>
          </g>
        </svg>
        {/* legenda zona */}
        <ul className="absolute bottom-3 right-3 m-0 flex list-none gap-3 rounded-sm border border-line bg-surface/90 px-2.5 py-1.5 text-xs font-medium backdrop-blur-sm">
          {[3, 6, 12].map((j) => (
            <li key={j} className="flex items-center gap-1.5">
              <svg width="18" height="10" aria-hidden="true"><rect x="1.5" y="1.5" width="15" height="7" className={`zona-${j}`} style={{ strokeWidth: 1.5 }} /></svg>
              {tr(`${j} jam`, `${j} h`)}
            </li>
          ))}
        </ul>
        <p className="absolute right-3 top-3 m-0 rounded-sm border border-line bg-surface/90 px-2 py-1 text-xs tabular-nums text-ink-2 backdrop-blur-sm">{koordinat}</p>
      </div>

      {/* hasil: berubah seiring kontrol */}
      <dl className="m-0 mt-5 grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0" aria-live="polite">
        <div className="py-4 sm:pr-4">
          <dt className="text-sm text-ink-2">{tr('Luas sebaran 12 jam', 'Spread area, 12 h')}</dt>
          <dd className="m-0 mt-1 font-display text-4xl font-extrabold tabular-nums leading-none [font-stretch:76%]">{formatHa(zona[12].luasHa, b)}<span className="ml-1 text-base font-semibold text-ink-2">ha</span></dd>
        </div>
        <div className="py-4 sm:px-4">
          <dt className="text-sm text-ink-2">{tr('Pemukiman terancam', 'Settlements at risk')}</dt>
          <dd className="m-0 mt-1 font-display text-4xl font-extrabold tabular-nums leading-none [font-stretch:76%]">{risiko.length}</dd>
        </div>
        <div className="py-4 sm:pl-4">
          <dt className="text-sm text-ink-2">{tr('Terkena paling awal', 'Reached first')}</dt>
          <dd className="m-0 mt-1 text-sm font-semibold leading-snug">{tercepat ? tr(`${tercepat.nama}, dalam ${tercepat.zona} jam`, `${tercepat.nama}, within ${tercepat.zona} h`) : tr('Tidak ada dalam 12 jam', 'None within 12 h')}</dd>
        </div>
      </dl>

      {/* kontrol */}
      <div className="mt-5 grid items-center gap-5 sm:grid-cols-[auto_1fr]">
        <WindCompass value={angin.theta} onChange={(theta) => setAngin((a) => ({ ...a, theta }))} />
        <div className="space-y-4">
          <p className="m-0 text-sm" aria-live="polite">{tr(`Angin dari ${asal} (${angin.theta}°), api menjalar ke ${arahJalar}.`, `Wind from the ${asal} (${angin.theta}°), fire spreads ${arahJalar}.`)}</p>
          <Slider label={tr('Kecepatan angin', 'Wind speed')} display={`${angin.U} m/s`} min={0} max={U_MAKS} step={0.5}
            value={angin.U} onChange={(e) => setAngin((a) => ({ ...a, U: Number(e.target.value) }))} />
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-2">
            <BadgeDemo>{tr('Data demo · model edukatif', 'Demo data · educational model')}</BadgeDemo>
            <button type="button" onClick={() => setAngin(AWAL)}
              className="rounded-sm underline decoration-line underline-offset-4 transition-colors duration-150 ease-snap hover:text-ink hover:decoration-ember-ink">{tr('Setel ulang', 'Reset')}</button>
          </div>
        </div>
      </div>
    </figure>
  )
}
