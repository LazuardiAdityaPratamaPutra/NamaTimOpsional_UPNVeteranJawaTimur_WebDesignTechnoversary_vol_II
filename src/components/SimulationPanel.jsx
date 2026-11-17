import { useEffect, useRef, useState } from 'react'
import { Layers, Pause, Play, Sprout, Trees, Wheat } from 'lucide-react'
import WindCompass from './WindCompass'
import { Link } from 'react-router-dom'
import BadgeDemo from './BadgeDemo'
import AnginNyata from './AnginNyata'
import RiskList from './RiskList'
import BriefingPanel from './BriefingPanel'
import { susunPayloadBriefing } from '../lib/briefing'
import { kurangiGerak } from '../lib/gerak'
import { namaArah, namaLahan, formatHa } from '../lib/format'
import { SIM } from '../lib/config'
import { useBahasa, useKamus, useTr } from '../i18n'

const LAHAN = ['hutan', 'semak', 'gambut', 'pertanian']
const SINGKAT = { hutan: ['Hutan', 'Forest'], semak: ['Semak', 'Scrub'], gambut: ['Gambut', 'Peat'], pertanian: ['Pertanian', 'Farmland'] }
const IKON = { hutan: Trees, semak: Sprout, gambut: Layers, pertanian: Wheat }
// Penamaan kecepatan angin: ambang m/s dan label
const KENCANG = [[3, 'Tenang', 'Calm'], [8, 'Sedang', 'Moderate'], [14, 'Kencang', 'Strong'], [99, 'Sangat kencang', 'Very strong']]
const ZONA = [
  { jam: 3, warna: '--flame', garis: undefined, gaya: 'border-solid', isi: 0.45, nama: ['Garis solid', 'Solid line'] },
  { jam: 6, warna: '--ember', garis: '8 5', gaya: 'border-dashed', isi: 0.35, nama: ['Garis putus-putus', 'Dashed line'] },
  { jam: 12, warna: '--amber', garis: '1 5', gaya: 'border-dotted', isi: 0.25, nama: ['Garis titik-titik', 'Dotted line'] },
]

export default function SimulationPanel({ hotspots, hotspotId, onPilih, params, onParams, indeksAngin, onIndeksAngin, jalan, onJalan, zona, waktu, t, onT, risiko, pemAktif, onPilihPem }) {
  const b = useBahasa()
  const tr = useTr()
  const kamus = useKamus()
  const [putar, setPutar] = useState(false)
  const [dari, setDari] = useState(0)
  const hemat = useState(() => kurangiGerak())[0]
  const strip = useRef(null)
  // Chip titik api yang aktif selalu digulir ke tengah strip
  useEffect(() => { strip.current?.querySelector('[aria-pressed=true]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }) }, [hotspotId])

  // Animasi slider: 12 jam ditempuh dalam 6 detik
  useEffect(() => {
    if (!putar) return
    let raf, mulai = null
    const langkah = (ts) => {
      if (mulai === null) mulai = ts
      const nilai = Math.min(SIM.maksJam, dari + ((ts - mulai) / 1000) * 2)
      onT(nilai)
      if (nilai < SIM.maksJam) raf = requestAnimationFrame(langkah)
      else setPutar(false)
    }
    raf = requestAnimationFrame(langkah)
    return () => cancelAnimationFrame(raf)
  }, [putar, dari, onT])

  const ubah = (k, v) => onParams({ ...params, [k]: v })
  const hotspot = hotspots.find((h) => h.id === hotspotId)
  const payloadBriefing = jalan && zona ? susunPayloadBriefing({ hotspot, params, zona, risiko, bahasa: b }) : null

  const maksLuas = zona ? Math.max(...ZONA.map((z) => zona[z.jam].luasHa), 1) : 1
  const idxLahan = Math.max(0, LAHAN.indexOf(params.jenisLahan))
  const [, kencangId, kencangEn] = KENCANG.find(([m]) => params.U < m)
  const mpsPct = (params.U / 20) * 100

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.2em] text-ember-ink">{tr('Atur lalu jalankan', 'Set, then run')}</p>
          <h2 className="judul-display m-0 mt-1 text-4xl leading-[0.95]">{tr('Simulasi sebaran api', 'Fire spread simulation')}</h2>
        </div>
        <BadgeDemo>{tr('Model edukatif', 'Educational model')}</BadgeDemo>
      </div>

      {/* Titik api: strip chip yang bisa digulir; ketuk untuk berpindah titik */}
      <div>
        <p id="sim-titik" className="m-0 mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{tr('Titik api', 'Fire point')} <span className="text-ink">{hotspot && `${hotspot.lat.toFixed(2)}, ${hotspot.lon.toFixed(2)}`}</span></p>
        <div ref={strip} role="group" aria-labelledby="sim-titik" className="-mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {hotspots.map((h) => (
            <button key={h.id} type="button" aria-pressed={h.id === hotspotId} onClick={() => onPilih(h.id)}
              className="min-h-9 shrink-0 snap-center rounded-full border border-line px-3.5 font-mono text-xs font-bold text-ink transition-[background-color,color,border-color,scale] duration-200 ease-snap hover:border-ember-ink active:scale-90 aria-pressed:border-ember-ink aria-pressed:bg-ember-ink aria-pressed:text-on-ember">{h.id}</button>
          ))}
        </div>
      </div>

      <AnginNyata lat={hotspot.lat} lon={hotspot.lon} params={params} onParams={onParams} indeks={indeksAngin} onIndeks={onIndeksAngin} />

      <fieldset data-tur="angin" className="m-0 min-w-0 space-y-5 border-0 p-0">
        <legend className="sr-only">{tr('Skenario angin (what-if)', 'Wind scenario (what-if)')}</legend>
        <WindCompass value={params.theta} onChange={(v) => ubah('theta', v)} kecepatan={params.U} />
        <p className="m-0 text-center text-sm font-semibold" aria-live="polite">{tr(`Angin dari ${namaArah(params.theta)}`, `Wind from the ${namaArah(params.theta, 'en')}`)} <span className="font-mono font-normal text-ink-2">({params.theta}°)</span></p>

        {/* Kecepatan: pembacaan besar di atas, rel bertanda ambang di bawah */}
        <label className="block">
          <span className="flex items-end justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{tr('Kecepatan angin', 'Wind speed')}</span>
            <span className="text-xs font-semibold text-ember-ink">{tr(kencangId, kencangEn)}</span>
          </span>
          <span className="font-mono text-4xl font-bold leading-none tabular-nums">{params.U}<span className="ml-1 text-sm font-normal text-ink-2">m/s</span></span>
          <span className="relative mt-3 block">
            <input type="range" min={0} max={20} step={0.1} value={params.U} onChange={(e) => ubah('U', Number(e.target.value))}
              style={{ background: `linear-gradient(to right, var(--ember) ${mpsPct}%, var(--border) ${mpsPct}%)` }}
              className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full outline-offset-4 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-ember [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-ember [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-125" />
            <span aria-hidden="true" className="mt-1.5 flex justify-between font-mono text-[11px] text-ink-2"><span>0</span><span>5</span><span>10</span><span>15</span><span>20</span></span>
          </span>
        </label>

        {/* Jenis lahan: pilihan bersegmen dengan penanda yang meluncur */}
        <div>
          <p id="sim-lahan" className="m-0 mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{tr('Jenis lahan', 'Land type')}</p>
          <div role="radiogroup" aria-labelledby="sim-lahan" className="relative grid grid-cols-4 rounded-2xl border border-line p-1">
            <span aria-hidden="true" className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-xl bg-ember transition-transform duration-[450ms] ease-snap" style={{ transform: `translateX(${idxLahan * 100}%)` }} />
            {LAHAN.map((k) => {
              const Ikon = IKON[k]
              const on = k === params.jenisLahan
              return (
                <button key={k} type="button" role="radio" aria-checked={on} onClick={() => ubah('jenisLahan', k)} aria-label={namaLahan(k, b)}
                  className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-[color,scale] duration-300 ease-snap active:scale-95 ${on ? 'text-on-ember' : 'text-ink hover:text-ember-ink'}`}>
                  <Ikon size={18} aria-hidden="true" className={on ? 'motion-safe:animate-[pop_400ms_ease-out]' : ''} />{tr(...SINGKAT[k])}
                </button>
              )
            })}
          </div>
        </div>
      </fieldset>

      <button type="button" onClick={onJalan}
        className="group/j flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ember px-5 text-base font-bold text-on-ember transition-[scale,filter] duration-200 ease-snap hover:brightness-110 active:scale-[0.98]">
        <Play size={18} aria-hidden="true" className="fill-current transition-transform duration-300 ease-snap group-hover/j:scale-125" />
        {jalan ? tr('Jalankan ulang dan fokuskan peta', 'Run again and focus the map') : tr('Jalankan simulasi', 'Run simulation')}
      </button>

      {jalan && zona && (
        <>
          {/* Luas per zona: batang bergaya garis sama dengan di peta; ketuk satu untuk melompat ke jam itu */}
          <section aria-label={tr('Estimasi luas terdampak per zona', 'Estimated affected area per zone')}>
            <h3 className="!m-0 !mb-2 !font-mono !text-[11px] !font-normal !uppercase !leading-normal !tracking-[0.16em] text-ink-2">{tr('Estimasi luas terdampak', 'Estimated affected area')}</h3>
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {ZONA.map((z) => (
                <li key={z.jam}>
                  <button type="button" onClick={() => { setPutar(false); onT(z.jam) }} aria-label={`${tr(`${z.jam} jam`, `${z.jam} h`)}: ${formatHa(zona[z.jam].luasHa, b)} ha. ${tr(...z.nama)}. ${tr('Ketuk untuk melompat ke jam ini', 'Tap to jump to this hour')}`}
                    className="group/z grid w-full grid-cols-[3.1rem_minmax(0,1fr)_4.2rem] items-center gap-x-2 rounded-lg py-1 text-left transition-[background-color] duration-150 hover:bg-line/40">
                    <span className="font-mono text-xs text-ink-2">{tr(`${z.jam} jam`, `${z.jam} h`)}</span>
                    <span aria-hidden="true" className="h-5 overflow-hidden rounded">
                      <span className={`block h-full rounded border-2 transition-[width] duration-700 ease-snap ${z.gaya}`} style={{ width: `${Math.max(6, (zona[z.jam].luasHa / maksLuas) * 100)}%`, borderColor: `var(${z.warna})`, backgroundColor: `color-mix(in oklab, var(${z.warna}) ${z.isi * 100}%, transparent)` }} />
                    </span>
                    <span className="text-right font-mono text-sm font-bold tabular-nums">{formatHa(zona[z.jam].luasHa, b)}<span className="ml-0.5 text-[11px] font-normal text-ink-2">ha</span></span>
                  </button>
                </li>
              ))}
            </ul>
            {/* Keterbatasan dibaca bersama angkanya, bukan hanya di dasar panel */}
            <p className="m-0 mt-2.5 flex items-start gap-2 rounded-lg border border-amber/60 bg-amber/10 px-3 py-2 text-xs leading-relaxed text-ink">
              <span aria-hidden="true" className="mt-1 size-1.5 shrink-0 rounded-full bg-amber" />
              <span>{tr('Ilustrasi dari model sederhana, bukan prediksi resmi. Jangan dipakai untuk keputusan evakuasi.', 'An illustration from a simple model, not an official forecast. Do not use it for evacuation decisions.')}{' '}
                <Link to="/about#batasan" className="font-semibold text-ember-ink underline underline-offset-2">{tr('Lihat batasan model', 'See the model limits')}</Link></span>
            </p>
          </section>

          {/* Penggeser waktu: jam besar, penanda tiga zona di rel, tombol putar bundar */}
          <section aria-label={tr('Waktu simulasi', 'Simulation time')}>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{tr('Waktu (garis tebal di peta)', 'Time (thick line on the map)')}</p>
                <p className="m-0 mt-1 font-mono text-4xl font-bold leading-none tabular-nums">{t.toFixed(1)}<span className="ml-1 text-sm font-normal text-ink-2">{tr('jam', 'h')}</span></p>
                <p className="m-0 mt-1 text-xs text-ink-2">{tr('Estimasi luas saat ini', 'Current estimated area')}: <span className="font-mono font-bold text-ink">{formatHa(waktu.luasHa, b)} ha</span></p>
              </div>
              {!hemat && (
                <button type="button" onClick={() => { setDari(t >= SIM.maksJam ? 0 : t); setPutar(!putar) }} aria-label={putar ? tr('Jeda', 'Pause') : tr('Putar animasi', 'Play animation')}
                  className="flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-bg transition-[scale,background-color] duration-200 ease-snap hover:bg-ember-ink hover:text-on-ember active:scale-90">
                  {putar ? <Pause size={22} aria-hidden="true" className="fill-current" /> : <Play size={22} aria-hidden="true" className="ml-0.5 fill-current" />}
                </button>
              )}
            </div>
            <div className="relative mt-4">
              <input type="range" aria-label={tr('Waktu simulasi (jam)', 'Simulation time (hours)')} min={0} max={SIM.maksJam} step={0.1} value={t}
                aria-valuetext={tr(`${t.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jam setelah api mulai`, `${t.toLocaleString('en-US', { maximumFractionDigits: 1 })} hours after ignition`)}
                onChange={(e) => { setPutar(false); onT(Number(e.target.value)) }}
                style={{ background: `linear-gradient(to right, var(--ember) ${(t / SIM.maksJam) * 100}%, var(--border) ${(t / SIM.maksJam) * 100}%)` }}
                className="relative z-10 h-2 w-full cursor-pointer appearance-none rounded-full outline-offset-4 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-ember [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-ember [&::-webkit-slider-thumb]:shadow-md" />
              <span aria-hidden="true" className="relative mt-2 block h-4 font-mono text-[11px] text-ink-2">
                {ZONA.map((z) => <span key={z.jam} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `calc(${(z.jam / SIM.maksJam) * 100}% - ${(z.jam / SIM.maksJam) * 20 - 10}px)` }}><span className="mb-0.5 h-1.5 w-0.5 rounded-full" style={{ backgroundColor: `var(${z.warna})` }} />{z.jam}</span>)}
              </span>
            </div>
          </section>

          <RiskList daftar={risiko} aktif={pemAktif} onPilih={onPilihPem} />
          {payloadBriefing && <BriefingPanel payload={payloadBriefing} />}
        </>
      )}

      <p className="m-0 text-xs text-ink-2">{kamus.disclaimer}</p>
    </div>
  )
}
