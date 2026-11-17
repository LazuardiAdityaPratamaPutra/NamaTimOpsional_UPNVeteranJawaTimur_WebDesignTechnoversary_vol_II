import { useState } from 'react'
import { useTr } from '../../i18n'
import { WARNA_SEV } from './kit'

const SEGMEN = [['ringan', 'Ringan', 'Light'], ['sedang', 'Sedang', 'Moderate'], ['berat', 'Berat', 'Severe']]

function Tip({ children, style, className = '' }) {
  return <div role="presentation" style={style} className={`pointer-events-none absolute z-20 whitespace-nowrap rounded-lg border border-line bg-bg px-3 py-2 text-xs shadow-xl ${className}`}>{children}</div>
}

const URUT = ['berat', 'sedang', 'ringan']

/** Grafik garis + titik: laporan per 3 jam. Warna titik = tingkat terparah pada rentang itu; hover/fokus pada kolom memunculkan penunjuk dan tooltip. */
export function Denyut({ bins, tinggi = 'h-44' }) {
  const tr = useTr()
  const [on, setOn] = useState(null)
  const n = bins.length
  const jumlah = (x) => x.ringan + x.sedang + x.berat
  const puncak = Math.max(2, ...bins.map(jumlah))
  const parah = (x) => URUT.find((k) => x[k] > 0)
  const xp = (i) => ((i + 0.5) / n) * 100
  const yp = (v) => 100 - (v / puncak) * 100
  const garis = bins.map((x, i) => `${i ? 'L' : 'M'}${xp(i)} ${yp(jumlah(x))}`).join(' ')
  const jam = (i) => { const a = (n - 1 - i) * 3 + 3, z = (n - 1 - i) * 3; return z === 0 ? tr(`${a} jam terakhir`, `last ${a} h`) : tr(`${a}–${z} jam lalu`, `${a}–${z} h ago`) }
  const ringkas = (x, i) => `${jam(i)}: ${SEGMEN.map(([k, id, en]) => `${tr(id, en)} ${x[k]}`).join(', ')}`
  return (
    <div>
      <div className="relative ml-7">
        <div role="group" aria-label={tr(`Laporan per 3 jam, ${n * 3} jam terakhir`, `Reports per 3 hours, last ${n * 3} hours`)} className={`relative ${tinggi}`} onMouseLeave={() => setOn(null)}>
          <div aria-hidden="true" className="absolute inset-x-0 inset-y-3">
            {[0, 0.5, 1].map((f) => <span key={f} className="absolute inset-x-0 border-t border-dashed border-line/80" style={{ bottom: `${f * 100}%` }}><span className="absolute -left-7 -top-2 w-5 text-right font-mono text-[11px] text-ink-2">{Math.round(puncak * f)}</span></span>)}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              <defs><linearGradient id="denyut-isi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--ember)" stopOpacity="0.28" /><stop offset="100%" stopColor="var(--ember)" stopOpacity="0" /></linearGradient></defs>
              <path d={`${garis} L${xp(n - 1)} 100 L${xp(0)} 100 Z`} fill="url(#denyut-isi)" />
              <path d={garis} pathLength="1" fill="none" stroke="var(--ember)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" className="garis-gambar" />
            </svg>
            {bins.map((x, i) => {
              const v = jumlah(x), k = parah(x)
              return <span key={i} className={`absolute rounded-full border-2 border-surface transition-[scale] duration-200 ease-snap ${on === i ? 'scale-150' : ''} ${v ? 'size-3.5' : 'size-2.5'}`} style={{ left: `${xp(i)}%`, bottom: `${100 - yp(v)}%`, translate: '-50% 50%', background: k ? WARNA_SEV[k] : 'var(--border)' }} />
            })}
          </div>
          <div className="absolute inset-0 flex">
            {bins.map((x, i) => (
              <button key={i} type="button" aria-label={ringkas(x, i)} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onBlur={() => setOn(null)} className="relative min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ember-ink">
                {on === i && (
                  <>
                    <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-ink/25" />
                    <Tip className={i < 3 ? 'left-0' : i > n - 4 ? 'right-0' : 'left-1/2 -translate-x-1/2'} style={{ top: `calc(0.75rem + ${yp(jumlah(x))} * (100% - 1.5rem) / 100 - 5.5rem)`, translate: '0 -0.25rem' }}>
                      <span className="block text-left">
                        <span className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-ink-2">{jam(i)}</span>
                        {SEGMEN.slice().reverse().map(([k, id, en]) => (
                          <span key={k} className="flex items-center gap-2 leading-5"><span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ background: WARNA_SEV[k] }} /><strong className="w-4 text-right tabular-nums text-ink">{x[k]}</strong><span className="text-ink-2">{tr(id, en)}</span></span>
                        ))}
                      </span>
                    </Tip>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="mt-2 flex justify-between font-mono text-[11px] text-ink-2"><span>-{n * 3} {tr('jam', 'h')}</span><span>-{n * 1.5}</span><span>{tr('sekarang', 'now')}</span></div>
      </div>
      <table className="sr-only"><caption>{tr('Laporan per 3 jam menurut tingkat', 'Reports per 3 hours by severity')}</caption><thead><tr><th>{tr('Jangka', 'Window')}</th>{SEGMEN.map(([k, id, en]) => <th key={k}>{tr(id, en)}</th>)}</tr></thead><tbody>{bins.map((x, i) => <tr key={i}><td>{jam(i)}</td>{SEGMEN.map(([k]) => <td key={k}>{x[k]}</td>)}</tr>)}</tbody></table>
    </div>
  )
}
