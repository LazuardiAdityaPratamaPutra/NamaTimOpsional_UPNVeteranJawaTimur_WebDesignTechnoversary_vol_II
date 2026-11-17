import { useRef } from 'react'
import { namaArah } from '../lib/format'
import { useBahasa } from '../i18n'

// Kompas arah ASAL angin. Seret titik di tepi, atau pakai tombol panah (Shift = 15 derajat).
// Garis-garis tipis di dalamnya mengalir searah tiupan; makin kencang angin, makin cepat alirannya.
export default function WindCompass({ value, onChange, kecepatan = 0 }) {
  const ref = useRef(null)
  const b = useBahasa()
  const huruf = b === 'en' ? ['N', 'E', 'S', 'W'] : ['U', 'T', 'S', 'B']
  const dekat = Math.round(value / 90) % 4 // huruf mata angin terdekat dengan asal angin

  const dariPointer = (e) => {
    const r = ref.current.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    onChange(Math.round(((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360))
  }
  const onKey = (e) => {
    const langkah = e.shiftKey ? 15 : 5
    const arah = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key]
    if (!arah) return
    e.preventDefault()
    onChange((value + arah * langkah + 360) % 360)
  }
  const dur = `${Math.max(0.55, 2.6 - kecepatan * 0.11).toFixed(2)}s`

  return (
    <svg ref={ref} viewBox="-70 -70 140 140" className="group/k mx-auto size-48 cursor-grab touch-none select-none active:cursor-grabbing"
      tabIndex={0} role="slider" aria-label={b === 'en' ? 'Direction the wind comes from' : 'Arah asal angin'}
      aria-valuemin={0} aria-valuemax={359} aria-valuenow={value}
      aria-valuetext={b === 'en' ? `Wind from the ${namaArah(value, 'en')}, ${value} degrees` : `Angin dari ${namaArah(value)}, ${value} derajat`}
      onKeyDown={onKey}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dariPointer(e) }}
      onPointerMove={(e) => { if (e.buttons) dariPointer(e) }}>
      <defs>
        <radialGradient id="kompas-isi" r="1"><stop offset="0" stopColor="var(--ember)" stopOpacity="0.16" /><stop offset="1" stopColor="var(--ember)" stopOpacity="0" /></radialGradient>
        <clipPath id="kompas-klip"><circle r="46" /></clipPath>
      </defs>
      <circle r="52" fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />
      <circle r="46" fill="url(#kompas-isi)" />
      {/* Skala derajat: tiap 15 derajat, tebal tiap 45 */}
      {Array.from({ length: 24 }, (_, i) => (
        <line key={i} y1={-52} y2={i % 3 === 0 ? -45 : -48.5} transform={`rotate(${i * 15})`} stroke={i % 6 === 0 ? 'var(--text)' : 'var(--text-2)'} strokeWidth={i % 3 === 0 ? 1.6 : 0.8} opacity={i % 3 === 0 ? 0.9 : 0.55} />
      ))}
      {[[huruf[0], 0, -62], [huruf[1], 62, 0], [huruf[2], 0, 62], [huruf[3], -62, 0]].map(([l, x, y], i) => (
        <text key={l} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight={i === dekat ? 800 : 500} style={{ fill: i === dekat ? 'var(--ember-ink)' : 'var(--text-2)', transition: 'fill .25s' }}>{l}</text>
      ))}
      {/* Aliran angin: berputar bersama arah asal, mengalir ke seberang */}
      <g transform={`rotate(${value})`} clipPath="url(#kompas-klip)" style={{ transition: 'transform .12s ease-out' }}>
        {kecepatan > 0 && [-28, -14, 0, 14, 28].map((x, i) => (
          <line key={x} x1={x} x2={x} y1={-8} y2={8} stroke="var(--ember)" strokeWidth="1.6" strokeLinecap="round" className="angin-alir" style={{ '--dur': dur, animationDelay: `${-i * 0.37}s` }} />
        ))}
        <line x1="0" y1="-40" x2="0" y2="26" strokeWidth="3" strokeLinecap="round" style={{ stroke: 'var(--ember)' }} />
        <polygon points="-8,22 8,22 0,38" style={{ fill: 'var(--ember)' }} />
      </g>
      <g transform={`rotate(${value})`} style={{ transition: 'transform .12s ease-out' }}>
        <circle cx="0" cy="-52" r="8.5" className="transition-[r] duration-200 group-hover/k:[r:10px]" style={{ fill: 'var(--ember)', stroke: 'var(--surface)' }} strokeWidth="2.5" />
        <circle cx="0" cy="-52" r="2.5" style={{ fill: 'var(--surface)' }} />
      </g>
      <text y="1" textAnchor="middle" dominantBaseline="central" className="font-mono" fontSize="13" fontWeight="700" style={{ fill: 'var(--text)', paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 4 }}>{value}°</text>
    </svg>
  )
}
