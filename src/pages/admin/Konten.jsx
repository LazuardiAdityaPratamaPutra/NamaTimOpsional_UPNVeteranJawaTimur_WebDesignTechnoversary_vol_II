import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpenText, CircleHelp, Eye, HardDrive, Image as Gambar, ListChecks, PencilLine, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Kepala, chip } from './kit'
import KontenEditor from './KontenEditor'
import KontenEditorLain from './KontenEditorLain'
import { useAdmin, useArtikelSimpan } from '../../components/useAdmin'
import { useAuth } from '../../components/authContext'
import { catat, setTerbit, terbit } from '../../lib/admin'
import { bacaArtikelLengkap, daftarArtikel, hapusArtikel, kembalikanArtikel, pulihkanArtikel, simpanArtikel } from '../../lib/artikel'
import { daftarChecklist, daftarGaleri, daftarKuis, hapusKonten, kembalikanKonten, pulihkanKonten, simpanKonten } from '../../lib/kontenEdukasi'
import { gambarUnggahan, langgananKonten, pakaiPenyimpanan, simpanGambar, tandaKonten } from '../../lib/kontenStore'
import { mulaiPratinjau } from '../../lib/pratinjau'
import { useSorot } from '../../lib/sorot'
import { sampul } from '../../data/sampul'
import { TAHAP } from '../../data/checklist'
import { useJudul } from '../../lib/useJudul'
import { lokal, useBahasa, useTr } from '../../i18n'

const IKON = { artikel: BookOpenText, galeri: Gambar, kuis: CircleHelp, checklist: ListChecks }
const WARNA = { artikel: 'var(--ember)', galeri: 'var(--amber)', kuis: 'var(--canopy)', checklist: 'var(--mint)' }
const JENIS = ['artikel', 'galeri', 'kuis', 'checklist']
const BATAS_SIMPAN = 5 * 1024 * 1024 // perkiraan kuota localStorage peramban umum

export default function Konten() {
  const tr = useTr()
  const b = useBahasa()
  useJudul(tr('Konten edukasi', 'Education content'))
  const { sesi } = useAuth()
  const { konten } = useAdmin()
  useArtikelSimpan() // render ulang saat artikel dibuat, disunting, atau dihapus
  useSyncExternalStore(langgananKonten, tandaKonten) // ... dan saat galeri, kuis, checklist, atau gambar berubah
  const navigate = useNavigate()
  const loc = useLocation()
  const [jenis, setJenis] = useState('semua')
  // null = daftar; { jenis, id } = editor (id null = baru)
  const [mode, setMode] = useState(() => (loc.state?.baru ? { jenis: 'artikel', id: null } : null))
  const [menu, setMenu] = useState(false)
  const [gagal, setGagal] = useState(null)
  const [hapusId, setHapusId] = useState(null)
  const [info, setInfo] = useState(null)
  const timer = useRef(null)
  useSorot()
  useEffect(() => () => clearTimeout(timer.current), [])

  // Tiba dari pencarian: "Tulis artikel baru" membuka editor, butir lain menampilkan daftar penuh lalu disorot
  const [kunciLoc, setKunciLoc] = useState(loc.key)
  if (kunciLoc !== loc.key) {
    setKunciLoc(loc.key)
    if (loc.state?.baru) setMode({ jenis: 'artikel', id: null })
    else if (loc.state?.sorot) { setMode(null); setJenis('semua') }
  }

  const beri = (teks, urungkan) => {
    clearTimeout(timer.current)
    setInfo({ teks, urungkan })
    timer.current = setTimeout(() => setInfo(null), urungkan ? 9000 : 5000)
  }
  const PENUH = tr('Penyimpanan perangkat penuh. Hapus beberapa gambar unggahan atau pakai gambar yang lebih kecil, lalu coba lagi.', 'Device storage is full. Remove some uploaded images or use a smaller image, then try again.')
  const NAMA = { artikel: tr('Artikel', 'Articles'), galeri: tr('Galeri', 'Gallery'), kuis: tr('Kuis', 'Quiz'), checklist: tr('Persiapan', 'Preparation') }
  const SATUAN = { artikel: tr('artikel', 'article'), galeri: tr('lukisan', 'painting'), kuis: tr('soal', 'question'), checklist: tr('butir persiapan', 'preparation item') }

  const baris = [
    ...daftarArtikel(b, { draf: true }).map((a) => ({ id: `artikel-${a.slug}`, kunci: a.slug, jenis: 'artikel', judul: a.judul, kustom: a.kustom, diubah: a.diubah || Boolean(gambarUnggahan(`artikel-${a.slug}`)) && !a.kustom, meta: tr(`${a.menit} menit baca`, `${a.menit} min read`), ket: a.ringkas, foto: sampul(a.slug) })),
    ...daftarGaleri(b, { draf: true }).map((g) => ({ id: `galeri-${g.id}`, kunci: g.id, jenis: 'galeri', judul: g.judul, kustom: g.kustom, diubah: g.diubah, meta: g.kustom ? tr('Unggahan admin', 'Admin upload') : tr('Ilustrasi', 'Illustration'), ket: g.keterangan, foto: { src: g.src, posisi: '50% 50%' } })),
    ...daftarKuis(b, { draf: true }).map((k, i) => ({ id: `kuis-${k.id}`, kunci: k.id, jenis: 'kuis', judul: k.tanya, kustom: k.kustom, diubah: k.diubah, meta: tr(`Soal ${i + 1}`, `Question ${i + 1}`), ket: k.opsi[k.benar] ? `✓ ${k.opsi[k.benar]}` : null, no: i + 1 })),
    ...['keluarga', 'sekolah'].flatMap((grup) => daftarChecklist(grup, b, { draf: true }).map((d) => ({ id: `checklist-${d.id}`, kunci: d.id, jenis: 'checklist', judul: d.teks, kustom: d.kustom, diubah: d.diubah, grup, meta: `${grup === 'keluarga' ? tr('Keluarga', 'Family') : tr('Sekolah', 'School')} · ${lokal(TAHAP.find((t) => t.id === d.tahap) ?? TAHAP[0], b).judul}`, ket: null }))),
  ]
  const tampil = baris.filter((r) => jenis === 'semua' || r.jenis === jenis)
  const jumlahTerbit = baris.filter((r) => terbit(r.id, konten)).length
  const ringkas = JENIS.map((j) => { const s = baris.filter((r) => r.jenis === j); return { j, n: s.length, t: s.filter((r) => terbit(r.id, konten)).length } })
  const pakai = pakaiPenyimpanan()

  const tutupEditor = (kunciSorot) => {
    setMode(null); setGagal(null)
    navigate('/admin/konten', { replace: true, state: kunciSorot ? { sorot: `konten-${kunciSorot}` } : undefined })
  }

  // ---- simpan ----
  const simpanArtikelForm = (form, terbitkan) => {
    const slug = simpanArtikel({ slug: mode.id, id: form.id, en: form.en })
    if (!slug) return
    if (form.sampulBerubah && !simpanGambar(`artikel-${slug}`, form.sampul)) { beri(PENUH); }
    if (!mode.id) setTerbit(`artikel-${slug}`, Boolean(terbitkan))
    const judul = form.id.judul.trim()
    catat(mode.id ? [`Mengubah artikel: ${judul}`, `Edited article: ${judul}`] : [`${terbitkan ? 'Menerbitkan' : 'Membuat draf'} artikel: ${judul}`, `${terbitkan ? 'Published' : 'Drafted'} article: ${judul}`], sesi?.nama)
    setJenis('semua')
    if (!form.sampulBerubah || gambarUnggahan(`artikel-${slug}`) === form.sampul) beri(mode.id ? tr(`Perubahan “${judul}” disimpan.`, `Saved changes to “${judul}”.`) : terbitkan ? tr(`“${judul}” terbit dan tampil di rak perpustakaan.`, `“${judul}” is published and on the library shelf.`) : tr(`“${judul}” disimpan sebagai draf.`, `“${judul}” saved as a draft.`))
    tutupEditor(`artikel-${slug}`)
  }
  const simpanLain = (form, terbitkan) => {
    const h = simpanKonten(mode.jenis, mode.id, form)
    if (h.penuh) { setGagal(PENUH); return }
    if (h.galat) return
    const id = `${mode.jenis}-${h.id}`
    if (!mode.id) setTerbit(id, Boolean(terbitkan))
    const judul = (form.id.judul ?? form.id.tanya ?? form.id.teks).trim().slice(0, 80)
    const s = SATUAN[mode.jenis]
    catat(mode.id ? [`Mengubah ${s}: ${judul}`, `Edited ${s}: ${judul}`] : [`${terbitkan ? 'Menerbitkan' : 'Membuat draf'} ${s}: ${judul}`, `${terbitkan ? 'Published' : 'Drafted'} ${s}: ${judul}`], sesi?.nama)
    setJenis(mode.jenis)
    beri(mode.id ? tr(`Perubahan disimpan: ${judul}`, `Changes saved: ${judul}`) : terbitkan ? tr(`Terbit: ${judul}`, `Published: ${judul}`) : tr(`Disimpan sebagai draf: ${judul}`, `Saved as draft: ${judul}`))
    tutupEditor(id)
  }

  // ---- hapus, pulihkan, terbit ----
  const hapus = (r) => {
    setHapusId(null)
    const wasTerbit = terbit(r.id, konten)
    let urung
    if (r.jenis === 'artikel') {
      const sampulLama = gambarUnggahan(`artikel-${r.kunci}`)
      const data = hapusArtikel(r.kunci)
      if (!data) return
      if (sampulLama) simpanGambar(`artikel-${r.kunci}`, null)
      urung = () => { kembalikanArtikel(data); if (sampulLama) simpanGambar(`artikel-${r.kunci}`, sampulLama) }
    } else {
      const data = hapusKonten(r.jenis, r.kunci)
      if (!data) return
      urung = () => kembalikanKonten(data)
    }
    catat([`Menghapus ${SATUAN[r.jenis]}: ${r.judul}`, `Deleted ${SATUAN[r.jenis]}: ${r.judul}`], sesi?.nama)
    beri(tr(`“${r.judul}” dihapus.`, `“${r.judul}” deleted.`), () => {
      urung(); setTerbit(r.id, wasTerbit)
      catat([`Mengembalikan ${SATUAN[r.jenis]}: ${r.judul}`, `Restored ${SATUAN[r.jenis]}: ${r.judul}`], sesi?.nama)
      beri(tr(`“${r.judul}” dikembalikan.`, `“${r.judul}” restored.`))
    })
  }
  const pulihkan = (r) => {
    let ok
    if (r.jenis === 'artikel') { pulihkanArtikel(r.kunci); ok = simpanGambar(`artikel-${r.kunci}`, null) } else ok = pulihkanKonten(r.jenis, r.kunci)
    if (!ok) return
    catat([`Memulihkan isi asli: ${r.judul}`, `Restored original: ${r.judul}`], sesi?.nama)
    beri(tr(`Isi asli “${r.judul}” dipulihkan.`, `Original of “${r.judul}” restored.`))
  }
  const ubahTerbit = (r) => {
    const nilai = !terbit(r.id, konten)
    setTerbit(r.id, nilai)
    catat([`${nilai ? 'Menerbitkan' : 'Menarik ke draf'}: ${r.judul}`, `${nilai ? 'Published' : 'Moved to draft'}: ${r.judul}`], sesi?.nama)
    beri(nilai ? tr(`“${r.judul}” terbit dan tampil untuk pengunjung.`, `“${r.judul}” is published and visible to visitors.`) : tr(`“${r.judul}” jadi draf dan disembunyikan dari pengunjung.`, `“${r.judul}” is now a draft and hidden from visitors.`))
  }

  if (mode) {
    return mode.jenis === 'artikel'
      ? <KontenEditor key={mode.id ?? 'baru'} awal={mode.id ? bacaArtikelLengkap(mode.id) : null} onSimpan={simpanArtikelForm} onTutup={() => tutupEditor()} />
      : <KontenEditorLain key={`${mode.jenis}-${mode.id ?? 'baru'}`} jenis={mode.jenis} id={mode.id} grupAwal={mode.grup} gagal={gagal} onSimpan={simpanLain} onTutup={() => tutupEditor()} />
  }

  const TAMBAH = [['artikel', tr('Artikel (buku di rak)', 'Article (book on the shelf)')], ['galeri', tr('Lukisan galeri', 'Gallery painting')], ['kuis', tr('Soal kuis', 'Quiz question')], ['checklist', tr('Butir persiapan', 'Preparation item')]]
  return (
    <>
      <Kepala kicker={tr('Edukasi', 'Education')} judul={tr('Konten edukasi', 'Education content')}
        ket={tr('Semua materi di halaman Edukasi: artikel di rak perpustakaan, lukisan galeri, soal kuis, dan butir persiapan. Buat, sunting, hapus, atau jadikan draf; pengunjung di peramban ini langsung melihat hasilnya. Data tersimpan di perangkat ini (demo, tanpa server).', 'Everything on the Learn page: library articles, gallery paintings, quiz questions, and preparation items. Create, edit, delete, or move to draft; visitors in this browser see the result right away. Data stays on this device (demo, no server).')}
        aksi={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => mulaiPratinjau(navigate, '/edukasi')} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold text-ink transition-[scale,border-color] duration-150 ease-snap hover:border-ink-2 active:scale-95"><Eye size={17} aria-hidden="true" />{tr('Lihat sebagai pengunjung', 'View as a visitor')}</button>
            <div className="relative">
              <button type="button" aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu(!menu)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ember-ink px-5 text-sm font-semibold text-on-ember transition-[scale,filter] duration-150 ease-snap hover:brightness-110 active:scale-95"><Plus size={17} aria-hidden="true" />{tr('Tambah konten', 'Add content')}</button>
              {menu && (
                <ul className="absolute right-0 top-full z-30 m-0 mt-2 w-64 list-none rounded-xl border border-line-strong bg-surface p-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.5)]" onKeyDown={(e) => { if (e.key === 'Escape') setMenu(false) }}>
                  {TAMBAH.map(([j, nama], i) => { const Ikon = IKON[j]; return (
                    <li key={j}><button type="button" autoFocus={i === 0} onClick={() => { setMenu(false); setGagal(null); setMode({ jenis: j, id: null, grup: 'keluarga' }) }} className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-line/50"><Ikon size={16} aria-hidden="true" style={{ color: WARNA[j] }} />{nama}</button></li>
                  ) })}
                </ul>
              )}
            </div>
          </div>
        } />
      <p role="status" className={info ? 'm-0 mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm text-ink' : 'sr-only'}>
        {info && <><span>{info.teks}</span>{info.urungkan && <button type="button" onClick={info.urungkan} className="inline-flex min-h-9 items-center gap-1.5 font-semibold text-ember-ink underline-offset-4 hover:underline"><RotateCcw size={14} aria-hidden="true" />{tr('Urungkan', 'Undo')}</button>}</>}
      </p>

      <ul className="m-0 grid list-none grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface p-0 sm:grid-cols-3 lg:grid-cols-5">
        <li className="col-span-2 flex items-center gap-4 border-b border-line p-4 sm:col-span-3 sm:p-5 lg:col-span-1 lg:border-b-0 lg:border-r">
          <span className="judul-display text-5xl leading-none tabular-nums sm:text-6xl">{jumlahTerbit}<span className="text-2xl text-ink-2">/{baris.length}</span></span>
          <span className="text-sm leading-snug text-ink-2">{tr('materi tampil untuk pengunjung', 'items visible to visitors')}</span>
        </li>
        {ringkas.map(({ j, n, t }, i) => {
          const Ikon = IKON[j]
          return (
            <li key={j} className={`border-line p-4 sm:p-5 ${i < 3 ? 'lg:border-r' : ''} ${i % 2 === 0 ? 'max-sm:border-r' : ''} ${i < 2 ? 'max-sm:border-b' : ''} ${i % 3 !== 2 ? 'sm:max-lg:border-r' : ''} ${i < 3 ? 'sm:max-lg:border-b' : ''}`}>
              <p className="m-0 flex items-center gap-2 text-sm text-ink-2"><Ikon size={15} aria-hidden="true" style={{ color: WARNA[j] }} />{NAMA[j]}</p>
              <p className="m-0 mt-1.5 font-display text-3xl font-extrabold leading-none tabular-nums [font-stretch:76%]">{t}<span className="text-lg text-ink-2">/{n}</span></p>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line/60" aria-hidden="true"><span className="block h-full rounded-full transition-[width] duration-500 ease-snap" style={{ width: `${(t / Math.max(n, 1)) * 100}%`, background: WARNA[j] }} /></span>
            </li>
          )
        })}
      </ul>
      <p className="m-0 mt-3 flex items-center gap-2 text-xs text-ink-2"><HardDrive size={14} aria-hidden="true" />{tr(`Penyimpanan perangkat terpakai sekitar ${Math.round(pakai / 1024)} KB dari ±${BATAS_SIMPAN / 1024 / 1024} MB (gambar unggahan paling banyak memakan tempat).`, `About ${Math.round(pakai / 1024)} KB of ~${BATAS_SIMPAN / 1024 / 1024} MB device storage used (uploaded images take the most).`)}
        <span aria-hidden="true" className="h-1.5 w-24 overflow-hidden rounded-full bg-line/60"><span className={`block h-full rounded-full ${pakai / BATAS_SIMPAN > 0.8 ? 'bg-flame' : 'bg-ink-2'}`} style={{ width: `${Math.min(100, (pakai / BATAS_SIMPAN) * 100)}%` }} /></span></p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={tr('Saring jenis konten', 'Filter content type')}>
        {['semua', ...JENIS].map((j) => <button key={j} type="button" aria-pressed={jenis === j} onClick={() => setJenis(j)} className={chip(jenis === j)}>{j === 'semua' ? tr('Semua', 'All') : NAMA[j]}<span className="ml-1.5 font-mono text-xs">{j === 'semua' ? baris.length : baris.filter((r) => r.jenis === j).length}</span></button>)}
      </div>

      <ul className="m-0 mt-4 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {tampil.map((r) => {
          const Ikon = IKON[r.jenis]
          const on = terbit(r.id, konten)
          return (
            <li key={r.id} id={`konten-${r.id}`} tabIndex={-1} className={`group flex flex-col overflow-hidden rounded-2xl border bg-surface transition-[border-color,translate] duration-200 ease-snap hover:-translate-y-0.5 ${on ? 'border-line hover:border-ink-2' : 'border-dashed border-ink-2/60'}`}>
              {r.foto ? (
                <div className="relative h-28 overflow-hidden">
                  <img src={r.foto.src} alt="" aria-hidden="true" loading="lazy" decoding="async" className={`size-full object-cover transition-[scale,filter] duration-500 ease-snap group-hover:scale-105 ${on ? '' : 'grayscale'}`} style={{ objectPosition: r.foto.posisi }} />
                  <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-surface/70 to-transparent" />
                </div>
              ) : (
                <div aria-hidden="true" className={`relative flex h-28 items-center justify-center overflow-hidden ${on ? '' : 'grayscale'}`} style={{ background: `color-mix(in srgb, ${WARNA[r.jenis]} 14%, var(--surface))` }}>
                  {r.no ? <span className="font-display text-7xl font-extrabold leading-none [font-stretch:76%]" style={{ color: WARNA[r.jenis] }}>{String(r.no).padStart(2, '0')}</span> : <Ikon size={44} style={{ color: WARNA[r.jenis] }} />}
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <p className="m-0 flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-2"><Ikon size={13} aria-hidden="true" style={{ color: WARNA[r.jenis] }} />{NAMA[r.jenis]} · {r.meta}{(r.kustom || r.diubah) && <> · <span className="text-ember-ink">{r.kustom ? tr('Buatan admin', 'Admin-made') : tr('Disunting', 'Edited')}</span></>}</p>
                <h2 className="m-0 mt-2 !font-sans !text-base !font-semibold !leading-snug !tracking-normal ![font-stretch:100%] line-clamp-3">{r.judul}</h2>
                {r.ket && <p className="m-0 mt-1.5 line-clamp-2 text-sm text-ink-2">{r.ket}</p>}
                {hapusId === r.id ? (
                  <div role="alert" className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-flame p-2.5 text-sm">
                    <span className="mr-auto font-medium">{tr(`Hapus ${SATUAN[r.jenis]} ini?`, `Delete this ${SATUAN[r.jenis]}?`)}</span>
                    <button type="button" autoFocus onClick={() => setHapusId(null)} className="min-h-9 rounded-lg border border-line-strong px-3 font-semibold text-ink hover:border-ink-2">{tr('Batal', 'Cancel')}</button>
                    <button type="button" onClick={() => hapus(r)} className="min-h-9 rounded-lg bg-flame px-3 font-semibold text-on-ember hover:brightness-110">{tr('Ya, hapus', 'Yes, delete')}</button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="button" onClick={() => { setGagal(null); setMode({ jenis: r.jenis, id: r.kunci, grup: r.grup }) }} aria-label={`${tr('Sunting', 'Edit')}: ${r.judul}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-ink-2 transition-[color,border-color,scale] duration-150 ease-snap hover:border-ink-2 hover:text-ink active:scale-95"><PencilLine size={14} aria-hidden="true" />{tr('Sunting', 'Edit')}</button>
                    {r.kustom && <button type="button" onClick={() => setHapusId(r.id)} aria-label={`${tr('Hapus', 'Delete')}: ${r.judul}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-ink-2 transition-[color,border-color,scale] duration-150 ease-snap hover:border-flame hover:text-flame active:scale-95"><Trash2 size={14} aria-hidden="true" />{tr('Hapus', 'Delete')}</button>}
                    {r.diubah && <button type="button" onClick={() => pulihkan(r)} aria-label={`${tr('Pulihkan isi asli', 'Restore original')}: ${r.judul}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold text-ink-2 transition-[color,border-color,scale] duration-150 ease-snap hover:border-ink-2 hover:text-ink active:scale-95"><RotateCcw size={14} aria-hidden="true" />{tr('Pulihkan asli', 'Restore')}</button>}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${on ? 'text-canopy' : 'text-ink-2'}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${on ? 'bg-canopy' : 'bg-ink-2'}`} />{on ? tr('Terbit · tampil untuk pengunjung', 'Published · visible') : tr('Draf · disembunyikan', 'Draft · hidden')}</span>
                  <button type="button" role="switch" aria-checked={on} aria-label={`${tr('Terbit', 'Published')}: ${r.judul}`} onClick={() => ubahTerbit(r)}
                    className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors duration-200 ease-snap ${on ? 'border-canopy bg-canopy' : 'border-line bg-line/60'}`}>
                    <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-ink shadow transition-[translate] duration-200 ease-snap ${on ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}
