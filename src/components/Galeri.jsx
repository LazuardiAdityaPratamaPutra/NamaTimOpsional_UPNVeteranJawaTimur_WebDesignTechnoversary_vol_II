import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Flame, Maximize2, ZoomIn, ZoomOut } from 'lucide-react'
import Lightbox from './Lightbox'
import { MaskotBelakang } from './Maskot'
import { BAB_GALERI, TITIK_GAMBUT, UNSUR_API } from '../data/galeri'
import { daftarGaleri } from '../lib/kontenEdukasi'
import { useGesek } from '../lib/interaksi'
import { lokal, useBahasa, useTr } from '../i18n'

// Galeri sebagai ruang museum: dinding gelap dengan lampu sorot, satu lukisan berbingkai per "ruang", plakat di sampingnya,
// dan TORA (ilustrasi tampak belakang dari tim) di latar depan memandangi lukisan. Empat lukisan membentuk cerita sebab-akibat:
// unsur api -> menjalar di bawah gambut -> meluas karena angin -> asap sampai ke permukiman.
// Setiap lukisan punya satu interaksi di plakat; lukisan tambahan (tanpa interaksi khusus) tetap tampil dengan plakat biasa.

const JUDUL_ARTIKEL = { penyebab: ['Penyebab', 'Causes'], dampak: ['Dampak', 'Impacts'], pencegahan: ['Pencegahan', 'Prevention'], gambut: ['Gambut', 'Peat'] }
const TOMBOL = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl border-2 border-ink px-3 text-sm font-bold text-ink shadow-[2px_2px_0_0_var(--text)] transition-[translate,box-shadow,background-color,color] duration-150 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--text)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'

/** Zona yang diredupkan saat satu unsur segitiga api dihilangkan ("R x,y,w,h" = persegi, selain itu poligon). */
function ZonaRedup({ zona }) {
  return zona.map((z) => {
    if (z.startsWith('R')) { const [x, y, w, h] = z.slice(1).split(',').map(Number); return <rect key={z} x={x} y={y} width={w} height={h} rx="10" /> }
    return <polygon key={z} points={z} />
  })
}

/** Gambar di lightbox yang bisa diperbesar 2,5×; titik perbesaran mengikuti kursor atau jari. */
function GambarZoom({ src, alt, tr }) {
  const [zoom, setZoom] = useState(false)
  const [titik, setTitik] = useState({ x: 50, y: 50 })
  const ke = (e) => { const r = e.currentTarget.getBoundingClientRect(); setTitik({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }) }
  const tahan = (e) => { if (zoom) e.stopPropagation() } // saat diperbesar, geser jari = menggeser gambar, bukan pindah lukisan
  return (
    <div>
      <div className={`relative overflow-hidden rounded-lg ${zoom ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in'}`}
        onClick={(e) => { ke(e); setZoom(!zoom) }} onPointerMove={(e) => { if (zoom) ke(e) }} onPointerDown={tahan} onPointerUp={tahan}>
        <img src={src} alt={alt} width="1408" height="768" draggable="false" style={{ transformOrigin: `${titik.x}% ${titik.y}%` }}
          className={`block h-auto w-full select-none transition-[scale] duration-300 ease-snap motion-reduce:transition-none ${zoom ? 'scale-[2.5]' : ''}`} />
      </div>
      <button type="button" onClick={() => setZoom(!zoom)} aria-pressed={zoom} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs font-semibold text-ink hover:border-ember-ink">
        {zoom ? <ZoomOut size={14} aria-hidden="true" /> : <ZoomIn size={14} aria-hidden="true" />}{zoom ? tr('Perkecil', 'Zoom out') : tr('Perbesar 2,5×', 'Zoom 2.5×')}
      </button>
    </div>
  )
}

export default function Galeri() {
  const b = useBahasa()
  const tr = useTr()
  const GALERI = daftarGaleri(b) // bawaan + unggahan admin, hanya yang berstatus terbit
  const n = GALERI.length
  const [aktifMentah, setAktif] = useState(0)
  const aktif = Math.min(aktifMentah, Math.max(0, n - 1))
  const [arah, setArah] = useState(1)
  const [jalan, setJalan] = useState(false) // TORA berjalan ke lukisan berikutnya
  const [buka, setBuka] = useState(null) // indeks lukisan di lightbox
  const [unsur, setUnsur] = useState(null) // unsur segitiga yang dihilangkan
  const [titik, setTitik] = useState(null) // titik sorot gambut yang terbuka
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const pindah = (i) => {
    const ke = (i + n) % n
    if (ke === aktif) return
    setArah(i > aktif ? 1 : -1); setAktif(ke); setUnsur(null); setTitik(null)
    setJalan(true); clearTimeout(timer.current); timer.current = setTimeout(() => setJalan(false), 750)
  }
  const gesek = useGesek(() => pindah(aktif + 1), () => pindah(aktif - 1))
  const onKey = (e) => {
    if (e.target.closest('input, textarea, dialog')) return
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (d) { e.preventDefault(); pindah(aktif + d) }
  }

  if (!n) return <p className="m-0 rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-2">{tr('Galeri sedang ditata ulang. Coba lagi nanti.', 'The gallery is being rearranged. Please check back later.')}</p>
  const g = GALERI[aktif]
  const babG = BAB_GALERI[g.id] ? lokal(BAB_GALERI[g.id], b) : null
  const nomor = String(aktif + 1).padStart(2, '0')
  const src = g.src
  const unsurAktif = unsur ? lokal(UNSUR_API.find((u) => u.id === unsur), b) : null
  const titikAktif = titik ? lokal(TITIK_GAMBUT.find((t) => t.id === titik), b) : null
  const ucapan = babG?.tora ?? g.keterangan
  const item = buka === null ? null : GALERI[buka]

  const tautanArtikel = (slug) => (
    <Link to={`/edukasi/${slug}`} className="mt-1.5 inline-block text-xs font-semibold text-ink-2 underline underline-offset-4 hover:text-ember-ink">
      {tr(`Baca selengkapnya: artikel ${tr(...JUDUL_ARTIKEL[slug])}`, `Read more: the ${tr(...JUDUL_ARTIKEL[slug])} article`)}
    </Link>
  )

  // Interaksi per lukisan, ditampilkan di plakat
  const interaksi = () => {
    if (g.id === 'segitiga') return (
      <div>
        <p className="m-0 text-sm font-bold">{tr('Hilangkan satu unsur:', 'Remove one element:')}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {UNSUR_API.map((u0) => { const u = lokal(u0, b), on = unsur === u.id; return (
            <button key={u.id} type="button" aria-pressed={on} onClick={() => setUnsur(on ? null : u.id)}
              className={`${TOMBOL} ${on ? '!bg-ink !text-surface line-through decoration-2' : 'bg-surface'}`}>{u.nama}</button>
          ) })}
        </div>
        <div aria-live="polite">
          {unsurAktif && (
            <div key={unsurAktif.id} className="baris-masuk-halus mt-3 border-l-2 border-ember-ink pl-3">
              <p className="m-0 text-sm font-bold text-canopy">{tr('Api padam.', 'The fire is out.')}</p>
              <p className="m-0 mt-1 text-sm leading-relaxed">{unsurAktif.teks}</p>
              {tautanArtikel(unsurAktif.artikel)}
            </div>
          )}
        </div>
        {unsur && <button type="button" onClick={() => setUnsur(null)} className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink"><Flame size={14} aria-hidden="true" />{tr('Nyalakan lagi', 'Relight')}</button>}
      </div>
    )
    if (g.id === 'gambut') return (
      <div>
        <p className="m-0 text-sm font-bold">{tr('Ketuk titik di lukisan atau di sini:', 'Tap a point on the painting or here:')}</p>
        <ol className="m-0 mt-2 flex list-none flex-wrap gap-2 p-0">
          {TITIK_GAMBUT.map((t0, i) => { const t = lokal(t0, b), on = titik === t.id; return (
            <li key={t.id}><button type="button" aria-pressed={on} onClick={() => setTitik(on ? null : t.id)}
              className={`${TOMBOL} ${on ? '!bg-ember !text-on-ember' : 'bg-surface'}`}><span className="font-mono">{i + 1}</span><span className="sr-only">. {t.judul}</span></button></li>
          ) })}
        </ol>
        <div aria-live="polite">
          {titikAktif && (
            <div key={titikAktif.id} className="baris-masuk-halus mt-3 border-l-2 border-ember-ink pl-3">
              <p className="m-0 text-sm font-bold">{titikAktif.judul}</p>
              <p className="m-0 mt-1 text-sm leading-relaxed">{titikAktif.teks}</p>
              {tautanArtikel('gambut')}
            </div>
          )}
        </div>
      </div>
    )
    if (g.id === 'angin') return (
      <Link to="/peta?demo=1" className={`${TOMBOL} !min-h-11 !bg-ember px-4 !text-on-ember`}>{tr('Coba sendiri di simulasi Peta', 'Try it in the Map simulation')}<ArrowRight size={16} aria-hidden="true" /></Link>
    )
    if (g.id === 'asap') return (
      <div className="flex flex-wrap gap-2">
        <Link to="/edukasi?tab=checklist" className={`${TOMBOL} !min-h-11 !bg-ember px-4 !text-on-ember`}>{tr('Siapkan diri: checklist', 'Get ready: checklist')}<ArrowRight size={16} aria-hidden="true" /></Link>
        <Link to="/edukasi/dampak" className={`${TOMBOL} !min-h-11 bg-surface px-4`}>{tr('Dampak asap', 'Smoke impacts')}</Link>
      </div>
    )
    return null
  }

  return (
    <>
    <section aria-roledescription={tr('galeri', 'gallery')} aria-label={tr('Galeri museum karhutla', 'Wildfire museum gallery')} onKeyDown={onKey}
      className="museum hero-malam overflow-hidden rounded-[1.75rem] border-2 border-ink shadow-[6px_6px_0_0_var(--line-strong)]">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_23rem]">
        {/* Ruang pamer */}
        <div {...gesek} className="museum-ruang relative h-[23rem] touch-pan-y select-none sm:h-[30rem] lg:h-[37rem]">
          <div aria-hidden="true" className="museum-lantai absolute inset-x-0 bottom-0 h-[24%]" />
          <div aria-hidden="true" className="absolute left-1/2 top-0 h-2.5 w-[22%] -translate-x-1/2 rounded-b-md bg-[rgb(18_16_14)] shadow-[0_2px_0_rgb(255_255_255/0.08)]" />
          <div key={`sorot-${aktif}`} aria-hidden="true" className="museum-sorot absolute left-1/2 top-2 h-[82%] w-[86%] -translate-x-1/2" />

          {/* Pigura */}
          <figure key={aktif} className={`pigura absolute left-1/2 top-[6%] m-0 w-[88%] -translate-x-1/2 sm:w-[76%] lg:w-[80%] ${arah > 0 ? 'pigura-dari-kanan' : 'pigura-dari-kiri'}`}>
            <div className="pigura-bingkai">
              <div className="pigura-pasparto">
                <div className="relative aspect-[1408/768] overflow-hidden">
                  <button type="button" onClick={() => setBuka(aktif)} aria-label={`${tr('Perbesar lukisan', 'Enlarge painting')}: ${g.judul}`} className="group/l absolute inset-0 cursor-zoom-in">
                    <img src={src} alt={g.alt} width="1408" height="768" decoding="async" draggable="false" className="size-full object-cover" />
                    <span aria-hidden="true" className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-ember text-on-ember opacity-0 transition-opacity duration-200 group-hover/l:opacity-100 group-focus-visible/l:opacity-100"><Maximize2 size={14} /></span>
                  </button>
                  {g.id === 'segitiga' && unsurAktif && (
                    <svg key={unsurAktif.id} viewBox="0 0 1408 768" preserveAspectRatio="none" aria-hidden="true" className="unsur-redup pointer-events-none absolute inset-0 size-full">
                      <g fill="rgb(246 246 244 / 0.9)"><ZonaRedup zona={unsurAktif.zona} /></g>
                      <circle cx="704" cy="402" r="40" fill="rgb(246 246 244)" />
                      <path className="asap-padam" d="M704 412 c-14 -12 12 -18 0 -32 c-12 -12 12 -16 2 -30" fill="none" stroke="rgb(120 124 122)" strokeWidth="7" strokeLinecap="round" />
                    </svg>
                  )}
                  {g.id === 'gambut' && TITIK_GAMBUT.map((t0, i) => { const t = lokal(t0, b), on = titik === t.id; return (
                    <button key={t.id} type="button" aria-pressed={on} aria-label={`${i + 1}. ${t.judul}`} onClick={() => setTitik(on ? null : t.id)}
                      style={{ left: `${t.x}%`, top: `${t.y}%` }}
                      className={`titik-gambut absolute flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-mono text-xs font-bold sm:size-9 sm:text-sm ${on ? 'border-[rgb(255_196_84)] bg-[rgb(28_22_18)] text-[rgb(255_196_84)]' : 'border-[rgb(28_22_18)] bg-[rgb(255_196_84)] text-[rgb(28_22_18)]'}`}>{i + 1}</button>
                  ) })}
                </div>
              </div>
            </div>
          </figure>

          {/* Tali pembatas */}
          <svg aria-hidden="true" viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute bottom-[5%] left-[14%] h-[9%] w-[74%]">
            <path d="M2 2 Q 50 9 98 2" fill="none" stroke="rgb(158 38 46)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 5 }} />
          </svg>
          {[14, 88].map((x) => <span key={x} aria-hidden="true" style={{ left: `${x}%` }} className="absolute bottom-[3%] h-[13%] w-2.5 -translate-x-1/2 rounded-t-full border-2 border-[rgb(28_22_18)] bg-[rgb(198_160_82)]" />)}

          {/* TORA memandangi lukisan */}
          <div aria-hidden="true" className="absolute bottom-0 left-[14%] w-[30%] max-w-[10rem] sm:left-[16%] sm:w-[23%] lg:left-[17%] lg:w-[25%] lg:max-w-[13.5rem]">
            <MaskotBelakang jalan={jalan} className="h-auto w-full" />
          </div>
          <p key={`ucap-${aktif}`} className="gelembung-tora absolute bottom-[19%] left-[43%] m-0 hidden w-[23%] max-w-[15rem] rounded-2xl border-2 border-[rgb(28_22_18)] bg-[rgb(250_246_236)] p-3 text-[13px] font-semibold leading-snug text-[rgb(28_22_18)] lg:block">
            <span className="sr-only">TORA: </span>{ucapan}
          </p>
        </div>

        {/* Plakat */}
        <div className="plakat flex flex-col gap-5 border-t-2 border-ink p-5 sm:p-6 lg:border-l-2 lg:border-t-0">
          <div key={`plakat-${aktif}`} className="plakat-kartu baris-masuk-halus rounded-xl border-2 border-[rgb(28_22_18)] p-4 shadow-[4px_4px_0_0_rgb(0_0_0/0.45)]">
            <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-ink">No. {nomor}{babG ? ` · ${babG.bab}` : ''}</p>
            <h3 className="judul-display m-0 mt-1 text-2xl leading-none">{g.judul}</h3>
            <p className="m-0 mt-2 text-sm leading-relaxed">{g.keterangan}</p>
            <p className="m-0 mt-2 text-xs text-ink-2">{g.atribusi} · {g.lisensi}</p>
            <p className="m-0 mt-3 border-t border-dashed border-ink-2/50 pt-3 text-sm font-semibold lg:hidden"><span className="font-mono text-xs uppercase tracking-widest text-ember-ink">TORA · </span>{ucapan}</p>
          </div>
          {interaksi() && <div key={`aksi-${aktif}`} className="plakat-aksi baris-masuk-halus">{interaksi()}</div>}

          {/* Denah: pindah ruang */}
          <nav aria-label={tr('Denah galeri', 'Gallery map')} className="mt-auto">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 font-mono text-xs uppercase tracking-[0.16em] text-ink-2" aria-live="polite">{tr(`Ruang ${aktif + 1} dari ${n}`, `Room ${aktif + 1} of ${n}`)}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => pindah(aktif - 1)} aria-label={tr('Lukisan sebelumnya', 'Previous painting')} className={`${TOMBOL} !size-10 justify-center !px-0`}><ChevronLeft size={18} aria-hidden="true" /></button>
                <button type="button" onClick={() => pindah(aktif + 1)} aria-label={tr('Lukisan berikutnya', 'Next painting')} className={`${TOMBOL} !size-10 justify-center !bg-ember !px-0 !text-on-ember`}><ChevronRight size={18} aria-hidden="true" /></button>
              </div>
            </div>
            <ol className="m-0 mt-3 grid list-none gap-1.5 p-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
              {GALERI.map((x, i) => (
                <li key={x.id}>
                  <button type="button" onClick={() => pindah(i)} aria-current={i === aktif ? 'true' : undefined} aria-label={`${i + 1}. ${x.judul}`}
                    className={`denah-ruang flex h-12 w-full flex-col items-start justify-between rounded-lg border-2 px-2 py-1.5 text-left transition-colors duration-200 ${i === aktif ? 'border-ember-ink bg-ember-ink/15' : 'border-line hover:border-ink-2'}`}>
                    <span className="font-mono text-[11px] text-ember-ink">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`h-1 w-full rounded-full ${i === aktif ? 'bg-ember-ink' : 'bg-line'}`} />
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </section>

      <Lightbox item={item} indeks={buka ?? 0} total={n} onClose={() => setBuka(null)}
        onPrev={() => setBuka((buka + n - 1) % n)} onNext={() => setBuka((buka + 1) % n)}>
        {item && <GambarZoom key={item.id} src={item.src} alt={item.alt} tr={tr} />}
      </Lightbox>
    </>
  )
}
