import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Copy, Crosshair, Layers, Sprout, Trees, Wheat, X } from 'lucide-react'
import BadgeDemo from './BadgeDemo'
import { namaArah, namaLahan } from '../lib/format'
import { useBahasa, useTr } from '../i18n'

const KEPERCAYAAN = { high: ['Tinggi', 'High', 3], nominal: ['Sedang', 'Medium', 2], low: ['Rendah', 'Low', 1] }
const IKON_LAHAN = { hutan: Trees, semak: Sprout, gambut: Layers, pertanian: Wheat }

/** Label kecil di atas nilai: dipakai semua pembacaan di panel ini, jadi tata letaknya satu bahasa. */
const Label = ({ children }) => <dt className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{children}</dt>

export default function HotspotDetail({ hotspot: h, onClose, onSimulasi }) {
  const b = useBahasa()
  const tr = useTr()
  const [disalin, setDisalin] = useState(false)
  const [sapu, setSapu] = useState(false) // panah angin menyapu dari utara ke arah sebenarnya saat panel terbuka
  const timer = useRef(null)
  useEffect(() => { const t = setTimeout(() => setSapu(true), 80); return () => { clearTimeout(t); clearTimeout(timer.current) } }, [])

  const [kl, ke, level] = KEPERCAYAAN[h.confidence]
  const tgl = new Date(h.acq_datetime)
  const tanggal = tgl.toLocaleDateString(b === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric' })
  const jam = tgl.toLocaleTimeString(b === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).replace(':', '.')
  const koordinat = `${h.lat.toFixed(3)}, ${h.lon.toFixed(3)}`
  const Lahan = IKON_LAHAN[h.jenisLahan] ?? Layers

  const salin = async () => {
    try { await navigator.clipboard.writeText(koordinat) } catch { /* tanpa izin papan klip: tetap beri umpan balik */ }
    setDisalin(true); clearTimeout(timer.current); timer.current = setTimeout(() => setDisalin(false), 1600)
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.2em] text-ember-ink">{tr('Titik api terdeteksi', 'Fire point detected')}</p>
          <h2 className="judul-display m-0 mt-1 text-[3.5rem] leading-[0.9]"><span className="sr-only">Hotspot </span>{h.id}</h2>
          <div className="mt-2"><BadgeDemo /></div>
        </div>
        <button onClick={onClose} aria-label={tr('Tutup detail', 'Close details')} className="flex size-9 items-center justify-center rounded-xl text-ink-2 transition-[color,background-color,rotate] duration-200 ease-snap hover:rotate-90 hover:bg-line/50 hover:text-ink"><X size={18} aria-hidden="true" /></button>
      </div>

      <dl className="m-0 mt-5">
        {/* Koordinat: ketuk untuk menyalin */}
        <div className="border-t border-line py-3">
          <Label>{tr('Koordinat', 'Coordinates')}</Label>
          <dd className="m-0 mt-1">
            <button type="button" onClick={salin} aria-label={`${tr('Salin koordinat', 'Copy coordinates')}: ${koordinat}`}
              className="group/c flex w-full items-center justify-between gap-3 rounded-lg text-left transition-[background-color] duration-150 hover:bg-line/40">
              <span className="flex items-center gap-2 font-mono text-xl font-bold tabular-nums"><Crosshair size={16} aria-hidden="true" className="text-ember-ink transition-transform duration-500 ease-snap group-hover/c:rotate-90" />{koordinat}</span>
              <span className={`flex items-center gap-1 text-[11px] font-semibold transition-[color,opacity] duration-200 ${disalin ? 'text-canopy opacity-100' : 'text-ink-2 opacity-0 group-hover/c:opacity-100 group-focus-visible/c:opacity-100'}`}>
                {disalin ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}{disalin ? tr('Disalin', 'Copied') : tr('Salin', 'Copy')}
              </span>
            </button>
            <span role="status" className="sr-only">{disalin ? tr('Koordinat disalin', 'Coordinates copied') : ''}</span>
          </dd>
        </div>

        {/* Angin dan kepercayaan berdampingan: dua pembacaan visual, bukan dua baris teks */}
        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-4 border-t border-line py-3">
          <div>
            <Label>{tr('Angin (sampel)', 'Wind (sample)')}</Label>
            <dd className="m-0 mt-2 flex items-center gap-3">
              <svg viewBox="-24 -24 48 48" className="size-14 shrink-0" aria-hidden="true">
                <circle r="21" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                {[0, 90, 180, 270].map((a) => <line key={a} y1="-21" y2="-17" transform={`rotate(${a})`} stroke="var(--text-2)" strokeWidth="1.2" />)}
                <g style={{ transform: `rotate(${sapu ? h.angin.theta : 0}deg)`, transition: 'transform 900ms cubic-bezier(.2,.9,.2,1.15)' }}>
                  <line y1="-15" y2="8" stroke="var(--ember)" strokeWidth="2.4" strokeLinecap="round" />
                  <polygon points="-5,5 5,5 0,15" fill="var(--ember)" />
                </g>
              </svg>
              <span className="min-w-0 leading-tight">
                <span className="block font-mono text-xl font-bold tabular-nums">{h.angin.U}<span className="ml-0.5 text-xs font-normal text-ink-2">m/s</span></span>
                <span className="block text-xs text-ink-2">{tr(`dari ${namaArah(h.angin.theta)}`, `from the ${namaArah(h.angin.theta, 'en')}`)} ({h.angin.theta}°)</span>
              </span>
            </dd>
          </div>
          <div>
            <Label>{tr('Tingkat kepercayaan', 'Confidence level')}</Label>
            <dd className="m-0 mt-2">
              <span aria-hidden="true" className="flex h-8 items-end gap-1">
                {[1, 2, 3].map((n) => <span key={n} className={`w-3 rounded-sm transition-[height,background-color] duration-500 ease-snap ${n <= level ? 'bg-ember' : 'bg-line'}`} style={{ height: `${n * 33}%`, transitionDelay: `${n * 90}ms` }} />)}
              </span>
              <span className="mt-1 block text-sm font-bold">{tr(kl, ke)}</span>
            </dd>
          </div>
        </div>

        <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-4 border-t border-line py-3">
          <div>
            <Label>{tr('Jenis lahan', 'Land type')}</Label>
            <dd className="m-0 mt-2 flex items-center gap-2.5">
              <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canopy/25 text-mint"><Lahan size={18} /></span>
              <span className="text-sm font-bold leading-tight">{namaLahan(h.jenisLahan, b)}</span>
            </dd>
          </div>
          <div>
            <Label>{tr('Waktu deteksi', 'Detection time')}</Label>
            <dd className="m-0 mt-2 leading-tight">
              <span className="block font-mono text-xl font-bold tabular-nums">{jam}<span className="ml-1 text-[11px] font-normal text-ink-2">WIB</span></span>
              <span className="block text-xs text-ink-2">{tanggal}</span>
            </dd>
          </div>
        </div>
      </dl>

      <button type="button" onClick={onSimulasi}
        className="group/s relative mt-2 flex min-h-14 w-full items-center justify-between overflow-hidden rounded-2xl bg-ember px-5 text-base font-bold text-on-ember transition-[scale,filter] duration-200 ease-snap hover:brightness-110 active:scale-[0.98]">
        <span aria-hidden="true" className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-surface/30 opacity-0 transition-[translate,opacity] duration-700 ease-snap group-hover/s:translate-x-[420%] group-hover/s:opacity-100" />
        <span className="relative">{tr('Simulasikan titik ini', 'Simulate this point')}</span>
        <ArrowRight size={20} aria-hidden="true" className="relative transition-transform duration-300 ease-snap group-hover/s:translate-x-1" />
      </button>
      <p className="m-0 mt-3 text-xs text-ink-2">{tr('Titik ini contoh untuk demonstrasi, bukan deteksi nyata.', 'This point is a sample for demonstration, not a real detection.')}</p>
    </div>
  )
}
