import { kurangiGerak } from '../lib/gerak'
import { useLayoutEffect, useRef, useState } from 'react'
import { ChevronDown, RotateCcw, SlidersHorizontal, X } from 'lucide-react'
import { FAKTOR, BOBOT_AWAL, AMBANG, SKENARIO } from '../lib/prioritas'
import { namaLahan } from '../lib/format'
import { useBahasa, useTr } from '../i18n'

const TINGKAT = {
  utama: ['Utama', 'Top', 'bg-ember-ink text-on-ember', 'text-ember-ink'],
  sedang: ['Sedang', 'Medium', 'bg-amber text-bg', 'text-amber'],
  pantau: ['Pantau', 'Watch', 'border border-line text-ink', 'text-ink-2'],
}
const STEP = 5
const sama = (a, b) => FAKTOR.every(([k]) => a[k] === b[k])

/** Batang skor 0-100: tiap faktor menyumbang potongan warnanya; dua garis tipis menandai ambang Sedang dan Utama. */
const Segmen = ({ r, tebal = false }) => {
  const tr = useTr()
  return (
    <span role="img" aria-label={FAKTOR.map(([k, idn, en]) => `${tr(idn, en)} ${r.sumbang[k].toFixed(0)}`).join(', ')}
      className={`relative flex w-full overflow-hidden rounded-full bg-line/60 ${tebal ? 'h-2.5' : 'h-2'}`}>
      {FAKTOR.map(([k, , , warna]) => <span key={k} className={`h-full ${warna} transition-[width] duration-500 ease-snap`} style={{ width: `${r.sumbang[k]}%` }} />)}
      {[AMBANG.sedang, AMBANG.utama].map((a) => <span key={a} aria-hidden="true" className="absolute inset-y-0 w-px bg-bg/80" style={{ left: `${a}%` }} />)}
    </span>
  )
}

/** Baris yang berpindah urutan meluncur ke tempat barunya (FLIP), bukan melompat. */
function useGeser(kunci) {
  const ref = useRef(new Map())
  const lama = useRef(new Map())
  useLayoutEffect(() => {
    const hemat = kurangiGerak()
    ref.current.forEach((el, id) => {
      const t = el.getBoundingClientRect().top
      const p = lama.current.get(id)
      if (!hemat && p !== undefined && Math.abs(p - t) > 1) el.animate([{ translate: `0 ${p - t}px` }, { translate: '0 0' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' })
      lama.current.set(id, t)
    })
  }, [kunci])
  return (id) => (el) => { if (el) ref.current.set(id, el); else ref.current.delete(id) }
}

/**
 * Pembagi bobot: satu batang 100% yang dibagi enam faktor. Geser garis pemisah untuk memindahkan bobot
 * antara dua faktor bertetangga (jumlah tetap). Tiap pemisah juga slider yang bisa digeser dengan panah.
 */
function Pembagi({ bobot, onBobot }) {
  const tr = useTr()
  const kotak = useRef(null)
  const [geser, setGeser] = useState(null) // indeks pemisah yang sedang ditarik
  const [sorot, setSorot] = useState(null)
  const total = FAKTOR.reduce((a, [k]) => a + bobot[k], 0) || 1
  const kum = FAKTOR.reduce((acc, [k], i) => [...acc, (acc[i] ?? 0) + bobot[k]], [0]) // batas kumulatif tiap segmen

  const pindahKe = (i, nilai) => {
    const kiri = FAKTOR[i][0], kanan = FAKTOR[i + 1][0]
    const lo = kum[i] + STEP, hi = kum[i + 2] - STEP
    const n = Math.max(lo, Math.min(hi, Math.round(nilai / STEP) * STEP))
    if (n === kum[i + 1]) return
    onBobot({ ...bobot, [kiri]: n - kum[i], [kanan]: kum[i + 2] - n })
  }
  const dariPointer = (e) => {
    const r = kotak.current.getBoundingClientRect()
    return ((e.clientX - r.left) / r.width) * total
  }
  const info = (i) => `${tr(FAKTOR[i][1], FAKTOR[i][2])} ${bobot[FAKTOR[i][0]]} · ${tr(FAKTOR[i + 1][1], FAKTOR[i + 1][2])} ${bobot[FAKTOR[i + 1][0]]}`
  const fokusInfo = geser ?? sorot

  return (
    <div>
      <div ref={kotak} className="relative flex h-12 touch-none select-none rounded-xl">
        {FAKTOR.map(([k, idn, en, warna], i) => (
          <span key={k} title={`${tr(idn, en)}: ${bobot[k]}`} onPointerEnter={() => setSorot(i)} onPointerLeave={() => setSorot(null)}
            className={`relative flex min-w-0 items-end justify-center overflow-hidden pb-1 font-mono text-[11px] font-bold tabular-nums transition-[flex-basis,filter,opacity] duration-300 ease-snap first:rounded-l-xl last:rounded-r-xl ${warna} ${sorot !== null && sorot !== i && geser === null ? 'opacity-70' : ''}`}
            style={{ flexBasis: `${(bobot[k] / total) * 100}%`, flexGrow: 0, flexShrink: 0 }}>
            <span className="text-bg mix-blend-luminosity">{bobot[k] >= 10 ? bobot[k] : ''}</span>
          </span>
        ))}
        {FAKTOR.slice(0, -1).map(([k], i) => (
          <button key={k} type="button" role="slider" aria-label={`${tr('Batas bobot', 'Weight boundary')}: ${tr(FAKTOR[i][1], FAKTOR[i][2])} / ${tr(FAKTOR[i + 1][1], FAKTOR[i + 1][2])}`}
            aria-valuemin={kum[i] + STEP} aria-valuemax={kum[i + 2] - STEP} aria-valuenow={kum[i + 1]} aria-valuetext={info(i)}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setGeser(i) }}
            onPointerMove={(e) => { if (geser === i) pindahKe(i, dariPointer(e)) }}
            onPointerUp={() => setGeser(null)} onPointerCancel={() => setGeser(null)}
            onKeyDown={(e) => { const d = { ArrowRight: STEP, ArrowUp: STEP, ArrowLeft: -STEP, ArrowDown: -STEP }[e.key]; if (d) { e.preventDefault(); pindahKe(i, kum[i + 1] + d) } }}
            className="group/p absolute -top-1 bottom-[-4px] z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center outline-none [transition:left_300ms_var(--ease-snap,ease)] data-[tarik=true]:[transition:none]"
            data-tarik={geser === i} style={{ left: `${(kum[i + 1] / total) * 100}%` }}>
            <span aria-hidden="true" className={`flex h-14 w-3.5 items-center justify-center rounded-full border-2 border-bg bg-ink shadow-md transition-[scale,background-color] duration-150 group-hover/p:scale-110 group-focus-visible/p:ring-2 group-focus-visible/p:ring-ember ${geser === i ? 'scale-110 bg-ember-ink' : ''}`}>
              <span className="h-5 w-0.5 rounded-full bg-bg/70" />
            </span>
          </button>
        ))}
      </div>
      <p aria-live="polite" className="m-0 mt-2 min-h-4 text-[11px] leading-tight text-ink-2">
        {fokusInfo === null ? tr('Geser garis pemisah untuk memindahkan bobot. Jumlah selalu 100.', 'Drag a divider to move weight. The total is always 100.') : info(fokusInfo)}
      </p>
      <ul className="m-0 mt-2 grid list-none grid-cols-2 gap-x-3 gap-y-1 p-0">
        {FAKTOR.map(([k, idn, en, warna], i) => (
          <li key={k} onPointerEnter={() => setSorot(i)} onPointerLeave={() => setSorot(null)} className="flex items-center justify-between gap-2 text-[11px] text-ink">
            <span className="flex min-w-0 items-center gap-1.5"><span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${warna}`} /><span className="truncate">{tr(idn, en)}</span></span>
            <span className="font-mono tabular-nums text-ink-2">{bobot[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Panel prioritas: filter tingkat, peringkat berbatang yang berpindah halus, dan pembagi bobot dengan skenario siap pakai. */
export default function PanelPrioritas({ daftar, bobot, onBobot, terpilih, onPilih, onTutup }) {
  const tr = useTr()
  const b = useBahasa()
  const [bobotBuka, setBobotBuka] = useState(false)
  const [saring, setSaring] = useState(null) // tingkat yang disaring, atau null = semua
  const bawaan = sama(bobot, BOBOT_AWAL)
  const hitung = (t) => daftar.filter((r) => r.tingkat === t).length
  const tampil = saring ? daftar.filter((r) => r.tingkat === saring) : daftar
  const geserBaris = useGeser(`${tampil.map((r) => r.id).join()}|${terpilih}|${bobotBuka}`)

  return (
    <aside aria-label={tr('Prioritas penanganan hotspot', 'Hotspot response priority')} data-tur="prioritas"
      className="absolute inset-x-0 bottom-0 z-[1000] flex max-h-[62%] flex-col overflow-hidden rounded-t-2xl border border-line bg-surface/95 shadow-xl backdrop-blur-md motion-safe:[animation:tile-masuk_.3s_cubic-bezier(.2,.8,.2,1)_both] md:inset-x-auto md:bottom-auto md:left-3 md:top-[4.25rem] md:max-h-[calc(100%-10.5rem)] md:w-[21rem] md:rounded-2xl">
      <header className="flex items-center gap-3 px-4 pb-2 pt-3">
        <div className="min-w-0 flex-1">
          <h2 className="!m-0 !font-sans !text-base !font-extrabold !leading-tight !tracking-normal !normal-case">{tr('Prioritas penanganan', 'Response priority')}</h2>
          <p className="m-0 mt-0.5 text-[11px] leading-snug text-ink-2">{tr('Hujan dan penduduk: data ilustrasi', 'Rain and population: illustrative data')}</p>
        </div>
        <button type="button" aria-expanded={bobotBuka} onClick={() => setBobotBuka(!bobotBuka)}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-[background-color,color] duration-150 ${bobotBuka ? 'bg-ember-ink text-on-ember' : 'text-ember-ink hover:bg-line/50'}`}>
          <SlidersHorizontal size={15} aria-hidden="true" />{tr('Bobot', 'Weights')}
        </button>
        <button type="button" onClick={onTutup} aria-label={tr('Tutup panel prioritas', 'Close priority panel')}
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-ink-2 transition-[color,background-color] duration-150 hover:bg-line/50 hover:text-ink"><X size={18} aria-hidden="true" /></button>
      </header>

      {/* Sebaran tingkat: batang tunggal, lebar mengikuti jumlah; ketuk satu bagian untuk menyaring daftar */}
      <div role="group" aria-label={tr('Saring menurut tingkat', 'Filter by tier')} className="flex gap-1 px-4 pb-3">
        {Object.entries(TINGKAT).map(([t, [li, le, kls]]) => {
          const n = hitung(t)
          return (
            <button key={t} type="button" aria-pressed={saring === t} onClick={() => setSaring(saring === t ? null : t)}
              className={`group/t flex min-h-10 min-w-[5.2rem] items-center justify-between gap-1.5 overflow-hidden rounded-xl px-2.5 transition-[flex-grow,opacity,scale] duration-500 ease-snap active:scale-95 ${kls} ${saring && saring !== t ? 'opacity-45' : ''} ${saring === t ? 'ring-2 ring-ink/60' : ''}`}
              style={{ flexGrow: Math.max(n, 0.6), flexBasis: 0 }}>
              <span className="truncate text-[11px] font-semibold leading-none">{tr(li, le)}</span>
              <span className="font-mono text-lg font-extrabold leading-none tabular-nums">{n}</span>
            </button>
          )
        })}
      </div>

      {bobotBuka && (
        <div className="border-t border-line px-4 py-3 motion-safe:[animation:tile-masuk_.25s_cubic-bezier(.2,.8,.2,1)_both]">
          <div role="group" aria-label={tr('Skenario bobot', 'Weight scenarios')} className="mb-3 flex items-center gap-1">
            {SKENARIO.map(([id, li, le, w]) => (
              <button key={id} type="button" aria-pressed={sama(bobot, w)} onClick={() => onBobot({ ...w })}
                className="min-h-8 rounded-full border border-line px-2.5 text-[11px] font-semibold text-ink transition-[background-color,color,border-color,scale] duration-200 ease-snap hover:border-ember-ink active:scale-95 aria-pressed:border-ember-ink aria-pressed:bg-ember-ink aria-pressed:text-on-ember">{tr(li, le)}</button>
            ))}
            <button type="button" onClick={() => onBobot({ ...BOBOT_AWAL })} disabled={bawaan} aria-label={tr('Kembalikan bobot awal', 'Reset weights')}
              className="ml-auto inline-flex size-8 shrink-0 items-center justify-center rounded-full text-ink-2 transition-[color,rotate] duration-300 ease-snap hover:text-ember-ink hover:-rotate-180 disabled:opacity-30 disabled:hover:rotate-0"><RotateCcw size={14} aria-hidden="true" /></button>
          </div>
          <Pembagi bobot={bobot} onBobot={onBobot} />
        </div>
      )}

      {/* Mobile: kartu geser; peta tetap terlihat */}
      {!bobotBuka && (
        <ol className="m-0 flex list-none snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] md:hidden">
          {tampil.map((r) => {
            const [li, le, kls] = TINGKAT[r.tingkat]
            return (
              <li key={r.id} className="w-[72%] max-w-64 shrink-0 snap-center">
                <button type="button" onClick={() => onPilih(r.id)} aria-pressed={r.id === terpilih}
                  className="relative block w-full overflow-hidden rounded-2xl border border-line bg-bg p-3 text-left transition-[scale,border-color] duration-150 ease-snap active:scale-[0.98] aria-pressed:border-ember">
                  <span aria-hidden="true" className="absolute -right-1 -top-3 font-mono text-6xl font-extrabold leading-none text-ink/10">{r.rank}</span>
                  <span className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${kls}`}>{tr(li, le)}</span><span className="text-xs text-ink-2">#{r.rank}</span></span>
                  <span className="mt-2 flex items-baseline justify-between"><span className="text-base font-extrabold text-ink">{r.id}</span><span className="font-mono text-2xl font-extrabold tabular-nums text-ink">{r.skor.toFixed(0)}</span></span>
                  <span className="mb-2 block text-xs text-ink-2">{namaLahan(r.hotspot.jenisLahan, b)} · {r.ancaman.jumlah} {tr('permukiman terjangkau', 'settlements reached')}</span>
                  <Segmen r={r} />
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {/* Desktop: peringkat berbatang. Baris terpilih membuka rincian tiap faktor; urutan baru meluncur saat bobot berubah. */}
      <ol className="m-0 hidden min-h-0 list-none overflow-y-auto sembunyi-gulir border-t border-line p-1.5 md:block">
        {tampil.map((r) => {
          const [li, le, , teks] = TINGKAT[r.tingkat]
          const aktif = r.id === terpilih
          return (
            <li key={r.id} ref={geserBaris(r.id)}>
              <button type="button" onClick={() => onPilih(r.id)} aria-pressed={aktif}
                className={`group/baris grid w-full grid-cols-[2.1rem_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-xl px-2 py-2 text-left transition-[background-color] duration-150 ${aktif ? 'bg-bg' : 'hover:bg-line/40'}`}>
                <span aria-hidden="true" className={`font-display text-4xl font-extrabold leading-none [font-stretch:76%] transition-[color,-webkit-text-stroke-color,scale] duration-300 ease-snap [-webkit-text-stroke:1.5px_var(--text-2)] group-hover/baris:scale-110 ${aktif ? 'text-ember-ink [-webkit-text-stroke-color:var(--ember-ink)]' : 'text-transparent'}`}>{r.rank}</span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="truncate text-sm font-bold text-ink">{r.id}</span>
                    <span className="truncate text-[11px] text-ink-2">{namaLahan(r.hotspot.jenisLahan, b).split(' ')[0]}</span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider ${teks}`}>{tr(li, le)}</span>
                  </span>
                  <span className="mt-1.5 block"><Segmen r={r} tebal /></span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-mono text-xl font-bold tabular-nums text-ink">{r.skor.toFixed(0)}</span>
                  <ChevronDown size={14} aria-hidden="true" className={`shrink-0 text-ink-2 transition-transform duration-200 ${aktif ? 'rotate-180' : '-rotate-90 opacity-0 group-hover/baris:opacity-100'}`} />
                </span>
              </button>
              {aktif && (
                <dl className="m-0 mb-1 ml-[2.6rem] mr-2 space-y-1.5 rounded-xl bg-bg px-3 pb-2.5 pt-2 motion-safe:[animation:tile-masuk_.25s_cubic-bezier(.2,.8,.2,1)_both]">
                  {FAKTOR.map(([k, idn, en, warna]) => (
                    <div key={k} className="grid grid-cols-[8.6rem_minmax(0,1fr)_1.5rem] items-center gap-x-2 text-[11px] text-ink-2">
                      <dt className="truncate">{tr(idn, en)} <span className="font-mono opacity-60">×{bobot[k]}</span></dt>
                      <dd className="m-0 h-1.5 overflow-hidden rounded-full bg-line/60" aria-hidden="true"><span className={`block h-full rounded-full ${warna} transition-[width] duration-500 ease-snap`} style={{ width: `${r.nilai[k]}%` }} /></dd>
                      <dd className="m-0 text-right font-mono tabular-nums text-ink"><span className="sr-only">{tr('nilai', 'value')} </span>{r.nilai[k].toFixed(0)}</dd>
                    </div>
                  ))}
                  <p className="m-0 border-t border-line pt-1.5 text-[11px] text-ink-2">{tr('Simulasi menjangkau', 'Simulation reaches')} {r.ancaman.jumlah} {tr('permukiman', 'settlements')}{r.ancaman.kritis > 0 && ` (${r.ancaman.kritis} ${tr('kritis', 'critical')})`}<br />{tr('Hujan 7 hari', '7-day rain')}: {r.hotspot.curahHujan7h} mm</p>
                </dl>
              )}
            </li>
          )
        })}
        {tampil.length === 0 && <li className="p-3 text-xs text-ink-2">{tr('Tidak ada hotspot pada tingkat ini.', 'No hotspots at this tier.')}</li>}
      </ol>
    </aside>
  )
}
