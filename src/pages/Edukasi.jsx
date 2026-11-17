import { kurangiGerak } from '../lib/gerak'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Bookmark, BookOpenText, CheckCircle2, Image as Gambar, Lock, Target } from 'lucide-react'
import { Container } from '../components/ui'
import { AjakTora } from '../components/ChatEdukasi'
import { KartuPatroli } from '../components/AdeganPatroli'
import Galeri from '../components/Galeri'
import Perpustakaan from '../components/Perpustakaan'
import Kuis from '../components/Kuis'
import Checklist from '../components/Checklist'
import FotoZoom from '../components/FotoZoom'
import { daftarArtikel } from '../lib/artikel'
import { daftarGaleri, daftarKuis, semuaChecklist } from '../lib/kontenEdukasi'
import { useJudul } from '../lib/useJudul'
import { useBahasa, useTr } from '../i18n'
import Terkunci from '../components/Terkunci'
import { hitungCentang, muatBaca, muatPatroli, muatSkor } from '../lib/progres'
import AjakMasuk from '../components/AjakMasuk'
import { useAuth } from '../components/authContext'

// Jalur berkelok: empat titik dan kurva yang menyambungnya (koordinat kotak 400×460; garis melintas di celah antarlabel)
const TITIK = [[64, 44], [336, 174], [64, 304], [336, 434]]
const LINTAS = 'M64 44 C64 174 336 44 336 174 C336 304 64 174 64 304 C64 434 336 304 336 434'
const KEDALAMAN = [10, -12, 14, -9]
const TAB = ['artikel', 'galeri', 'kuis', 'checklist']

const Panah = ({ on }) => <span className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-[background-color,color,rotate,border-color] duration-300 ease-snap group-hover:-rotate-12 group-hover:border-ember-ink group-hover:bg-ember-ink group-hover:text-on-ember ${on ? 'border-ember-ink' : 'border-line'}`} aria-hidden="true"><ArrowUpRight size={18} /></span>

/** Tab Artikel: perpustakaan (rak buku) lalu ajakan ke Kuis. */
function DaftarArtikel({ pilih }) {
  const tr = useTr()
  const nKuis = daftarKuis(useBahasa()).length
  return (
    <Container className="py-10 md:py-14">
      <Perpustakaan pilihTab={pilih} />

      <button type="button" onClick={() => pilih('kuis')} data-spot className="group mt-8 flex w-full items-center justify-between gap-6 rounded-3xl border border-line bg-surface p-6 text-left transition-[border-color,translate] duration-300 ease-snap hover:-translate-y-0.5 hover:border-ember-ink sm:p-8">
        <span>
          <span className="block font-mono text-xs uppercase tracking-widest text-ember-ink">{tr('Berikutnya', 'Up next')}</span>
          <span className="judul-display mt-2 block text-3xl leading-none sm:text-5xl">{tr('Uji yang sudah kamu baca', 'Test what you just read')}</span>
          <span className="mt-3 block text-base text-ink-2">{tr(`Kuis ${nKuis} soal, tiap jawaban ada penjelasannya.`, `${nKuis}-question quiz, every answer explained.`)}</span>
        </span>
        <Panah />
      </button>
    </Container>
  )
}

/** Pembuka tiap tab: satu kalimat yang menjelaskan isinya. */
const Pengantar = ({ children }) => <p className="m-0 mb-8 max-w-[60ch] text-lg leading-relaxed text-ink-2">{children}</p>

export default function Edukasi() {
  const b = useBahasa()
  const { sesi } = useAuth()
  const tr = useTr()
  useJudul(tr('Edukasi', 'Learn'))
  const id = useId()
  const [sp, setSp] = useSearchParams()
  const minta = sp.get('tab') === 'persiapan' ? 'checklist' : sp.get('tab') // alias: label tab yang terlihat adalah "Persiapan"
  const tab = TAB.includes(minta) ? minta : 'artikel'
  // Ganti tab, lalu bila halaman sedang tergulir melewati awal materi, kembali ke awal materi tab baru (bukan tertinggal di tengah).
  const pilih = (t, gulir = true) => {
    setSp({ tab: t }, { replace: true })
    if (!gulir) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`${id}-panel`)
      if (!el || el.getBoundingClientRect().top >= 128) return
      el.scrollIntoView({ behavior: kurangiGerak() ? 'auto' : 'smooth' })
    })
  }

  // Di layar sempit bilah tab bisa lebih lebar dari layar: geser bilah agar tab aktif terlihat utuh
  // (dihitung ulang setelah label tab aktif selesai melebar)
  useEffect(() => {
    const geser = () => {
      const el = document.getElementById(`${id}-tab-${tab}`), bilah = el?.parentElement
      if (!el || !bilah || bilah.scrollWidth <= bilah.clientWidth) return
      const kiri = el.offsetLeft - 8, kanan = el.offsetLeft + el.offsetWidth - bilah.clientWidth + 8
      const ke = bilah.scrollLeft > kiri ? kiri : bilah.scrollLeft < kanan ? kanan : null
      if (ke !== null) bilah.scrollTo({ left: ke, behavior: kurangiGerak() ? 'auto' : 'smooth' })
    }
    geser()
    const t = setTimeout(geser, 560)
    return () => clearTimeout(t)
  }, [tab, id])

  const tabs = [
    { id: 'artikel', ikon: BookOpenText, label: tr('Artikel', 'Articles') },
    { id: 'galeri', ikon: Gambar, label: tr('Galeri', 'Gallery') },
    { id: 'kuis', ikon: Target, label: tr('Kuis', 'Quiz') },
    { id: 'checklist', ikon: CheckCircle2, label: tr('Persiapan', 'Prepare') },
  ]
  const nBaca = daftarArtikel(b).length, menitBaca = daftarArtikel(b).reduce((n, a) => n + a.menit, 0)
  // Kemajuan pribadi dari penyimpanan di perangkat; dibaca sekali saat halaman dibuka
  const [patroli] = useState(muatPatroli)
  const [kemajuan] = useState(() => ({ baca: muatBaca().length, skor: muatSkor(), centang: hitungCentang() }))
  const nCentang = semuaChecklist(b).length
  const nGaleri = daftarGaleri(b).length, nKuis = daftarKuis(b).length
  const jalur = [
    { id: 'artikel', verba: tr('Pahami', 'Understand'), ket: kemajuan.baca ? tr(`${kemajuan.baca} dari ${nBaca} bacaan selesai`, `${kemajuan.baca} of ${nBaca} reads done`) : tr(`${nBaca} bacaan, sekitar ${menitBaca} menit`, `${nBaca} reads, about ${menitBaca} min`), pct: kemajuan.baca / nBaca, ikon: BookOpenText },
    { id: 'galeri', verba: tr('Lihat', 'See'), ket: tr(`${nGaleri} ilustrasi bagaimana api menjalar`, `${nGaleri} illustrations of how fire spreads`), pct: 0, ikon: Gambar },
    { id: 'kuis', verba: tr('Uji', 'Test'), ket: kemajuan.skor ? tr(`Skor terbaikmu ${kemajuan.skor.skor}/${kemajuan.skor.total}`, `Your best score ${kemajuan.skor.skor}/${kemajuan.skor.total}`) : tr(`${nKuis} soal dengan penjelasan`, `${nKuis} questions with explanations`), pct: kemajuan.skor ? kemajuan.skor.skor / kemajuan.skor.total : 0, ikon: Target },
    { id: 'checklist', verba: tr('Siapkan', 'Prepare'), ket: kemajuan.centang ? tr(`${kemajuan.centang} dari ${nCentang} langkah siap`, `${kemajuan.centang} of ${nCentang} steps ready`) : tr(`${nCentang} langkah untuk rumahmu`, `${nCentang} steps for your home`), pct: kemajuan.centang / nCentang, ikon: CheckCircle2 },
  ]
  const adaProgres = jalur.some((j) => j.pct > 0)
  const lanjutId = (jalur.find((j) => j.id !== 'galeri' && j.pct < 1) ?? jalur[0]).id
  // Garis api menyala sampai titik yang sedang disorot; tanpa sorotan, sampai titik lanjutan belajar
  const [sorot, setSorot] = useState(null)
  // Paralaks: titik bergeser tipis mengikuti kursor, tiap titik dengan kedalaman berbeda (variabel CSS, tanpa render ulang)
  const jejak = useRef(null)
  const geser = (e) => {
    const el = jejak.current
    if (!el || e.pointerType !== 'mouse' || kurangiGerak()) return
    const r = el.getBoundingClientRect()
    const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)))
    const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)))
    el.style.setProperty('--px', nx.toFixed(3)); el.style.setProperty('--py', ny.toFixed(3))
  }
  const lepas = () => { jejak.current?.style.setProperty('--px', '0'); jejak.current?.style.setProperty('--py', '0') }
  const nyala = sorot ?? (adaProgres ? jalur.findIndex((j) => j.id === lanjutId) : 0)
  // Pil tab meringkas (hanya ikon di tab tak aktif) setelah halaman tergulir; melebar lagi saat disentuh atau difokus
  const [kecil, setKecil] = useState(false)
  useEffect(() => {
    const ukur = () => setKecil(scrollY > 420)
    ukur()
    addEventListener('scroll', ukur, { passive: true })
    return () => removeEventListener('scroll', ukur)
  }, [])
  const onKey = (e) => {
    const idx = TAB.indexOf(tab)
    const arah = { ArrowRight: (idx + 1) % TAB.length, ArrowLeft: (idx - 1 + TAB.length) % TAB.length, Home: 0, End: TAB.length - 1 }
    const n = arah[e.key]
    if (n === undefined) return
    e.preventDefault(); pilih(TAB[n], false); document.getElementById(`${id}-tab-${TAB[n]}`)?.focus()
  }

  return (
    <>
      <header className="hero-malam relative isolate overflow-hidden" onPointerMove={geser} onPointerLeave={lepas}>
        <FotoZoom mode="atas" src="/foto/edu-hero.webp" decoding="async" className="absolute inset-0 -z-10 size-full -scale-x-100 object-cover" style={{ objectPosition: '50% 72%' }} aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-bg/5 max-md:bg-bg/50" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-bg/75 via-bg/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/40 to-transparent" aria-hidden="true" />
        <Container className="grid items-end gap-10 pb-14 pt-28 md:pb-16 md:pt-32 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <div>
            {/* Garis waktu satu menit: label, penggaris yang terisi dari kiri, lalu durasinya */}
            <p className="m-0 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink sm:text-[13px] [text-shadow:0_1px_12px_color-mix(in_oklab,var(--bg)_90%,transparent)]">
              <span>{tr('Edukasi karhutla', 'Wildfire learning')}</span>
              <span aria-hidden="true" className="relative h-3.5 w-16 shrink-0 sm:w-28">
                <span className="absolute inset-0 opacity-60 [background:repeating-linear-gradient(90deg,var(--text)_0_1px,transparent_1px_7px)]" />
                <span className="penggaris-isi absolute inset-0 [background:repeating-linear-gradient(90deg,var(--ember)_0_2px,transparent_2px_7px)]" />
                <span className="penggaris-kepala absolute inset-y-[-3px] left-0 w-0.5 bg-ember" />
              </span>
              <span className="text-ember-ink"><span className="max-sm:hidden">{tr('Mulai dari ', 'Start in ')}</span>{tr('1 menit', '1 min')}</span>
            </p>
            <h1 className="mt-4 max-w-[11ch] text-[clamp(3.5rem,9vw,7.5rem)] leading-[1.02]">{tr('Kenali api sebelum ia menyebar', 'Know the fire before it spreads')}</h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink">{tr('Dari apa yang memicu api sampai cara melindungi keluargamu: bacaan singkat, kuis, dan checklist yang bisa kamu pakai hari ini.', 'From what sparks a fire to how to protect your family: short reads, a quiz, and a checklist you can use today.')}</p>
          </div>
          <nav aria-label={tr('Jalur belajar', 'Learning path')} className="relative ml-auto w-full max-w-[26rem] lg:max-w-none">
            <p className="m-0 mb-9 font-mono text-xs uppercase tracking-widest text-ink [text-shadow:0_1px_12px_color-mix(in_oklab,var(--bg)_90%,transparent)]">{tr('Jalur belajar · ikuti apinya', 'Learning path · follow the fire')}</p>
            <ol ref={jejak} className="relative m-0 aspect-[400/460] w-full list-none p-0 [text-shadow:0_1px_14px_color-mix(in_oklab,var(--bg)_90%,transparent)]" onMouseLeave={() => setSorot(null)}>
              <svg viewBox="0 0 400 460" fill="none" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible [translate:calc(var(--px,0)*-4px)_calc(var(--py,0)*-4px)] transition-[translate] duration-300 ease-out">
                <path d={LINTAS} pathLength="1" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.012 0.02" className="stroke-ink-2/60" />
                <path d={LINTAS} pathLength="1" strokeWidth="4" strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - nyala / 3} className="stroke-ember transition-[stroke-dashoffset] duration-[900ms] ease-snap [filter:drop-shadow(0_0_6px_var(--color-ember))]" />
              </svg>
              {jalur.map((j, i) => {
                const [x, y] = TITIK[i], kanan = x > 200, lit = i <= nyala, fokus = sorot === i
                return (
                  <li key={j.id} className="absolute transition-[translate] duration-300 ease-out" style={{ translate: `calc(var(--px,0) * ${KEDALAMAN[i]}px) calc(var(--py,0) * ${KEDALAMAN[i] * 0.7}px)`, top: `${(y / 460) * 100}%`, ...(kanan ? { right: `${100 - (x / 400) * 100}%` } : { left: `${(x / 400) * 100}%` }) }}>
                    <button type="button" onMouseEnter={() => setSorot(i)} onFocus={() => setSorot(i)} onBlur={() => setSorot(null)}
                      onClick={() => { pilih(j.id); document.getElementById(`${id}-panel`)?.scrollIntoView({ behavior: 'smooth' }) }}
                      className={`group/n flex items-center gap-4 text-left ${kanan ? 'translate-x-7 flex-row-reverse text-right' : '-translate-x-7'} -translate-y-1/2`}>
                      <span className={`relative flex size-14 shrink-0 items-center justify-center rounded-full border-2 backdrop-blur-sm transition-[background-color,border-color,scale,box-shadow] duration-300 ease-snap group-hover/n:scale-110 group-active/n:scale-95 ${lit ? 'border-ember bg-ember text-on-ember shadow-[0_0_0_6px_color-mix(in_oklab,var(--color-ember)_25%,transparent)]' : 'border-ink-2/60 bg-bg/70 text-ink'} ${fokus ? 'shadow-[0_0_0_10px_color-mix(in_oklab,var(--color-ember)_30%,transparent)]' : ''}`}>
                        {j.pct >= 1 ? <CheckCircle2 size={24} aria-hidden="true" /> : <j.ikon size={24} aria-hidden="true" className="transition-[rotate] duration-300 ease-snap group-hover/n:-rotate-12" />}
                        <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 rounded-full bg-bg px-1.5 font-mono text-[11px] leading-4 text-ember-ink ring-1 ring-ember/60">{String(i + 1).padStart(2, '0')}</span>
                        {!sesi && (j.id === 'kuis' || j.id === 'checklist') && <span aria-hidden="true" className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-ember text-on-ember"><Lock size={11} /></span>}
                      </span>
                      <span className={`relative flex min-w-0 flex-col gap-1.5 ${kanan ? 'items-end' : 'items-start'}`}>
                        {j.id === lanjutId && adaProgres && <span className="absolute bottom-full mb-1.5 rounded-full bg-ember px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-on-ember [text-shadow:none]">{tr('Lanjutkan', 'Continue')}</span>}
                        <span className="block">
                          <span className="judul-display block text-3xl leading-[0.95] text-ink transition-[translate] duration-300 ease-snap group-hover/n:[translate:var(--geser)] sm:text-4xl" style={{ '--geser': kanan ? '-0.25rem 0' : '0.25rem 0' }}>{j.verba}</span>
                          
                        </span>
                        <span className="block w-[14rem] text-[0.9375rem] font-medium leading-snug text-ink/90 [text-wrap:balance]">{j.ket}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        </Container>
      </header>
      {/* Game Patroli Hutan: cuplikan yang bermain sendiri, diberi jarak dari teks jalur belajar di atasnya */}
      <Container className="relative z-10 mt-8 md:mt-12">
        <KartuPatroli skor={patroli?.skor ?? null} total={patroli?.total} />
      </Container>
      <Container className="pt-6">
        <AjakMasuk butir={[[BookOpenText, tr('Progres bacaan', 'Reading progress')], [Target, tr('Skor kuis', 'Quiz scores')], [CheckCircle2, 'Checklist'], [Bookmark, tr('Simpan artikel', 'Saved articles')]]} manfaat={{ belum: tr('Bacaan dan galeri terbuka untuk semua. Masuk untuk membuka kuis, checklist persiapan, dan melapor titik api, serta menyimpan progres dan artikel di akunmu.', 'Reads and the gallery are open to everyone. Sign in to unlock the quiz, the preparation checklist, and fire-point reporting, and to keep your progress and saved articles in your account.'), sudah: tr('Progres bacaan, kuis, dan checklist tersimpan di akunmu.', 'Your reading, quiz, and checklist progress is kept in your account.') }} />
      </Container>


      <div className="h-8" aria-hidden="true" />
      <div data-kecil={kecil} className="group/pil pointer-events-none sticky top-[4.6rem] z-30 h-0">
        <div className="flex justify-center px-4">
          <div role="tablist" aria-label={tr('Materi edukasi', 'Learning materials')} onKeyDown={onKey}
            className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-line bg-bg/80 p-1.5 shadow-[0_10px_30px_-10px_rgb(0_0_0/.45)] backdrop-blur-xl [scrollbar-width:none]">
            {tabs.map((t) => {
              const aktif = t.id === tab
              return (
                <button key={t.id} id={`${id}-tab-${t.id}`} role="tab" type="button" aria-selected={aktif} aria-controls={`${id}-panel`} aria-label={t.label} tabIndex={aktif ? 0 : -1} onClick={() => pilih(t.id)}
                  className={`flex h-10 shrink-0 items-center rounded-full px-3 text-sm font-semibold transition-[background-color,color,scale] duration-300 ease-snap active:scale-95 ${aktif ? 'bg-ink text-bg' : 'text-ink-2 hover:bg-ink/10 hover:text-ink'}`}>
                  <t.ikon size={17} aria-hidden="true" className="shrink-0" />
                  <span className={`grid transition-[grid-template-columns,margin] duration-500 ease-snap ${aktif ? 'ml-2 grid-cols-[1fr]' : 'ml-0 grid-cols-[0fr] group-data-[kecil=false]/pil:ml-2 group-data-[kecil=false]/pil:grid-cols-[1fr] group-hover/pil:ml-2 group-hover/pil:grid-cols-[1fr] group-focus-within/pil:ml-2 group-focus-within/pil:grid-cols-[1fr]'}`}>
                    <span className="flex items-baseline gap-2 overflow-hidden whitespace-nowrap">{t.label}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="h-7" aria-hidden="true" />

      <div key={tab} id={`${id}-panel`} role="tabpanel" className="tab-ganti scroll-mt-32" aria-labelledby={`${id}-tab-${tab}`}>
        {tab === 'artikel' && <DaftarArtikel pilih={pilih} />}
        {tab !== 'artikel' && <Container className="py-10 md:py-14">
          {tab === 'galeri' && <><Pengantar>{tr('Berkeliling galeri bersama TORA: lihat bagaimana api menyala, menjalar di bawah tanah, dan terbawa angin ke permukiman. Ketuk lukisan untuk memperbesar.', 'Walk through the gallery with TORA: see how fire starts, creeps underground, and rides the wind into communities. Tap a painting to enlarge it.')}</Pengantar><Galeri /></>}
          {tab === 'kuis' && !sesi && <Terkunci alasan="kuis" ikon={Target} judul={tr('Kuis khusus pengguna masuk', 'The quiz is for signed-in users')} isi={tr('Skor terbaikmu tersimpan di akun, jadi kamu bisa melihat kemajuan dari waktu ke waktu. Bacaan dan galeri tetap terbuka untuk semua.', 'Your best score is kept in your account so you can see progress over time. Reads and the gallery stay open to everyone.')} />}
          {tab === 'kuis' && sesi && <><Pengantar>{tr('Berapa soal yang bisa kamu jawab benar? Tiap jawaban disertai penjelasan singkat, jadi sambil menguji kamu juga belajar.', 'How many can you get right? Every answer comes with a short explanation, so you learn as you test.')}</Pengantar><Kuis /></>}
          {tab === 'checklist' && !sesi && <Terkunci alasan="persiapan" ikon={CheckCircle2} judul={tr('Persiapan khusus pengguna masuk', 'Preparation is for signed-in users')} isi={tr('Centang langkah yang sudah siap dan simpan di akunmu, supaya tidak hilang saat berganti perangkat. Bacaan dan galeri tetap terbuka untuk semua.', 'Tick the steps that are ready and keep them in your account. Reads and the gallery stay open to everyone.')} />}
          {tab === 'checklist' && sesi && <><Pengantar>{tr('Persiapan kecil hari ini bisa menyelamatkan banyak hal saat asap datang. Centang yang sudah siap, cetak, dan tempel di rumah.', 'Small preparations today can save a lot when smoke arrives. Tick what is ready, print it, and keep it at home.')}</Pengantar><Checklist /></>}
        </Container>}
      </div>

      <AjakTora />
    </>
  )
}
