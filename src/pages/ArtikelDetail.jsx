import { useEffect, useState } from 'react'
import Percikan from '../components/Percikan'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Bookmark, BookmarkCheck, Check, Clock, Link2 } from 'lucide-react'
import { useAuth } from '../components/authContext'
import { alihSimpan, muatSimpan } from '../lib/simpan'
import { Button, Container } from '../components/ui'
import Markdown, { idBagian } from '../components/Markdown'
import FotoZoom from '../components/FotoZoom'
import KemajuanBaca from '../components/KemajuanBaca'
import { KartuPinjamAkhir } from '../components/Perpustakaan'
import { WIDGET_PERUMPAMAAN } from '../components/Perumpamaan'
import { GLOSARIUM, PERUMPAMAAN } from '../data/perpustakaan'
import { lokal } from '../i18n'
import { sampul } from '../data/sampul'
import { parseMarkdown } from '../lib/markdown'
import { daftarArtikel, cariArtikel } from '../lib/artikel'
import { useJudul } from '../lib/useJudul'
import { useBahasa, useTr } from '../i18n'

const JUDUL_ARTIKEL = { penyebab: ['Penyebab', 'Causes'], dampak: ['Dampak', 'Impacts'], pencegahan: ['Pencegahan', 'Prevention'], gambut: ['Gambut', 'Peat'] }

/** Salin tautan artikel (atau buka lembar bagikan bawaan di ponsel). Ikon berganti centang sebentar sebagai tanda berhasil. */
function BagikanTautan({ judul }) {
  const tr = useTr()
  const [ok, setOk] = useState(0)
  useEffect(() => { if (!ok) return undefined; const t = setTimeout(() => setOk(0), 2200); return () => clearTimeout(t) }, [ok])
  const bagikan = async () => {
    const url = window.location.href
    const sentuh = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
    try {
      if (sentuh && navigator.share) { await navigator.share({ title: judul, url }); return }
      await navigator.clipboard.writeText(url); setOk((n) => n + 1)
    } catch { /* dibatalkan pengguna atau izin papan klip ditolak: tidak perlu pesan */ }
  }
  return (
    <button type="button" onClick={bagikan} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink-2/60 bg-bg/40 px-4 text-sm font-semibold backdrop-blur-md transition-[border-color,scale] duration-200 ease-snap hover:border-ember active:scale-95">
      {ok ? <Check key={ok} size={16} aria-hidden="true" className="animate-[pop_450ms_var(--ease-snap)] text-canopy" /> : <Link2 size={16} aria-hidden="true" />}
      <span aria-live="polite">{ok ? tr('Tautan disalin', 'Link copied') : tr('Salin tautan', 'Copy link')}</span>
    </button>
  )
}

export default function ArtikelDetail() {
  const { slug } = useParams()
  const b = useBahasa()
  const tr = useTr()
  const { sesi } = useAuth()
  const { pathname } = useLocation()
  const [simpan, setSimpan] = useState(muatSimpan)
  const [letup, setLetup] = useState(0)
  const [aktifId, setAktifId] = useState(null)
  const artikel = cariArtikel(slug, b)
  useJudul(artikel ? artikel.judul : tr('Artikel tidak ditemukan', 'Article not found'))

  // Penanda bagian yang sedang dibaca: bagian terakhir yang judulnya sudah melewati sepertiga atas layar
  useEffect(() => {
    if (!artikel) return
    const ids = parseMarkdown(artikel.isi).filter((x) => x.tipe === 'h2').map((x) => idBagian(x.teks))
    const hitung = () => {
      let a = null
      for (const id of ids) { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < innerHeight * 0.35) a = id }
      setAktifId(a)
    }
    hitung()
    addEventListener('scroll', hitung, { passive: true })
    return () => removeEventListener('scroll', hitung)
  }, [artikel])

  if (!artikel) {
    return (
      <Container className="py-16">
        <h1 className="text-2xl font-bold">{tr('Artikel tidak ditemukan', 'Article not found')}</h1>
        <p className="mt-2 text-ink-2">{tr('Artikel yang kamu cari tidak ada atau sudah dipindahkan.', 'The article you are looking for does not exist or has been moved.')}</p>
        <Button as={Link} to="/edukasi" className="mt-4">{tr('Kembali ke Edukasi', 'Back to Learn')}</Button>
      </Container>
    )
  }
  const semua = daftarArtikel(b)
  const i = semua.findIndex((a) => a.slug === slug)
  const sebelum = semua[i - 1], sesudah = semua[i + 1]

  const foto = sampul(slug)
  const bagian = parseMarkdown(artikel.isi).filter((x) => x.tipe === 'h2').map((x) => x.teks)
  const nomor = String(i + 1).padStart(2, '0')
  const lanjut = sesudah ?? semua[0]
  const fotoLanjut = sampul(lanjut.slug)
  // Glosarium sentuh: istilah pertama di artikel ini bisa diketuk
  const glosarium = GLOSARIUM.map((g) => ({ ...lokal(g, b), re: g.pola[b === 'en' ? 'en' : 'id'] }))
  // Widget perumpamaan: tiap widget sekali, setelah paragraf pertama yang memuat perumpamaannya
  const blokArtikel = parseMarkdown(artikel.isi)
  const letakWidget = new Map(PERUMPAMAAN.filter((p) => p.artikel === slug).map((p) => [blokArtikel.findIndex((x) => x.tipe === 'p' && p.cocok[b === 'en' ? 'en' : 'id'].test(x.teks)), p.id]).filter(([i]) => i >= 0))
  const sisipan = (_blok, i) => { const id = letakWidget.get(i); const Widget = id && WIDGET_PERUMPAMAAN[id]; return Widget ? <Widget /> : null }

  return (
    <>
      <KemajuanBaca slug={slug} />
      <header className="hero-malam relative isolate overflow-hidden">
        <FotoZoom mode="atas" src={foto.src} aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover" style={{ objectPosition: foto.posisi }} />
        <div className="absolute inset-0 -z-10 bg-bg/20" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/55 via-40% to-transparent" aria-hidden="true" />
        <Container className="flex min-h-[min(80svh,760px)] flex-col justify-end pb-12 pt-28 md:pb-16">
          <Link to="/edukasi" className="mb-auto inline-flex min-h-11 w-fit items-center gap-1.5 rounded-full border border-line bg-bg/40 px-4 text-sm font-semibold backdrop-blur-md transition-[transform,border-color] duration-200 ease-snap hover:border-ember-ink active:scale-[0.97]"><ArrowLeft size={14} aria-hidden="true" />{tr('Semua materi', 'All materials')}</Link>
          <p className="m-0 mt-10 font-mono text-sm tracking-widest text-ember-ink">{nomor} / {String(semua.length).padStart(2, '0')}</p>
          <h1 className="mt-5 max-w-[14ch] text-[clamp(3rem,9vw,8rem)] leading-[1.02]">{artikel.judul}</h1>
          <p className="mt-7 max-w-[52ch] text-xl leading-relaxed text-ink">{artikel.ringkas}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3"><p className="m-0 inline-flex items-center gap-1.5 text-sm text-ink-2"><Clock size={14} aria-hidden="true" />{tr(`${artikel.menit} menit baca`, `${artikel.menit} min read`)}</p>
            <BagikanTautan judul={artikel.judul} />
            {sesi ? (
              <button type="button" onClick={() => { const baru = alihSimpan(slug); setSimpan(baru); if (baru.includes(slug)) setLetup((n) => n + 1) }} aria-pressed={simpan.includes(slug)} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,color,border-color,scale] duration-200 ease-snap active:scale-95 ${simpan.includes(slug) ? 'border-ember bg-ember text-on-ember' : 'border-ink-2/60 bg-bg/40 backdrop-blur-md hover:border-ember'}`}>
                <span className="relative flex">{simpan.includes(slug) ? <BookmarkCheck key={letup} size={16} aria-hidden="true" className="animate-[pop_450ms_var(--ease-snap)]" /> : <Bookmark size={16} aria-hidden="true" />}{letup > 0 && simpan.includes(slug) && <Percikan key={letup} className="left-1/2 top-1/2" />}</span>
                {simpan.includes(slug) ? tr('Tersimpan', 'Saved') : tr('Simpan artikel', 'Save article')}
              </button>
            ) : (
              <Link to="/masuk" state={{ next: pathname }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-ink-2/60 bg-bg/40 px-4 text-sm font-semibold backdrop-blur-md transition-[border-color] duration-200 ease-snap hover:border-ember">
                <Bookmark size={16} aria-hidden="true" />{tr('Masuk untuk menyimpan', 'Sign in to save')}
              </Link>
            )}
          </div>
        </Container>
      </header>

      <Container as="article" className="grid gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,15rem)_minmax(0,48rem)] lg:gap-20">
        {bagian.length > 1 && (
          <nav aria-label={tr('Isi artikel', 'In this article')} className="lg:sticky lg:top-24 lg:self-start">
            <p className="m-0 text-sm font-semibold uppercase tracking-wide text-ink-2">{tr('Isi artikel', 'In this article')}</p>
            <ol className="m-0 mt-4 list-none space-y-1 p-0">
              {bagian.map((h, n) => (
                <li key={h}><a href={`#${idBagian(h)}`} aria-current={aktifId === idBagian(h) ? 'location' : undefined} className={`group flex min-h-11 items-center gap-3 border-l-2 py-1 pl-4 text-base leading-snug transition-[color,border-color,padding] duration-300 ease-snap hover:border-ember-ink hover:text-ink ${aktifId === idBagian(h) ? 'border-ember-ink pl-6 font-semibold text-ink' : 'border-line text-ink-2'}`}>
                  <span className="font-mono text-xs text-ember-ink" aria-hidden="true">{String(n + 1).padStart(2, '0')}</span>{h}
                </a></li>
              ))}
            </ol>
          </nav>
        )}
        <div>
          <Markdown sumber={artikel.isi} slugIni={slug} glosarium={glosarium} sisipan={sisipan}
            labelArtikel={(s) => tr(`Selengkapnya di artikel ${tr(...(JUDUL_ARTIKEL[s] ?? [s, s]))}`, `More in the ${tr(...(JUDUL_ARTIKEL[s] ?? [s, s]))} article`)} />
          <KartuPinjamAkhir key={slug} slug={slug} judul={artikel.judul} nomor={nomor} />
        </div>
      </Container>

      <nav aria-label={tr('Artikel lainnya', 'More articles')} className="border-t border-line">
        <Link to={`/edukasi/${lanjut.slug}`} className="hero-malam group relative isolate flex min-h-[60svh] flex-col items-center justify-center overflow-hidden px-4 py-20 text-center">
          <FotoZoom src={fotoLanjut.src} aria-hidden="true" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover opacity-30" style={{ objectPosition: fotoLanjut.posisi }} />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg via-transparent to-bg" aria-hidden="true" />
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-ember-ink">{sesudah ? tr('Berikutnya', 'Next') : tr('Mulai lagi dari awal', 'Start over')}</span>
          <span className="mt-5 block max-w-[16ch] font-display text-[clamp(2.5rem,7vw,6rem)] font-extrabold leading-[1.04] [font-stretch:76%]">{lanjut.judul}</span>
          <span className="mt-8 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-5 font-semibold transition-[border-color,transform] duration-200 ease-snap group-hover:border-ember-ink group-active:scale-[0.97]">{tr('Baca artikel', 'Read article')}<ArrowUpRight size={18} aria-hidden="true" /></span>
        </Link>
        {sebelum && <div className="border-t border-line py-5 text-center"><Link to={`/edukasi/${sebelum.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-2 hover:text-ember-ink"><ArrowLeft size={14} aria-hidden="true" />{tr('Sebelumnya', 'Previous')}: {sebelum.judul}</Link></div>}
      </nav>
    </>
  )
}
