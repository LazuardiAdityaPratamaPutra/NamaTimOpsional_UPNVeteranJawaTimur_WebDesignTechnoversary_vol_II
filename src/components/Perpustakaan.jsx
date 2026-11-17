import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, BookOpen, BookOpenText, Bookmark, Clock, Flame, HeartPulse, Layers, Search, ShieldCheck, Target, X } from 'lucide-react'
import { MaskotEkspresi } from './Maskot'
import { daftarArtikel } from '../lib/artikel'
import { muatBaca, muatTanggalBaca, tandaiBaca } from '../lib/progres'
import { muatSimpan } from '../lib/simpan'
import { sampul } from '../data/sampul'
import { TORA_PUSTAKAWAN, warnaBuku } from '../data/perpustakaan'
import { kurangiGerak } from '../lib/gerak'
import { useBahasa, useTr } from '../i18n'

// Perpustakaan (tab Artikel): setiap artikel menjadi buku di rak. Tebal buku mengikuti lama baca, pita menandai buku yang
// sudah dibaca, kertas tempel menandai buku yang disimpan. Artikel buatan admin otomatis tampil di "Rak 2 · Bacaan baru".
// Buku dipilih -> sampulnya tampil di meja baca bersama kartu peminjaman -> "Buka buku" membuka sampul lalu masuk ke artikel.

const IKON = { penyebab: Flame, dampak: HeartPulse, gambut: Layers, pencegahan: ShieldCheck }
const KATEGORI = { penyebab: ['Pemicu', 'Cause'], dampak: ['Dampak', 'Impact'], gambut: ['Gambut', 'Peat'], pencegahan: ['Pencegahan', 'Prevention'] }
const TOMBOL = 'inline-flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-ink px-4 text-sm font-bold text-ink shadow-[2px_2px_0_0_var(--text)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--text)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'
const lebarBuku = (a) => Math.min(5.4, 2.7 + a.menit * 0.5) // rem: buku lebih tebal untuk bacaan lebih lama
const tanggalCap = (iso, b) => new Intl.DateTimeFormat(b === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso)).toUpperCase()

/** Kartu peminjaman perpustakaan gaya lama; dicap "Dikembalikan" setelah artikel selesai dibaca. */
export function KartuPinjam({ judul, nomor, tanggal, cap = false, className = '' }) {
  const b = useBahasa()
  const tr = useTr()
  return (
    <div className={`kartu-pinjam relative rounded-lg border-2 border-[rgb(28_22_18)] p-4 shadow-[4px_4px_0_0_rgb(0_0_0/0.35)] ${className}`}>
      <p className="m-0 flex items-center justify-between gap-3 border-b-2 border-[rgb(28_22_18)] pb-2 font-mono text-[11px] uppercase tracking-[0.16em]">
        <span>{tr('Kartu pinjam', 'Library card')}</span><span className="text-[rgb(170_56_14)]">PyraOps</span>
      </p>
      <dl className="m-0 mt-2 grid grid-cols-[auto_1fr] gap-x-3 text-sm">
        <dt className="py-1.5 font-mono text-[11px] uppercase tracking-widest text-[rgb(84_78_70)]">{tr('Judul', 'Title')}</dt><dd className="m-0 border-b border-dashed border-[rgb(150_140_125)] py-1.5 font-semibold leading-snug">{judul}</dd>
        <dt className="py-1.5 font-mono text-[11px] uppercase tracking-widest text-[rgb(84_78_70)]">{tr('Bab', 'Part')}</dt><dd className="m-0 border-b border-dashed border-[rgb(150_140_125)] py-1.5 font-mono">{nomor}</dd>
        <dt className="py-1.5 font-mono text-[11px] uppercase tracking-widest text-[rgb(84_78_70)]">{tr('Status', 'Status')}</dt>
        <dd className="m-0 min-h-[3.25rem] py-1.5">
          {tanggal
            ? <span className={`cap-pinjam ${cap ? 'cap-masuk' : ''}`}>{tr('Dikembalikan', 'Returned')}<span className="block text-[11px] tracking-[0.12em]">{tanggalCap(tanggal, b)}</span></span>
            : <span className="text-sm text-[rgb(84_78_70)]">{tr('Sedang dipinjam. Selesaikan bacaan untuk mendapat cap.', 'On loan. Finish reading to get the stamp.')}</span>}
        </dd>
      </dl>
    </div>
  )
}

/** Kartu pinjam di akhir artikel: saat terlihat, artikel ditandai selesai dan cap "Dikembalikan" mendarat. */
export function KartuPinjamAkhir({ slug, judul, nomor }) {
  const tr = useTr()
  const ref = useRef(null)
  const [tgl, setTgl] = useState(() => muatTanggalBaca()[slug] ?? null)
  const [cap, setCap] = useState(false)
  // Cap "mendarat" bila artikel belum pernah selesai saat halaman dibuka (penanda 80% gulir bisa lebih dulu menyimpan tanggal)
  const [baruPertama] = useState(() => !muatTanggalBaca()[slug])
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      tandaiBaca(slug)
      setTgl(muatTanggalBaca()[slug] ?? new Date().toISOString())
      if (baruPertama) setCap(true)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [slug, baruPertama])
  return (
    <section ref={ref} aria-label={tr('Kartu peminjaman', 'Library card')} className="mt-14 max-w-md">
      <p className="alis m-0 mb-3">{tr('Selesai membaca', 'Finished reading')}</p>
      <KartuPinjam judul={judul} nomor={nomor} tanggal={tgl} cap={cap} />
      <p className="sr-only" aria-live="polite">{cap ? tr('Cap dikembalikan diberikan.', 'Returned stamp given.') : ''}</p>
    </section>
  )
}

export default function Perpustakaan({ pilihTab }) {
  const b = useBahasa()
  const tr = useTr()
  const navigate = useNavigate()
  const daftar = daftarArtikel(b)
  const [sudah] = useState(muatBaca)
  const [tgl] = useState(muatTanggalBaca)
  const [simpan] = useState(muatSimpan)
  const [cari, setCari] = useState('')
  const [pilihan, setPilihan] = useState(null)
  const [membuka, setMembuka] = useState(false)
  const meja = useRef(null)
  const dinding = useRef(null)
  const timer = useRef(0)
  const [lebarRak, setLebarRak] = useState(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  // Lebar rak diukur agar buku dibagi ke beberapa baris rak (tidak ada buku yang tersembunyi di luar layar)
  useEffect(() => {
    const el = dinding.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([e]) => setLebarRak(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  if (!daftar.length) return null

  const nomorDari = (slug) => String(daftar.findIndex((a) => a.slug === slug) + 1).padStart(2, '0')
  const total = daftar.reduce((n, a) => n + a.menit, 0)
  const berikut = daftar.find((a) => !sudah.includes(a.slug))
  const q = cari.trim().toLowerCase()
  const cocok = (a) => !q || `${a.judul} ${a.ringkas ?? ''}`.toLowerCase().includes(q)
  const nCocok = daftar.filter(cocok).length
  const rak = [
    { id: 'inti', judul: tr('Rak 1 · Bab inti', 'Shelf 1 · Core chapters'), isi: daftar.filter((a) => !a.kustom) },
    { id: 'baru', judul: tr('Rak 2 · Bacaan baru', 'Shelf 2 · New reads'), isi: daftar.filter((a) => a.kustom) },
  ].filter((r) => r.isi.length)
  const buku = pilihan ? daftar.find((a) => a.slug === pilihan) : null
  // Bagi buku per baris rak menurut lebar yang tersedia (rem -> px; sisakan ruang untuk penyangga buku)
  const rem = typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16
  const skala = lebarRak && lebarRak < 480 ? 0.8 : 1 // layar sempit: buku sedikit lebih kecil agar satu baris muat 4-5 buku
  const barisRak = (isi) => {
    const muat = lebarRak ? lebarRak - 48 : Infinity
    const baris = [[]]
    let pakai = 0
    for (const a of isi) {
      const w = (lebarBuku(a) * skala + 0.5) * rem
      if (baris.at(-1).length && pakai + w > muat) { baris.push([]); pakai = 0 }
      baris.at(-1).push(a); pakai += w
    }
    return baris
  }

  const ambil = (slug) => {
    setMembuka(false)
    setPilihan(pilihan === slug ? null : slug)
    if (pilihan !== slug) requestAnimationFrame(() => meja.current?.scrollIntoView({ behavior: kurangiGerak() ? 'auto' : 'smooth', block: 'nearest' }))
  }
  const buka = (e) => {
    e.preventDefault()
    if (kurangiGerak()) { navigate(`/edukasi/${buku.slug}`); return }
    setMembuka(true)
    clearTimeout(timer.current); timer.current = setTimeout(() => navigate(`/edukasi/${buku.slug}`), 720)
  }

  const ucapan = buku
    ? tr(...TORA_PUSTAKAWAN.pilih).replace('{m}', buku.menit)
    : !berikut ? tr(...TORA_PUSTAKAWAN.tamat) : tr(...TORA_PUSTAKAWAN.sapa)

  const buku1 = (a) => {
    const Ikon = IKON[a.slug] ?? BookOpenText
    const dibaca = sudah.includes(a.slug), disimpan = simpan.includes(a.slug), on = pilihan === a.slug
    const lebar = lebarBuku(a) * skala
    const tinggi = skala * 12.5 + skala * ([...a.slug].reduce((n, c) => n + c.charCodeAt(0), 0) % 4) * 0.7
    const status = [tr(`${a.menit} menit baca`, `${a.menit} min read`), dibaca && tr('sudah dibaca', 'read'), disimpan && tr('disimpan', 'saved')].filter(Boolean).join(', ')
    return (
      <li key={a.slug} className={`relative shrink-0 transition-opacity duration-300 ${cocok(a) ? '' : 'opacity-25'}`}>
        {a.slug === berikut?.slug && !q && !on && <span aria-hidden="true" className="buku-mulai absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ember px-2 py-0.5 text-[11px] font-bold text-on-ember">{sudah.length ? tr('Lanjut', 'Next') : tr('Mulai', 'Start')}</span>}
        <button type="button" onClick={() => ambil(a.slug)} aria-pressed={on} aria-controls="meja-baca"
          aria-label={`${a.judul}. ${status}`} title={a.judul} style={{ '--warna': warnaBuku(a.slug), width: `${lebar}rem`, height: `${tinggi}rem` }}
          className={`buku group/b relative flex flex-col items-center justify-between rounded-t-[5px] border-2 border-[rgb(18_14_10)] px-1 pb-2 pt-3 text-[rgb(250_240_222)] ${on ? 'buku-dipilih' : ''}`}>
          {dibaca && <span aria-hidden="true" className="buku-pita absolute -top-3 right-2 h-6 w-2.5" />}
          {disimpan && <span aria-hidden="true" className="absolute -left-1.5 top-6 flex size-5 -rotate-12 items-center justify-center rounded-sm bg-[rgb(255_214_92)] text-[rgb(28_22_18)] shadow-[1px_1px_0_rgb(0_0_0/0.4)]"><Bookmark size={11} strokeWidth={3} /></span>}
          <span aria-hidden="true" className="font-mono text-[11px] opacity-85">{nomorDari(a.slug)}</span>
          <span aria-hidden="true" className="judul-display line-clamp-2 max-h-[72%] overflow-hidden text-[15px] leading-[1.05] [writing-mode:vertical-rl]">{a.judul}</span>
          <Ikon size={15} aria-hidden="true" className="opacity-90" />
        </button>
      </li>
    )
  }

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <p className="alis m-0">{tr('Perpustakaan PyraOps', 'The PyraOps library')}</p>
          <h2 className="mt-3 text-4xl leading-[1.02] sm:text-5xl">{tr('Ambil satu buku dari rak', 'Take a book from the shelf')}</h2>
          <p className="m-0 mt-3 max-w-[48ch] text-base leading-relaxed text-ink-2">{tr(`${daftar.length} buku, sekitar ${total} menit seluruhnya. Buku tebal artinya bacaan lebih panjang.`, `${daftar.length} books, about ${total} minutes in all. A thicker book means a longer read.`)}</p>
        </div>
        <div className="w-full sm:w-72">
          <label htmlFor="katalog" className="text-sm font-semibold">{tr('Cari di katalog', 'Search the catalogue')}</label>
          <div className="relative mt-1.5">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-2" />
            <input id="katalog" type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder={tr('mis. asap, gambut', 'e.g. smoke, peat')}
              className="min-h-11 w-full rounded-xl border-2 border-line-strong bg-surface pl-9 pr-3 text-sm text-ink outline-none focus:border-ember-ink" />
          </div>
          <p className="m-0 mt-1 text-xs text-ink-2" aria-live="polite">{q ? tr(`${nCocok} buku cocok`, `${nCocok} matching books`) : ''}</p>
        </div>
      </div>

      <div className="perpus hero-malam overflow-hidden rounded-[1.75rem] border-2 border-ink shadow-[6px_6px_0_0_var(--line-strong)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_19rem]">
          {/* Rak buku */}
          <div ref={dinding} className="perpus-dinding order-2 min-w-0 p-4 pt-2 sm:p-8 sm:pt-4 lg:order-1">
            {rak.map((r) => (
              <section key={r.id} aria-labelledby={`rak-${r.id}`} className="mt-4 first:mt-2">
                <h3 id={`rak-${r.id}`} className="rak-label m-0 inline-block">{r.judul}</h3>
                {barisRak(r.isi).map((baris, k, semua) => (
                  <div key={k}>
                    <ul className="rak m-0 flex list-none items-end gap-2 px-3 pb-0 pt-10">
                      {baris.map((a) => buku1(a))}
                      {k === semua.length - 1 && <li aria-hidden="true" className="rak-penyangga ml-1 shrink-0" />}
                    </ul>
                    <div aria-hidden="true" className="rak-papan" />
                  </div>
                ))}
              </section>
            ))}
            {q && !nCocok && <p className="m-0 mt-4 text-sm font-semibold">{tr('Tidak ada buku yang cocok. Coba kata lain.', 'No matching books. Try another word.')}</p>}
          </div>

          {/* Meja pustakawan */}
          <aside aria-label={tr('Meja pustakawan', 'Librarian desk')} className="perpus-meja relative order-1 flex items-end gap-3 overflow-hidden border-b-2 border-ink px-4 pt-4 lg:order-2 lg:flex-col lg:items-stretch lg:border-b-0 lg:border-l-2 lg:px-5 lg:pt-6">
            <div className="relative z-10 mb-4 flex-1 lg:mb-0 lg:flex-none">
              <p key={ucapan} className="gelembung-pustaka baris-masuk-halus m-0 rounded-2xl border-2 border-[rgb(28_22_18)] bg-[rgb(250_246_236)] p-3 text-sm font-semibold leading-snug text-[rgb(28_22_18)]">
                <span className="sr-only">TORA: </span>{ucapan}
                {!buku && berikut && (
                  <button type="button" onClick={() => ambil(berikut.slug)} className="mt-2 flex w-full items-center justify-between gap-2 rounded-lg border-2 border-[rgb(28_22_18)] bg-[rgb(255_214_92)] px-2.5 py-1.5 text-left text-[13px] font-bold">
                    <span><span className="block text-[11px] font-semibold opacity-80">{tr(...TORA_PUSTAKAWAN.mulai)}</span>{berikut.judul}</span><ArrowUpRight size={15} aria-hidden="true" className="shrink-0" />
                  </button>
                )}
                {!berikut && <button type="button" onClick={() => pilihTab('kuis')} className="mt-2 inline-flex items-center gap-1 text-[13px] font-bold underline underline-offset-4"><Target size={14} aria-hidden="true" />{tr('Buka Kuis', 'Open the Quiz')}</button>}
              </p>
            </div>
            <div className="relative w-28 shrink-0 self-end sm:w-36 lg:mx-auto lg:mt-auto lg:w-56">
              <MaskotEkspresi ekspresi={buku ? 'merayakan' : 'ramah'} className="relative z-0 -mb-3 w-full lg:-mb-6" />
              <div aria-hidden="true" className="meja-kayu absolute inset-x-[-1rem] bottom-0 z-10 h-6 lg:inset-x-[-2.5rem] lg:h-16" />
            </div>
          </aside>
        </div>

        {/* Meja baca: buku yang diambil */}
        <div id="meja-baca" ref={meja} aria-live="polite" className="scroll-mt-32">
          {buku && (
            <div key={buku.slug} className="meja-baca baris-masuk-halus grid gap-6 border-t-2 border-ink p-5 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
              <div className="buku-3d mx-auto md:mx-0" style={{ '--warna': warnaBuku(buku.slug) }}>
                <div className="buku-halaman"><p className="m-0 font-mono text-[10px] uppercase tracking-[0.16em] opacity-70">{tr('Halaman 1', 'Page 1')}</p><p className="m-0 mt-2 text-[13px] leading-snug">{buku.ringkas}</p></div>
                <div className={`buku-sampul ${membuka ? 'terbuka' : ''}`}>
                  <img src={sampul(buku.slug).src} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover opacity-45 mix-blend-luminosity" style={{ objectPosition: sampul(buku.slug).posisi }} />
                  <div className="relative flex h-full flex-col justify-between p-4">
                    <p className="m-0 font-mono text-[11px] uppercase tracking-[0.16em]">{tr('Bab', 'Part')} {nomorDari(buku.slug)}</p>
                    <p className="judul-display m-0 text-[1.65rem] leading-[1.02]">{buku.judul}</p>
                    <p className="m-0 inline-flex items-center gap-1.5 text-xs font-semibold"><Clock size={13} aria-hidden="true" />{tr(`${buku.menit} menit`, `${buku.menit} min`)}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <p className="m-0 font-mono text-xs uppercase tracking-[0.16em] text-ember-ink">{tr('Bab', 'Part')} {nomorDari(buku.slug)} · {tr(...(KATEGORI[buku.slug] ?? ['Bacaan baru', 'New read']))}</p>
                <h3 className="judul-display m-0 mt-2 text-3xl leading-[1.04] sm:text-4xl">{buku.judul}</h3>
                <p className="m-0 mt-3 max-w-[52ch] text-base leading-relaxed text-ink-2">{buku.ringkas}</p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <a href={`/edukasi/${buku.slug}`} onClick={buka} className={`${TOMBOL} !bg-ember !text-on-ember`}><BookOpen size={16} aria-hidden="true" />{sudah.includes(buku.slug) ? tr('Baca lagi', 'Read again') : tr('Buka buku', 'Open the book')}</a>
                  <button type="button" onClick={() => setPilihan(null)} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-ink-2 hover:text-ink"><X size={15} aria-hidden="true" />{tr('Kembalikan ke rak', 'Put it back')}</button>
                </div>
                <KartuPinjam judul={buku.judul} nomor={nomorDari(buku.slug)} tanggal={tgl[buku.slug] ?? null} className="mt-6 max-w-md" />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
