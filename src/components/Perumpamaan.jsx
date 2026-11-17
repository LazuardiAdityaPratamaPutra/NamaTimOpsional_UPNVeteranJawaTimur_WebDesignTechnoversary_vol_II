import { useEffect, useId, useRef, useState } from 'react'
import { Droplets, Pause, Play, RotateCcw, Sparkles } from 'lucide-react'
import { useTr } from '../i18n'
import { kurangiGerak } from '../lib/gerak'

// Widget perumpamaan di dalam artikel: menghidupkan perumpamaan yang sudah ditulis di artikel (spons, obat nyamuk bakar, bak mandi).
// Semuanya ilustrasi sederhana, bukan model ilmiah; ambang di sini tidak mewakili angka nyata.

const TOMBOL = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-ink bg-bg px-3 text-sm font-bold text-ink shadow-[2px_2px_0_0_var(--text)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--text)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
const TANAH = 'rgb(92 70 48)'
const RUMPUT = 'rgb(84 140 70)'
const KAYU = 'rgb(28 22 18)'

function Bingkai({ judul, children, catatan }) {
  const tr = useTr()
  return (
    <figure className="perumpamaan my-8 overflow-hidden rounded-2xl border-2 border-ink bg-surface shadow-[5px_5px_0_0_var(--line-strong)]">
      <figcaption className="flex items-center gap-2 border-b-2 border-ink bg-band px-4 py-2.5">
        <Sparkles size={15} aria-hidden="true" className="text-ember-ink" />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ember-ink">{tr('Coba perumpamaannya', 'Try the analogy')}</span>
        <span className="text-base font-bold leading-tight">· {judul}</span>
      </figcaption>
      <div className="p-4 sm:p-5">{children}</div>
      <p className="m-0 border-t border-line px-4 py-2 text-xs leading-snug text-ink-2">{catatan ?? tr('Ilustrasi sederhana dari perumpamaan di artikel, bukan model ilmiah.', 'A simple illustration of the analogy in the article, not a scientific model.')}</p>
    </figure>
  )
}

const campur = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t))

/** Spons gambut: geser kadar air, lalu jatuhkan percikan. */
function Spons() {
  const tr = useTr()
  const id = useId()
  const [air, setAir] = useState(80)
  const [uji, setUji] = useState(0)
  const kondisi = air >= 60 ? 'basah' : air >= 30 ? 'sedang' : 'kering'
  const warna = campur([64, 44, 28], [158, 116, 68], 1 - air / 100)
  const tinggiAir = 104 * (air / 100)
  const HASIL = {
    basah: tr('Percikan padam. Gambut basah seperti spons penuh air: sulit terbakar.', 'The spark fizzles out. Wet peat is like a sponge full of water: hard to burn.'),
    sedang: tr('Percikan mulai berasap. Gambut yang mengering makin mudah terbakar.', 'The spark starts to smoke. Drying peat burns more easily.'),
    kering: tr('Percikan menyala dan merambat. Spons yang diperas kering menjadi tumpukan bahan bakar.', 'The spark catches and spreads. A sponge wrung dry becomes a pile of fuel.'),
  }
  return (
    <Bingkai judul={tr('Gambut seperti spons', 'Peat is like a sponge')}>
      <svg viewBox="0 0 360 190" className="block h-auto w-full" role="img" aria-label={tr(`Penampang gambut dengan kadar air ${air} persen`, `Peat cross-section with ${air} percent water`)}>
        <path d="M0 58 H360" stroke={RUMPUT} strokeWidth="6" />
        {[40, 120, 210, 300].map((x) => <path key={x} d={`M${x} 56 l-5 -12 M${x} 56 l0 -15 M${x} 56 l5 -12`} stroke={RUMPUT} strokeWidth="3" strokeLinecap="round" />)}
        <rect x="20" y="62" width="320" height="108" rx="10" fill={`rgb(${warna.join(' ')})`} stroke={KAYU} strokeWidth="3" style={{ transition: 'fill 400ms' }} />
        <clipPath id={`${id}-k`}><rect x="22" y="64" width="316" height="104" rx="8" /></clipPath>
        <g clipPath={`url(#${id}-k)`}>
          <rect x="20" y={168 - tinggiAir} width="320" height={tinggiAir + 4} fill="rgb(74 146 214 / 0.55)" style={{ transition: 'y 400ms, height 400ms' }} />
          {Array.from({ length: 24 }, (_, i) => <ellipse key={i} cx={38 + (i % 8) * 41 + (Math.floor(i / 8) % 2) * 18} cy={84 + Math.floor(i / 8) * 30} rx="9" ry="6" fill="rgb(0 0 0 / 0.22)" />)}
        </g>
        {kondisi !== 'basah' && <path d="M70 62 l10 14 -6 10 M200 62 l-8 16 8 8 M280 62 l6 12" stroke={KAYU} strokeWidth="2" fill="none" />}
        {kondisi === 'kering' && uji > 0 && (
          <g key={`api-${uji}`} className="pr-nyala">
            {[90, 150, 220, 270].map((x, i) => <circle key={x} cx={x} cy={70 + (i % 2) * 18} r="6" fill="rgb(255 140 40)" className="pr-bara" style={{ animationDelay: `${i * 160}ms` }} />)}
            <path d="M150 54 c-8 -10 8 -16 0 -28 M220 54 c-8 -10 8 -16 0 -28" stroke="rgb(150 150 150)" strokeWidth="4" fill="none" strokeLinecap="round" className="pr-asap" />
          </g>
        )}
        {kondisi === 'sedang' && uji > 0 && <path key={`asap-${uji}`} d="M180 54 c-8 -10 8 -16 0 -28" stroke="rgb(150 150 150)" strokeWidth="4" fill="none" strokeLinecap="round" className="pr-asap" />}
        {kondisi === 'basah' && uji > 0 && <g key={`uap-${uji}`} className="pr-asap"><circle cx="180" cy="44" r="8" fill="rgb(220 230 240 / 0.8)" /><circle cx="192" cy="34" r="6" fill="rgb(220 230 240 / 0.6)" /></g>}
        {uji > 0 && <circle key={`p-${uji}`} cx="180" cy="10" r="5" fill="rgb(255 196 84)" className="pr-jatuh" />}
      </svg>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <label htmlFor={`${id}-air`} className="flex items-center justify-between text-sm font-bold"><span className="inline-flex items-center gap-1.5"><Droplets size={15} aria-hidden="true" className="text-ember-ink" />{tr('Kadar air gambut', 'Peat water content')}</span><output htmlFor={`${id}-air`} className="font-mono tabular-nums">{air}%</output></label>
          <input id={`${id}-air`} type="range" min="0" max="100" step="5" value={air} onChange={(e) => setAir(Number(e.target.value))} className="mt-2 w-full accent-[var(--ember)]" />
        </div>
        <button type="button" onClick={() => setUji((n) => n + 1)} className={`${TOMBOL} !bg-ember !text-on-ember`}><Sparkles size={15} aria-hidden="true" />{tr('Jatuhkan percikan', 'Drop a spark')}</button>
      </div>
      <p className="m-0 mt-3 min-h-[3rem] text-base font-semibold leading-snug" aria-live="polite">{uji > 0 ? HASIL[kondisi] : tr('Geser kadar air, lalu jatuhkan percikan.', 'Move the water slider, then drop a spark.')}</p>
    </Bingkai>
  )
}

// Jalur bara di bawah tanah (titik-titik koordinat), merayap pelan lalu naik ke permukaan
const JALUR = [[40, 160], [80, 150], [110, 168], [150, 150], [175, 130], [150, 112], [190, 102], [230, 120], [260, 150], [290, 128], [300, 100], [292, 72]]
const panjang = JALUR.slice(1).map((p, i) => Math.hypot(p[0] - JALUR[i][0], p[1] - JALUR[i][1]))
const TOTAL = panjang.reduce((a, b) => a + b, 0)
function titikPada(t) {
  let sisa = (t / 100) * TOTAL
  for (let i = 0; i < panjang.length; i++) {
    if (sisa <= panjang[i]) { const f = sisa / panjang[i], a = JALUR[i], b = JALUR[i + 1]; return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, i } }
    sisa -= panjang[i]
  }
  return { x: JALUR.at(-1)[0], y: JALUR.at(-1)[1], i: panjang.length - 1 }
}

/** Bara bawah tanah seperti obat nyamuk bakar. */
function Bara() {
  const tr = useTr()
  const id = useId()
  const [t, setT] = useState(0)
  const [jalan, setJalan] = useState(false)
  const raf = useRef(0)
  const tRef = useRef(0)
  const atur = (n) => { tRef.current = n; setT(n) }
  useEffect(() => {
    if (!jalan) return undefined
    let lalu = performance.now()
    const langkah = (kini) => {
      const n = Math.min(100, tRef.current + (kini - lalu) / 90); lalu = kini
      tRef.current = n; setT(n)
      if (n >= 100) { setJalan(false); return }
      raf.current = requestAnimationFrame(langkah)
    }
    raf.current = requestAnimationFrame(langkah)
    return () => cancelAnimationFrame(raf.current)
  }, [jalan])
  const p = titikPada(t)
  const jejak = [...JALUR.slice(0, p.i + 1), [p.x, p.y]].map((q) => q.join(',')).join(' ')
  const muncul = t >= 97
  const tahap = t < 5 ? tr('Hari pertama: bara mulai membara.', 'Day one: the embers start to smolder.')
    : !muncul ? tr('Berminggu-minggu: bara merayap di bawah tanah. Dari atas, semua tampak tenang.', 'Weeks go by: the embers creep underground. From above, everything looks calm.')
      : tr('Bara muncul kembali di permukaan, jauh dari titik awal.', 'The embers re-emerge at the surface, far from where they started.')
  return (
    <Bingkai judul={tr('Membara seperti obat nyamuk bakar', 'Smoldering like a mosquito coil')}>
      <svg viewBox="0 0 360 190" className="block h-auto w-full" role="img" aria-label={tahap}>
        <rect x="0" y="66" width="360" height="124" fill={TANAH} />
        <rect x="0" y="120" width="360" height="70" fill="rgb(70 52 36)" />
        <path d="M0 64 H360" stroke={RUMPUT} strokeWidth="6" />
        {[30, 90, 160, 230].map((x) => <g key={x}><rect x={x - 3} y="30" width="6" height="34" fill="rgb(96 66 40)" /><circle cx={x} cy="28" r="14" fill={RUMPUT} stroke={KAYU} strokeWidth="2" /></g>)}
        <polyline points={JALUR.map((q) => q.join(',')).join(' ')} fill="none" stroke="rgb(255 255 255 / 0.12)" strokeWidth="5" strokeDasharray="2 7" strokeLinecap="round" />
        <polyline points={jejak} fill="none" stroke="rgb(30 22 16)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={jejak} fill="none" stroke="rgb(200 80 30 / 0.55)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={p.x} cy={p.y} r="9" fill={`url(#${id}-g)`} className="pr-denyut" />
        <radialGradient id={`${id}-g`}><stop offset="0" stopColor="rgb(255 220 120)" /><stop offset=".5" stopColor="rgb(255 120 30)" /><stop offset="1" stopColor="rgb(255 80 20 / 0)" /></radialGradient>
        {muncul && (
          <g className="pr-nyala">
            <path d="M292 64 c-12 -8 -6 -26 4 -34 c0 10 10 12 8 24 c4 -4 6 -8 6 -12 c8 10 4 22 -6 26 Z" fill="rgb(255 120 30)" stroke={KAYU} strokeWidth="2" />
            <path d="M300 30 c-8 -10 8 -16 0 -28" stroke="rgb(160 160 160)" strokeWidth="4" fill="none" strokeLinecap="round" className="pr-asap" />
          </g>
        )}
        <text x="8" y="84" fontSize="11" fontFamily="ui-monospace, monospace" fill="rgb(255 255 255 / 0.85)">{tr('bawah permukaan', 'below the surface')}</text>
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => { if (kurangiGerak()) { atur(t >= 100 ? 0 : 100); return } if (t >= 100) atur(0); setJalan(!jalan) }} className={`${TOMBOL} !bg-ember !text-on-ember`}>
          {jalan ? <Pause size={15} aria-hidden="true" /> : <Play size={15} aria-hidden="true" />}{jalan ? tr('Jeda', 'Pause') : t >= 100 ? tr('Ulangi', 'Replay') : tr('Jalankan waktu', 'Run time')}
        </button>
        <label htmlFor={`${id}-t`} className="sr-only">{tr('Waktu berlalu', 'Time passing')}</label>
        <input id={`${id}-t`} type="range" min="0" max="100" value={Math.round(t)} onChange={(e) => { setJalan(false); atur(Number(e.target.value)) }} className="min-w-0 flex-1 accent-[var(--ember)]" />
      </div>
      <p className="m-0 mt-3 min-h-[3rem] text-base font-semibold leading-snug" aria-live="polite">{tahap}</p>
    </Bingkai>
  )
}

/** Sekat kanal seperti menyumbat bak mandi. */
function Sekat() {
  const tr = useTr()
  const [sekat, setSekat] = useState(false)
  const muka = sekat ? 82 : 132 // y permukaan air di dalam gambut
  return (
    <Bingkai judul={tr('Sekat kanal seperti menyumbat bak mandi', 'A canal block is like plugging a bathtub')}>
      <svg viewBox="0 0 360 190" className="block h-auto w-full" role="img" aria-label={sekat ? tr('Sekat terpasang: air tertahan dan muka air naik', 'Block in place: water is held and the water table rises') : tr('Tanpa sekat: air mengalir keluar lewat kanal dan muka air turun', 'No block: water drains out through the canal and the water table drops')}>
        <path d="M0 66 H230" stroke={RUMPUT} strokeWidth="6" />
        <rect x="0" y="68" width="230" height="112" fill={sekat ? 'rgb(74 54 36)' : 'rgb(150 110 66)'} style={{ transition: 'fill 900ms' }} />
        <rect x="0" y={muka} width="230" height={180 - muka} fill="rgb(74 146 214 / 0.42)" style={{ transition: 'y 1.2s cubic-bezier(.2,.8,.2,1), height 1.2s cubic-bezier(.2,.8,.2,1)' }} />
        <text x="10" y={muka + 16} fontSize="11" fontFamily="ui-monospace, monospace" fill="rgb(255 255 255 / 0.9)" style={{ transition: 'y 1.2s' }}>{tr('muka air', 'water table')}</text>
        {/* Kanal menuju sungai */}
        <path d="M230 120 L360 150 L360 180 L230 180 Z" fill="rgb(70 52 36)" />
        <path d="M230 128 L360 160" stroke="rgb(74 146 214)" strokeWidth={sekat ? 3 : 10} style={{ transition: 'stroke-width 900ms' }} className={sekat ? '' : 'pr-alir'} strokeDasharray="14 8" />
        {sekat && <g className="pr-pasang"><rect x="232" y="92" width="14" height="48" fill="rgb(150 104 60)" stroke={KAYU} strokeWidth="2.5" /><path d="M232 104 h14 M232 116 h14 M232 128 h14" stroke={KAYU} strokeWidth="1.5" /></g>}
        <text x="352" y="146" textAnchor="end" fontSize="11" fontFamily="ui-monospace, monospace" fill="rgb(255 255 255 / 0.85)">{tr('ke sungai', 'to river')}</text>
      </svg>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" aria-pressed={sekat} onClick={() => setSekat(!sekat)} className={`${TOMBOL} ${sekat ? 'bg-surface' : '!bg-ember !text-on-ember'}`}>
          {sekat ? <RotateCcw size={15} aria-hidden="true" /> : <Droplets size={15} aria-hidden="true" />}{sekat ? tr('Lepas sekat', 'Remove the block') : tr('Pasang sekat kanal', 'Put in a canal block')}
        </button>
      </div>
      <p className="m-0 mt-3 min-h-[3rem] text-base font-semibold leading-snug" aria-live="polite">
        {sekat ? tr('Air tertahan seperti bak mandi yang disumbat. Muka air naik dan gambut tetap basah.', 'The water is held like a plugged bathtub. The water table rises and the peat stays wet.')
          : tr('Tanpa sekat, air terus mengalir keluar lewat kanal. Muka air turun dan gambut mengering.', 'Without a block, water keeps draining out through the canal. The water table drops and the peat dries.')}
      </p>
    </Bingkai>
  )
}

export const WIDGET_PERUMPAMAAN = { spons: Spons, bara: Bara, sekat: Sekat }
