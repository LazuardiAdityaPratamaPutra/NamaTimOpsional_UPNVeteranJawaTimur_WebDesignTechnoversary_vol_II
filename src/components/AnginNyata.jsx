import { useId, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { SUMBER_ANGIN } from '../data/angin'
import { MAKS_KECEPATAN_GRAFIK, SERI_ARSIP, bacaJam, namaZona, ringkasHarian, samaDenganData } from '../lib/angin'
import { useAnginLangsung } from '../lib/useAnginLangsung'
import { namaArah, desimal } from '../lib/format'
import { useBahasa, useTr } from '../i18n'

const L = 288, T = 52 // lebar dan tinggi area batang (satuan viewBox)

// Waktu dibaca sebagai waktu dinding lokal lokasi (disimpan sebagai UTC), jadi diformat dengan zona UTC.
const fmt = (instan, b, opsi) => instan.toLocaleDateString(b === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'UTC', ...opsi })

/**
 * Angin per jam di lokasi titik api (Open-Meteo, 72 jam: kemarin, hari ini, besok) dengan cadangan arsip nyata
 * 19–21 Agustus 2026. Memilih jam langsung mengisi kecepatan dan arah angin simulasi.
 * `indeks` = jam terpilih atau null bila belum memakai data.
 */
export default function AnginNyata({ lat, lon, params, onParams, indeks, onIndeks }) {
  const b = useBahasa()
  const tr = useTr()
  const uid = useId()
  const [mode, setMode] = useState('langsung') // 'langsung' | 'arsip'
  const [ulang, setUlang] = useState(0)
  const live = useAnginLangsung(lat, lon, mode === 'langsung', ulang)
  const memuat = mode === 'langsung' && live.status === 'memuat'
  const gagal = mode === 'langsung' && live.status === 'gagal'
  const seri = mode === 'arsip' || gagal ? SERI_ARSIP : live.seri
  const adalahArsip = seri === SERI_ARSIP

  const ganti = (m) => { setMode(m); onIndeks(null) }
  const coba = () => { setUlang((n) => n + 1); onIndeks(null) }

  const header = (
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2">{tr('Angin nyata', 'Observed wind')}</p>
        <h3 id={`${uid}-j`} className="!m-0 !mt-1 !text-sm !font-semibold !leading-snug text-ink">
          {seri
            ? `${fmt(bacaJam(seri, 0).instan, b, { day: 'numeric', month: 'short' })} – ${fmt(bacaJam(seri, seri.waktu.length - 1).instan, b, { day: 'numeric', month: 'short', year: 'numeric' })}, ${tr('per jam', 'hourly')}`
            : tr('72 jam di lokasi ini', '72 hours at this location')}
        </h3>
      </div>
      <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-2">Open-Meteo</span>
    </div>
  )

  const pilihSumber = (
    <div role="group" aria-label={tr('Sumber data angin', 'Wind data source')} className="mt-3 grid grid-cols-2 gap-1 rounded-xl border border-line p-1">
      {[['langsung', tr('Titik ini', 'This point')], ['arsip', tr('Arsip Agu 2026', 'Aug 2026 archive')]].map(([k, label]) => (
        <button key={k} type="button" aria-pressed={mode === k} onClick={() => ganti(k)}
          className={`min-h-9 rounded-lg px-2 text-xs font-semibold transition-[background-color,color,scale] duration-150 ease-snap active:scale-95 ${mode === k ? 'bg-ember-ink text-on-ember' : 'text-ink hover:bg-line/50'}`}>{label}</button>
      ))}
    </div>
  )

  if (memuat || !seri) {
    return (
      <section aria-labelledby={`${uid}-j`} className="rounded-2xl border border-line p-3.5">
        {header}{pilihSumber}
        <p role="status" className="m-0 mt-4 flex min-h-24 items-center gap-2 text-xs text-ink-2">
          <span className="size-2 rounded-full bg-amber motion-safe:animate-pulse" aria-hidden="true" />{tr('Memuat angin di lokasi titik api…', 'Loading wind at the fire point…')}
        </p>
      </section>
    )
  }

  const zona = namaZona(seri.offsetDetik)
  const hari = ringkasHarian(seri)
  const jumlahJam = seri.waktu.length
  const lebarBatang = L / jumlahJam
  const aktif = indeks != null
  const d = aktif ? bacaJam(seri, indeks) : null
  const manual = aktif && !samaDenganData(seri, indeks, params)
  const hariAktif = aktif ? Math.floor(indeks / 24) : -1
  const jamHari = aktif ? indeks % 24 : 12
  const pilih = (i) => {
    const x = bacaJam(seri, i)
    onIndeks(x.indeks)
    onParams({ ...params, U: x.U, theta: x.theta })
  }
  // Ketuk di grafik: pilih jam terdekat (papan ketik memakai penggeser di bawahnya)
  const dariGrafik = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    pilih(Math.floor(((e.clientX - r.left) / r.width) * jumlahJam))
  }
  const teksNilai = d
    ? `${fmt(d.instan, b, { weekday: 'long', day: 'numeric', month: 'long' })}, ${String(d.jam).padStart(2, '0')}.00 ${zona}: ${desimal(d.U.toFixed(2), b)} m/s ${tr(`dari ${namaArah(d.theta)}`, `from the ${namaArah(d.theta, 'en')}`)} (${d.theta}°)`
    : tr('Belum dipilih', 'Not selected')
  const koordinat = `${Math.abs(seri.lintang).toFixed(2)}° ${seri.lintang < 0 ? tr('LS', 'S') : tr('LU', 'N')}, ${Math.abs(seri.bujur).toFixed(2)}° ${tr('BT', 'E')}`

  return (
    <section aria-labelledby={`${uid}-j`} className="rounded-2xl border border-line p-3.5">
      {header}{pilihSumber}

      {gagal && (
        <div role="status" className="mt-3 rounded-xl border border-amber bg-amber/10 p-2.5 text-xs leading-snug text-ink">
          {tr('Angin langsung tidak bisa dimuat (mungkin sedang offline). Yang tampil adalah arsip nyata Agustus 2026.', 'Live wind could not be loaded (you may be offline). Showing the real August 2026 archive instead.')}{' '}
          <button type="button" onClick={coba} className="inline-flex min-h-8 items-center gap-1 rounded-lg px-1 font-semibold text-ember-ink underline underline-offset-2 hover:bg-line/50">{tr('Coba lagi', 'Try again')}</button>
        </div>
      )}

      {/* Hari: rata-rata kecepatan; ketuk untuk memakai jam yang sama pada hari itu */}
      <div role="group" aria-label={tr('Pilih hari', 'Choose a day')} className="mt-3 grid grid-cols-3 gap-1.5">
        {hari.map((h, k) => {
          const on = k === hariAktif
          const instan = bacaJam(seri, h.mulai).instan
          return (
            <button key={h.tanggal} type="button" aria-pressed={on} onClick={() => pilih(k * 24 + jamHari)}
              className={`flex min-h-14 flex-col items-start justify-center gap-0.5 whitespace-nowrap rounded-xl border px-2 py-1.5 text-left transition-[background-color,border-color,color,scale] duration-150 ease-snap active:scale-95 ${on ? 'border-ember-ink bg-ember-ink text-on-ember' : 'border-line text-ink hover:border-ember-ink'}`}>
              <span className="text-[13px] font-semibold">{fmt(instan, b, { day: 'numeric', month: 'short' })}</span>
              <span className={`font-mono text-[11px] tabular-nums ${on ? 'opacity-95' : 'text-ink-2'}`}>
                <span className="sr-only">{fmt(instan, b, { weekday: 'long' })}, {tr('rata-rata', 'average')} </span>{desimal(h.rata.toFixed(1), b)} m/s
              </span>
            </button>
          )
        })}
      </div>

      {/* Grafik kecepatan: satu seri; batang terpilih berwarna aksen, sisanya netral */}
      <div className="mt-3">
        <svg viewBox={`0 0 ${L} ${T + 18}`} role="img" onPointerDown={dariGrafik} className="block w-full cursor-pointer touch-pan-y"
          aria-label={tr(`Grafik kecepatan angin ${jumlahJam} jam, 0 sampai ${MAKS_KECEPATAN_GRAFIK} meter per detik. Gunakan penggeser di bawahnya untuk memilih jam.`, `Wind speed chart over ${jumlahJam} hours, 0 to ${MAKS_KECEPATAN_GRAFIK} metres per second. Use the slider below to choose an hour.`)}>
          {[2, 4].map((v) => <line key={v} x1="0" x2={L} y1={T - (v / MAKS_KECEPATAN_GRAFIK) * T} y2={T - (v / MAKS_KECEPATAN_GRAFIK) * T} stroke="var(--border)" strokeWidth="0.6" strokeDasharray="2 3" />)}
          {seri.U.map((u, i) => {
            const h = Math.min(T, Math.max(1.5, (u / MAKS_KECEPATAN_GRAFIK) * T))
            const on = i === indeks
            return <rect key={i} x={i * lebarBatang + 0.5} y={T - h} width={lebarBatang - 1} height={h} rx="1" fill={on ? 'var(--ember)' : 'var(--text-2)'} opacity={on ? 1 : aktif ? 0.4 : 0.55} />
          })}
          {hari.slice(1).map((h) => <line key={h.mulai} x1={h.mulai * lebarBatang} x2={h.mulai * lebarBatang} y1="0" y2={T + 4} stroke="var(--text-2)" strokeOpacity="0.5" strokeWidth="0.8" />)}
          <line x1="0" x2={L} y1={T} y2={T} stroke="var(--text-2)" strokeOpacity="0.5" strokeWidth="0.8" />
          {hari.map((h) => <text key={h.mulai} x={h.mulai * lebarBatang + 2} y={T + 15} fontSize="10" fill="var(--text-2)" className="font-mono">{fmt(bacaJam(seri, h.mulai).instan, b, { day: 'numeric', month: 'short' })}</text>)}
          <text x={L - 1} y="9" textAnchor="end" fontSize="10" fill="var(--text-2)" className="font-mono">{MAKS_KECEPATAN_GRAFIK} m/s</text>
        </svg>
        <input type="range" min={0} max={jumlahJam - 1} step={1} value={indeks ?? 0} aria-label={tr('Jam data angin', 'Wind data hour')} aria-valuetext={teksNilai}
          onChange={(e) => pilih(Number(e.target.value))}
          className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-line outline-offset-4 [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-surface [&::-moz-range-thumb]:bg-ember [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-surface [&::-webkit-slider-thumb]:bg-ember [&::-webkit-slider-thumb]:shadow-md" />
      </div>

      {/* Pembacaan jam terpilih */}
      <div className="mt-3 min-h-[3.25rem]" aria-live="polite">
        {d ? (
          <>
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">
              {fmt(d.instan, b, { weekday: 'short', day: 'numeric', month: 'short' })} · {String(d.jam).padStart(2, '0')}.00 {zona}
            </p>
            <p className="m-0 mt-0.5 text-sm">
              <span className="font-mono text-lg font-bold tabular-nums">{desimal(d.U.toFixed(2), b)}</span><span className="ml-0.5 text-xs text-ink-2">m/s</span>
              <span className="text-ink-2"> · {tr(`dari ${namaArah(d.theta)}`, `from the ${namaArah(d.theta, 'en')}`)} ({d.theta}°)</span>
            </p>
          </>
        ) : (
          <p className="m-0 text-xs leading-snug text-ink-2">{tr('Geser penggeser atau ketuk grafik untuk memakai angin pada jam itu sebagai skenario simulasi.', 'Drag the slider or tap the chart to use the wind at that hour as the simulation scenario.')}</p>
        )}
        {manual && (
          <button type="button" onClick={() => pilih(indeks)} className="mt-1.5 inline-flex min-h-8 items-center gap-1.5 rounded-lg px-1 text-xs font-semibold text-ember-ink transition-[background-color,scale] duration-150 ease-snap hover:bg-line/50 active:scale-95">
            <RotateCcw size={13} aria-hidden="true" />{tr('Diubah manual. Kembalikan ke data', 'Edited by hand. Restore the data')}
          </button>
        )}
      </div>

      <p className="m-0 mt-2 border-t border-line pt-2 text-[11px] leading-snug text-ink-2">
        {adalahArsip
          ? tr(`Arsip nyata. ${SUMBER_ANGIN.lokasi} (${koordinat}), ${SUMBER_ANGIN.tinggi} di atas tanah. Lokasinya bukan lokasi titik api yang dipilih, jadi angin ini dipakai sebagai skenario.`,
              `Real archive. ${SUMBER_ANGIN.en.lokasi} (${koordinat}), ${SUMBER_ANGIN.tinggi} above ground. It is not the selected fire point's location, so this wind is used as a scenario.`)
          : tr(`Angin di petak grid terdekat dari titik api (${koordinat}), ${SUMBER_ANGIN.tinggi} di atas tanah, zona waktu ${zona}. Jam yang sudah lewat berupa analisis, jam berikutnya prakiraan.`,
              `Wind at the grid cell nearest the fire point (${koordinat}), ${SUMBER_ANGIN.tinggi} above ground, ${zona} time. Past hours are analysis, later hours are forecast.`)}{' '}
        {tr('Data', 'Data')}: <a href={SUMBER_ANGIN.tautan} target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-2 hover:text-ember-ink">{adalahArsip ? SUMBER_ANGIN.nama : 'Open-Meteo Weather API'}<span className="sr-only"> {tr('(buka di tab baru)', '(opens in new tab)')}</span></a> ({SUMBER_ANGIN.lisensi}).
      </p>
    </section>
  )
}
