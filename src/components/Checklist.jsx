import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from './ui/toastContext'
import { Backpack, Check, ChevronDown, Contact, MapPin, MapPinned, Printer, RotateCcw, Share2 } from 'lucide-react'
import { Tabs } from './ui'
import Percikan from './Percikan'
import { MaskotEkspresi } from './Maskot'
import RumahSiaga from './RumahSiaga'
import KemasTas from './KemasTas'
import LembarCetak from './LembarCetak'
import { CHECKLIST, TAHAP } from '../data/checklist'
import { daftarChecklist } from '../lib/kontenEdukasi'
import { muatCatatan, muatCentang, pesanTetangga, simpanCatatan, simpanCentang, vcardDarurat } from '../lib/checklist'
import { kurangiGerak } from '../lib/gerak'
import { lokal, useBahasa, useTr } from '../i18n'

const JUDUL = { keluarga: ['Keluarga', 'Family'], sekolah: ['Sekolah', 'School'] }
const JUDUL_ARTIKEL = { penyebab: ['Penyebab', 'Causes'], dampak: ['Dampak', 'Impacts'], pencegahan: ['Pencegahan', 'Prevention'], gambut: ['Gambut', 'Peat'] }

/**
 * Pil progres ringkas yang menempel di bawah bilah tab (hanya layar sempit; di layar lebar Rumah Siaga sudah menempel),
 * muncul setelah panel rumah tergulir lewat, supaya hitungan "x dari y" tetap terlihat saat mencentang butir di bawah.
 */
function ProgresMelekat({ selesai, total, tr }) {
  const penanda = useRef(null)
  const [tampil, setTampil] = useState(false)
  // Dicek saat gulir (bukan IntersectionObserver) agar lompatan jauh sekaligus, mis. tombol End, tetap terdeteksi
  useEffect(() => {
    let raf = 0
    const cek = () => { raf = 0; const el = penanda.current; if (el) setTampil(el.getBoundingClientRect().top < 140) }
    const gulir = () => { if (!raf) raf = requestAnimationFrame(cek) }
    cek()
    window.addEventListener('scroll', gulir, { passive: true }); window.addEventListener('resize', gulir)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', gulir); window.removeEventListener('resize', gulir) }
  }, [])
  const penuh = selesai === total
  return (
    <>
      <div ref={penanda} aria-hidden="true" className="h-px lg:hidden" />
      <div aria-hidden="true" className="no-print pointer-events-none sticky top-[8.9rem] z-20 h-0 lg:hidden">
        <div className={`mx-auto flex w-fit items-center gap-3 rounded-full border-2 border-ink bg-surface px-4 py-2 text-sm font-semibold shadow-[3px_3px_0_0_var(--line-strong)] transition-[opacity,translate] duration-300 ease-snap ${tampil ? 'opacity-100' : '-translate-y-2 opacity-0'}`}>
          <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line"><span className={`block h-full rounded-full transition-[width] duration-500 ease-snap ${penuh ? 'bg-canopy' : 'bg-ember'}`} style={{ width: `${(selesai / total) * 100}%` }} /></span>
          <span className="tabular-nums">{tr(`${selesai} dari ${total} selesai`, `${selesai} of ${total} done`)}</span>
        </div>
      </div>
    </>
  )
}

/** Tombol aksi kecil di kartu butir (gaya neo-brutal ringan). */
const AKSI = 'inline-flex min-h-9 items-center gap-1.5 rounded-xl border-2 border-ink bg-bg px-3 text-sm font-bold text-ink shadow-[2px_2px_0_0_var(--text)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_0_var(--text)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'

export default function Checklist() {
  const b = useBahasa()
  const tr = useTr()
  const toast = useToast()
  const [grup, setGrup] = useState('keluarga')
  const [centang, setCentang] = useState(() => ({ keluarga: muatCentang('keluarga'), sekolah: muatCentang('sekolah') }))
  const [catatan, setCatatan] = useState(() => ({ keluarga: muatCatatan('keluarga'), sekolah: muatCatatan('sekolah') }))
  const [letup, setLetup] = useState({ id: null, n: 0 }) // butir yang baru dicentang: percikan + benda muncul di rumah
  const [sorot, setSorot] = useState(null) // butir yang sedang disentuh: cincin di rumah
  const [kilat, setKilat] = useState(null) // kartu yang dituju dari klik benda di rumah
  const [buka, setBuka] = useState(() => new Set()) // "Kenapa?" yang terbuka
  const [isiTitik, setIsiTitik] = useState(null) // grup yang sedang mengisi titik kumpul
  const [tas, setTas] = useState(false)
  const timerKilat = useRef(0)
  useEffect(() => () => clearTimeout(timerKilat.current), [])

  const ubah = (g, ids) => { setCentang((c) => ({ ...c, [g]: ids })); simpanCentang(g, ids) }
  // Menghapus semua centang bisa diurungkan (tanpa dialog konfirmasi yang memperlambat)
  const kosongkan = (g) => {
    const lama = centang[g]
    if (!lama.length) return
    ubah(g, [])
    toast.show(tr(`${lama.length} centang dihapus.`, `${lama.length} checks cleared.`), 'info', { kunci: `checklist-${g}`, aksi: { label: tr('Urungkan', 'Undo'), urungkan: true, jalankan: () => ubah(g, lama) } })
  }
  const toggle = (g, id) => {
    const ada = centang[g].includes(id)
    if (!ada) setLetup((l) => ({ id, n: l.n + 1 }))
    ubah(g, ada ? centang[g].filter((x) => x !== id) : [...centang[g], id])
  }
  /** Aksi yang sudah dikerjakan ikut mencentang butirnya (tidak pernah melepas centang). */
  const tandai = (g, id) => { if (!centang[g].includes(id)) toggle(g, id) }
  const alihKenapa = (id) => setBuka((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  // Klik benda di Rumah Siaga: gulir ke kartunya dan beri kilatan singkat
  const keButir = (id) => {
    const el = document.getElementById(`butir-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: kurangiGerak() ? 'auto' : 'smooth', block: 'center' })
    el.querySelector('input[type=checkbox]')?.focus({ preventScroll: true })
    setKilat(id); clearTimeout(timerKilat.current); timerKilat.current = setTimeout(() => setKilat(null), 1200)
  }

  const unduhKontak = (g, id) => {
    const url = URL.createObjectURL(new Blob([vcardDarurat(b === 'en')], { type: 'text/vcard' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: tr('darurat-112.vcf', 'emergency-112.vcf') })
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    tandai(g, id)
    toast.show(tr('Kartu kontak 112 terunduh. Buka berkasnya di ponsel untuk menyimpannya, lalu tambahkan nomor BPBD dan ketua RT.', 'The 112 contact card is downloaded. Open it on your phone to save it, then add your BPBD and neighborhood head.'), 'sukses', { kunci: 'kontak-112' })
  }
  const bagikan = (g, id) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(pesanTetangga(b === 'en'))}`, '_blank', 'noopener')
    tandai(g, id)
  }
  const simpanTitik = (g, id, nilai) => {
    const t = nilai.trim()
    if (!t) return
    const baru = { ...catatan[g], titik: t }
    setCatatan((c) => ({ ...c, [g]: baru })); simpanCatatan(g, baru)
    setIsiTitik(null); tandai(g, id)
    toast.show(tr(`Titik kumpul disimpan: ${t}. Ikut tercetak bersama checklist.`, `Meeting point saved: ${t}. It prints with the checklist.`), 'sukses', { kunci: `titik-${g}` })
  }

  const tombolAksi = (g, d) => {
    if (d.aksi === 'kontak') return <button type="button" className={AKSI} onClick={() => unduhKontak(g, d.id)}><Contact size={15} aria-hidden="true" />{tr('Simpan kontak 112', 'Save 112 contact')}</button>
    if (d.aksi === 'bagikan') return <button type="button" className={AKSI} onClick={() => bagikan(g, d.id)}><Share2 size={15} aria-hidden="true" />{tr('Ajak lewat WhatsApp', 'Invite on WhatsApp')}</button>
    if (d.aksi === 'tas') return <button type="button" className={`${AKSI} !bg-ember !text-on-ember`} onClick={() => setTas(true)}><Backpack size={15} aria-hidden="true" />{tr('Main: kemas tas', 'Play: pack the bag')}</button>
    if (d.aksi === 'pantau') return <Link to="/peta" className={AKSI}><MapPinned size={15} aria-hidden="true" />{tr('Lihat titik panas di Peta', 'See hotspots on the Map')}</Link>
    if (d.aksi === 'titik') return <button type="button" className={AKSI} aria-expanded={isiTitik === g} onClick={() => setIsiTitik(isiTitik === g ? null : g)}><MapPin size={15} aria-hidden="true" />{catatan[g].titik ? tr('Ubah titik kumpul', 'Change meeting point') : tr('Tulis titik kumpul', 'Write a meeting point')}</button>
    return null
  }

  const kartu = (g, d) => {
    const cek = centang[g].includes(d.id), terbuka = buka.has(d.id)
    return (
      <li key={d.id} id={`butir-${d.id}`} onMouseEnter={() => setSorot(d.id)} onMouseLeave={() => setSorot(null)}
        onFocus={() => setSorot(d.id)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSorot(null) }}
        className={`rounded-2xl border-2 transition-[border-color,background-color,box-shadow,translate] duration-200 ease-snap print:break-inside-avoid
          ${cek ? 'border-canopy bg-canopy/10' : 'border-ink/70 bg-surface hover:-translate-y-0.5 hover:border-ink hover:shadow-[4px_4px_0_0_var(--line-strong)]'}
          ${kilat === d.id ? 'ring-4 ring-ember/60' : ''}`}>
        <label className="flex cursor-pointer items-start gap-4 p-4 pb-3 text-base active:scale-[0.99]">
          <span className="relative mt-0.5 size-6 shrink-0">
            {letup.id === d.id && cek && <Percikan key={letup.n} className="left-1/2 top-1/2" />}
            <input type="checkbox" checked={cek} onChange={() => toggle(g, d.id)} className="peer size-6 cursor-pointer appearance-none rounded-md border-2 border-ink-2 transition-colors duration-200 ease-snap checked:border-canopy checked:bg-canopy" />
            <Check size={16} strokeWidth={3} aria-hidden="true" className="pointer-events-none absolute left-1 top-1 scale-50 text-bg opacity-0 transition-[opacity,transform] duration-200 ease-snap peer-checked:scale-100 peer-checked:opacity-100" />
          </span>
          <span className={`transition-colors duration-200 ${cek ? 'text-ink-2' : ''}`}>{d.teks}</span>
        </label>
        {d.aksi === 'titik' && catatan[g].titik && (
          <p className="m-0 -mt-1 mb-3 ml-14 mr-4 inline-flex items-center gap-1.5 rounded-lg border-2 border-canopy px-2.5 py-1 text-sm font-bold print:border-ink">
            <MapPin size={14} aria-hidden="true" className="text-canopy" />{tr('Titik kumpul', 'Meeting point')}: {catatan[g].titik}
          </p>
        )}
        <div className="no-print flex flex-wrap items-center gap-2 px-4 pb-4 pl-14">
{d.kenapa?.teks && (
          <button type="button" aria-expanded={terbuka} aria-controls={`kenapa-${d.id}`} onClick={() => alihKenapa(d.id)}
            className="inline-flex min-h-9 items-center gap-1 rounded-xl px-2 text-sm font-bold text-ink decoration-ember decoration-2 underline-offset-4 hover:underline">
            {tr('Kenapa?', 'Why?')}<ChevronDown size={16} aria-hidden="true" className={`text-ember-ink transition-transform duration-300 ease-snap ${terbuka ? 'rotate-180' : ''}`} />
          </button>)}
          {tombolAksi(g, d)}
        </div>
        {terbuka && d.kenapa?.teks && (
          <div id={`kenapa-${d.id}`} className="no-print baris-masuk-halus mx-4 mb-4 ml-14 border-l-2 border-ember pl-3.5">
            <p className="m-0 text-sm leading-relaxed text-ink">{d.kenapa.teks}</p>
            {d.artikelRujukan
              ? <Link to={`/edukasi/${d.artikelRujukan}`} className="mt-1.5 inline-block text-xs font-semibold text-ink-2 underline underline-offset-4 hover:text-ember-ink">{tr(`Sumber dan rinciannya: artikel ${tr(...JUDUL_ARTIKEL[d.artikelRujukan])}`, `Sources and details: the ${tr(...JUDUL_ARTIKEL[d.artikelRujukan])} article`)}</Link>
              : <p className="m-0 mt-1.5 text-xs text-ink-2">{tr('Anjuran umum kesiapsiagaan.', 'General preparedness advice.')}</p>}
          </div>
        )}
        {d.aksi === 'titik' && isiTitik === g && (
          <form className="no-print baris-masuk-halus mx-4 mb-4 ml-14 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); simpanTitik(g, d.id, new FormData(e.currentTarget).get('titik') ?? '') }}>
            <label htmlFor={`titik-${g}`} className="sr-only">{tr('Titik kumpul', 'Meeting point')}</label>
            <input id={`titik-${g}`} name="titik" defaultValue={catatan[g].titik ?? ''} autoFocus maxLength={80} required
              placeholder={g === 'sekolah' ? tr('mis. Lapangan upacara', 'e.g. The front field') : tr('mis. Lapangan voli RT 03', 'e.g. The village volleyball court')}
              className="min-h-10 min-w-0 flex-1 rounded-xl border-2 border-line-strong bg-bg px-3 text-sm text-ink outline-none focus:border-ember-ink" />
            <button type="submit" className={`${AKSI} !bg-canopy !text-on-ember`}><Check size={15} aria-hidden="true" />{tr('Simpan', 'Save')}</button>
          </form>
        )}
      </li>
    )
  }

  const panel = (g) => {
    // Butir bawaan + buatan admin yang berstatus terbit (draf disembunyikan)
    const daftar = daftarChecklist(g, b).map((d) => ({ ...d, artikelRujukan: d.kenapa?.artikel ?? null }))
    const selesai = daftar.filter((d) => centang[g].includes(d.id)).length
    const total = daftar.length
    const nama = (id) => daftar.find((d) => d.id === id)?.teks ?? ''
    const perTahap = TAHAP.map((t) => {
      const isi = daftar.filter((d) => d.tahap === t.id)
      return { ...lokal(t, b), id: t.id, isi, beres: isi.filter((d) => centang[g].includes(d.id)).length }
    }).filter((t) => t.isi.length) // tahap tanpa butir terbit tidak ditampilkan
    if (!total) return <p className="m-0 mt-6 rounded-2xl border border-dashed border-line-strong p-8 text-center text-ink-2">{tr('Daftar persiapan sedang diperbarui. Coba lagi nanti.', 'The preparation list is being updated. Please check back later.')}</p>
    return (
      <div>
        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
          {/* Rumah Siaga + kemajuan (menempel di layar lebar) */}
          <aside className="no-print lg:sticky lg:top-[8.5rem]">
            <div className="overflow-hidden rounded-[1.75rem] border-2 border-ink bg-surface shadow-[6px_6px_0_0_var(--line-strong)]">
              <RumahSiaga grup={g} centang={centang[g]} total={total} baru={letup.id} sorot={sorot} nama={nama} onPilih={keButir} />
              <div className="border-t-2 border-ink p-4 sm:p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p key={selesai === total ? 'penuh' : 'sebagian'} className={`m-0 text-lg font-extrabold ${selesai === total ? 'animate-[pop_500ms_var(--ease-snap)] text-canopy' : ''}`} aria-live="polite">{tr(`${selesai} dari ${total} selesai`, `${selesai} of ${total} done`)}</p>
                  <span className="font-mono text-sm tabular-nums text-ink-2" aria-hidden="true">{Math.round((selesai / total) * 100)}%</span>
                </div>
                {/* Batang bersegmen: satu ruas per butir, dikelompokkan per tahap */}
                <div role="progressbar" aria-label={tr('Kemajuan checklist', 'Checklist progress')} aria-valuemin={0} aria-valuemax={total} aria-valuenow={selesai} className="mt-3 flex gap-2">
                  {perTahap.map((t) => (
                    <span key={t.id} className="flex flex-1 gap-1" style={{ flexGrow: t.isi.length }}>
                      {t.isi.map((d) => <span key={d.id} className={`h-2.5 flex-1 rounded-full border border-ink/40 transition-colors duration-300 ${centang[g].includes(d.id) ? 'bg-canopy' : 'bg-bg'}`} />)}
                    </span>
                  ))}
                </div>
                <p className="m-0 mt-3 text-xs text-ink-2">{tr('Ketuk benda di gambar untuk menuju butirnya. Anjuran umum; sesuaikan dengan arahan BPBD dan dinas setempat.', 'Tap something in the picture to jump to its item. General advice; adapt it to your local BPBD and authorities.')}</p>
              </div>
              {/* Aksi lembar: dekat ringkasan kemajuan, bukan di ujung daftar yang panjang */}
              <div className="grid gap-2 border-t-2 border-ink bg-bg/60 p-4 sm:px-5">
                <button type="button" onClick={() => window.print()} className={`${AKSI} min-h-11 w-full justify-center !bg-ember px-4 !text-on-ember`}>
                  <Printer size={16} aria-hidden="true" />{tr('Cetak lembar siaga', 'Print readiness sheet')}
                </button>
                <div className="flex min-h-11 items-center justify-between gap-3">
                <span className="text-xs text-ink-2">{tr('A4, kontak darurat & titik kumpul ikut tercetak', 'A4, with emergency contacts and meeting point')}</span>
                {selesai > 0 && (
                  <button type="button" onClick={() => kosongkan(g)}
                    className="baris-masuk-halus inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline">
                    <RotateCcw size={15} aria-hidden="true" />{tr('Hapus centang', 'Clear checks')}
                  </button>
                )}
                </div>
              </div>
            </div>
            <div role="status">
              {total > 0 && selesai === total && (
                <div data-no-rv className="mt-5 flex items-center gap-4 motion-safe:animate-[tile-masuk_400ms_var(--ease-snap,ease-out)_both]">
                  <MaskotEkspresi ekspresi="merayakan" className="w-24 shrink-0 sm:w-28" />
                  <p className="m-0 max-w-[48ch] text-base font-semibold leading-snug">{tr('Hebat! Semua persiapan sudah kamu selesaikan. Tetap utamakan keselamatan dan peduli terhadap lingkungan, ya!', 'Well done! You have finished every preparation. Keep safety first and keep caring for the environment!')}</p>
                </div>
              )}
            </div>
          </aside>

          <div>
            <ProgresMelekat selesai={selesai} total={total} tr={tr} />
            <ol className="m-0 grid list-none gap-8 p-0">
              {perTahap.map((t, i) => {
                const lengkap = t.beres === t.isi.length
                return (
                  <li key={t.id}>
                    <section aria-labelledby={`tahap-${g}-${t.id}`}>
                      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b-2 border-ink pb-3">
                        <div className="min-w-0">
                          <p className="alis m-0">{tr('Tahap', 'Stage')} {String(i + 1).padStart(2, '0')} · {t.beres}/{t.isi.length}</p>
                          <h3 id={`tahap-${g}-${t.id}`} className="judul-display m-0 mt-1 text-2xl leading-none sm:text-3xl">{t.judul}</h3>
                          <p className="m-0 mt-1.5 text-sm text-ink-2">{t.ket}</p>
                        </div>
                        {lengkap && (
                          <span className="stempel-masuk no-print inline-flex -rotate-6 items-center gap-1.5 rounded-lg border-[3px] border-canopy px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-[0.14em] text-canopy">
                            <Check size={14} strokeWidth={3} aria-hidden="true" />{t.stempel}
                          </span>
                        )}
                      </div>
                      <ul className="m-0 mt-4 grid list-none gap-3 p-0">{t.isi.map((d) => kartu(g, d))}</ul>
                    </section>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

      </div>
    )
  }

  return (
    <>
      <Tabs label={tr('Jenis checklist', 'Checklist type')} value={grup} onChange={setGrup}
        tabs={Object.keys(CHECKLIST).map((g) => ({ id: g, label: tr(...JUDUL[g]), panel: panel(g) }))} />
      <LembarCetak grup={grup} centang={centang[grup]} catatan={catatan[grup]} />
      <KemasTas open={tas} onClose={() => setTas(false)} onSelesai={() => tandai('keluarga', 'k4')} />
    </>
  )
}
