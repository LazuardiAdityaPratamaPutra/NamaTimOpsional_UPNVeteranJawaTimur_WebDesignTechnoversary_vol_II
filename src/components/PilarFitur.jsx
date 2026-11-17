import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Plus } from 'lucide-react'
import { sampul } from '../data/sampul'
import { KUIS } from '../data/kuis'
import { lokal, useBahasa, useTr } from '../i18n'

// Tiga kemampuan utama. Visual prediksi: peta grid sel; sel menyala bertahap (3 j, 6 j, 12 j) searah angin.
const KOL = 26, BAR = 16, SEL = 20
const hash = (c, r) => Math.abs((Math.sin(c * 127.1 + r * 311.7) * 43758.5453) % 1)
const SUDUT = (20 * Math.PI) / 180
const SEL_PETA = (() => {
  const out = []
  for (let r = 0; r < BAR; r++) for (let c = 0; c < KOL; c++) {
    const dx = c - 5, dy = r - 11
    let u = dx * Math.cos(SUDUT) - dy * Math.sin(SUDUT)
    const v = dx * Math.sin(SUDUT) + dy * Math.cos(SUDUT)
    if (u < 0) u *= 3
    const d = Math.hypot(u * 0.62, v * 1.25) + (hash(c, r) - 0.5) * 1.6
    const band = d < 2.4 ? 3 : d < 4.8 ? 6 : d < 7.4 ? 12 : 0
    out.push({ c, r, band, k: hash(r, c) })
  }
  return out
})()
const WARNA = { 3: 'var(--flame)', 6: 'var(--ember)', 12: 'var(--ember)' }
const OPASITAS = { 3: 1, 6: 0.7, 12: 0.38 }

function VisualPrediksi({ tr }) {
  const desa = [[11, 7, tr('Permukiman', 'Settlement'), '± 5 j'], [15, 5, tr('Sekolah', 'School'), '± 9 j'], [9, 9, tr('Jalan lintas', 'Main road'), '± 2 j']]
  return (
    <div className="flex size-full flex-col p-4 sm:p-6">
      <div className="relative min-h-0 flex-1">
        <svg viewBox={`0 0 ${KOL * SEL} ${BAR * SEL}`} aria-hidden="true" className="size-full">
          {SEL_PETA.map(({ c, r, band, k }) => band === 0 ? (
            <circle key={`${c}-${r}`} cx={c * SEL + SEL / 2} cy={r * SEL + SEL / 2} r="1.6" fill="var(--text-2)" opacity="0.35" />
          ) : (
            <rect key={`${c}-${r}`} x={c * SEL + 2} y={r * SEL + 2} width={SEL - 4} height={SEL - 4} rx="4" fill={WARNA[band]} style={{ '--o': OPASITAS[band] * (0.8 + k * 0.2) }} className={`sebar sebar-${band}`} />
          ))}
          {desa.map(([c, r, t, eta]) => (
            <g key={t} transform={`translate(${c * SEL + SEL / 2} ${r * SEL + SEL / 2})`}>
              <circle r="9" fill="var(--bg)" stroke="var(--text)" strokeWidth="2" />
              <circle r="3.5" fill="var(--text)" />
              <text x="15" y="4" fontSize="11" fontWeight="700" fill="var(--text)" stroke="var(--bg)" strokeWidth="4" paintOrder="stroke" strokeLinejoin="round">{t} · {eta}</text>
            </g>
          ))}
          <g transform={`translate(${5 * SEL + SEL / 2} ${11 * SEL + SEL / 2})`}>
            <circle r="14" fill="var(--flame)" opacity="0.25" className="napas" />
            <circle r="6" fill="var(--flame)" stroke="var(--bg)" strokeWidth="2" />
          </g>
        </svg>
        <span className="absolute right-0 top-0 inline-flex items-center gap-1.5 rounded-full border border-line bg-bg/85 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur-sm">
          {tr('Angin', 'Wind')}<ArrowUpRight size={14} className="text-ember-ink" />
        </span>
      </div>
      {/* Legenda di luar gambar agar tidak ikut mengecil dan tidak menimpa sel */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line pt-3 text-xs font-semibold text-ink-2">
        <ul className="m-0 flex list-none items-center gap-4 p-0">
          {[3, 6, 12].map((b) => (
            <li key={b} className="flex items-center gap-1.5 text-ink"><span className="size-3 rounded-[4px]" style={{ background: WARNA[b], opacity: OPASITAS[b] }} />{b} {tr('jam', 'h')}</li>
          ))}
        </ul>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-flame" />{tr('Titik api', 'Ignition point')}</span>
      </div>
    </div>
  )
}

function VisualOffline({ tr }) {
  const pil = 'flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold'
  return (
    <div aria-hidden="true" className="flex size-full flex-col items-center justify-center gap-8 p-6 sm:p-10">
      <div className="flex w-full max-w-md items-center gap-3">
        <span className={pil}><span className="size-2.5 rounded-full bg-flame" />{tr('Di perangkat', 'On device')}</span>
        <span className="relative h-px flex-1 bg-line"><span className="kirim absolute -top-[3px] size-[7px] rounded-full bg-ember-ink" /></span>
        <span className={pil}><span className="size-2.5 rounded-full bg-mint" />{tr('Terkirim', 'Synced')}</span>
      </div>
      <div className="w-full max-w-md space-y-2">
        {[tr('Titik api, Desa Sungai Rawa', 'Fire spot, Sungai Rawa village'), tr('Asap tebal, jalan lintas', 'Dense smoke, main road'), tr('Foto lahan terbakar', 'Photo of burning land')].map((t, i) => (
          <div key={t} className="flex items-center justify-between rounded-2xl border border-line bg-surface/90 px-4 py-3 text-sm" style={{ opacity: 1 - i * 0.2 }}>
            <span>{t}</span><span className="font-mono text-xs text-ink-2">{tr('antre', 'queued')}</span>
          </div>
        ))}
      </div>
      <p className="m-0 text-sm text-ink-2">{tr('Sinyal kembali, laporan terkirim sendiri', 'Signal returns, the report sends itself')}</p>
    </div>
  )
}

// Edukasi: tiga ubin yang bisa dijelajahi. Artikel dan Galeri menautkan ke tab masing-masing; ubin Kuis berisi satu soal sungguhan yang bisa dijawab di tempat.
const URUT_SAMPLE = [1, 0, 2] // urutan tampil opsi (jawaban benar tidak di posisi pertama)
function UbinFoto({ x, to, label, ket, kelas }) {
  return (
    <Link to={to} className={`hero-malam group/ub relative block overflow-hidden rounded-2xl ${kelas}`}>
      <img src={x.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-[900ms] ease-snap group-hover/ub:scale-110" style={{ objectPosition: x.posisi }} />
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/10 to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-bg/80 px-3 py-1 text-xs font-semibold backdrop-blur-sm">{label}</span>
      <span aria-hidden="true" className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-ember text-on-ember opacity-0 transition-[opacity,translate] duration-300 ease-snap translate-y-1 group-hover/ub:translate-y-0 group-hover/ub:opacity-100 group-focus-visible/ub:opacity-100"><ArrowUpRight size={15} /></span>
      <span className="absolute inset-x-3 bottom-3 text-sm font-semibold leading-tight text-ink">{ket}</span>
    </Link>
  )
}

// Dua soal paling dasar, bisa dijawab dengan akal sehat tanpa membaca materi apa pun.
const SOAL_DASAR = ['buka-lahan', 'darurat']

function VisualEdukasi({ tr }) {
  const b = useBahasa()
  const [u, g] = ['penyebab', 'gambut'].map(sampul)
  const soal = SOAL_DASAR.map((id) => lokal(KUIS.find((k) => k.id === id), b))
  const [no, setNo] = useState(0)
  const [jawab, setJawab] = useState(null)
  const [skor, setSkor] = useState(0)
  const [selesai, setSelesai] = useState(false)
  const q = soal[no]
  const benar = jawab === q.benar
  const jawabIni = (idx) => { setJawab(idx); if (idx === q.benar) setSkor((x) => x + 1) }
  const lanjut = () => { if (no + 1 < soal.length) { setNo(no + 1); setJawab(null) } else setSelesai(true) }
  const ulang = () => { setNo(0); setJawab(null); setSkor(0); setSelesai(false) }
  return (
    <div className="grid size-full grid-cols-5 grid-rows-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2 p-3 max-sm:grid-rows-[minmax(0,1fr)_minmax(0,1.8fr)]">
      <UbinFoto x={u} to="/edukasi?tab=artikel" label={tr('Artikel', 'Articles')} ket={tr('Penyebab, dampak, pencegahan', 'Causes, impacts, prevention')} kelas="col-span-3" />
      <UbinFoto x={g} to="/edukasi?tab=galeri" label={tr('Galeri', 'Gallery')} ket={tr('4 ilustrasi', '4 illustrations')} kelas="col-span-2" />
      <div data-no-rv className="col-span-5 flex flex-col rounded-2xl bg-ember p-4 text-on-ember">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest">{tr('Kuis · coba 2 soal dasar', 'Quiz · try 2 basic questions')}</span>
          <span className="flex items-center gap-1.5" aria-label={selesai ? tr('Selesai', 'Done') : tr(`Soal ${no + 1} dari ${soal.length}`, `Question ${no + 1} of ${soal.length}`)}>
            {soal.map((_, i) => <span key={i} aria-hidden="true" className={`h-1.5 w-6 rounded-full transition-[background-color] duration-300 ${i < no || selesai ? 'bg-on-ember' : i === no ? 'bg-on-ember/70' : 'bg-on-ember/25'}`} />)}
          </span>
        </div>
        {selesai ? (
          <div role="status" className="flex flex-1 flex-col justify-center py-2">
            <p className="m-0 text-2xl font-extrabold leading-tight sm:text-3xl">{tr(`Kamu benar ${skor} dari ${soal.length}.`, `You got ${skor} of ${soal.length} right.`)}</p>
            <p className="m-0 mt-1 text-sm leading-snug">{skor === soal.length ? tr('Dasarnya sudah kamu kuasai. Lanjut ke kuis lengkap untuk yang lebih menantang.', 'You have the basics down. Try the full quiz for a tougher round.') : tr('Tidak apa-apa. Baca artikelnya sebentar, lalu coba lagi.', 'No worries. Skim an article, then try again.')}</p>
          </div>
        ) : (
          <>
            <p key={no} className="m-0 mt-2 text-lg font-bold leading-tight [animation:tile-masuk_.4s_var(--ease-snap)] sm:text-xl">{q.tanya}</p>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-3" role="group" aria-label={tr('Pilihan jawaban', 'Answer choices')}>
              {URUT_SAMPLE.map((idx, k) => {
                const pilih = jawab === idx, kunci = jawab !== null && idx === q.benar
                return (
                  <button key={idx} type="button" disabled={jawab !== null} onClick={() => jawabIni(idx)}
                    className={`flex items-start gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium leading-snug transition-[background-color,scale,opacity] duration-300 ease-snap ${kunci ? 'bg-canopy text-bg' : pilih ? 'bg-ink text-bg' : jawab !== null ? 'bg-bg/60 text-ink opacity-60' : 'bg-bg/90 text-ink hover:-translate-y-0.5 hover:bg-bg'}`}>
                    <span className="font-mono text-[11px] leading-5 opacity-70" aria-hidden="true">{'ABC'[k]}</span><span>{q.opsi[idx]}</span>
                  </button>
                )
              })}
            </div>
            <p role="status" className="m-0 mt-2 min-h-10 text-sm leading-snug">
              {jawab === null ? '' : <><strong>{benar ? tr('Tepat. ', 'Correct. ') : tr('Belum tepat. ', 'Not quite. ')}</strong>{q.jelasan}</>}
            </p>
          </>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <Link to="/kuis" className="inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4">{tr('Main kuis lengkap', 'Play the full quiz')}<ArrowUpRight size={14} aria-hidden="true" /></Link>
          {selesai ? (
            <button type="button" onClick={ulang} className="rounded-full border border-current px-3.5 py-1.5 text-sm font-semibold transition-[scale] duration-200 ease-snap hover:scale-105">{tr('Ulangi', 'Retry')}</button>
          ) : jawab !== null && (
            <button type="button" onClick={lanjut} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-4 py-1.5 text-sm font-semibold text-ink transition-[scale] duration-200 ease-snap hover:scale-105">{no + 1 < soal.length ? tr('Soal berikutnya', 'Next question') : tr('Lihat skor', 'See score')}<ArrowRight size={14} aria-hidden="true" /></button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PilarFitur({ glass }) {
  const tr = useTr()
  const P = [
    { ke: '/peta?demo=1', judul: tr('Prediksi', 'Prediction'), cta: tr('Buka peta', 'Open the map'), v: <VisualPrediksi tr={tr} />,
      teks: tr('Simulasi sebaran api 3, 6, dan 12 jam di peta, lengkap dengan skenario angin "bagaimana jika".', 'Fire spread simulation for 3, 6, and 12 hours on the map, with "what-if" wind scenarios.') },
    { ke: '/lapor', judul: tr('Tahan offline', 'Works offline'), cta: tr('Buat laporan', 'File a report'), v: <VisualOffline tr={tr} />,
      teks: tr('Catat laporan lapangan tanpa sinyal. Data tersinkron otomatis saat koneksi pulih.', 'Record field reports without a signal. Data syncs automatically when the connection returns.') },
    { ke: '/edukasi', judul: tr('Edukasi', 'Education'), cta: tr('Mulai belajar', 'Start learning'), v: <VisualEdukasi tr={tr} />,
      teks: tr('Artikel, galeri, dan kuis agar penyebab, dampak, dan pencegahan karhutla mudah dipahami.', 'Articles, a gallery, and a quiz so the causes, impacts, and prevention of wildfires are easy to understand.') },
  ]
  const [aktif, setAktif] = useState(0)
  const maju = () => setAktif((n) => (n + 1) % P.length)
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8" data-rv>
      <div className="flex flex-col gap-3 lg:order-1">
        {P.map((x, i) => {
          const on = i === aktif
          return (
            <div key={x.ke} className={`group/it relative overflow-hidden rounded-3xl border transition-[border-color,background-color] duration-300 ease-snap ${on ? 'border-ember-ink' : 'border-line hover:border-ink-2'} ${glass ? 'bg-surface/80 backdrop-blur-md' : 'bg-surface'}`}>
              <button type="button" aria-expanded={on} onClick={() => setAktif(i)}
                className="flex w-full items-center gap-4 p-5 text-left sm:p-6">
                <span className="judul-display flex-1 text-3xl leading-none sm:text-4xl">{x.judul}</span>
                <span className={`flex size-8 items-center justify-center rounded-full border transition-[rotate,background-color,color] duration-300 ease-snap ${on ? 'rotate-45 border-ember-ink bg-ember-ink text-on-ember' : 'border-line text-ink-2'}`} aria-hidden="true"><Plus size={15} /></span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-500 ease-snap ${on ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden" inert={on ? undefined : ''}>
                  <div className="px-5 pb-6 sm:px-6">
                    <p className="m-0 max-w-md text-base leading-relaxed text-ink-2">{x.teks}</p>
                    <Link to={x.ke} data-mag className="mt-4 inline-flex items-center gap-2 rounded-full bg-ember px-4 py-2 text-sm font-semibold text-on-ember transition-[translate] duration-300 ease-snap hover:-translate-y-0.5">{x.cta}<ArrowUpRight size={15} aria-hidden="true" /></Link>
                  </div>
                </div>
              </div>
              {on && <span aria-hidden="true" onAnimationEnd={maju} className="isi-progres absolute inset-x-0 bottom-0 h-[3px] origin-left bg-ember" />}
            </div>
          )
        })}
      </div>
      <div
        className="relative h-[34rem] sm:h-[32rem] overflow-hidden rounded-3xl border border-line bg-surface bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] lg:order-2 lg:h-auto lg:min-h-[30rem] [&_.napas]:origin-center">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--ember)_25%,transparent),transparent_70%)]" />
        {P.map((x, i) => (
          <div key={x.ke} inert={i === aktif ? undefined : ''} aria-hidden={i === aktif ? undefined : 'true'} className={`absolute inset-0 transition-[opacity,scale,filter] duration-700 ease-snap ${i === aktif ? 'scale-100 opacity-100 blur-0' : 'pointer-events-none scale-95 opacity-0 blur-sm'}`}>{x.v}</div>
        ))}
      </div>
    </div>
  )
}
