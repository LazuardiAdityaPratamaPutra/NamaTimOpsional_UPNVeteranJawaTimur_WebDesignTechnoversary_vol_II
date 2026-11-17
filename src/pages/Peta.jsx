import { useEffect, useMemo, useRef, useState } from 'react'
import { CircleHelp, Info, ListOrdered, Play } from 'lucide-react'
import MapView from '../components/MapView'
import HotspotDetail from '../components/HotspotDetail'
import SimulationPanel from '../components/SimulationPanel'
import Tur from '../components/Tur'
import PanelPrioritas from '../components/PanelPrioritas'
import { Tabs } from '../components/ui'
import hotspots from '../data/hotspot.json'
import sipongi from '../data/sipongi-kaltim.json'
import sipongiLuarKaltim from '../data/sipongi-indonesia.json' // titik panas nyata provinsi lain (di luar Kaltim), format sama
import pemukiman from '../data/pemukiman.json'
import { DEMO } from '../data/demo'
import { LANGKAH_TUR } from '../data/tur'
import { useApp } from '../components/appContext'
import { useSinkron } from '../components/syncContext'
import { hitungZona, hitungKontinu } from '../lib/simulasi'
import { hitungRisiko } from '../lib/risiko'
import { hitungPrioritas, BOBOT_AWAL } from '../lib/prioritas'
import { sudahLihatTur, tandaiTur } from '../lib/tur'
import { useJudul } from '../lib/useJudul'
import { lokal, useBahasa, useTr } from '../i18n'

// [kunci, label ID, label EN, warna titik]; warna titik sekaligus berfungsi sebagai legenda
const DAFTAR_LAYER = [['sipongi', 'SiPongi', 'SiPongi', 'bg-ember ring-1 ring-ink'], ['hotspot', 'Hotspot demo', 'Demo hotspots', 'bg-flame'], ['pemukiman', 'Pemukiman', 'Settlements', 'bg-canopy'], ['zona', 'Zona', 'Zones', 'bg-amber'], ['laporan', 'Laporan', 'Reports', 'bg-mint']]
const SEMUA_LAYER = { sipongi: true, hotspot: true, pemukiman: true, zona: true, laporan: true }
// Batas wilayah demo (hotspot ilustrasi) untuk tombol "kembali ke wilayah demo"
const BATAS_DEMO = [[Math.min(...hotspots.map((h) => h.lat)), Math.min(...hotspots.map((h) => h.lon))], [Math.max(...hotspots.map((h) => h.lat)), Math.max(...hotspots.map((h) => h.lon))]]
const TGL_SIPONGI = [['2026-08-19', '19 Agu', 'Aug 19'], ['2026-08-20', '20 Agu', 'Aug 20'], ['2026-08-21', '21 Agu', 'Aug 21'], ['semua', 'Semua', 'All']]
const PARAM_DEMO = { U: DEMO.U, theta: DEMO.theta, jenisLahan: DEMO.jenisLahan }

export default function Peta() {
  const b = useBahasa()
  const tr = useTr()
  useJudul(tr('Peta dan simulasi', 'Map and simulation'))
  const langkahTurBahasa = LANGKAH_TUR.map((s) => lokal(s, b))
  const { theme } = useApp()
  // ?demo=1 (dari tombol di Home) langsung memuat skenario demo: tanpa efek, cukup nilai awal state
  const [awalDemo] = useState(() => new URLSearchParams(window.location.search).get('demo') === '1')
  const [layers, setLayers] = useState(SEMUA_LAYER)
  const [terpilih, setTerpilih] = useState(awalDemo ? DEMO.hotspotId : null)
  const [tab, setTab] = useState(awalDemo ? 'simulasi' : 'detail')
  const [params, setParams] = useState(awalDemo ? PARAM_DEMO : null) // { U, theta, jenisLahan }
  const [jalan, setJalan] = useState(awalDemo)
  const [indeksAngin, setIndeksAngin] = useState(null) // jam data angin nyata yang dipakai (0..71) atau null
  const [fokusKunci, setFokusKunci] = useState(awalDemo ? 1 : 0)
  const [t, setT] = useState(awalDemo ? DEMO.t : 6)
  const [tileGagal, setTileGagal] = useState(false)
  const [legendaBuka, setLegendaBuka] = useState(false)
  // Titik panas nyata SiPongi (Kaltim, 19–21 Agu 2026): saring per tanggal, dan bingkai peta ke sebarannya atau kembali ke wilayah demo
  const [tglSp, setTglSp] = useState('semua')
  const titikSp = useMemo(() => (tglSp === 'semua' ? sipongi.titik : sipongi.titik.filter((t) => t[2] === tglSp)), [tglSp])
  const titikLuar = useMemo(() => (tglSp === 'semua' ? sipongiLuarKaltim.titik : sipongiLuarKaltim.titik.filter((t) => t[2] === tglSp)), [tglSp])
  const [bingkai, setBingkai] = useState(null)
  // Sisakan ruang untuk panel yang menumpuk di atas peta: di ponsel panel ada di atas, di layar lebar di kiri; dock aksi di bawah
  const tumpukan = useRef(null)
  const keBatas = (batas) => {
    const r = tumpukan.current?.getBoundingClientRect(), peta = tumpukan.current?.parentElement?.getBoundingClientRect()
    const lebar = window.innerWidth >= 768
    const kiriAtas = r && peta ? (lebar ? [r.right - peta.left + 24, 64] : [24, r.bottom - peta.top + 16]) : [48, 48]
    setBingkai((x) => ({ batas, kiriAtas, kananBawah: [24, 120], kunci: (x?.kunci ?? 0) + 1 }))
  }
  const [pemAktif, setPemAktif] = useState(null)
  const [titikFokus, setTitikFokus] = useState(null)
  const [turAktif, setTurAktif] = useState(() => awalDemo && !sudahLihatTur())
  const [langkahTur, setLangkahTur] = useState(0)
  const [prioOn, setPrioOn] = useState(false)
  const [bobot, setBobot] = useState(BOBOT_AWAL)
  const { laporan } = useSinkron()
  const laporanSynced = useMemo(() => (laporan ?? []).filter((r) => r.status === 'synced'), [laporan])
  const hotspot = hotspots.find((h) => h.id === terpilih)
  const daftarPrioritas = useMemo(() => hitungPrioritas(hotspots, pemukiman, bobot), [bobot])
  const petaPrioritas = useMemo(() => (prioOn ? Object.fromEntries(daftarPrioritas.map((r) => [r.id, { rank: r.rank, tingkat: r.tingkat }])) : null), [prioOn, daftarPrioritas])
  const alihPrioritas = () => { if (!prioOn) setLayers((l) => ({ ...l, hotspot: true })); setPrioOn(!prioOn) }
  const pilihDariPrioritas = (id) => {
    const h = hotspots.find((x) => x.id === id)
    pilih(id); setTab('detail'); setTitikFokus({ lat: h.lat, lon: h.lon })
  }

  // Memilih titik api memuat angin dan lahan bawaan dari datanya
  const pilih = (id) => {
    const h = hotspots.find((x) => x.id === id)
    setTerpilih(id)
    setParams({ U: h.angin.U, theta: h.angin.theta, jenisLahan: h.jenisLahan })
    setJalan(false)
    setIndeksAngin(null)
    setPemAktif(null)
  }
  const tutup = () => { setTerpilih(null); setJalan(false); setPemAktif(null) }
  // Escape menutup panel detail/simulasi (kecuali saat tur atau dialog terbuka, atau sedang mengetik), fokus kembali ke penanda
  useEffect(() => {
    if (!terpilih) return undefined
    const tekan = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('dialog[open], [role=dialog][aria-modal=true]')) return
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) && e.target.type !== 'range') return
      const id = terpilih
      setTerpilih(null); setJalan(false); setPemAktif(null)
      setTimeout(() => document.querySelector(`.leaflet-marker-icon[title$="Hotspot ${id}"]`)?.focus({ preventScroll: true }), 60)
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [terpilih])

  // Demo Skenario: kasus contoh dari data statis, simulasi langsung jalan, panel risiko terbuka
  const muatDemo = () => {
    setLayers(SEMUA_LAYER)
    setTerpilih(DEMO.hotspotId)
    setParams(PARAM_DEMO)
    setIndeksAngin(null)
    setT(DEMO.t)
    setPemAktif(null)
    setTab('simulasi')
    setJalan(true)
    setFokusKunci((k) => k + 1)
  }

  // Tur: memuat demo lebih dulu agar semua elemen yang disorot tersedia
  const mulaiTur = () => { muatDemo(); setLangkahTur(0); setTurAktif(true) }
  const keLangkah = (n) => {
    if (n >= 1 && n <= 3) setTab('simulasi')
    setPrioOn(n === 4) // langkah 5: tampilkan panel prioritas, lalu tutup lagi saat pindah
    setLangkahTur(n)
  }
  const tutupTur = () => { tandaiTur(); setPrioOn(false); setTurAktif(false) }

  // Hitung ulang otomatis setiap input berubah (perhitungan di sisi klien)
  const dasar = hotspot && params ? { lat: hotspot.lat, lon: hotspot.lon, ...params } : null
  const zona = useMemo(() => (jalan && dasar ? hitungZona(dasar) : null), [jalan, hotspot, params]) // eslint-disable-line react-hooks/exhaustive-deps
  const waktu = useMemo(() => (jalan && dasar ? hitungKontinu(dasar, t) : null), [jalan, hotspot, params, t]) // eslint-disable-line react-hooks/exhaustive-deps

  // Daftar risiko ikut berubah setiap zona berubah (simulasi atau angin)
  const risiko = useMemo(() => (zona ? hitungRisiko(pemukiman, zona) : []), [zona])
  const kategoriPem = useMemo(() => Object.fromEntries(risiko.map((r) => [r.nama, r.kategori])), [risiko])
  const pilihPem = (p) => { setPemAktif(p.nama); setTitikFokus({ lat: p.lat, lon: p.lon }) }

  const jalankan = () => { setJalan(true); setFokusKunci((k) => k + 1) }

  return (
    <div className={`relative h-[calc(100dvh-57px)] min-h-[480px] ${theme === 'dark' ? 'peta-gelap' : ''}`}>
      <h1 className="sr-only">{tr('Peta dan simulasi sebaran api karhutla', 'Map and simulation of wildfire spread')}</h1>
      <div role="region" aria-label={tr('Peta karhutla interaktif', 'Interactive wildfire map')} className="absolute inset-0">
        <MapView layers={layers} selectedId={terpilih} onSelect={(id) => { pilih(id); setTab('detail') }}
          onTileError={() => setTileGagal(true)} zona={zona} waktu={waktu} fokusKunci={fokusKunci}
          kategoriPem={kategoriPem} pemAktif={pemAktif} titikFokus={titikFokus} laporan={laporanSynced} prioritas={petaPrioritas} sipongi={titikSp} sipongiLuar={titikLuar} bingkai={bingkai} />
      </div>

      {/* Bilah layer: tombol hidup-mati dengan titik warna (sekaligus legenda), jumlah data, dan tombol legenda */}
      <div ref={tumpukan} className={`absolute left-3 top-3 z-[1000] flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2 ${hotspot && params ? 'md:max-w-[calc(100%-23rem)]' : ''}`}>
        <div data-tur="layer" role="group" aria-label={tr('Tampilkan layer', 'Show layers')} className="flex max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-line bg-surface/90 p-1 shadow-lg backdrop-blur-md [scrollbar-width:none] max-sm:gap-0.5 max-sm:rounded-xl max-sm:p-0.5 max-[380px]:flex-wrap max-[380px]:overflow-visible">
          {DAFTAR_LAYER.map(([k, labelId, labelEn, warna]) => {
            const jumlah = { sipongi: titikSp.length, hotspot: hotspots.length, pemukiman: pemukiman.length, zona: null, laporan: laporanSynced.length }[k]
            return (
              <button key={k} type="button" aria-pressed={layers[k]} onClick={() => setLayers({ ...layers, [k]: !layers[k] })}
                className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium max-sm:min-h-9 max-sm:gap-1 max-sm:px-1.5 max-sm:text-[11px] max-[380px]:px-1 transition-[background-color,color,opacity,scale] duration-150 ease-snap active:scale-95 ${layers[k] ? 'bg-bg text-ink shadow-[inset_0_0_0_1px_var(--border)]' : 'text-ink-2 opacity-75 hover:opacity-100'}`}>
                <span aria-hidden="true" className={`size-2.5 rounded-full max-sm:size-2 transition-opacity duration-150 ${warna} ${layers[k] ? '' : 'opacity-30'}`} />
                {tr(labelId, labelEn)}
                {jumlah != null && <span className="font-mono text-xs tabular-nums text-ink-2 max-sm:hidden">{jumlah}</span>}
              </button>
            )
          })}
          <span aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-line max-sm:hidden" />
          <button type="button" aria-pressed={prioOn} onClick={alihPrioritas} data-tur="prioritas-tombol"
            className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold max-sm:size-9 max-sm:min-h-9 max-sm:justify-center max-sm:gap-0 max-sm:px-0 transition-[background-color,color,scale] duration-150 ease-snap active:scale-95 ${prioOn ? 'bg-ember-ink text-on-ember' : 'text-ember-ink hover:bg-line/50'}`}>
            <ListOrdered size={16} aria-hidden="true" /><span className="max-sm:sr-only">{tr('Prioritas', 'Priority')}</span>
          </button>
          <span aria-hidden="true" className="mx-0.5 h-6 w-px shrink-0 bg-line max-sm:hidden" />
          <button type="button" aria-expanded={legendaBuka} aria-controls="legenda-peta" aria-label={tr('Legenda peta', 'Map legend')} onClick={() => setLegendaBuka(!legendaBuka)}
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl max-sm:size-9 transition-[color,background-color] duration-150 ease-snap ${legendaBuka ? 'bg-bg text-ember-ink' : 'text-ink-2 hover:text-ink'}`}><Info size={18} aria-hidden="true" /></button>
        </div>
        {/* Saat panel Prioritas terbuka di layar lebar, legenda dan pemberitahuan pindah ke sebelah kanannya agar tidak tertutup */}
        <div className={`flex max-w-full flex-col items-start gap-2 ${prioOn ? 'md:absolute md:left-[21.25rem] md:top-14 md:w-72' : 'contents'}`}>
        {/* Kendali data nyata SiPongi: tanggal, jumlah, bingkai peta, dan atribusi wajib */}
        {layers.sipongi && (
          <div role="group" aria-label={tr('Titik panas nyata SiPongi', 'Real SiPongi hotspots')} className="max-w-[21rem] rounded-2xl border border-line bg-surface/95 p-2.5 text-xs leading-snug shadow-lg backdrop-blur-md">
            <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 px-1 text-ink-2">
              <strong className="font-semibold text-ink">{tr('Data nyata', 'Real data')}</strong>
              <span>· {tr('Kaltim', 'East Kalimantan')}<span className="max-sm:hidden"> · {tr('keyakinan High', 'High confidence')}</span> ·</span>
              <span role="status" className="font-mono tabular-nums text-ink">{tr(`${titikSp.length} titik`, `${titikSp.length} points`)}</span>
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1 rounded-xl bg-bg p-1" role="group" aria-label={tr('Tanggal (Agustus 2026)', 'Date (August 2026)')}>
              {TGL_SIPONGI.map(([v, id, en]) => (
                <button key={v} type="button" aria-pressed={tglSp === v} onClick={() => setTglSp(v)}
                  className={`min-h-9 rounded-lg px-1 font-semibold transition-[background-color,color,scale] duration-150 ease-snap active:scale-95 ${tglSp === v ? 'bg-surface text-ink shadow-sm ring-1 ring-line-strong' : 'text-ink-2 hover:text-ink'}`}>{tr(id, en)}</button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={() => keBatas(sipongi.batas)} className="min-h-9 rounded-xl bg-ember-ink px-3 font-semibold text-on-ember transition-[filter,scale] duration-150 ease-snap hover:brightness-110 active:scale-95">{tr('Lihat sebaran', 'Show spread')}</button>
              <button type="button" onClick={() => keBatas(BATAS_DEMO)} className="min-h-9 rounded-xl border border-line px-3 font-semibold text-ink transition-[border-color,scale] duration-150 ease-snap hover:border-ember-ink active:scale-95">{tr('Wilayah demo', 'Demo area')}</button>
            </div>
            <p className="m-0 mt-2 px-1 text-ink-2">{tr('Sumber', 'Source')}: <a href={sipongi.url} target="_blank" rel="noreferrer" className="font-semibold text-ember-ink underline underline-offset-2">SIPONGI KEMENHUT</a><span className="max-sm:hidden">. {tr('Snapshot 19–21 Agu 2026; simulasi tetap memakai hotspot demo.', 'Snapshot of Aug 19–21, 2026; the simulation still uses demo hotspots.')}</span></p>
          </div>
        )}
        {/* Umpan balik saringan: semua lapisan mati = peta kosong (beri tahu), sebagian mati = tawarkan reset satu ketukan */}
        {Object.values(layers).some((v) => !v) && (
          <div role="status" className="flex max-w-[20rem] items-center gap-3 rounded-2xl border border-line bg-surface/95 py-2 pl-3.5 pr-2 text-xs leading-snug shadow-lg backdrop-blur-md motion-safe:[animation:tile-masuk_.3s_cubic-bezier(.2,.8,.2,1)_both]">
            <span className="text-ink-2">{Object.values(layers).every((v) => !v) ? tr('Semua lapisan disembunyikan, jadi peta kosong.', 'All layers are hidden, so the map is empty.') : tr(`${Object.values(layers).filter((v) => !v).length} lapisan disembunyikan.`, `${Object.values(layers).filter((v) => !v).length} layer(s) hidden.`)}</span>
            <button type="button" onClick={() => setLayers(SEMUA_LAYER)} className="min-h-9 shrink-0 rounded-xl border border-line bg-bg px-3 font-semibold text-ink transition-[border-color,scale] duration-150 ease-snap hover:border-ember-ink active:scale-95">{tr('Tampilkan semua', 'Show all')}</button>
          </div>
        )}
        {legendaBuka && (
          <div id="legenda-peta" className="max-w-[18rem] rounded-2xl border border-line bg-surface/95 p-3.5 shadow-lg backdrop-blur-md motion-safe:[animation:tile-masuk_.3s_cubic-bezier(.2,.8,.2,1)_both]">
            <ul className="m-0 list-none space-y-2 p-0 text-xs leading-snug text-ink-2">
              <li className="flex items-start gap-2"><span className="mt-1 size-2 shrink-0 rounded-full bg-ember ring-1 ring-ink" aria-hidden="true" />{tr('SiPongi: titik panas nyata Kaltim, 19–21 Agu 2026 (SIPONGI KEMENHUT)', 'SiPongi: real East Kalimantan hotspots, Aug 19–21, 2026 (SIPONGI KEMENHUT)')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 size-3 shrink-0 rounded-full bg-flame" aria-hidden="true" />{tr('Hotspot demo (berdenyut, bisa disimulasikan)', 'Demo hotspot (pulsing, can be simulated)')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 size-3 shrink-0 rounded-full bg-canopy" aria-hidden="true" />{tr('Pemukiman (data ilustrasi); setelah simulasi berwarna menurut risiko', 'Settlements (illustrative data); colored by risk after a simulation')}</li>
              <li className="flex items-start gap-2"><span className="mt-0.5 size-3 shrink-0 rounded-full border-2 border-ink bg-mint" aria-hidden="true" />{tr('Laporan lapangan (tersinkron)', 'Field reports (synced)')}</li>
              <li className="border-t border-line pt-2">{tr('Zona: solid 3 jam, putus-putus 6 jam, titik-titik 12 jam. Garis tebal hitam/putih = waktu slider.', 'Zones: solid 3 h, dashed 6 h, dotted 12 h. Thick black/white line = slider time.')}</li>
            </ul>
          </div>
        )}
        {tileGagal && (
          <p role="status" className="m-0 rounded-xl border border-amber bg-surface px-3 py-2 text-xs leading-snug text-ink shadow">
            {tr('Peta dasar tidak termuat. Menampilkan basemap cadangan.', 'The base map did not load. Showing the fallback basemap.')}
          </p>
        )}
        </div>
      </div>

      {/* Dock aksi: ajakan utama (demo satu klik) dan tur, di bawah tengah peta; petunjuk berdenyut selama belum ada titik terpilih */}
      <div className={`pointer-events-none absolute inset-x-3 bottom-4 z-[1000] flex flex-col items-center gap-2.5 max-md:pl-12 ${prioOn ? 'max-md:hidden' : ''} ${hotspot && params ? 'max-md:hidden md:pr-[21.5rem]' : ''}`}>
        {!hotspot && (
          <p className="pointer-events-auto m-0 flex items-center gap-2.5 rounded-full border border-line bg-surface/90 px-4 py-2 text-xs text-ink shadow-lg backdrop-blur-md">
            <span className="relative flex size-2.5 shrink-0" aria-hidden="true"><span className="absolute inline-flex size-full rounded-full bg-flame opacity-70 motion-safe:animate-ping" /><span className="relative size-2.5 rounded-full bg-flame" /></span>
            {tr('Ketuk hotspot demo (merah, berdenyut) untuk detail dan simulasi', 'Tap a demo hotspot (red, pulsing) for details and a simulation')}
          </p>
        )}
        <div className="pointer-events-auto flex max-w-full items-stretch gap-1.5 rounded-[1.9rem] border border-line bg-surface/90 p-1.5 shadow-xl backdrop-blur-md">
          <button type="button" onClick={muatDemo} data-mag
            className="group flex min-h-14 min-w-0 items-center gap-3 rounded-[1.5rem] bg-ember-ink py-2 pl-2.5 pr-5 text-left text-on-ember transition-[filter,scale] duration-150 ease-snap hover:brightness-110 active:scale-[0.97]">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-on-ember/15 transition-[scale] duration-300 ease-snap group-hover:scale-110"><Play size={16} fill="currentColor" aria-hidden="true" className="translate-x-px" /></span>
            <span className="min-w-0">
              <span className="block truncate text-base font-bold leading-tight">{tr('Demo Skenario', 'Demo Scenario')}</span>
              <span className="block truncate text-xs leading-tight opacity-95">{tr(`Titik ${DEMO.hotspotId} · angin ${DEMO.U} m/s`, `Point ${DEMO.hotspotId} · wind ${DEMO.U} m/s`)}</span>
            </span>
          </button>
          <button type="button" onClick={mulaiTur}
            className="flex min-h-14 shrink-0 items-center gap-2 rounded-[1.5rem] px-4 text-sm font-semibold text-ink transition-[background-color,scale] duration-150 ease-snap hover:bg-line/50 active:scale-95">
            <CircleHelp size={18} aria-hidden="true" className="text-ember-ink" />{tr('Tur', 'Tour')}
          </button>
        </div>
      </div>

      {prioOn && !(hotspot && params) && (
        <PanelPrioritas daftar={daftarPrioritas} bobot={bobot} onBobot={setBobot} terpilih={terpilih} onPilih={pilihDariPrioritas} onTutup={() => setPrioOn(false)} />
      )}
      {prioOn && hotspot && params && (
        <div className="max-md:hidden"><PanelPrioritas daftar={daftarPrioritas} bobot={bobot} onBobot={setBobot} terpilih={terpilih} onPilih={pilihDariPrioritas} onTutup={() => setPrioOn(false)} /></div>
      )}

      {hotspot && params && (
        <aside aria-label={tr('Panel hotspot dan simulasi', 'Hotspot and simulation panel')} data-tur="panel"
          className="sheet-naik overscroll-contain absolute inset-x-0 bottom-0 z-[1000] max-h-[55%] overflow-y-auto sembunyi-gulir rounded-t-2xl border border-line bg-surface p-4 shadow-lg md:inset-x-auto md:bottom-auto md:right-3 md:top-3 md:max-h-[calc(100%-1.5rem)] md:w-80 md:rounded-xl">
          <Tabs label={tr('Panel hotspot', 'Hotspot panel')} value={tab} onChange={setTab} tabs={[
            { id: 'detail', label: tr('Detail', 'Details'), panel: <HotspotDetail hotspot={hotspot} onClose={tutup} onSimulasi={() => setTab('simulasi')} /> },
            { id: 'simulasi', label: tr('Simulasi', 'Simulation'), panel: (
              <SimulationPanel hotspots={hotspots} hotspotId={terpilih} onPilih={pilih} params={params} onParams={setParams} indeksAngin={indeksAngin} onIndeksAngin={setIndeksAngin}
                jalan={jalan} onJalan={jalankan} zona={zona} waktu={waktu} t={t} onT={setT}
                risiko={risiko} pemAktif={pemAktif} onPilihPem={pilihPem} />) },
          ]} />
        </aside>
      )}

      <Tur aktif={turAktif} langkah={langkahTur} steps={langkahTurBahasa} onLangkah={keLangkah} onTutup={tutupTur} onSelesai={tutupTur} />
    </div>
  )
}
