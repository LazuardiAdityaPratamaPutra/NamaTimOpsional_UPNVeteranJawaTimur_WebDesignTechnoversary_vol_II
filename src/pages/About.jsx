import { Children, cloneElement, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Wind, Flame, Home as Rumah, ArrowUpRight, ChevronDown, Minus, Plus, Map as Peta } from 'lucide-react'
import { Container, Accordion, Button } from '../components/ui'
import BadgeDemo from '../components/BadgeDemo'
import { SIM, RISIKO } from '../lib/config'
import { desimal } from '../lib/format'
import { DATA_ADEGAN, RISIKO_ADEGAN } from '../components/hero3d/dataDemo'
import { FOTO } from '../data/foto'
import KreditDaftar from '../components/KreditDaftar'
import { useJudul } from '../lib/useJudul'
import KemajuanBaca from '../components/KemajuanBaca'
import { STATISTIK } from '../data/statistik'
import { useBahasa, useKamus, useTr } from '../i18n'

// Setiap teks berupa pasangan [Indonesia, Inggris]
const TEMA = [
  [['Isu Lingkungan Global', 'Global Environment'], ['Karhutla berdampak lintas wilayah dan batas negara lewat asap, emisi karbon, dan hilangnya habitat.', 'Wildfires reach across regions and borders through smoke, carbon emissions, and habitat loss.']],
  [['Kampanye Peduli Lingkungan', 'Awareness Campaign'], ['Setiap halaman ditutup ajakan bertindak: belajar, melapor, dan membagikan.', 'Every page ends with a call to action: learn, report, and share.']],
  [['Portal Edukasi Lingkungan', 'Environmental Education Portal'], ['Artikel, galeri, kuis, dan checklist kesiapsiagaan dalam bahasa yang mudah dipahami.', 'Articles, a gallery, a quiz, and a preparedness checklist in language that is easy to understand.']],
]
const LANGKAH = [
  { ikon: MapPin, j: ['Titik panas', 'Hotspot'], d: ['Lokasi api terdeteksi menjadi titik awal.', 'A detected fire becomes the starting point.'] },
  { ikon: Wind, j: ['Angin dan lahan', 'Wind and land'], d: ['Arah, kecepatan angin, dan jenis lahan menentukan laju api.', 'Wind direction, speed, and land type set how fast fire moves.'] },
  { ikon: Flame, j: ['Zona 3, 6, 12 jam', '3, 6, 12 h zones'], d: ['Tiga elips menunjukkan jangkauan api ke depan.', 'Three ellipses show how far the fire can reach.'] },
  { ikon: Rumah, j: ['Risiko pemukiman', 'Settlement risk'], d: ['Pemukiman di jalur api diberi skor dan diurutkan.', 'Settlements in the path are scored and ranked.'] },
]
const DATA = [
  { d: ['Titik panas (hotspot)', 'Hotspots'], s: ['Data demo', 'Demo data'], badge: true, c: ['Dua lapisan: titik nyata SiPongi (Kalimantan Timur, keyakinan High, 19–21 Agustus 2026, snapshot statis; sumber SIPONGI KEMENHUT) dan 10 hotspot demo untuk simulasi.', 'Two layers: real SiPongi points (East Kalimantan, High confidence, 19–21 August 2026, static snapshot; source SIPONGI KEMENHUT) and 10 demo hotspots for the simulation.'] },
  { d: ['Pemukiman', 'Settlements'], s: ['Data ilustrasi', 'Illustrative data'], badge: true, c: ['Titik sampel buatan tim, bukan data kependudukan.', 'Sample points made by the team, not census data.'] },
  { d: ['Angin', 'Wind'], s: ['Data demo', 'Demo data'], badge: true, c: ['Nilai sampel per hotspot. Integrasi API cuaca publik masuk roadmap.', 'Sample values per hotspot. Integration with a public weather API is on the roadmap.'] },
  { d: ['Tile peta', 'Map tiles'], s: ['© OpenStreetMap contributors', '© OpenStreetMap contributors'], badge: false, c: ['Lisensi ODbL.', 'ODbL license.'] },
]
const BATASAN = [
  ['Model berbasis elips yang disederhanakan dan belum dikalibrasi dengan data kebakaran nyata.', 'A simplified ellipse-based model that has not been calibrated against real fire data.'],
  ['Tidak memodelkan kelembapan bahan bakar, penghalang alami, medan, atau upaya pemadaman.', 'It does not model fuel moisture, natural barriers, terrain, or suppression efforts.'],
  ['Kebakaran gambut dapat menjalar di bawah permukaan; model hanya menggambarkan api permukaan.', 'Peat fires can spread underground; the model only describes surface fire.'],
  ['Data hotspot, angin, dan pemukiman dalam demo adalah sampel berlabel, bukan kondisi nyata.', 'Hotspot, wind, and settlement data in the demo are labeled samples, not real conditions.'],
  ['AI hanya merangkum hasil hitungan dan menjawab pertanyaan edukasi; AI tidak meramal.', 'AI only summarizes the calculation results and answers educational questions; AI does not predict.'],
]
const LAHAN_EN = { hutan: 'forest', semak: 'shrubland', gambut: 'peat', pertanian: 'farmland' }

// Foto tiap prinsip (dekoratif), urutan sama dengan PRINSIP; posisi = object-position. Fotografer belum diketahui.
const FOTO_PRINSIP = [
  { src: '/foto/prinsip-1.webp', posisi: '34% 50%' },
  { src: '/foto/prinsip-2.webp', posisi: '30% 40%' },
  { src: '/foto/prinsip-3.webp', posisi: '30% 50%' },
  { src: '/foto/prinsip-4.webp', posisi: '58% 50%' },
]
const PRINSIP = [
  [['Jujur soal batasan', 'Honest on limits'], ['Setiap angka demo diberi label. Model tidak berpura-pura meramal.', 'Every demo number is labeled. The model does not pretend to predict.']],
  [['Dapat dijelaskan', 'Explainable'], ['Rumus dan aturan skor ada di satu berkas konfigurasi, tanpa kotak hitam.', 'Formulas and score rules live in one config file, with no black box.']],
  [['Edukasi lebih dulu', 'Education first'], ['Simulasi dipakai untuk memahami, bukan untuk mengambil keputusan operasional.', 'The simulation is for understanding, not for operational decisions.']],
  [['Tetap jalan tanpa sinyal', 'Works without signal'], ['Dibangun sebagai aplikasi web progresif yang bisa dipakai luring.', 'Built as a progressive web app that works offline.']],
]
const KATEGORI = { kritis: ['Kritis', 'Critical'], tinggi: ['Tinggi', 'High'], waspada: ['Waspada', 'Watch'] }
const WARNA_KAT = { kritis: 'var(--ember)', tinggi: 'var(--ember)', waspada: 'var(--amber)' }

/** Garis kemajuan baca di tepi atas halaman. */

/** Foto latar dengan parallax: gambar lebih tinggi dari bingkainya dan bergeser pelan saat halaman digulir. */
function FotoLatar({ posisi = '50% 50%', skala = 1, segera = false, className = '' }) {
  const bingkai = useRef(null), gambar = useRef(null)
  useEffect(() => {
    const el = bingkai.current, img = gambar.current
    if (!el || !img || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const hitung = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight // -1..1 saat melintasi layar
      const geser = Math.max(-1, Math.min(1, p)) * r.height * 0.12
      img.style.transform = `translate3d(0, ${(-geser).toFixed(1)}px, 0) scale(${skala})`
    }
    const naik = () => { if (!raf) raf = requestAnimationFrame(hitung) }
    hitung(); addEventListener('scroll', naik, { passive: true }); addEventListener('resize', naik)
    return () => { removeEventListener('scroll', naik); removeEventListener('resize', naik); cancelAnimationFrame(raf) }
  }, [skala])
  if (!FOTO.hero) return null
  return (
    <div ref={bingkai} className={`absolute inset-0 -z-10 overflow-hidden ${className}`} aria-hidden="true">
      <img ref={gambar} src={FOTO.hero.src} alt="" loading={segera ? 'eager' : 'lazy'} decoding="async" className="absolute inset-x-0 -top-[14%] h-[128%] w-full object-cover will-change-transform" style={{ objectPosition: posisi, transform: `scale(${skala})` }} />
    </div>
  )
}

/** Bentuk geometris garis: empat poligon bersisi `sisi` yang diputar bertahap, jadi pola seperti rosetta. */
function Bentuk({ sisi, aktif, urut }) {
  const poligon = (rot, r) => Array.from({ length: sisi }, (_, k) => {
    const a = (k / sisi) * 2 * Math.PI + rot
    return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <span aria-hidden="true" className="block size-full transition-transform duration-[1100ms] ease-snap" style={{ transform: `rotate(${aktif ? 180 + urut * 30 : urut * 30}deg) scale(${aktif ? 1 : 0.9})` }}>
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className="bentuk-putar size-full">
        {[0, 1, 2, 3, 4].map((k) => <polygon key={k} points={poligon((k * Math.PI) / sisi, 46 - k * 7)} />)}
      </svg>
    </span>
  )
}

const SISI = [4, 6, 8]

/**
 * Satu blok akordeon. Blok aktif melebar dan memuat teks, visual, dan pita fakta; blok lain menyusut jadi kartu foto
 * bernuansa malam yang hanya memuat bentuk, judul, dan tombol buka. Dimiliki dan diatur oleh AkordeonPanel.
 */
function PanelFoto({ id, eyebrow, judul, visual, foto, strip, children, aktif, urut, sisi, onPilih }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} onClick={aktif ? undefined : onPilih}
      className={`group relative isolate flex min-w-0 scroll-mt-32 flex-col overflow-hidden rounded-3xl border border-line bg-surface p-5 transition-colors duration-300 sm:p-7 ${aktif ? '' : 'hero-malam cursor-pointer'}`}>
      <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
        <img src={foto.src} alt="" loading="lazy" decoding="async" className={`absolute inset-0 size-full object-cover transition-[scale,opacity] duration-[900ms] ease-snap ${aktif ? 'scale-110 opacity-40' : 'scale-100 opacity-90 group-hover:scale-110'}`} style={{ objectPosition: foto.posisi }} />
        <div className={`absolute inset-0 bg-gradient-to-br from-surface via-surface/90 to-surface/70 transition-opacity duration-700 ease-snap ${aktif ? 'opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-0 bg-gradient-to-t from-bg via-bg/50 to-bg/30 transition-opacity duration-700 ease-snap ${aktif ? 'opacity-0' : 'opacity-100'}`} />
      </div>
      <h2 id={`${id}-h`} className="m-0">
        <button type="button" aria-expanded={aktif} aria-controls={`${id}-isi`} onClick={(e) => { e.stopPropagation(); onPilih() }}
          className="flex w-full flex-col items-start gap-4 rounded-2xl text-left">
          <span className="flex w-full items-start justify-between">
            <span className="size-14 text-ember sm:size-16"><Bentuk sisi={sisi} aktif={aktif} urut={urut} /></span>
            <span aria-hidden="true" className={`flex size-11 items-center justify-center rounded-full border transition-[background-color,color,border-color,rotate] duration-500 ease-snap ${aktif ? 'rotate-180 border-ink bg-ink text-bg' : 'border-ink-2/60 text-ink group-hover:rotate-90 group-hover:border-ember group-hover:text-ember'}`}>
              {aktif ? <Minus size={18} /> : <Plus size={18} />}
            </span>
          </span>
          <span className="block">
            <span className="mb-2 block font-mono text-xs font-medium uppercase tracking-widest text-ink-2">{String(urut + 1).padStart(2, '0')} · {eyebrow}</span>
            <span className={`block leading-[1.02] transition-[font-size] duration-500 ease-snap ${aktif ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'}`}>{judul}</span>
          </span>
        </button>
      </h2>
      <div id={`${id}-isi`} inert={aktif ? undefined : ''}
        className={`grid transition-[grid-template-rows,opacity] ease-snap ${aktif ? 'grid-rows-[1fr] opacity-100 duration-700 delay-150' : 'grid-rows-[0fr] opacity-0 duration-300'}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="@container pt-7 lg:w-[var(--lebar-isi)] lg:max-w-none">
            <div className="grid gap-6 @2xl:grid-cols-2 @2xl:gap-9">
              <div className="min-w-0 space-y-4 text-base leading-relaxed text-ink">{children}</div>
              {visual && <div className="min-w-0">{visual}</div>}
            </div>
            {strip && <div className="mt-7">{strip}</div>}
          </div>
        </div>
      </div>
      {!aktif && <p className="m-0 mt-auto pt-10 text-sm font-semibold text-ink transition-transform duration-300 ease-snap group-hover:translate-x-1">{eyebrow} →</p>}
    </section>
  )
}

/**
 * Akordeon: satu blok melebar dan yang lain menyusut, kolom berganti ukuran dengan transisi, seperti kartu layanan di
 * referensi. Menekan tombol blok aktif menutup semuanya (tampilan ringkas tiga kolom sama lebar). Di layar sempit
 * blok ditumpuk ke bawah.
 */
function AkordeonPanel({ id, children }) {
  const tr = useTr()
  const [aktif, setAktif] = useState(0)
  const item = Children.toArray(children)
  const ids = item.map((c) => c.props.id)
  useEffect(() => {
    const dariHash = () => { const k = ids.indexOf(location.hash.slice(1)); if (k >= 0) setAktif(k) }
    dariHash(); addEventListener('hashchange', dariHash)
    return () => removeEventListener('hashchange', dariHash)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const pilih = (k) => {
    setAktif((a) => (a === k ? -1 : k))
    if (matchMedia('(max-width: 1023px)').matches) setTimeout(() => document.getElementById(ids[k])?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60)
  }
  const FR_AKTIF = 3.2
  const kolom = item.map((_, k) => (aktif < 0 ? 'minmax(0,1fr)' : k === aktif ? `minmax(0,${FR_AKTIF}fr)` : 'minmax(0,1fr)')).join(' ')
  // Lebar isi panel aktif = lebar kolomnya (bagian FR_AKTIF dari total) dikurangi padding kiri-kanan (2 × 1,75rem). Diturunkan dari angka kolom
  // yang sama supaya isi tak pernah lebih lebar daripada panelnya (sebelumnya dipatok 2/3 sehingga ujung teks terpotong).
  const jarak = (item.length - 1) * 0.75
  const lebarIsi = `calc((100cqw - ${jarak}rem) * ${(FR_AKTIF / (FR_AKTIF + item.length - 1)).toFixed(5)} - 3.5rem)`
  return (
    <section id={id} aria-label={tr('Latar belakang, cara kerja, dan hasil simulasi', 'Background, how it works, and simulation output')} className="scroll-mt-28 py-14 md:py-20">
      <Container>
        <div style={{ '--kol': kolom, '--lebar-isi': lebarIsi }} className="@container grid gap-3 lg:min-h-[40rem] lg:[grid-template-columns:var(--kol)] lg:transition-[grid-template-columns] lg:duration-[800ms] lg:ease-snap">
          {item.map((c, k) => cloneElement(c, { aktif: aktif === k, urut: k, sisi: SISI[k % SISI.length], onPilih: () => pilih(k) }))}
        </div>
      </Container>
    </section>
  )
}

const SelStrip = ({ children, className = '' }) => <div className={`grid gap-px overflow-hidden rounded-2xl border border-line bg-line ${className}`}>{children}</div>

// Pita fakta di dasar panel 01: dua angka resmi + sumbernya.
function StripStat({ b }) {
  return (
    <SelStrip className="sm:grid-cols-2">
      {STATISTIK.slice(0, 2).map((x) => {
        const v = b === 'en' && x.en ? { ...x, ...x.en } : x
        return (
          <div key={x.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 bg-bg/80 p-4 backdrop-blur-md sm:p-5">
            <span className="font-display text-4xl font-extrabold leading-none [font-stretch:76%] sm:text-4xl">{v.angka}</span>
            <span className="text-sm font-semibold text-ember-ink">{v.satuan}</span>
            <p className="m-0 basis-full text-sm leading-snug text-ink">{v.label}</p>
            <p className="m-0 basis-full text-xs text-ink-2">{v.periode} · {v.sumber}</p>
          </div>
        )
      })}
    </SelStrip>
  )
}

// Pita parameter di dasar panel 02: tiga nilai kunci model dalam bahasa sehari-hari (rumus lengkapnya ada di akordeon).
function StripRumus({ k, tr }) {
  const R = [
    [`${k(SIM.R0)} km/${tr('jam', 'h')}`, tr('Laju dasar api', 'Base fire speed'), tr('Tanpa angin, lalu dikalikan faktor jenis lahan', 'With no wind, then multiplied by the land-type factor'), 'var(--amber)'],
    [`+${Math.round(SIM.koefAngin * 100)}%`, tr('Tiap 1 m/s angin', 'Per 1 m/s of wind'), tr('Laju searah angin bertambah', 'Downwind speed increases'), 'var(--ember)'],
    [`${Math.round(SIM.rasioBelakang * 100)}%`, tr('Laju melawan angin', 'Speed against the wind'), tr('Dari laju searah angin', 'Of the downwind speed'), 'var(--flame)'],
  ]
  return (
    <SelStrip className="sm:grid-cols-3">
      {R.map(([v, l, ket, w]) => (
        <div key={l} className="bg-bg/80 p-4 backdrop-blur-md sm:p-5">
          <p className="m-0 font-display text-4xl font-extrabold leading-none tabular-nums [font-stretch:76%] rel:short:text-3xl" style={{ color: w }}>{v}</p>
          <p className="m-0 mt-3 text-base font-bold text-ink rel:short:mt-1.5">{l}</p>
          <p className="m-0 text-sm text-ink rel:short:hidden">{ket}</p>
        </div>
      ))}
    </SelStrip>
  )
}

// Pita skala di dasar panel 03: tiga kategori risiko, angka ambang besar dan terbaca; batang tumbuh saat panel tiba.
function StripSkala({ tr }) {
  const S = [
    ['waspada', tr('Waspada', 'Watch'), `0–${RISIKO.batasTinggi - 1}`, RISIKO.batasTinggi, tr('Pantau dan siapkan', 'Monitor and prepare')],
    ['tinggi', tr('Tinggi', 'High'), `${RISIKO.batasTinggi}–${RISIKO.batasKritis - 1}`, RISIKO.batasKritis - RISIKO.batasTinggi, tr('Siaga, rencanakan evakuasi', 'On alert, plan evacuation')],
    ['kritis', tr('Kritis', 'Critical'), `${RISIKO.batasKritis}–${RISIKO.maks}`, RISIKO.maks - RISIKO.batasKritis, tr('Prioritas utama', 'Top priority')],
  ]
  const warna = { waspada: 'var(--amber)', tinggi: 'var(--ember)', kritis: 'var(--flame)' }
  return (
    <div className="rounded-2xl border border-line bg-bg/90 p-4 backdrop-blur-md">
      <div className="flex h-2.5 gap-1.5" aria-hidden="true">
        {S.map(([id, , , bobot], i) => <span key={id} className="origin-left rounded-full transition-transform duration-[900ms] ease-snap motion-reduce:transition-none" style={{ flex: bobot, background: warna[id], transitionDelay: `${300 + i * 220}ms` }} />)}
      </div>
      <dl className="m-0 mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {S.map(([id, nama, rentang, , ket]) => (
          <div key={id} className="flex items-center justify-between gap-3 sm:flex-col sm:items-start sm:justify-start">
            <dt className="m-0 sm:mt-2"><span className="block text-base font-bold text-ink">{nama}</span><span className="block text-sm text-ink rel:short:hidden">{ket}</span></dt>
            <dd className="m-0 font-display text-4xl font-extrabold leading-none tabular-nums [font-stretch:76%] sm:order-first rel:short:text-3xl" style={{ color: warna[id] }}>{rentang}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Alur simulasi sebagai jalur langkah yang bisa dijelajahi. Langkah 2 berisi kalkulator mini yang memakai rumus asli (SIM),
// langkah 3 menggambar elips 3/6/12 jam dari angka yang sama, jadi pembaca melihat sendiri bagaimana angin memanjangkan api.
function AlurSimulasi({ tr, p, k }) {
  const [on, setOn] = useState(-1)
  const [u, setU] = useState(5)
  const lahanKeys = Object.keys(SIM.faktorLahan)
  const [lahan, setLahan] = useState(lahanKeys[0])
  const bhs = useBahasa()
  const nama = (n) => (bhs === 'en' ? LAHAN_EN[n] : n)
  const rh = SIM.R0 * SIM.faktorLahan[lahan] * (1 + SIM.koefAngin * u)
  const rb = SIM.rasioBelakang * rh
  const lw = Math.min(SIM.maksLW, 1 + SIM.koefLW * u)
  const zona = [3, 6, 12].map((t) => { const ah = rh * t, ab = rb * t; const a = (ah + ab) / 2; return { t, ah, ab, a, b: a / lw, c: (ah - ab) / 2 } })
  const z12 = zona[2]
  const skala = Math.min(220 / (z12.ah + z12.ab), 54 / z12.b)
  const x0 = 10 + z12.ab * skala
  const WARNA = ['var(--amber)', 'var(--ember)', 'var(--flame)']
  const f2 = (n) => k(Number(n.toFixed(2)))
  return (
    <ol className="relative m-0 list-none space-y-2 p-0">
      <span aria-hidden="true" className="absolute bottom-6 left-[1.95rem] top-6 w-px bg-line" />
      <span aria-hidden="true" className="absolute bottom-6 left-[1.95rem] top-6 w-px origin-top bg-ember transition-transform duration-[1400ms] ease-snap motion-reduce:transition-none" />
      {LANGKAH.map((l, i) => {
        const buka = on === i
        return (
          <li key={i} className={`relative rounded-2xl border backdrop-blur-md transition-[border-color,background-color] duration-300 ease-snap ${buka ? 'border-ember-ink bg-bg/90' : 'border-line bg-bg/70 hover:border-ink-2'}`}>
            <button type="button" aria-expanded={buka} onClick={() => setOn(buka ? -1 : i)} className="flex w-full items-center gap-4 p-3 text-left sm:p-3.5">
              <span className={`relative flex size-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-300 ease-snap ${buka ? 'scale-105 bg-ember text-on-ember' : 'border border-ink-2/60 bg-bg text-ink'}`}><l.ikon size={18} aria-hidden="true" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11px] tracking-widest text-ember-ink" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                <span className="block text-lg font-bold leading-tight">{p(l.j)}</span>
              </span>
              <ChevronDown size={18} aria-hidden="true" className={`shrink-0 text-ink-2 transition-transform duration-300 ease-snap ${buka ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-snap ${buka ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <div className="overflow-hidden" inert={buka ? undefined : ''}>
                <div className="px-3 pb-4 pl-[4.75rem] pr-4 sm:pr-5">
                  <p className="m-0 text-sm leading-snug text-ink">{p(l.d)}</p>
                  {i === 0 && (
                    <p className="m-0 mt-3 flex items-center gap-3 text-sm text-ink">
                      <span className="relative flex size-3 shrink-0"><span className="absolute inset-0 animate-ping rounded-full bg-flame opacity-70 motion-reduce:animate-none" /><span className="relative size-3 rounded-full bg-flame" /></span>
                      {tr('Titik awal api, t = 0', 'Fire starting point, t = 0')}
                    </p>
                  )}
                  {i === 1 && (
                    <div className="mt-3 space-y-3">
                      <label className="flex items-center gap-3 text-sm font-semibold text-ink">
                        <span className="w-24 shrink-0">{tr('Angin U', 'Wind U')} <span className="font-mono tabular-nums text-ember-ink">{u}</span></span>
                        <input type="range" min="0" max="10" step="1" value={u} onChange={(e) => setU(Number(e.target.value))} className="h-1.5 min-w-0 flex-1 cursor-pointer accent-[var(--ember)]" />
                      </label>
                      <div role="group" aria-label={tr('Jenis lahan', 'Land type')} className="flex flex-wrap gap-1.5">
                        {lahanKeys.map((n) => (
                          <button key={n} type="button" aria-pressed={lahan === n} onClick={() => setLahan(n)} className={`rounded-full border px-3 py-1 text-sm font-semibold capitalize transition-[background-color,color,scale] duration-200 ease-snap hover:scale-105 ${lahan === n ? 'border-ember bg-ember text-on-ember' : 'border-line text-ink hover:border-ink-2'}`}>{nama(n)} <span className="font-mono text-xs opacity-80">F {k(SIM.faktorLahan[n])}</span></button>
                        ))}
                      </div>
                      <p className="m-0 font-mono text-sm tabular-nums text-ink" aria-live="polite">Rh = {k(SIM.R0)} × {k(SIM.faktorLahan[lahan])} × (1 + {k(SIM.koefAngin)} × {u}) = <strong className="text-ember-ink">{f2(rh)} km/{tr('jam', 'h')}</strong></p>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="mt-3">
                      <svg viewBox="0 0 240 112" role="img" aria-label={tr('Tiga elips 3, 6, dan 12 jam dari angin dan lahan yang dipilih di langkah 2', 'Three 3, 6, and 12 hour ellipses from the wind and land chosen in step 2')} className="h-auto w-full max-w-sm">
                        {[...zona].reverse().map((z, j) => (
                          <ellipse key={z.t} cx={x0 + z.c * skala} cy="56" rx={z.a * skala} ry={z.b * skala} fill={WARNA[2 - j]} fillOpacity="0.28" stroke={WARNA[2 - j]} strokeWidth="1.5" className="transition-[rx,ry,cx] duration-500 ease-snap" />
                        ))}
                        <circle cx={x0} cy="56" r="3.5" fill="var(--text)" />
                      </svg>
                      <p className="m-0 mt-1 text-sm text-ink">{tr('3 j · 6 j · 12 j, dari angin U', '3 h · 6 h · 12 h, from wind U')} = {u}. {tr('Ubah di langkah 2.', 'Change it in step 2.')}</p>
                    </div>
                  )}
                  {i === 3 && (
                    <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                      {[3, 6, 12].map((t, j) => <li key={t} className="rounded-xl border border-line px-3 py-1.5 text-sm text-ink"><span className="text-ink-2">{t} {tr('jam', 'h')}</span> <strong className="font-display text-xl tabular-nums [font-stretch:76%]" style={{ color: WARNA[j] }}>{RISIKO.skorZona[t]}</strong></li>)}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// Urutan risiko: nomor urut, nama, skor besar, dan batang yang tumbuh saat panel tiba.
function UrutanRisiko({ ranking, skor, skorMaks, tr, p }) {
  return (
    <div className="rounded-2xl border border-line bg-bg/90 p-4 backdrop-blur-md sm:p-5">
      <p className="alis m-0">{tr('Contoh urutan risiko (data demo)', 'Sample risk ranking (demo data)')}</p>
      <ol className="m-0 mt-2 list-none divide-y divide-line p-0">
        {ranking.map((r, i) => {
          const h = skor[r.nama]
          if (!h) return (
            <li key={r.nama} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-200 hover:bg-ink/5 rel:[&:nth-child(n+5)]:hidden rel:short:[&:nth-child(n+4)]:hidden">
              <span className="w-5 font-mono text-sm tabular-nums text-ink-2" aria-hidden="true">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-base font-semibold leading-tight text-ink">{r.nama}</p>
                <p className="m-0 mt-0.5 flex items-center gap-2 text-sm text-ink-2"><span className="size-2 shrink-0 rounded-full bg-canopy" aria-hidden="true" />{tr('Aman · di luar zona 12 jam', 'Safe · outside the 12 h zone')}</p>
              </div>
              <span className="shrink-0 text-right leading-none"><span className="font-display text-2xl font-extrabold tabular-nums text-ink-2 [font-stretch:76%]">{Math.round(r.km)}</span><span className="ml-1 text-sm text-ink-2">km</span><span className="sr-only"> {tr('dari titik api', 'from the fire')}</span></span>
            </li>
          )
          const warna = WARNA_KAT[h.kategori] ?? WARNA_KAT.waspada
          return (
            <li key={r.nama} className="group/r -mx-2 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-ink/5">
              <div className="flex items-center gap-3">
                <span className="w-5 font-mono text-sm tabular-nums text-ink-2" aria-hidden="true">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate text-base font-bold leading-tight text-ink">{r.nama}</p>
                  <p className="m-0 mt-0.5 flex items-center gap-2 text-sm text-ink"><span className="size-2 rounded-full" style={{ background: warna }} aria-hidden="true" />{p(KATEGORI[h.kategori] ?? KATEGORI.waspada)} · {tr(`dicapai ${h.zona} jam`, `reached in ${h.zona} h`)}</p>
                </div>
                <span className="font-display text-4xl font-extrabold leading-none tabular-nums [font-stretch:76%] sm:text-4xl" style={{ color: warna }}>{Math.round(h.skor)}<span className="sr-only"> {tr('dari', 'of')} {RISIKO.maks}</span></span>
              </div>
              <div className="ml-8 mt-2 h-2.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
                <div className="h-full origin-left rounded-full transition-transform duration-[900ms] ease-snap motion-reduce:transition-none group-hover/r:brightness-125" style={{ width: `${Math.max((h.skor / skorMaks) * 100, 6)}%`, background: warna, transitionDelay: '300ms' }} />
              </div>
            </li>
          )
        })}
      </ol>
      <p className="m-0 mt-2 border-t border-line pt-2 text-xs text-ink-2">{tr('Skor hanya untuk yang terjangkau zona; sisanya menampilkan jarak dari titik api.', 'Scores apply only to settlements inside a zone; the rest show distance from the fire.')}</p>
    </div>
  )
}

const Panel = ({ children, className = '' }) => <div className={`rounded-2xl border border-line bg-surface/70 p-5 backdrop-blur-md sm:p-7 ${className}`}>{children}</div>

// Empat prinsip sebagai panel yang melebar: di layar lebar, panel yang disorot/difokus terbuka dan memperlihatkan penjelasannya;
// di layar kecil semua panel tersusun terbuka.
function PanelPrinsip({ item, tr, p }) {
  const [aktif, setAktif] = useState(0)
  const CAP = [tr('Label DEMO di setiap angka', 'DEMO label on every number'), tr('Satu berkas konfigurasi', 'One config file'), tr('Bukan alat keputusan', 'Not a decision tool'), tr('Aplikasi web progresif', 'Progressive web app')]
  return (
    <ol className="m-0 mt-10 flex list-none flex-col gap-3 p-0 lg:h-[22rem] lg:flex-row">
      {item.map(([j, d], i) => {
        const buka = aktif === i
        return (
          <li key={i} onMouseEnter={() => setAktif(i)} data-spot
            className={`hero-malam group relative isolate flex min-h-[18rem] flex-col justify-between overflow-hidden rounded-3xl border bg-surface p-6 transition-[flex-grow,border-color] duration-[600ms] ease-snap sm:p-8 lg:min-h-0 lg:basis-0 ${buka ? 'border-ember-ink lg:grow-[3.4]' : 'border-line lg:grow-[1]'}`}>
            <img src={FOTO_PRINSIP[i].src} alt="" loading="lazy" decoding="async" width="1100" height="734" style={{ objectPosition: FOTO_PRINSIP[i].posisi }}
              className={`absolute inset-0 -z-10 size-full object-cover transition-[scale,filter,opacity] duration-[900ms] ease-snap ${buka ? 'scale-105 opacity-100 saturate-100' : 'scale-100 opacity-60 saturate-50 group-hover:opacity-80 max-lg:opacity-90 max-lg:saturate-100'}`} />
            <span aria-hidden="true" className={`absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/55 to-bg/20 transition-opacity duration-500 ${buka ? 'opacity-90' : 'opacity-100'}`} />
            <span aria-hidden="true" className={`pointer-events-none absolute -bottom-10 -right-2 select-none font-display text-[13rem] font-extrabold leading-none transition-opacity duration-500 ease-snap [font-stretch:76%] ${buka ? 'text-ember-ink opacity-[0.09]' : 'text-ink opacity-0'}`}>{String(i + 1).padStart(2, '0')}</span>
            <div className="flex items-start justify-between gap-4">
              <span className={`font-mono text-sm tracking-widest transition-colors duration-300 ease-snap ${buka ? 'text-ember-ink' : 'text-ink-2'}`} aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold transition-[border-color,color,opacity] duration-300 ease-snap ${buka ? 'border-ember-ink bg-bg/70 text-ember-ink backdrop-blur-sm' : 'border-ink-2/50 bg-bg/50 text-ink lg:opacity-0'}`}>{CAP[i]}</span>
            </div>
            <div className="relative">
              <h3 className="m-0 max-w-[14ch] text-2xl leading-[1.05] sm:text-3xl">
                <button type="button" onFocus={() => setAktif(i)} onClick={() => setAktif(i)} aria-expanded={buka} aria-controls={`prinsip-${i}`}
                  className="text-left outline-offset-8">{p(j)}</button>
              </h3>
              <div id={`prinsip-${i}`} className={`grid transition-[grid-template-rows,opacity] duration-[600ms] ease-snap max-lg:!grid-rows-[1fr] max-lg:!opacity-100 ${buka ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <p className="m-0 min-h-0 overflow-hidden pt-3 text-base leading-relaxed text-ink lg:max-w-[34ch]">{p(d)}</p>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const BAGIAN = [
  ['cara', ['Cara kerja', 'How it works']], ['batasan', ['Batasan', 'Limits']], ['prinsip', ['Prinsip', 'Principles']], ['tema', ['Sub-tema', 'Sub-themes']], ['data', ['Data', 'Data']],
]

/** Penggeser skor risiko: gerakkan penunjuk di atas skala 0-100 dan lihat kategori berubah. Bisa dengan penunjuk, sentuhan, atau panah keyboard. */
function PengukurSkor({ tr, t, kr, mx }) {
  const awal = 64
  const [v, setV] = useState(awal)
  const [seret, setSeret] = useState(false)
  const jalur = useRef(null)
  const dari = (e) => {
    const r = jalur.current.getBoundingClientRect()
    setV(Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * mx))
  }
  const kat = v >= kr ? [tr('Kritis', 'Critical'), 'var(--flame)'] : v >= t ? [tr('Tinggi', 'High'), 'var(--ember)'] : [tr('Waspada', 'Watch'), 'var(--amber)']
  const onKey = (e) => {
    const d = { ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5, Home: -mx, End: mx }[e.key]
    if (d === undefined) return
    e.preventDefault(); setV((x) => Math.min(mx, Math.max(0, x + d)))
  }
  return (
    <div className="mt-5">
      <div className="flex items-baseline gap-3" aria-hidden="true">
        <span className="font-display text-6xl font-extrabold leading-none tabular-nums [font-stretch:76%] sm:text-7xl" style={{ color: `color-mix(in srgb, ${kat[1]}, white 12%)` }}>{v}</span>
        <span className="text-sm font-bold uppercase tracking-widest" style={{ color: `color-mix(in srgb, ${kat[1]}, white 12%)` }}>{kat[0]}</span>
      </div>
      <div ref={jalur} role="slider" tabIndex={0} aria-label={tr('Coba skor risiko', 'Try a risk score')} aria-valuemin={0} aria-valuemax={mx} aria-valuenow={v} aria-valuetext={`${v}, ${kat[0]}`}
        onPointerDown={(e) => { setSeret(true); dari(e) }} onPointerMove={(e) => { setSeret(true); if (e.pointerType !== 'touch' || e.buttons) dari(e) }}
        onPointerLeave={(e) => { setSeret(false); if (e.pointerType === 'mouse') setV(awal) }} onKeyDown={onKey}
        className="relative mt-4 h-12 cursor-ew-resize touch-pan-y select-none rounded-lg">
        <div aria-hidden="true" className="absolute inset-x-0 top-5 flex h-2 gap-[3px]">
          <span className="rounded-full bg-amber" style={{ flex: t }} /><span className="rounded-full bg-ember" style={{ flex: kr - t }} /><span className="rounded-full bg-flame" style={{ flex: mx - kr }} />
        </div>
        {[0, t, kr, mx].map((x) => <span key={x} aria-hidden="true" className="absolute bottom-0 font-mono text-[11px] text-ink-2" style={{ left: `${(x / mx) * 100}%`, translate: x === mx ? '-100% 0' : x === 0 ? '0 0' : '-50% 0' }}>{x}</span>)}
        <span aria-hidden="true" className={`absolute top-1 h-8 w-0.5 -translate-x-1/2 rounded-full bg-ink ${seret ? '' : 'transition-[left] duration-500 ease-snap'}`} style={{ left: `${(v / mx) * 100}%` }}>
          <span className="absolute -top-1 left-1/2 size-3 -translate-x-1/2 rounded-full border-2 border-bg bg-ink shadow-[0_0_14px_3px_var(--ember)]" />
        </span>
      </div>
      <p className="m-0 mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-2" aria-hidden="true">{tr('Geser untuk mencoba skor', 'Slide to try a score')}</p>
    </div>
  )
}

/**
 * Angka kunci di dasar hero, tanpa kartu. Satu adegan menyatu: zona api 3/6/12 jam digambar melebar di atas peta kontur dan
 * angkanya menjadi huruf raksasa di atasnya; skor risiko bisa dicoba dengan penggeser; sumber dan batasan hanya catatan tepi
 * dengan penanda sendiri (titik dan goresan hitungan). Pemisahnya garis tipis, bukan kotak.
 */
function RingkasanHero({ tr }) {
  const t = RISIKO.batasTinggi, kr = RISIKO.batasKritis, mx = RISIKO.maks
  const masuk = '[animation:tile-masuk_.7s_var(--ease-snap)_both]'
  const angka = 'font-display font-extrabold leading-none tabular-nums [font-stretch:76%]'
  return (
    <div className="malam-token grid grid-cols-2 gap-x-8 gap-y-9 pb-10 lg:grid-cols-12 lg:pb-12">
      <div className={`relative col-span-2 flex min-h-[19rem] flex-col justify-end lg:col-span-7 lg:row-span-2 lg:min-h-[24rem] ${masuk}`} style={{ animationDelay: '100ms' }}>
        <div aria-hidden="true" className="pointer-events-none absolute -left-10 top-[22%] size-[22rem] rounded-full bg-ember/25 blur-3xl" />
        <svg viewBox="0 0 640 300" aria-hidden="true" className="absolute inset-x-0 top-0 h-[78%] w-full text-ember [filter:drop-shadow(0_0_22px_color-mix(in_srgb,var(--ember)_45%,transparent))] [overflow:visible]">
          {[330, 346].map((rx, i) => <ellipse key={rx} cx={rx - 50} cy="165" rx={rx} ry={118 + i * 14} fill="none" stroke="currentColor" strokeOpacity=".16" transform="rotate(-8 70 165)" />)}
          <g transform="rotate(-8 70 165)">
            {[[330, 280, 105, '12', 0.2, '12 9', 'var(--amber)'], [210, 160, 68, '6', 0.26, '', 'var(--ember)'], [150, 100, 40, '3', 0.5, '', 'var(--flame)']].map(([cx, rx, ry, j, o, , w]) => (
              <ellipse key={j} cx={cx} cy="165" rx={rx} ry={ry} fill={w} stroke={w} strokeWidth="1.8" className={`sebar sebar-${j}`} style={{ '--o': o, fillOpacity: 1, transformBox: 'view-box', transformOrigin: '70px 165px' }} />
            ))}
          </g>
          {[[248, 140, '3', 'var(--flame)'], [367, 123, '6', 'var(--ember)'], [605, 90, '12', 'var(--amber)']].map(([x, y, j, w]) => (
            <g key={j}>
              <circle cx={x} cy={y} r="3.5" fill={w} />
              <line x1={x} y1={y} x2={x} y2={y - 26} stroke={w} strokeOpacity=".8" />
              <text x={x} y={y - 32} textAnchor={j === '12' ? 'end' : 'middle'} className="fill-ink font-mono text-[12px] font-semibold">{j} {tr('jam', 'h')}</text>
            </g>
          ))}
          <circle cx="70" cy="165" r="5" fill="currentColor" /><circle cx="70" cy="165" r="5" fill="none" stroke="currentColor" className="titik-api-cincin [transform-box:fill-box] [transform-origin:center]" />
        </svg>
        <dl className="relative m-0">
          <dt className="m-0 flex items-baseline gap-3"><span className={`${angka} inline-flex items-center text-[clamp(5rem,12vw,9.5rem)] [text-shadow:0_4px_40px_var(--bg)]`}><span className="text-flame">3</span><span className="mx-[0.12em] size-[0.11em] shrink-0 rounded-full bg-ink-2" /><span className="text-ember">6</span><span className="mx-[0.1em] inline-block size-[0.13em] rounded-full bg-ink-2 align-[0.32em]" /><span className="text-amber">12</span></span><span className="text-lg font-semibold text-ember-ink">{tr('jam', 'hours')}</span></dt>
          <dd className="m-0 mt-3 max-w-[34ch] text-base leading-snug text-ink">{tr('Zona jangkauan api ke depan, menyebar dari titik api searah angin', 'Forward fire-reach zones, spreading from the ignition point downwind')}</dd>
        </dl>
      </div>

      <div className={`col-span-2 border-t border-ink-2/40 pt-5 lg:col-span-5 ${masuk}`} style={{ animationDelay: '220ms' }}>
        <dl className="m-0">
          <dt className="m-0 flex items-baseline gap-2"><span className={`${angka} text-4xl sm:text-5xl`}>0–{mx}</span><span className="text-sm font-semibold text-ember-ink">{tr('skor', 'score')}</span></dt>
          <dd className="m-0 mt-2 text-sm leading-snug text-ink-2">{tr('Risiko pemukiman, berbasis aturan', 'Settlement risk, rule-based')}</dd>
        </dl>
        <PengukurSkor tr={tr} t={t} kr={kr} mx={mx} />
      </div>

      <div className={`col-span-1 border-t border-ink-2/40 pt-5 lg:col-span-3 ${masuk}`} style={{ animationDelay: '340ms' }}>
        <div aria-hidden="true" className="flex gap-2">
          {DATA.map((d, i) => <span key={d.d[0]} className={`size-5 rounded-full ${d.badge ? 'bg-amber' : 'bg-mint ring-2 ring-mint/40 ring-offset-2 ring-offset-transparent'}`} style={{ animation: `tile-masuk .5s var(--ease-snap) ${500 + i * 90}ms both` }} />)}
        </div>
        <dl className="m-0">
          <dt className="m-0 mt-4 flex items-baseline gap-2"><span className={`${angka} text-5xl`}>{DATA.length}</span><span className="text-sm font-semibold text-ember-ink">{tr('sumber', 'sources')}</span></dt>
          <dd className="m-0 mt-2 text-sm leading-snug text-ink-2">{tr('Data berlabel demo atau berlisensi', 'Data labeled demo or licensed')}</dd>
        </dl>
      </div>

      <div className={`col-span-1 border-t border-ink-2/40 pt-5 lg:col-span-2 ${masuk}`} style={{ animationDelay: '440ms' }}>
        <div aria-hidden="true"><svg viewBox="0 0 48 22" aria-hidden="true" className="h-5 w-12 text-ember" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          {[6, 16, 26, 36].slice(0, Math.min(4, BATASAN.length)).map((x, i) => <line key={x} x1={x} y1="2" x2={x} y2="20" className="coret" style={{ '--j': i }} />)}
          {BATASAN.length >= 5 && <line x1="1" y1="17" x2="44" y2="5" className="coret" style={{ '--j': 4 }} />}
        </svg></div>
        <dl className="m-0">
          <dt className="m-0 mt-4 flex items-baseline gap-2"><span className={`${angka} text-5xl`}>{BATASAN.length}</span><span className="text-sm font-semibold text-ember-ink">{tr('batasan', 'limits')}</span></dt>
          <dd className="m-0 mt-2 text-sm leading-snug text-ink-2">{tr('Kami tulis terbuka, bukan disembunyikan', 'Stated openly, not hidden')}</dd>
        </dl>
      </div>
    </div>
  )
}

const IKON_DATA = [Flame, Rumah, Wind, Peta]
// Lapisan data sebagai tumpukan pelat: peta dasar di bawah, titik panas di atas. Memilih lapisan mengangkat pelatnya dan membuka rincian asal-usulnya.
function LapisanData({ tr, p }) {
  const [aktif, setAktif] = useState(0)
  const n = DATA.length
  const onKey = (e) => {
    const arah = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!arah) return
    e.preventDefault()
    const k = (aktif + arah + n) % n
    setAktif(k)
    document.getElementById(`lapis-tab-${k}`)?.focus()
  }
  return (
    <div className="relative grid overflow-hidden rounded-3xl border border-line bg-surface md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-ember/15 blur-3xl" />
      <div aria-hidden="true" className="relative min-h-[20rem] overflow-hidden border-b border-line [perspective:1100px] md:min-h-[26rem] md:border-b-0 md:border-r">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_50%_55%,var(--text),transparent_72%)]" />
        <div className="group/pelat absolute left-1/2 top-[60%] h-32 w-44 -ml-22 -mt-16 [transform-style:preserve-3d] [transform:rotateX(58deg)_rotateZ(-14deg)] sm:h-36 sm:w-52 sm:-ml-26 sm:-mt-[4.5rem]">
          {DATA.map((d, i) => {
            const sel = i === aktif, Ik = IKON_DATA[i]
            return (
              <button key={d.d[0]} type="button" tabIndex={-1} onClick={() => setAktif(i)} aria-label={p(d.d)}
                style={{ transform: `translateZ(${(n - 1 - i) * 50}px)`, transformStyle: 'preserve-3d' }}
                className="group/pl absolute inset-0 cursor-pointer rounded-2xl outline-none [-webkit-tap-highlight-color:transparent]">
                {/* Kotak sasaran klik tetap diam; hanya lapisan visual di dalamnya yang terangkat, agar klik tidak "lari" dari bawah kursor */}
                {/* Hover per pelat (bukan seluruh tumpukan): pelat di bawah kursor terangkat sedikit, tepinya menyala oranye, bayangannya menebal — tanda bisa diklik */}
                <span style={{ transform: `translateZ(calc(${sel ? 18 : 0}px + var(--angkat, 0px)))` }}
                  className={`pointer-events-none flex size-full items-end gap-2 rounded-2xl border-2 p-3 text-left text-xs font-bold uppercase tracking-wider shadow-[0_26px_40px_-20px_rgb(0_0_0/.6)] transition-[transform,opacity,background-color,border-color,box-shadow] duration-300 ease-snap will-change-transform [@media(hover:hover)]:group-hover/pl:[--angkat:10px] ${sel ? (d.badge ? 'border-amber bg-amber/25 text-amber' : 'border-canopy bg-canopy/25 text-canopy') : 'border-line-strong bg-surface text-ink [@media(hover:hover)]:group-hover/pl:border-ember-ink [@media(hover:hover)]:group-hover/pl:shadow-[0_0_0_4px_color-mix(in_oklab,var(--ember)_22%,transparent),0_34px_46px_-18px_rgb(0_0_0/.7)]'}`}>
                  <Ik size={14} className="shrink-0" /><span className="truncate">{p(d.d).split(' (')[0]}</span>
                </span>
              </button>
            )
          })}
        </div>
        <p className="absolute bottom-3 left-4 m-0 font-mono text-[11px] uppercase tracking-widest text-ink-2">{tr('Lapisan peta', 'Map layers')}<span className="normal-case tracking-normal"> · {tr('ketuk pelat untuk rincian', 'tap a layer for details')}</span></p>
      </div>
      <div className="relative flex flex-col p-5 sm:p-7">
        <div role="tablist" aria-label={tr('Sumber data', 'Data sources')} onKeyDown={onKey} className="flex flex-wrap gap-1.5">
          {DATA.map((d, i) => {
            const Ik = IKON_DATA[i], sel = i === aktif
            return (
              <button key={d.d[0]} id={`lapis-tab-${i}`} role="tab" type="button" aria-selected={sel} aria-controls="lapis-panel" tabIndex={sel ? 0 : -1} onClick={() => setAktif(i)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-[background-color,color,border-color,scale] duration-200 ease-snap active:scale-95 ${sel ? 'border-ink bg-ink text-bg' : 'border-line text-ink-2 hover:border-ink-2 hover:text-ink'}`}>
                <Ik size={15} aria-hidden="true" />{p(d.d).split(' (')[0]}
                <span aria-hidden="true" className={`size-2 rounded-full ${d.badge ? 'bg-amber' : 'bg-canopy'}`} />
              </button>
            )
          })}
        </div>
        <div id="lapis-panel" role="tabpanel" aria-labelledby={`lapis-tab-${aktif}`} className="mt-6 grid flex-1">
          {DATA.map((d, i) => {
            const on = i === aktif, Ik = IKON_DATA[i]
            return (
              <div key={d.d[0]} aria-hidden={!on} inert={on ? undefined : ''} style={{ transitionDelay: on ? '90ms' : '0ms' }}
                className={`flex flex-col [grid-area:1/1] transition-[opacity,translate,filter] duration-500 ease-snap ${on ? 'translate-y-0 opacity-100 blur-0' : 'pointer-events-none translate-y-3 opacity-0 blur-[2px]'}`}>
                <p className="m-0 font-mono text-xs uppercase tracking-widest text-ink-2">{tr('Lapisan', 'Layer')} {String(n - i).padStart(2, '0')} · {i === 0 ? tr('paling atas', 'top') : i === n - 1 ? tr('dasar peta', 'base map') : tr('di tengah', 'middle')}</p>
                <div className="mt-3 flex items-start gap-4">
                  <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl border ${d.badge ? 'border-amber/60 bg-amber/10 text-amber' : 'border-canopy/60 bg-canopy/10 text-canopy'}`}><Ik size={26} aria-hidden="true" /></span>
                  <h3 className="m-0 text-3xl leading-[1.05] sm:text-4xl">{p(d.d)}</h3>
                </div>
                <p className="m-0 mt-4 max-w-[46ch] text-lg leading-relaxed text-ink-2">{p(d.c)}</p>
                <div className="mt-auto pt-6">
                  <div className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${d.badge ? 'border-amber/50 bg-amber/10' : 'border-canopy/50 bg-canopy/10'}`}>
                    <span className="text-sm font-semibold">{d.badge ? tr('Belum data nyata', 'Not real data yet') : tr('Sumber terbuka berlisensi', 'Openly licensed source')}</span>
                    {d.badge ? <BadgeDemo>{p(d.s)}</BadgeDemo> : <span className="inline-flex items-center gap-1.5 rounded-full border border-canopy/60 px-2.5 py-1 text-xs font-semibold text-canopy"><span className="size-1.5 rounded-full bg-canopy" aria-hidden="true" />{p(d.s)}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Dynamic island: pil melayang di bawah header. Ringkas (bagian yang sedang dibaca + cincin kemajuan halaman) saat
// menggulir, melebar menjadi daftar bagian saat disentuh, difokus, atau diklik. Lebarnya dianimasikan, bukan sekadar muncul.
function SubNav({ tr }) {
  const b = useBahasa()
  const [aktif, setAktif] = useState('cara')
  const [buka, setBuka] = useState(true)
  const [lebar, setLebar] = useState({ k: 0, l: 0 })
  const [maju, setMaju] = useState(0)
  const ringkas = useRef(null), daftar = useRef(null), pil = useRef(null), tahan = useRef(false), timer = useRef(0)
  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setAktif(e.target.id) }) }, { rootMargin: '-130px 0px -55% 0px' })
    BAGIAN.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [])
  // Menggulir: ringkas (kecuali sedang disentuh), dan perbarui cincin kemajuan
  useEffect(() => {
    let y0 = scrollY, raf = 0
    const ukur = () => {
      raf = 0
      const tinggi = document.documentElement.scrollHeight - innerHeight
      setMaju(tinggi > 0 ? Math.min(1, Math.max(0, scrollY / tinggi)) : 0)
      if (!tahan.current && Math.abs(scrollY - y0) > 60) { setBuka(false); y0 = scrollY }
    }
    const naik = () => { if (!raf) raf = requestAnimationFrame(ukur) }
    addEventListener('scroll', naik, { passive: true })
    return () => { removeEventListener('scroll', naik); cancelAnimationFrame(raf) }
  }, [])
  // Ukur lebar kedua wujud agar pil bisa berubah lebar dengan mulus
  useEffect(() => {
    const k = ringkas.current?.scrollWidth ?? 0, l = daftar.current?.scrollWidth ?? 0
    setLebar((o) => (o.k === k && o.l === l ? o : { k, l }))
  }, [aktif, b, buka])
  useEffect(() => { if (daftar.current) daftar.current.inert = !buka; if (ringkas.current) ringkas.current.inert = buka }, [buka])
  const masuk = () => { tahan.current = true; clearTimeout(timer.current); setBuka(true) }
  const keluar = () => { tahan.current = false; clearTimeout(timer.current); timer.current = setTimeout(() => { if (scrollY > 200) setBuka(false) }, 700) }
  const nama = (id) => tr(...BAGIAN.find(([x]) => x === id)[1])
  const lebarPil = lebar.k && lebar.l ? Math.min((buka ? lebar.l : lebar.k) + 12, (typeof innerWidth === 'number' ? innerWidth : 1200) - 32) : undefined
  return (
    <nav aria-label={tr('Bagian halaman', 'On this page')} className="pointer-events-none sticky top-[4.6rem] z-30 h-0">
      <div className="flex justify-center px-4 pt-3">
        <div ref={pil} onPointerEnter={masuk} onPointerLeave={keluar} onFocus={masuk} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) keluar() }}
          onKeyDown={(e) => { if (e.key === 'Escape') { setBuka(false); tahan.current = false } }}
          style={{ width: lebarPil }}
          className="pointer-events-auto relative h-12 overflow-hidden rounded-full border border-line bg-bg/80 p-1.5 shadow-[0_10px_30px_-10px_rgb(0_0_0/.45)] backdrop-blur-xl transition-[width] duration-500 ease-snap">
          <button ref={ringkas} type="button" aria-expanded={buka} onClick={() => setBuka(true)} aria-label={tr('Buka daftar bagian', 'Open section list')}
            className={`absolute inset-y-1.5 left-1.5 flex items-center gap-2.5 whitespace-nowrap rounded-full pl-1 pr-4 text-sm font-semibold transition-[opacity,scale] duration-300 ease-snap ${buka ? 'pointer-events-none scale-95 opacity-0' : 'opacity-100'}`}>
            <span aria-hidden="true" className="relative flex size-8 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--ember) ${maju * 360}deg, color-mix(in srgb, var(--text) 20%, transparent) 0)` }}>
              <span className="absolute inset-[3px] rounded-full bg-ink" />
            </span>
            {nama(aktif)}
          </button>
          <ul ref={daftar} className={`absolute inset-y-1.5 left-1.5 m-0 flex list-none items-center gap-1 whitespace-nowrap p-0 transition-[opacity,scale] duration-300 ease-snap ${buka ? 'opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}>
            {BAGIAN.map(([id]) => (
              <li key={id}>
                <a href={`#${id}`} aria-current={aktif === id ? 'location' : undefined} onClick={() => { tahan.current = false; setTimeout(() => setBuka(false), 350) }}
                  className={`flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-[background-color,color,scale] duration-200 ease-snap active:scale-95 ${aktif === id ? 'bg-ink text-bg' : 'text-ink-2 hover:bg-ink/10 hover:text-ink'}`}>
                  {nama(id)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default function About() {
  const b = useBahasa()
  const t = useKamus()
  const tr = useTr()
  useJudul(tr('Tentang', 'About'))
  const k = (n) => desimal(n, b)
  const p = (pasangan) => tr(...pasangan)
  const skorMaks = Math.max(...RISIKO_ADEGAN.map((r) => r.skor), 1)
  const skor = Object.fromEntries(RISIKO_ADEGAN.map((r) => [r.nama, r]))
  const jarak = (x) => Math.hypot(x.e, x.n)
  const ranking = [...DATA_ADEGAN.pemukiman].sort((x, y) => (skor[y.nama]?.skor ?? -1) - (skor[x.nama]?.skor ?? -1) || jarak(x) - jarak(y)).slice(0, 5).map((x) => ({ ...x, km: jarak(x) }))

  return (
    <>
      <KemajuanBaca />
      <header className="hero-malam relative isolate overflow-hidden">
        <FotoLatar posisi="50% 40%" segera />
        <div className="absolute inset-0 -z-10 bg-bg/5" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-bg/40 md:hidden" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/30 via-45% to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/70 via-transparent to-transparent" aria-hidden="true" />
        <Container className="flex min-h-[min(88svh,820px)] flex-col justify-end gap-12 pb-0 pt-32">
          <div className="grid w-full items-end gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div>
              <p className="alis m-0">{tr('Tentang kami', 'About us')}</p>
              <h1 className="mt-4 text-[clamp(3.5rem,9vw,7.5rem)] leading-[1.02]">{tr('Tentang PyraOps', 'About PyraOps')}</h1>
            </div>
            <div className="lg:pb-3">
              <p className="m-0 max-w-[40ch] text-lg leading-relaxed text-ink">{t.tagline}</p>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Button as={Link} to="/peta?demo=1">{tr('Coba simulasi demo', 'Try the demo simulation')}</Button>
                <a href="#latar" className="inline-flex min-h-9 items-center text-sm font-semibold underline decoration-line underline-offset-4 transition-colors duration-150 ease-snap hover:decoration-ember-ink">{tr('Baca selengkapnya', 'Read more')}</a>
              </div>
              {FOTO.hero?.kredit && <p className="mb-0 mt-6 text-xs text-ink-2">{tr('Foto', 'Photo')}: {FOTO.hero.tautan ? <a href={FOTO.hero.tautan} className="underline underline-offset-2" rel="noopener noreferrer">{FOTO.hero.kredit}</a> : FOTO.hero.kredit}{FOTO.hero.sumber ? ` / ${FOTO.hero.sumber}` : ''}</p>}
            </div>
          </div>
          <RingkasanHero tr={tr} />
        </Container>
      </header>
      <div className="h-5" aria-hidden="true" />
      <SubNav tr={tr} />
      <div className="h-9" aria-hidden="true" />

      <AkordeonPanel id="cara">
      <PanelFoto foto={FOTO.panel[0]} id="latar" strip={<StripStat b={b} />} eyebrow={tr('Latar belakang', 'Background')} judul={tr('Masalah yang ingin dijawab', 'The problem we want to answer')}
       
        visual={
          <figure className="m-0 border-l-[3px] border-ember-ink pl-6">
            <figcaption className="text-sm font-semibold uppercase tracking-wide text-ink-2">{tr('Visi', 'Vision')}</figcaption>
            <blockquote className="m-0 mt-3 font-display text-3xl font-extrabold leading-tight [font-stretch:76%] sm:text-4xl">
              {tr('Masyarakat yang memahami karhutla, siap siaga, dan ikut mencegahnya, dibantu teknologi yang jujur tentang batasannya.', 'A public that understands wildfires, is prepared, and helps prevent them, supported by technology that is honest about its limits.')}
            </blockquote>
          </figure>}>
        <p className="m-0">{tr('Kebakaran hutan dan lahan (karhutla) sering terjadi saat musim kemarau, dan asapnya memengaruhi kesehatan, ekonomi, serta ekosistem. Peta titik panas menunjukkan di mana api terdeteksi, tetapi masyarakat dan posko juga perlu membayangkan ke mana api dapat menjalar dan siapa yang berada di jalurnya.',
          'Forest and land fires (karhutla) often occur in the dry season, and their smoke affects health, the economy, and ecosystems. A hotspot map shows where fire is detected, but communities and command posts also need to picture where a fire can spread and who is in its path.')}</p>
        <p className="m-0">{tr('PyraOps hadir sebagai portal edukasi sekaligus simulasi untuk menjembatani celah itu.', 'PyraOps is an education portal and simulation built to bridge that gap.')}</p>
      </PanelFoto>
      <PanelFoto foto={FOTO.panel[1]} id="simulasi" strip={<StripRumus k={k} tr={tr} />} eyebrow={tr('Transparansi', 'Transparency')} judul={tr('Cara kerja simulasi', 'How simulation works')}
        visual={
          <AlurSimulasi tr={tr} p={p} k={k} />}>
        <p className="m-0">{tr('Semua parameter berada di satu berkas konfigurasi dan dapat dijelaskan langkah demi langkah. Nilainya adalah nilai demo, bukan hasil kalibrasi lapangan.', 'All parameters live in a single configuration file and can be explained step by step. The values are demo values, not field-calibrated results.')}</p>
        <div><Accordion items={[
              { judul: tr('Rumus sebaran api', 'Fire spread formulas'), isi: (
                <ol className="list-decimal space-y-1.5 pl-5 font-mono text-sm text-ink">
                  <li>Rh = R0 × F × (1 + {k(SIM.koefAngin)} × U), {tr('dengan', 'with')} R0 = {k(SIM.R0)} km/{tr('jam', 'h')}</li>
                  <li>Rb = {k(SIM.rasioBelakang)} × Rh</li>
                  <li>LW = min({SIM.maksLW}, 1 + {k(SIM.koefLW)} × U)</li>
                  <li>ah = Rh × t; ab = Rb × t</li>
                  <li>a = (ah + ab) / 2; b = a / LW; c = (ah − ab) / 2</li>
                  <li>{tr('Arah penjalaran', 'Spread direction')} φ = (θ + 180) mod 360; {tr('pusat elips bergeser sejauh c ke arah φ', 'the ellipse center shifts by c toward φ')}</li>
                  <li>{tr('Faktor lahan F', 'Land factor F')}: {Object.entries(SIM.faktorLahan).map(([n, v]) => `${b === 'en' ? LAHAN_EN[n] : n} ${k(v)}`).join('; ')}</li>
                </ol>) },
              { judul: tr('Aturan skor risiko pemukiman', 'Settlement risk score rules'), isi: (
                <p>{tr(
                  `Skor = skor zona tercepat (3 jam ${RISIKO.skorZona[3]}, 6 jam ${RISIKO.skorZona[6]}, 12 jam ${RISIKO.skorZona[12]}) × faktor kerentanan (kecil ${k(RISIKO.faktorKelas.kecil)}, sedang ${k(RISIKO.faktorKelas.sedang)}, besar ${k(RISIKO.faktorKelas.besar)}; sekolah dan fasilitas kesehatan ${k(RISIKO.faktorKhusus.sekolah)}), maksimum ${RISIKO.maks}. Kritis ≥ ${RISIKO.batasKritis}; Tinggi ${RISIKO.batasTinggi}-${RISIKO.batasKritis - 1}; Waspada < ${RISIKO.batasTinggi}. Berbasis aturan, bukan pembelajaran mesin.`,
                  `Score = fastest-zone score (3 h ${RISIKO.skorZona[3]}, 6 h ${RISIKO.skorZona[6]}, 12 h ${RISIKO.skorZona[12]}) × vulnerability factor (small ${k(RISIKO.faktorKelas.kecil)}, medium ${k(RISIKO.faktorKelas.sedang)}, large ${k(RISIKO.faktorKelas.besar)}; schools and health facilities ${k(RISIKO.faktorKhusus.sekolah)}), maximum ${RISIKO.maks}. Critical ≥ ${RISIKO.batasKritis}; High ${RISIKO.batasTinggi}-${RISIKO.batasKritis - 1}; Watch < ${RISIKO.batasTinggi}. Rule-based, not machine learning.`)}</p>) },
            ]} /></div>
      </PanelFoto>
      <PanelFoto foto={FOTO.panel[2]} id="risiko" strip={<StripSkala tr={tr} />} eyebrow={tr('Hasil simulasi', 'Simulation output')} judul={tr('Siapa yang terkena lebih dulu', 'Who gets hit first')}
        visual={<UrutanRisiko ranking={ranking} skor={skor} skorMaks={skorMaks} tr={tr} p={p} />}>
        <p className="m-0">{tr(
          `Setiap pemukiman diberi skor dari zona yang menjangkaunya paling cepat (3 jam ${RISIKO.skorZona[3]}, 6 jam ${RISIKO.skorZona[6]}, 12 jam ${RISIKO.skorZona[12]}), dikali faktor kerentanan: kecil ${k(RISIKO.faktorKelas.kecil)}, sedang ${k(RISIKO.faktorKelas.sedang)}, besar ${k(RISIKO.faktorKelas.besar)}, sekolah dan fasilitas kesehatan ${k(RISIKO.faktorKhusus.sekolah)}.`,
          `Each settlement is scored from the zone that reaches it fastest (3 h ${RISIKO.skorZona[3]}, 6 h ${RISIKO.skorZona[6]}, 12 h ${RISIKO.skorZona[12]}), times a vulnerability factor: small ${k(RISIKO.faktorKelas.kecil)}, medium ${k(RISIKO.faktorKelas.sedang)}, large ${k(RISIKO.faktorKelas.besar)}, schools and health facilities ${k(RISIKO.faktorKhusus.sekolah)}.`)}</p>
        <p className="m-0">{tr(`Skor maksimum ${RISIKO.maks}. Kritis mulai ${RISIKO.batasKritis}; Tinggi ${RISIKO.batasTinggi}-${RISIKO.batasKritis - 1}; di bawah itu Waspada. Berbasis aturan, bukan pembelajaran mesin.`, `Maximum score ${RISIKO.maks}. Critical from ${RISIKO.batasKritis}; High ${RISIKO.batasTinggi}-${RISIKO.batasKritis - 1}; below that, Watch. Rule-based, not machine learning.`)}</p>
      </PanelFoto>
      </AkordeonPanel>

      <section id="batasan" aria-labelledby="batasan-h" className="scroll-mt-28 border-t border-line bg-band py-14 md:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="alis m-0">{tr('Penting', 'Important')}</p>
              <h2 id="batasan-h" className="mt-4 text-[clamp(2.5rem,5.5vw,4.5rem)] leading-[1.04]">{tr('Model edukatif, bukan alat keputusan.', 'An educational model, not a decision tool.')}</h2>
              <p role="note" className="mt-5 max-w-[46ch] text-base leading-relaxed text-ink-2">{t.disclaimer}</p>
              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-ink px-5 py-4 text-bg">
                <span className="font-display text-5xl font-extrabold leading-none [font-stretch:76%]">112</span>
                <span className="text-sm leading-snug">{tr('Untuk kondisi darurat nyata, hubungi 112 atau BPBD setempat.', 'For a real emergency, call 112 or your local disaster agency (BPBD).')}</span>
              </div>
            </div>
            <ol className="m-0 list-none border-b border-line p-0">
              {BATASAN.map((x, i) => (
                <li key={x[0]} className="group grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-2 border-t border-line py-5 transition-[padding] duration-300 ease-snap hover:pl-2 sm:grid-cols-[4.5rem_minmax(0,1fr)]">
                  <span className="font-display text-3xl font-extrabold leading-none text-ember-ink [font-stretch:76%] sm:text-4xl" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-base leading-relaxed sm:text-lg">{p(x)}</span>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
      <section id="prinsip" aria-labelledby="prinsip-h" className="scroll-mt-28 border-t border-line py-14 md:py-20">
        <Container>
          <p className="alis m-0">{tr('Prinsip kami', 'Our principles')}</p>
          <h2 id="prinsip-h" className="mt-4 max-w-[20ch] text-4xl leading-[1.02] sm:text-5xl">{tr('Empat hal yang kami pegang', 'Four things we hold to')}</h2>
          <PanelPrinsip item={PRINSIP} tr={tr} p={p} />
        </Container>
      </section>
      <section id="tema" aria-labelledby="tema-h" className="scroll-mt-28 border-t border-line bg-band py-14 md:py-20">
        <Container>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:gap-16">
            <div>
              <p className="alis m-0">{tr('Tema lomba', 'Competition theme')}</p>
              <h2 id="tema-h" className="mt-4 max-w-[14ch] text-4xl leading-[1.02] sm:text-5xl">{tr('Tiga sudut pandang, satu tujuan', 'Three angles, one goal')}</h2>
            </div>
            <p className="m-0 max-w-[44ch] text-base leading-relaxed text-ink-2">{tr('PyraOps menjawab sub-tema lomba lewat tiga hal: memahami masalahnya, mengajak bertindak, dan menyediakan bahan belajar.', 'PyraOps answers the competition sub-themes in three ways: understanding the problem, inviting action, and providing learning material.')}</p>
          </div>

          {/* Tiga sudut pandang: kartu sejajar, tinggi sama, satu garis atas. */}
          <div className="mt-12">
            <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-3 lg:items-stretch lg:gap-5">
              <li data-spot className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-[border-color,translate] duration-300 ease-snap hover:-translate-y-1 hover:border-ember-ink">
                <div data-gulir className="relative h-52 shrink-0 overflow-hidden sm:h-60 lg:h-56">
                  <img src={'/foto/tema-asap.webp'} alt="" aria-hidden="true" loading="lazy" decoding="async" className="size-full object-cover scale-[1.18] [translate:0_calc(var(--gy,0)*-7%)] transition-[scale] duration-[1200ms] ease-snap group-hover:scale-[1.28]" style={{ objectPosition: '50% 22%' }} />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />
                  <span className="absolute left-5 top-4 rounded-full bg-bg/75 px-3 py-1 font-mono text-xs tracking-widest text-ink backdrop-blur-sm sm:left-6" aria-hidden="true">01 / 03</span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="m-0 max-w-[14ch] text-3xl leading-tight sm:text-4xl">{p(TEMA[0][0])}</h3>
                  <p className="m-0 mt-3 max-w-[38ch] text-base leading-relaxed text-ink-2">{p(TEMA[0][1])}</p>
                  <ul className="m-0 mt-auto flex list-none flex-wrap gap-2 p-0 pt-6" aria-label={tr('Dampak lintas batas', 'Cross-border impacts')}>
                    {[tr('Asap lintas negara', 'Transboundary haze'), tr('Emisi karbon', 'Carbon emissions'), tr('Hilangnya habitat', 'Habitat loss')].map((t) => (
                      <li key={t} className="rounded-full border border-line px-3 py-1 text-sm text-ink">{t}</li>
                    ))}
                  </ul>
                </div>
              </li>

              <li data-spot className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-[border-color,translate] duration-300 ease-snap hover:-translate-y-1 hover:border-ember-ink">
                <div data-gulir className="relative h-52 shrink-0 overflow-hidden sm:h-60 lg:h-56">
                  <img src={'/foto/tema-aksi.webp'} alt="" aria-hidden="true" loading="lazy" decoding="async" className="size-full object-cover scale-[1.18] [translate:0_calc(var(--gy,0)*-7%)] transition-[scale] duration-[1200ms] ease-snap group-hover:scale-[1.28]" style={{ objectPosition: '50% 35%' }} />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />
                  <span className="absolute left-5 top-4 rounded-full bg-bg/75 px-3 py-1 font-mono text-xs tracking-widest text-ink backdrop-blur-sm sm:left-6" aria-hidden="true">02 / 03</span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="m-0 max-w-[14ch] text-3xl leading-tight sm:text-4xl">{p(TEMA[1][0])}</h3>
                  <p className="m-0 mt-3 max-w-[38ch] text-base leading-relaxed text-ink-2">{p(TEMA[1][1])}</p>
                  <ol className="m-0 mt-auto flex list-none flex-wrap items-center gap-x-1 gap-y-2 p-0 pt-6 text-[13px] font-semibold">
                    <li><Link to="/edukasi" className="rounded-full border border-line px-2.5 py-1.5 transition-[border-color,color,background-color] duration-200 ease-snap hover:border-ember hover:bg-ember hover:text-on-ember">{tr('Belajar', 'Learn')}</Link></li>
                    <li aria-hidden="true" className="text-ink-2">→</li>
                    <li><Link to="/lapor" className="rounded-full border border-line px-2.5 py-1.5 transition-[border-color,color,background-color] duration-200 ease-snap hover:border-ember hover:bg-ember hover:text-on-ember">{tr('Melapor', 'Report')}</Link></li>
                    <li aria-hidden="true" className="text-ink-2">→</li>
                    <li><span className="rounded-full border border-line px-2.5 py-1.5 text-ink-2">{tr('Membagikan', 'Share')}</span></li>
                  </ol>
                </div>
              </li>

              <li data-spot className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-[border-color,translate] duration-300 ease-snap hover:-translate-y-1 hover:border-ember-ink">
                <div data-gulir className="relative h-52 shrink-0 overflow-hidden sm:h-60 lg:h-56">
                  <img src={'/foto/tema-petugas.webp'} alt="" aria-hidden="true" loading="lazy" decoding="async" className="size-full object-cover scale-[1.18] [translate:0_calc(var(--gy,0)*-7%)] transition-[scale] duration-[1200ms] ease-snap group-hover:scale-[1.28]" style={{ objectPosition: '50% 82%' }} />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />
                  <span className="absolute left-5 top-4 rounded-full bg-bg/75 px-3 py-1 font-mono text-xs tracking-widest text-ink backdrop-blur-sm sm:left-6" aria-hidden="true">03 / 03</span>
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="m-0 max-w-[16ch] text-3xl leading-tight sm:text-4xl">{p(TEMA[2][0])}</h3>
                  <p className="m-0 mt-3 max-w-[38ch] text-base leading-relaxed text-ink-2">{p(TEMA[2][1])}</p>
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                    {[['artikel', tr('Artikel', 'Articles')], ['galeri', tr('Galeri', 'Gallery')], ['kuis', tr('Kuis', 'Quiz')], ['checklist', 'Checklist']].map(([k, l]) => (
                      <Link key={k} to={`/edukasi?tab=${k}`} className="group/c flex items-center justify-between rounded-xl border border-line px-4 py-2.5 text-sm font-semibold transition-[border-color,color] duration-200 ease-snap hover:border-ember-ink hover:text-ember-ink">
                        {l}<ArrowUpRight size={15} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover/c:-translate-y-0.5 group-hover/c:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            </ul>

            <div className="relative mt-4 lg:mt-5">
              <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 hero-malam rounded-3xl border border-line bg-bg px-6 py-5 text-ink sm:px-8">
                <p className="m-0 flex-1 basis-80 text-2xl font-bold leading-tight sm:text-3xl"><span className="mr-3 font-mono text-xs font-semibold uppercase tracking-widest text-ember-ink align-middle">{tr('Satu tujuan', 'One goal')}</span>{tr('Karhutla lebih mudah dipahami, dicegah, dan dilaporkan.', 'Wildfires made easier to understand, prevent, and report.')}</p>
                <Link to="/edukasi" className="inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-on-ember transition-[scale] duration-200 ease-snap hover:scale-105 active:scale-95">{tr('Mulai belajar', 'Start learning')}<ArrowUpRight size={15} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section id="data" aria-labelledby="data-h" className="scroll-mt-28 border-t border-line py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <div>
              <p className="alis m-0">{tr('Data', 'Data')}</p>
              <h2 id="data-h" className="mt-4 text-4xl leading-[1.02] sm:text-5xl">{tr('Sumber data dan lisensi', 'Data sources and licenses')}</h2>
              <p className="m-0 mt-4 max-w-[34ch] text-base leading-relaxed text-ink-2">{tr('Setiap angka di demo punya label asal-usul. Yang bukan data nyata ditandai jelas.', 'Every demo number has a source label. Anything not real data is clearly marked.')}</p>
              <div className="mt-8 rounded-2xl border border-line bg-surface p-4">
                <p className="m-0 text-sm font-semibold">{DATA.filter((r) => r.badge).length} {tr('dari', 'of')} {DATA.length} {tr('sumber masih data demo', 'sources are still demo data')}</p>
                <div className="mt-3 flex gap-1.5" role="img" aria-label={tr(`${DATA.filter((r) => r.badge).length} demo, ${DATA.filter((r) => !r.badge).length} berlisensi`, `${DATA.filter((r) => r.badge).length} demo, ${DATA.filter((r) => !r.badge).length} licensed`)}>
                  {DATA.map((r) => <span key={r.d[0]} className={`h-2.5 flex-1 rounded-full ${r.badge ? 'bg-amber' : 'bg-canopy'}`} />)}
                </div>
                <p className="m-0 mt-3 flex items-center gap-4 text-xs text-ink-2"><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber" aria-hidden="true" />{tr('Demo', 'Demo')}</span><span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-canopy" aria-hidden="true" />{tr('Berlisensi', 'Licensed')}</span></p>
              </div>
              <Link to="/peta?demo=1" className="mt-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-ember-ink underline underline-offset-4">{tr('Lihat labelnya di Peta', 'See the labels on the Map')}<ArrowUpRight size={14} aria-hidden="true" /></Link>
            </div>
            <LapisanData tr={tr} p={p} />
          </div>
        </Container>
      </section>
      <section id="kredit" aria-labelledby="kredit-h" className="scroll-mt-28 border-t border-line py-14 md:py-20">
        <Container>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
            <div>
              <p className="alis m-0">{tr('Kredit', 'Credits')}</p>
              <h2 id="kredit-h" className="mt-4 text-4xl leading-[1.02] sm:text-5xl">{tr('Sumber data dan kredit', 'Data sources and credits')}</h2>
            </div>
            <p className="m-0 max-w-[40ch] text-base leading-relaxed text-ink-2">{tr('Data yang kami pakai dan pustaka terbuka di baliknya, lengkap dengan lisensinya.', 'The data we use and the open libraries behind it, with their licences.')}</p>
          </div>
          <KreditDaftar />
        </Container>
      </section>
    </>
  )
}
