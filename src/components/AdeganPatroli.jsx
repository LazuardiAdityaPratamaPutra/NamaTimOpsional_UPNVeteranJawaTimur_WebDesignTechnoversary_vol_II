import { useEffect, useReducer, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame, Footprints } from 'lucide-react'
import { MaskotEkspresi } from './Maskot'
import { PATROLI } from '../data/patroli'
import { kurangiGerak } from '../lib/gerak'
import { useBahasa, useTr } from '../i18n'

// Adegan 2.5D untuk game Patroli Hutan (/patroli, atas permintaan): lapisan hutan berparalaks, lantai berperspektif, dan TORA berjalan di tengahnya.
// Seluruh gerak bergantung pada variabel CSS --x yang diatur halaman Patroli lewat `adeganRef` (tanpa render ulang per frame).
// Warna adegan ada di index.css (kelas pt-*) atau memakai token tema; gambar titik hanyalah SVG dekoratif, informasinya ada di teks panel.

const Nyala = () => (
  <g className="pt-nyala">
    <path className="fill-flame" d="M60 18C72 44 94 58 90 90C87 113 72 126 60 126C47 126 31 113 30 90C29 69 45 62 50 43C52 35 56 29 60 18Z" />
    <g transform="translate(18 38) scale(.7)"><path className="pt-nyala-dalam fill-ember" d="M60 18C72 44 94 58 90 90C87 113 72 126 60 126C47 126 31 113 30 90C29 69 45 62 50 43C52 35 56 29 60 18Z" /></g>
    <g transform="translate(36 74) scale(.4)"><path className="fill-amber" d="M60 18C72 44 94 58 90 90C87 113 72 126 60 126C47 126 31 113 30 90C29 69 45 62 50 43C52 35 56 29 60 18Z" /></g>
  </g>
)
const Asap = ({ x = 60, y = 60 }) => (
  <g>{[0, 1, 2].map((k) => <circle key={k} className="pt-asap fill-ink-2" cx={x + (k - 1) * 9} cy={y} r={11 - k} />)}</g>
)
const Tunas = () => (
  <g className="pt-tunas">
    <path className="stroke-mint" d="M60 128V96" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path className="fill-mint" d="M60 104C46 102 40 92 40 84C54 84 60 92 60 104Z" />
    <path className="fill-mint" d="M60 98C72 96 80 88 80 80C66 80 60 88 60 98Z" />
  </g>
)
const Bendera = () => (
  <g className="pt-tunas">
    <path className="stroke-amber" d="M62 128V74" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path className="fill-amber" d="M62 74L94 85L62 96Z" />
  </g>
)
const Semak = () => (
  <>
    <ellipse className="pt-tanah" cx="60" cy="130" rx="48" ry="8" />
    <path className="pt-semak-gelap" d="M14 128C10 100 30 88 42 100C46 84 70 80 78 98C92 88 112 104 104 128Z" />
    <path className="pt-semak" d="M24 128C22 108 38 100 50 108C58 96 78 98 84 112C96 106 106 118 98 128Z" />
  </>
)

const VISUAL = {
  api: (
    <>
      <Semak /><Asap y={70} /><Nyala />
      <g className="pt-besar"><g transform="translate(-30 30) scale(.7)"><Nyala /></g><g transform="translate(46 26) scale(.75)"><Nyala /></g></g>
      <Tunas />
    </>
  ),
  bakar: (
    <>
      <ellipse className="pt-tanah" cx="60" cy="130" rx="52" ry="8" />
      <g className="pt-kayu" strokeWidth="7"><path d="M22 126L58 108" /><path d="M64 126L28 108" /><path d="M30 120H70" /></g>
      <Asap x={40} y={64} />
      <g transform="translate(-24 6) scale(.95)"><Nyala /></g>
      <path className="pt-orang" d="M88 130V96C88 86 112 86 112 96V130Z" /><circle className="pt-orang" cx="100" cy="76" r="9" />
      <g className="pt-besar"><g transform="translate(-34 22) scale(.7)"><Nyala /></g><g transform="translate(24 -2) scale(1.1)"><Nyala /></g></g>
      <Tunas />
    </>
  ),
  gambut: (
    <>
      <ellipse className="pt-tanah" cx="60" cy="130" rx="54" ry="8" />
      <path className="pt-tanah" d="M6 130C16 108 44 100 60 104C80 100 108 110 116 130Z" />
      <path className="pt-kayu" strokeWidth="2.5" d="M34 120L46 112L54 117L64 108L74 114" />
      {[[48, 113], [66, 109], [82, 118]].map(([x, y]) => <circle key={x} className="pt-bara" cx={x} cy={y} r="3" />)}
      <Asap x={50} y={92} /><Asap x={76} y={96} />
      <g className="pt-besar"><g transform="translate(18 34) scale(.65)"><Nyala /></g></g>
      <Bendera />
    </>
  ),
  hotspot: (
    <>
      <ellipse className="pt-tanah" cx="60" cy="130" rx="54" ry="8" />
      <path className="pt-semak-gelap" d="M10 128C14 112 28 108 36 118C42 106 58 106 62 118C70 108 86 108 90 120C98 114 108 118 110 128Z" />
      <g fill="none" strokeWidth="4"><circle className="pt-denyut stroke-ember" cx="60" cy="100" r="36" /><circle className="pt-denyut stroke-ember" cx="60" cy="100" r="36" /></g>
      <path className="pt-bara" d="M60 52C51 52 44 59 44 67C44 78 60 92 60 92C60 92 76 78 76 67C76 59 69 52 60 52Z" /><circle className="fill-bg" cx="60" cy="67" r="6" />
      <g className="pt-besar"><g transform="translate(18 40) scale(.65)"><Nyala /></g></g>
      <Tunas />
    </>
  ),
  angin: (
    <>
      <Semak />
      <g fill="none" strokeWidth="3" strokeLinecap="round">{[44, 64, 84].map((y) => <path key={y} className="pt-angin-garis stroke-ink-2" d={`M2 ${y}H40`} />)}</g>
      <g transform="rotate(16 60 126)"><Nyala /></g>
      <g className="pt-besar"><g transform="translate(30 26) rotate(18 60 126) scale(.8)"><Nyala /></g><g transform="translate(58 46) rotate(22 60 126) scale(.6)"><Nyala /></g></g>
      <Tunas />
    </>
  ),
}

export default function AdeganPatroli({ adeganRef, titik, akhir, hasil, fase, ekspresi, reaksi, gelembung }) {
  const napas = fase !== 'jalan' && !reaksi
  return (
    <div ref={adeganRef} className="pt-adegan hutan relative size-full" data-jalan="0" data-fase={fase} aria-hidden="true">
      <div className="pt-lapis pt-jauh" /><div className="pt-lapis pt-tengah" /><div className="pt-lapis pt-dekat" />
      <div className="pt-lantai" />
      <div className="pt-dunia">
        {titik.map((t, k) => (
          <div key={t.id} className="pt-titik" style={{ left: t.x }} data-hasil={hasil[k] === undefined ? 'baru' : hasil[k] ? 'benar' : 'salah'}>
            <svg viewBox="0 0 120 140" focusable="false">{VISUAL[t.visual]}</svg>
          </div>
        ))}
        <div className="pt-titik" style={{ left: akhir }}>
          <svg viewBox="0 0 120 140" focusable="false">
            <ellipse className="pt-tanah" cx="60" cy="130" rx="54" ry="8" />
            <rect className="fill-ink-2" x="14" y="38" width="10" height="92" rx="3" /><rect className="fill-ink-2" x="96" y="38" width="10" height="92" rx="3" />
            <path className="fill-canopy" d="M10 34H110L98 62H22Z" /><path className="fill-amber" d="M60 40C66 48 70 52 68 58C66 64 62 66 60 66C57 66 53 64 52 58C51 52 56 48 60 40Z" />
          </svg>
        </div>
      </div>
      <div className="pt-tora">
        <div className="pt-bayang" />
        <div className="pt-tora-langkah">
          <div className={reaksi === 'loncat' ? 'tora-loncat' : reaksi === 'geleng' ? 'tora-geleng' : napas ? 'tora-napas' : ''}>
            <MaskotEkspresi ekspresi={ekspresi} className="w-full" />
          </div>
        </div>
      </div>
      <div className="pt-lapis pt-depan" />
      <div className="pt-vinyet" />
      {gelembung && <p className="pt-gelembung m-0">{gelembung}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------------------------------------------------------
// Kartu bocoran di halaman Edukasi (KartuPatroli): bukan spanduk, melainkan cuplikan game yang bermain sendiri. Adegan 2.5D yang sama dengan
// /patroli berjalan di dalam kartu: TORA berjalan ke titik api, muncul pertanyaan dengan tiga pilihan, jawaban benar disorot, api padam dan
// bertunas, lalu lanjut ke titik berikutnya. Pengunjung langsung paham ini permainan. Hanya bergerak saat kartu terlihat dan tab aktif;
// saat gerak dikurangi tampil sebagai satu bingkai diam. Seluruh adegan dekoratif (aria-hidden); informasinya ada di papan dan tautannya.
// ---------------------------------------------------------------------------------------------------------------------------

const KECEPATAN = 230 // px per detik, sama dengan game
const PERTAMA = 700, JARAK = 1150 // letak titik api pertama di dunia, dan jarak antartitik (px): jarak jauh = TORA lebih lama terlihat berjalan
const JEDA_TANYA = 1000, JEDA_JAWAB = 800 // jeda sengaja singkat; porsi terbesar siklus adalah berjalan, agar pengunjung yang menggulir melihat TORA bergerak
const titikX = (i) => PERTAMA + JARAK * i
const jarakBerhenti = (lebar) => Math.max(140, Math.min(250, lebar * 0.24)) // TORA berhenti sejauh ini sebelum titik api, menyesuaikan lebar kartu
// Pilihan versi ringkas untuk cuplikan; urutannya sama dengan PATROLI[i].opsi, sehingga indeks jawaban benar (PATROLI[i].benar) tetap berlaku
const RINGKAS = [
  { id: ['Dekati & foto', 'Menjauh, hubungi 112', 'Padamkan sendiri'], en: ['Get close & photo', 'Move away, call 112', 'Put it out alone'] },
  { id: ['Biarkan saja', 'Ikut membantu', 'Ingatkan & lapor BPBD'], en: ['Leave it', 'Help out', 'Warn them & report'] },
  { id: ['Jauhi & lapor BPBD', 'Anggap sudah padam', 'Timbun daun kering'], en: ['Stay away & report', 'Assume it is out', 'Cover with leaves'] },
  { id: ['Sebar kabar besar', 'Catat & minta verifikasi', 'Abaikan'], en: ['Spread the alarm', 'Note & ask to verify', 'Ignore it'] },
  { id: ['Tunggu saja', 'Angin tak berpengaruh', 'Kabari warga & telepon 112'], en: ['Just wait', 'Wind does not matter', 'Warn residents & call 112'] },
]

// Keadaan demo: situasi ke-j, fase (jalan | tanya | jawab), dan `dekat` (pertanyaan sudah muncul selagi TORA mendekat)
const awalDemo = (diam) => ({ j: 0, fase: diam ? 'tanya' : 'jalan', dekat: false })
function lajuDemo(s, aksi) {
  switch (aksi) {
    case 'dekat': return s.dekat ? s : { ...s, dekat: true }
    case 'tanya': return { ...s, fase: 'tanya', dekat: true }
    case 'jawab': return { ...s, fase: 'jawab' }
    case 'lanjut': return { j: s.j + 1, fase: 'jalan', dekat: false }
    // Kartu kembali terlihat saat sedang jeda: jangan menunggu sisa jeda, langsung berjalan ke titik berikutnya
    case 'kembali': return s.fase === 'jalan' ? s : { j: s.j + 1, fase: 'jalan', dekat: false }
    default: return s
  }
}

export function KartuPatroli({ skor = null, total = PATROLI.length }) {
  const tr = useTr()
  const b = useBahasa()
  const kartu = useRef(null)
  const adegan = useRef(null)
  const [diam] = useState(() => kurangiGerak())
  const [aktif, setAktif] = useState(false)
  const [{ j, fase, dekat }, atur] = useReducer(lajuDemo, diam, awalDemo) // j: situasi yang diperagakan (berputar lewat 5 situasi game)
  const n = PATROLI.length
  const situasi = PATROLI[j % n]
  const teks = b === 'en' ? situasi.en : situasi
  const opsi = RINGKAS[j % n][b === 'en' ? 'en' : 'id']

  // Hanya bergerak saat kartu terlihat dan tab aktif
  useEffect(() => {
    if (diam || !kartu.current || typeof IntersectionObserver !== 'function') return undefined
    let lihat = false, tab = !document.hidden, tadi = false
    const ubah = () => {
      const kini = lihat && tab
      if (kini && !tadi) atur('kembali')
      tadi = kini
      setAktif(kini)
    }
    const io = new IntersectionObserver(([e]) => { lihat = e.isIntersecting; ubah() }, { threshold: 0.1 })
    io.observe(kartu.current)
    const ganti = () => { tab = !document.hidden; ubah() }
    document.addEventListener('visibilitychange', ganti)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', ganti) }
  }, [diam])

  // Bingkai diam (gerak dikurangi): TORA sudah berdiri di depan titik api pertama
  useEffect(() => {
    if (diam && adegan.current) adegan.current.style.setProperty('--x', String(Math.max(0, PERTAMA - jarakBerhenti(adegan.current.clientWidth))))
  }, [diam])

  // Putaran demo: jalan (menggeser --x seperti game) -> tanya -> jawab -> titik berikutnya
  useEffect(() => {
    const el = adegan.current
    if (diam || !aktif || !el) return undefined
    let raf = 0, timer = 0
    if (fase === 'jalan') {
      const target = titikX(j) - jarakBerhenti(el.clientWidth)
      let x = Number(el.style.getPropertyValue('--x')) || 0
      const x0 = x
      let terakhir = performance.now()
      el.dataset.jalan = '1'
      const tick = (t) => {
        const dt = Math.min(0.05, (t - terakhir) / 1000); terakhir = t
        x = Math.min(target, x + KECEPATAN * dt)
        el.style.setProperty('--x', x.toFixed(1))
        if (x < target) {
          if (x - x0 > (target - x0) * 0.45) atur('dekat') // pertanyaan muncul selagi TORA masih berjalan mendekat
          raf = requestAnimationFrame(tick)
        } else { el.dataset.jalan = '0'; atur('tanya') }
      }
      raf = requestAnimationFrame(tick)
    } else if (fase === 'tanya') timer = setTimeout(() => atur('jawab'), JEDA_TANYA)
    else timer = setTimeout(() => atur('lanjut'), JEDA_JAWAB)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); el.dataset.jalan = '0' }
  }, [aktif, diam, j, fase])

  const ids = Array.from({ length: j > 0 ? 3 : 2 }, (_, k) => (j > 0 ? j - 1 : j) + k)
  const titik = ids.map((i) => ({ id: String(i), x: titikX(i), visual: PATROLI[i % n].visual }))
  const hasil = ids.map((i) => (i < j || (i === j && fase === 'jawab') ? true : undefined))
  const jawab = fase === 'jawab'

  return (
    <div ref={kartu} className="pt-kartu hutan group/kartu relative isolate h-[31rem] rounded-[2rem] text-ink lg:h-[26rem]">
      <div className="absolute inset-0 overflow-hidden rounded-[inherit] border border-line-strong shadow-2xl shadow-black/40 transition-[border-color] duration-300 ease-snap group-hover/kartu:border-ember">
        <AdeganPatroli adeganRef={adegan} titik={titik} akhir={-9999} hasil={hasil} fase={fase === 'jalan' ? 'jalan' : 'tanya'} ekspresi={jawab ? 'merayakan' : 'ramah'} reaksi={jawab ? 'loncat' : null} />
      </div>

      {/* Seluruh kartu bisa diklik dengan mouse; pengguna papan ketik dan pembaca layar memakai tombol "Mulai patroli" di papan */}
      <Link to="/patroli" tabIndex={-1} aria-hidden="true" className="absolute inset-0 z-[6] rounded-[inherit]" />

      {/* Papan petunjuk arah: judul dan ajakan, menunjuk ke adegan */}
      <div className="pointer-events-none absolute inset-x-4 top-4 z-10 max-w-[30rem] drop-shadow-2xl lg:inset-x-auto lg:left-6 lg:top-1/2 lg:w-[24.5rem] lg:-translate-y-1/2">
        <div className="pt-papan relative rounded-3xl bg-surface px-6 pb-6 pt-5 lg:pb-7 lg:pl-7 lg:pr-14 lg:pt-6">
          <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[1.1rem] border border-dashed border-line-strong/70 lg:right-8" />
          <p className="relative flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ember-ink">
            <Flame size={14} aria-hidden="true" />{tr(`${n} titik api, ${n} keputusan`, `${n} fire spots, ${n} decisions`)}
          </p>
          <h2 className="judul-display relative mt-2.5 text-[2.6rem] leading-[0.92] sm:text-5xl">{tr('Patroli hutan', 'Forest patrol')}</h2>
          <p className="relative mt-3 max-w-[30ch] leading-snug text-ink-2">{tr('Jalan bersama TORA, temukan titik api, lalu pilih tindakan yang benar.', 'Walk with TORA, find the fire spots, then choose the right action.')}</p>
          <div className="pointer-events-auto relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Link to="/patroli" className="group/cta inline-flex min-h-12 items-center gap-2.5 rounded-xl bg-ember px-5 font-bold text-on-ember transition-[filter,translate] duration-200 ease-snap hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.97]">
              <Footprints size={19} aria-hidden="true" />{skor === null ? tr('Mulai patroli', 'Start patrol') : tr('Main lagi', 'Play again')}
              <ArrowRight size={18} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover/cta:translate-x-1" />
            </Link>
            <span className="flex items-center gap-2.5">
              <span aria-hidden="true" className="flex gap-0.5">{Array.from({ length: total }, (_, i) => <Flame key={i} size={17} className={skor !== null && i < skor ? 'fill-ember text-ember' : 'text-line-strong'} />)}</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-2">{skor === null ? tr('Belum pernah main', 'Not played yet') : tr(`Rekormu ${skor}/${total}`, `Your best ${skor}/${total}`)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Pertanyaan dari game yang sedang diperagakan; jawaban benar disorot lalu apinya padam dan bertunas */}
      <div aria-hidden="true" data-fase={fase === 'jalan' && dekat ? 'dekat' : fase} className={`pt-kartu-tanya pointer-events-none absolute right-5 top-4 z-10 hidden w-[17rem] rounded-2xl border border-line-strong bg-surface p-3.5 lg:block ${fase === 'jalan' && !dekat ? 'opacity-0' : 'opacity-100'}`}>
        <p className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] text-ember-ink">{tr('Titik', 'Spot')} {(j % n) + 1}/{n}</p>
        <p className="m-0 mt-1 text-[15px] font-bold leading-tight">{teks.judul}</p>
        <ul className="mt-2.5 space-y-1.5">
          {opsi.map((o, i) => {
            const benar = i === situasi.benar
            return (
              <li key={o} className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-1.5 text-[13px] font-semibold leading-tight transition-[background-color,color,border-color,opacity] duration-300 ${jawab && benar ? 'border-ember bg-ember text-on-ember' : jawab ? 'border-line opacity-45' : 'border-line'}`}>
                <span className="angka font-mono text-[11px]">{'ABC'[i]}</span><span>{o}</span>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Stiker: penanda bahwa ini permainan */}
      <span aria-hidden="true" className="absolute -top-3.5 right-6 z-20 rotate-[5deg] rounded-lg bg-amber px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-on-ember shadow-lg shadow-black/30 lg:-right-2 lg:top-5 lg:rotate-[6deg]">{tr('Mini game', 'Mini game')}</span>
    </div>
  )
}
