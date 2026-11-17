import { useMemo, useState } from 'react'
import MapView from '../../components/MapView'
import { Kepala, Kosong, Panel, WARNA_KAT, chip } from './kit'
import hotspots from '../../data/hotspot.json'
import pemukiman from '../../data/pemukiman.json'
import { useApp } from '../../components/appContext'
import { useSinkron } from '../../components/syncContext'
import { gabungLaporan } from '../../lib/admin'
import { sipongi, sipongiLuar } from '../../lib/dataPengguna'
import { hitungZona } from '../../lib/simulasi'
import { hitungRisiko } from '../../lib/risiko'
import { namaArah, namaLahan, namaTipe } from '../../lib/format'
import { useJudul } from '../../lib/useJudul'
import { useBahasa, useTr } from '../../i18n'

const LAYER = { sipongi: true, hotspot: true, pemukiman: true, zona: true, laporan: true }
const KEPERCAYAAN = { high: ['tinggi', 'high'], nominal: ['sedang', 'nominal'], low: ['rendah', 'low'] }

export default function PetaAdmin() {
  const tr = useTr()
  const b = useBahasa()
  useJudul(tr('Peta risiko', 'Risk map'))
  const { theme } = useApp()
  const { laporan: dariDb } = useSinkron()
  const laporan = useMemo(() => gabungLaporan(dariDb ?? []), [dariDb])
  const [id, setId] = useState(hotspots[0].id)
  const [layers, setLayers] = useState(LAYER)
  const h = hotspots.find((x) => x.id === id)
  const zona = useMemo(() => hitungZona({ lat: h.lat, lon: h.lon, U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan }), [h])
  const risiko = useMemo(() => hitungRisiko(pemukiman, zona), [zona])
  const kategoriPem = useMemo(() => Object.fromEntries(risiko.map((r) => [r.nama, r.kategori])), [risiko])
  const ubahLayer = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }))
  const [tglSp, setTglSp] = useState('semua')
  const [bingkai, setBingkai] = useState(null)
  const keBatas = (batas) => setBingkai((x) => ({ batas, kiriAtas: [24, 24], kananBawah: [24, 24], kunci: (x?.kunci ?? 0) + 1 }))
  const titikSp = useMemo(() => (tglSp === 'semua' ? sipongi.titik : sipongi.titik.filter((t) => t[2] === tglSp)), [tglSp])
  const titikLuar = useMemo(() => (tglSp === 'semua' ? sipongiLuar.titik : sipongiLuar.titik.filter((t) => t[2] === tglSp)), [tglSp])
  const NAMA_LAYER = { sipongi: `SiPongi (${titikSp.length + titikLuar.length})`, hotspot: tr('Hotspot', 'Hotspots'), pemukiman: tr('Pemukiman', 'Settlements'), zona: tr('Zona 3/6/12 jam', '3/6/12 h zones'), laporan: tr('Laporan', 'Reports') }

  return (
    <>
      <Kepala kicker={tr('Pemantauan', 'Monitoring')} judul={tr('Peta risiko', 'Risk map')} ket={tr('Pilih hotspot untuk melihat zona sebaran 3, 6, dan 12 jam serta pemukiman yang terkena lebih dulu. Angin dan lahan mengikuti data hotspot.', 'Pick a hotspot to see its 3, 6, and 12 hour spread zones and the settlements reached first. Wind and land follow the hotspot data.')} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex flex-col">
          <div className={`relative min-h-[26rem] flex-1 overflow-hidden rounded-2xl border border-line sm:min-h-[32rem] ${theme === 'dark' ? 'peta-gelap' : ''}`} role="region" aria-label={tr('Peta karhutla admin', 'Admin wildfire map')}>
            <MapView layers={layers} selectedId={id} onSelect={setId} onTileError={() => {}} zona={zona} waktu={null} fokusKunci={id} kategoriPem={kategoriPem} laporan={laporan} sipongi={titikSp} sipongiLuar={titikLuar} bingkai={bingkai} padKanan={40} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={tr('Lapisan peta', 'Map layers')}>
            {Object.keys(LAYER).map((k) => (
              <button key={k} type="button" aria-pressed={layers[k]} onClick={() => ubahLayer(k)}
                className={chip(layers[k])}>{NAMA_LAYER[k]}</button>
            ))}
          </div>
          {layers.sipongi && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm" role="group" aria-label={tr('Tanggal titik panas SiPongi', 'SiPongi hotspot date')}>
              <span className="text-ink-2">{tr('SiPongi:', 'SiPongi:')}</span>
              {['semua', ...sipongi.tanggal].map((t) => <button key={t} type="button" aria-pressed={tglSp === t} onClick={() => setTglSp(t)} className={chip(tglSp === t)}>{t === 'semua' ? tr('Semua tanggal', 'All dates') : new Intl.DateTimeFormat(b === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${t}T00:00:00`))}</button>)}
              <button type="button" onClick={() => keBatas(sipongi.batas)} className="min-h-9 rounded-xl bg-ember-ink px-3 font-semibold text-on-ember hover:brightness-110">{tr('Lihat sebaran Kaltim', 'Show East Kalimantan spread')}</button>
              <button type="button" onClick={() => keBatas([[Math.min(...hotspots.map((h) => h.lat)), Math.min(...hotspots.map((h) => h.lon))], [Math.max(...hotspots.map((h) => h.lat)), Math.max(...hotspots.map((h) => h.lon))]])} className="min-h-9 rounded-xl border border-line-strong px-3 font-semibold text-ink hover:border-ink-2">{tr('Wilayah demo', 'Demo area')}</button>
              <span className="text-xs text-ink-2">{tr(`Snapshot ${sipongi.sumber}, sama dengan Peta pengunjung. Simulasi zona tetap memakai hotspot demo.`, `${sipongi.sumber} snapshot, same as the visitor Map. Zone simulation still uses the demo hotspots.`)}</span>
            </div>
          )}
        </div>

        <div className="grid content-start gap-4">
          <Panel judul={tr('Pilih hotspot', 'Pick a hotspot')}>
            <ul className="m-0 grid list-none grid-cols-5 gap-1.5 p-0">
              {hotspots.map((x) => (
                <li key={x.id}>
                  <button type="button" onClick={() => setId(x.id)} aria-pressed={x.id === id} aria-label={`${x.id}, ${tr(...KEPERCAYAAN[x.confidence])}`}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl border py-2 font-mono text-xs font-bold transition-[border-color,background-color,scale] duration-150 ease-snap active:scale-95 ${x.id === id ? 'border-ember-ink bg-ember-ink/10' : 'border-line hover:border-ink-2'}`}>
                    {x.id.replace('H-', '')}
                    <span aria-hidden="true" className="h-1 w-6 rounded-full" style={{ background: 'var(--flame)', opacity: x.confidence === 'high' ? 1 : x.confidence === 'nominal' ? 0.5 : 0.22 }} />
                  </button>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-2 text-[11px] text-ink-2">{tr('Garis di bawah angka = tingkat kepercayaan deteksi.', 'The bar under each number = detection confidence.')}</p>
          </Panel>

          <section aria-label={tr(`Kondisi ${id}`, `Conditions at ${id}`)} className="hutan grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-4 rounded-2xl border border-line p-4">
            <svg viewBox="0 0 100 100" role="img" aria-label={tr(`Angin dari ${namaArah(h.angin.theta, b)}`, `Wind from ${namaArah(h.angin.theta, b)}`)} className="size-[5.5rem]">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--border)" strokeWidth="1.5" />
              {[0, 90, 180, 270].map((d) => <line key={d} x1="50" y1="6" x2="50" y2="12" stroke="var(--text-2)" strokeWidth="1.5" transform={`rotate(${d} 50 50)`} />)}
              <text x="50" y="25" textAnchor="middle" fontSize="9" fill="var(--text-2)" fontFamily="var(--font-mono)">N</text>
              {/* Panah menunjuk ke arah penjalaran (angin dari theta, jadi api bergerak ke theta + 180) */}
              <g style={{ transform: `rotate(${(h.angin.theta + 180) % 360}deg)`, transformOrigin: '50px 50px', transition: 'transform 700ms cubic-bezier(.2,.8,.2,1)' }}>
                <path d="M50 18 L58 44 H53 V78 H47 V44 H42 Z" fill="var(--ember)" />
              </g>
              <circle cx="50" cy="50" r="3" fill="var(--bg)" />
            </svg>
            <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
              <div><dt className="m-0 text-xs text-ink-2">{tr('Angin', 'Wind')}</dt><dd className="m-0 font-display text-2xl font-extrabold leading-none text-ink [font-stretch:76%]">{h.angin.U}<span className="ml-0.5 font-sans text-xs font-medium text-ink-2">m/s</span></dd></div>
              <div><dt className="m-0 text-xs text-ink-2">{tr('Dari', 'From')}</dt><dd className="m-0 font-medium text-ink">{namaArah(h.angin.theta, b)}</dd></div>
              <div><dt className="m-0 text-xs text-ink-2">{tr('Lahan', 'Land')}</dt><dd className="m-0 font-medium text-ink">{namaLahan(h.jenisLahan, b)}</dd></div>
              <div><dt className="m-0 text-xs text-ink-2">{tr('Kepercayaan', 'Confidence')}</dt><dd className="m-0 font-medium text-ink">{tr(...KEPERCAYAAN[h.confidence])}</dd></div>
            </dl>
          </section>

          <Panel judul={tr(`Terkena lebih dulu dari ${id}`, `Reached first from ${id}`)}>
            {risiko.length === 0 ? <Kosong teks={tr('Tidak ada pemukiman dalam zona 12 jam dari hotspot ini.', 'No settlements inside this hotspot’s 12 hour zone.')} /> : (
              <ol className="m-0 grid list-none gap-3 p-0">
                {risiko.map((r) => (
                  <li key={r.nama}>
                    <div className="flex items-baseline gap-2"><span className="min-w-0 flex-1 truncate text-sm font-semibold">{r.nama}</span><span className="font-display text-xl font-extrabold leading-none tabular-nums [font-stretch:76%]" style={{ color: WARNA_KAT[r.kategori] }}>{r.skor}</span></div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/60" role="img" aria-label={`${tr('Skor', 'Score')} ${r.skor} / 100`}><div className="h-full rounded-full" style={{ width: `${r.skor}%`, background: WARNA_KAT[r.kategori] }} /></div>
                    <p className="m-0 mt-1 text-xs text-ink-2">{namaTipe(r.tipe, b)} · ±{r.zona} {tr('jam', 'h')}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
