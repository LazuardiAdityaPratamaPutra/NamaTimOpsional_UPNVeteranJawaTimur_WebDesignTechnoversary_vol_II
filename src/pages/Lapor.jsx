import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Download, Flame, LoaderCircle, LocateFixed, MapPin, Phone, Plus, RefreshCw, Send, Trash2, X } from 'lucide-react'
import { Button, Container, Field, Pill, useToast } from '../components/ui'
import Parallax from '../components/Parallax'
import KonfirmasiLaporan from '../components/KonfirmasiLaporan'
import { useSinkron } from '../components/syncContext'
import { hapusLaporan, tambahLaporan, TINGKAT } from '../lib/db'
import AjakMasuk from '../components/AjakMasuk'
import { useAuth } from '../components/authContext'
import { kompresFoto } from '../lib/foto'
import { usePasang } from '../lib/usePasang'
import { useLokasi } from '../lib/useLokasi'
import { useJudul } from '../lib/useJudul'
import { POLA, sentuhan } from '../lib/sentuhan'
import { useBahasa, useTr } from '../i18n'

const KEPARAHAN = {
  ringan: [['Ringan', 'Light'], ['Asap tipis atau bara kecil', 'Thin smoke or small embers']],
  sedang: [['Sedang', 'Moderate'], ['Api terlihat, masih terbatas', 'Fire visible, still limited']],
  berat: [['Berat', 'Severe'], ['Api besar atau menyebar cepat', 'Large fire or spreading fast']],
}
const NAMA_STATUS = { pending: 'pending', synced: 'synced', failed: 'gagal' }

const UKURAN_KUNCI = { ringan: 20, sedang: 28, berat: 38 }
const WARNA = { ringan: 'var(--canopy)', sedang: 'var(--amber)', berat: 'var(--flame)' }
const SARAN = [['Angin kencang', 'Strong wind'], ['Asap tebal', 'Thick smoke'], ['Lahan gambut', 'Peatland'], ['Dekat permukiman', 'Near settlements'], ['Akses sulit', 'Hard to access']]
const pecah = (c) => c.split(/;\s*/).filter(Boolean)

// Kepala panel: nomor mono + garis + judul; tanda centang hijau muncul saat panel selesai.
function Kepala({ id, no, selesai, aksen, children }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="font-mono text-xs tracking-[0.2em] text-ember-ink">{no}</span>
      <span aria-hidden="true" className="h-px w-8 bg-ink-2/50" />
      <h2 id={id} className="m-0 text-xl leading-none sm:text-2xl">{children}</h2>
      {aksen}
      <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-canopy text-bg transition-[scale,opacity] duration-300 ease-snap ${aksen ? '' : 'ml-auto'} ${selesai ? 'scale-100 opacity-100 motion-safe:animate-[pop_.45s_var(--ease-snap)]' : 'scale-50 opacity-0'}`}><Check size={15} strokeWidth={3} /></span>
    </div>
  )
}

// Penanda lokasi: satu titik bercahaya di silang garis rambut. Garis bergeser tipis mengikuti kursor; titik meredup saat mencari, kosong bila GPS gagal.
function PadLokasi({ status, akurasi }) {
  const gerak = (e) => {
    const k = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--px', ((e.clientX - k.left) / k.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--py', ((e.clientY - k.top) / k.height - 0.5).toFixed(3))
  }
  const reda = (e) => { e.currentTarget.style.setProperty('--px', 0); e.currentTarget.style.setProperty('--py', 0) }
  const ok = status === 'ok'
  return (
    <div aria-hidden="true" onPointerMove={gerak} onPointerLeave={reda} className="relative mx-auto aspect-[4/3] w-full">
      <span className="absolute inset-x-0 top-1/2 h-px bg-ink-2/30 transition-[translate] duration-200 ease-out" style={{ translate: '0 calc(var(--py, 0) * -14px)' }} />
      <span className="absolute inset-y-0 left-1/2 w-px bg-ink-2/30 transition-[translate] duration-200 ease-out" style={{ translate: 'calc(var(--px, 0) * -14px) 0' }} />
      {status === 'mencari' && <span className="sapu absolute left-1/2 top-1/2 -ml-12 -mt-12 size-24 rounded-full opacity-70 [background:conic-gradient(from_0deg,transparent_0deg,transparent_250deg,color-mix(in_srgb,var(--ember)_60%,transparent)_360deg)]" />}
      {ok && [0, 1].map((i) => <span key={i} className="titik-api-cincin absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 size-5 rounded-full border border-ember" style={{ animationDelay: `${i * 1.2}s` }} />)}
      <span className="absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember blur-3xl transition-opacity duration-500" style={{ opacity: ok ? 0.4 : 0.12 }} />
      <span className={`absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-[background-color,box-shadow] duration-500 ${ok ? 'bg-ember shadow-[0_0_26px_6px_color-mix(in_srgb,var(--ember)_65%,transparent)]' : 'bg-ink-2/60'} ${status === 'mencari' ? 'motion-safe:animate-[napas_1.2s_ease-in-out_infinite]' : ''}`} />
      <span className="absolute inset-x-0 bottom-0 text-center font-mono text-[11px] uppercase tracking-widest text-ink-2">{ok ? `±${Math.round(akurasi)} m` : status === 'mencari' ? '···' : '—'}</span>
    </div>
  )
}

const PANDUAN = {
  ringan: ['Tetap lapor. Api kecil jauh lebih mudah dipadamkan bila diketahui lebih awal.', 'Still report it. A small fire is far easier to put out when it is found early.'],
  sedang: ['Api sudah terlihat. Jaga jarak aman dan jangan mencoba memadamkannya sendiri.', 'The fire is visible. Keep a safe distance and do not try to put it out yourself.'],
}

// Pulau pratinjau: pil melayang di bawah bilah navigasi. Mengambang saat halaman digulir, melebar saat disorot atau diketuk,
// dan warnanya mengikuti tingkat keparahan. Isinya laporan yang "tercetak" langsung saat diisi.
function Pulau({ tr, lat, lon, lokasiOk, tingkat, catatan, fotoUrl, siap }) {
  const [buka, setBuka] = useState(false)
  const warna = tingkat ? WARNA[tingkat] : 'var(--text-2)'
  const syarat = [[tr('Lokasi', 'Location'), lokasiOk], [tr('Keparahan', 'Severity'), !!tingkat], [tr('Detail', 'Details'), !!(catatan || fotoUrl)]]
  return (
    <div className="sticky top-[4.6rem] z-30 h-0">
      <div role="group" aria-label={tr('Pratinjau laporan', 'Report preview')} onMouseEnter={() => setBuka(true)} onMouseLeave={() => setBuka(false)}
        style={{ '--lebar': buka ? '26rem' : '20rem', boxShadow: `0 1px 0 0 color-mix(in oklab, var(--text) 14%, transparent) inset, 0 18px 50px -14px color-mix(in srgb, ${warna} ${tingkat ? 60 : 0}%, transparent), 0 14px 36px -12px rgb(0 0 0 / 0.55)` }}
        className="hero-malam relative mx-auto w-[min(var(--lebar),calc(100vw-2rem))] overflow-hidden rounded-[1.9rem] border border-line transition-[width,box-shadow] duration-500 ease-snap">
        <button type="button" aria-expanded={buka} onClick={() => setBuka((v) => !v)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
          <span aria-hidden="true" className={`size-3 shrink-0 rounded-full transition-colors duration-300 ${siap ? 'motion-safe:animate-[napas_1.6s_ease-in-out_infinite]' : ''}`} style={{ background: warna, boxShadow: tingkat ? `0 0 14px ${warna}` : 'none' }} />
          <span key={tingkat || 'x'} data-no-rv className="judul-display text-xl leading-none transition-colors duration-300 motion-safe:animate-[pop_.4s_var(--ease-snap)]" style={{ color: warna }}>{tingkat ? tr(...KEPARAHAN[tingkat][0]) : tr('Pilih tingkat', 'Pick a level')}</span>
          <span className="hidden min-w-0 flex-1 truncate font-mono text-[11px] text-ink-2 sm:block">{lat != null && lon != null ? `${lat.toFixed(3)}, ${lon.toFixed(3)}` : tr('Menunggu lokasi…', 'Waiting for location…')}</span>
          <span className="ml-auto flex shrink-0 items-center gap-1" aria-hidden="true">{syarat.map(([t, ok]) => <span key={t} className={`h-1.5 w-5 rounded-full transition-colors duration-300 ${ok ? 'bg-canopy' : 'bg-line'}`} />)}</span>
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest" style={{ color: siap ? 'var(--canopy)' : 'var(--text-2)' }}>{siap ? tr('Siap', 'Ready') : tr('Draf', 'Draft')}</span>
          <span className="sr-only">{syarat.map(([t, ok]) => `${t}: ${ok ? tr('terisi', 'done') : tr('belum', 'not yet')}`).join(', ')}</span>
        </button>
        <div className={`grid transition-[grid-template-rows] duration-500 ease-snap ${buka ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <div className="min-h-0 overflow-hidden" inert={buka ? undefined : ''}>
            <div className="border-t border-line px-4 pb-4 pt-3">
              <p className="m-0 flex items-center gap-2 font-mono text-xs text-ink"><MapPin size={13} aria-hidden="true" className="shrink-0 text-ember-ink" />{lat != null && lon != null ? `${lat.toFixed(5)}, ${lon.toFixed(5)}` : <span className="text-ink-2">{tr('Menunggu lokasi…', 'Waiting for location…')}</span>}</p>
              <div className="mt-3 flex gap-3">
                <p className={`m-0 line-clamp-3 min-h-12 flex-1 break-words text-sm leading-relaxed ${catatan ? 'text-ink' : 'text-ink-2'}`}>{catatan || tr('Catatan tampil di sini saat kamu menulisnya.', 'Your notes appear here as you write them.')}</p>
                {fotoUrl && <img src={fotoUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />}
              </div>
              <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1 p-0" aria-hidden="true">
                {syarat.map(([t, ok]) => (
                  <li key={t} className={`flex items-center gap-1.5 text-xs transition-colors duration-300 ${ok ? 'font-semibold text-canopy' : 'text-ink-2'}`}>
                    <span className={`flex size-4 items-center justify-center rounded-full border ${ok ? 'border-canopy bg-canopy text-bg' : 'border-line'}`}>{ok && <Check size={11} strokeWidth={3} />}</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Lapor() {
  useEffect(() => { document.documentElement.dataset.halaman = 'lapor'; return () => { delete document.documentElement.dataset.halaman } }, []) // tema gelap halaman ini hitam polos (index.css)
  const b = useBahasa()
  const tr = useTr()
  useJudul(tr('Lapor lapangan', 'Field report'))
  const toast = useToast()
  const { sesi } = useAuth()
  const { online, laporan, antrean, sedang, sinkronkan } = useSinkron()
  const pasang = usePasang()
  const waktu = (ms) => new Date(ms).toLocaleString(b === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })

  const gps = useLokasi({ onPerbarui: (p, ulang) => { if (ulang) toast.show(tr(`Lokasi diperbarui · ±${Math.round(p.accuracy)} m`, `Location updated · ±${Math.round(p.accuracy)} m`), 'sukses') } })
  const [manual, setManual] = useState({ lat: '', lon: '' })
  const [tingkat, setTingkat] = useState('')
  const [catatan, setCatatan] = useState('')
  const [foto, setFoto] = useState(null)
  const [fotoUrl, setFotoUrl] = useState(null)
  const [galat, setGalat] = useState({}) // hanya penanda (true); teks dipilih saat render agar mengikuti bahasa
  const [menyimpan, setMenyimpan] = useState(false)
  const [seret, setSeret] = useState(false)
  const [hapusId, setHapusId] = useState(null) // baris yang sedang menunggu konfirmasi hapus
  const [keluar, setKeluar] = useState(null) // baris yang sedang meluncur keluar sebelum dihapus
  const [terkirim, setTerkirim] = useState(false)
  const [ultimaId, setUltimaId] = useState(null) // laporan yang baru dibuat di halaman ini; statusnya dibaca dari catatan sebenarnya
  const urlRef = useRef(null)

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

  const pilihFoto = async (berkas) => {
    if (!berkas || !berkas.type?.startsWith('image/')) return
    try {
      const blob = await kompresFoto(berkas)
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = URL.createObjectURL(blob)
      setFoto(blob); setFotoUrl(urlRef.current)
    } catch { toast.show(tr('Foto tidak dapat diproses. Coba foto lain.', 'The photo could not be processed. Try another photo.'), 'galat') }
  }

  const punyaGps = gps.lat != null && gps.status !== 'gagal'
  const simpan = async (e) => {
    e.preventDefault()
    const lat = punyaGps ? gps.lat : Number(manual.lat)
    const lon = punyaGps ? gps.lon : Number(manual.lon)
    const g = {}
    if (!punyaGps && (manual.lat === '' || manual.lon === '' || Number.isNaN(lat) || Number.isNaN(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180)) g.lokasi = true
    if (!TINGKAT.includes(tingkat)) g.tingkat = true
    setGalat(g)
    if (Object.keys(g).length) {
      const tujuan = g.lokasi ? (document.querySelector('#lokasi-manual input') ?? document.getElementById('lokasi-cari')) : document.querySelector('input[name=tingkat]')
      requestAnimationFrame(() => tujuan?.focus())
      return
    }
    setMenyimpan(true)
    try {
      const baru = await tambahLaporan({ lat, lon, accuracy: punyaGps ? gps.accuracy : null, severity: tingkat, note: catatan, photo: foto, pemilik: sesi?.email ?? null })
      toast.show(online ? tr('Tersimpan. Menyinkronkan…', 'Saved. Syncing…') : tr('Tersimpan di perangkat. Akan dikirim saat kembali online.', 'Saved on this device. It will be sent when you are back online.'), 'sukses', { kunci: 'sinkron' })
      setUltimaId(baru.id)
      sentuhan(POLA.sukses)
      setTingkat(''); setCatatan(''); setFoto(null); setFotoUrl(null)
      setTerkirim(true); setTimeout(() => setTerkirim(false), 1800)
      if (online) sinkronkan()
    } catch { toast.show(tr('Gagal menyimpan laporan di perangkat.', 'Failed to save the report on this device.'), 'galat') }
    finally { setMenyimpan(false) }
  }

  const lokasiOk = punyaGps || (manual.lat !== '' && manual.lon !== '' && !Number.isNaN(Number(manual.lat)) && !Number.isNaN(Number(manual.lon)))
  const tingkatOk = TINGKAT.includes(tingkat)
  const siap = lokasiOk && tingkatOk
  const labelSimpan = online ? tr('Simpan & kirim laporan', 'Save & send report') : tr('Simpan di perangkat', 'Save on this device')
  const ringkas = siap ? [tr(...KEPARAHAN[tingkat][0]), punyaGps && Number.isFinite(gps.accuracy) ? `±${Math.round(gps.accuracy)} m` : tr('koordinat manual', 'manual coordinates'), foto ? tr('dengan foto', 'with photo') : null].filter(Boolean).join(' · ') : ''
  const latV = punyaGps ? gps.lat : manual.lat !== '' && !Number.isNaN(Number(manual.lat)) ? Number(manual.lat) : null
  const lonV = punyaGps ? gps.lon : manual.lon !== '' && !Number.isNaN(Number(manual.lon)) ? Number(manual.lon) : null
  const lebarAkurasi = punyaGps ? Math.max(8, Math.min(100, 100 - gps.accuracy / 2)) : 0
  const alihSaran = (t) => setCatatan((c) => {
    const daftar = pecah(c)
    return (daftar.includes(t) ? daftar.filter((x) => x !== t) : [...daftar, t]).join('; ').slice(0, 500)
  })
  const hapus = async (id) => {
    try { setHapusId(null); setKeluar(id); await new Promise((r) => setTimeout(r, 320)); await hapusLaporan(id); setKeluar(null); toast.show(tr('Laporan dihapus dari perangkat.', 'Report removed from this device.'), 'sukses') }
    catch { setKeluar(null); toast.show(tr('Gagal menghapus laporan.', 'Failed to remove the report.'), 'galat') }
  }
  const hapusFoto = () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); urlRef.current = null; setFoto(null); setFotoUrl(null) }
  const hitung = { synced: 0, pending: 0, failed: 0 }
  for (const r of laporan ?? []) hitung[r.status] = (hitung[r.status] ?? 0) + 1
  const lensa = (e) => {
    const k = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--lx', `${e.clientX - k.left}px`)
    e.currentTarget.style.setProperty('--ly', `${e.clientY - k.top}px`)
  }
  const akurasi = punyaGps ? (gps.accuracy <= 30 ? tr('Sangat akurat', 'Very accurate') : gps.accuracy <= 100 ? tr('Cukup akurat', 'Fairly accurate') : tr('Kurang akurat', 'Low accuracy')) : ''

  const bayang = 'shadow-[0_1px_0_0_color-mix(in_oklab,var(--text)_10%,transparent)_inset,0_2px_4px_-1px_rgb(0_0_0/0.18),0_28px_60px_-28px_rgb(0_0_0/0.45)]'

  return (
    <>
      <header onPointerMove={lensa} className="hero-malam group/hero relative isolate overflow-hidden rounded-b-[2.5rem]">
        <Parallax kecepatan={0.3} bleed={0.2} className="-z-10"><img src="/foto/lapor-hutan.webp" alt="" className="size-full object-cover [object-position:50%_52%] opacity-90" /></Parallax>
        <div className="absolute inset-0 -z-10 bg-bg/30 transition-colors duration-500 [[data-theme=dark]_&]:bg-bg/60" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/55 to-bg/10" aria-hidden="true" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 motion-reduce:hidden pointer-fine:group-hover/hero:opacity-100 [mask-image:radial-gradient(circle_190px_at_var(--lx,50%)_var(--ly,50%),#000_0%,transparent_100%)]">
          <img src="/foto/lapor-hutan.webp" alt="" className="size-full object-cover [object-position:50%_52%] mix-blend-screen [filter:sepia(1)_saturate(4.5)_hue-rotate(-28deg)_brightness(1.3)]" />
        </div>
        <Container className="grid items-end gap-8 pb-14 pt-28 md:pb-16 md:pt-32 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14">
          <div>
            <p className="m-0 font-mono text-xs uppercase tracking-[0.2em] text-ember-ink">{tr('Petugas lapangan', 'Field officers')}</p>
            <h1 className="mt-4 max-w-[10ch] text-[clamp(3.5rem,9vw,7.5rem)] leading-[1.02] [text-wrap:balance]">{tr('Lapor titik api', 'Report a fire point')}</h1>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-ink">{tr('Tiga langkah, kurang dari satu menit. Laporan disimpan di perangkat dan dikirim otomatis saat sinyal kembali.', 'Three steps, under a minute. Reports are saved on your device and sent automatically when the signal returns.')}</p>
            {/* Status perangkat: satu kapsul kaca berisi tiga indikator berbentuk beda (bar sinyal, slot antrean, dial GPS) */}
            <div role="group" aria-label={tr('Status perangkat', 'Device status')} className="mt-7 inline-flex max-w-full flex-wrap items-center gap-x-5 gap-y-3 rounded-[1.75rem] border border-ink-2/30 bg-bg/45 px-5 py-3 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.7)] backdrop-blur-md">
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <span aria-hidden="true" className="flex h-5 items-end gap-[3px]">{[7, 11, 15, 20].map((t, i) => <span key={t} style={{ height: t, transitionDelay: `${i * 70}ms` }} className={`w-[4px] rounded-full transition-[background-color,translate] duration-500 ease-snap ${online ? 'bg-canopy' : 'translate-y-0 bg-ink-2/40'}`} />)}</span>
                {online ? 'Online' : 'Offline'}
              </span>
              <a href="#antrean-lapor" className="group/q flex min-h-9 items-center gap-2.5 text-sm text-ink-2 transition-colors duration-200 hover:text-ink">
                <span aria-hidden="true" className="flex gap-[3px]">{[0, 1, 2, 3, 4].map((n) => <span key={n} style={{ transitionDelay: `${n * 60}ms` }} className={`size-[7px] rounded-[2px] transition-[background-color,scale] duration-500 ease-snap group-hover/q:scale-125 ${n < antrean ? 'bg-ember' : 'bg-ink-2/35'}`} />)}</span>
                <span aria-live="polite"><b className="font-bold text-ink">{antrean}</b> {tr('menunggu', 'pending')}</span>
              </a>
              <span className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                <span aria-hidden="true" className="relative flex size-5 items-center justify-center rounded-full border-2 transition-colors duration-500" style={{ borderColor: punyaGps && gps.status === 'ok' ? 'var(--canopy)' : gps.status === 'mencari' ? 'var(--ember)' : 'color-mix(in srgb, var(--text-2) 50%, transparent)' }}>
                  <span className={`size-1.5 rounded-full ${punyaGps && gps.status === 'ok' ? 'bg-canopy' : gps.status === 'mencari' ? 'bg-ember motion-safe:animate-[napas_1.4s_ease-in-out_infinite]' : 'bg-ink-2/60'}`} />
                </span>
                GPS {punyaGps && gps.status === 'ok' ? tr('terkunci', 'locked') : gps.status === 'mencari' ? tr('mencari…', 'searching…') : tr('manual', 'manual')}
              </span>
            </div>
          </div>
          <a href="tel:112" className="group flex items-center gap-4 rounded-3xl bg-ember p-5 text-on-ember shadow-[0_20px_50px_-18px_color-mix(in_srgb,var(--ember)_70%,transparent)] transition-[translate,filter] duration-300 ease-snap hover:-translate-y-1 hover:brightness-110 sm:p-6">
            <span className="relative flex size-12 shrink-0 items-center justify-center rounded-full border border-current"><span aria-hidden="true" className="absolute inset-0 rounded-full border border-current motion-safe:animate-[denyut_2.2s_ease-out_infinite]" /><Phone size={22} aria-hidden="true" className="transition-[rotate] duration-300 ease-snap group-hover:-rotate-[18deg]" /></span>
            <span className="flex-1">
              <span className="block text-sm font-semibold">{tr('Bahaya langsung?', 'Immediate danger?')}</span>
              <span className="judul-display block text-4xl leading-none sm:text-5xl">{tr('Telepon 112', 'Call 112')}</span>
            </span>
          </a>
        </Container>
      </header>

      <Container className="py-12 md:py-16">
        <AjakMasuk className="mb-6" manfaat={{ belum: tr('Laporan tamu tetap terkirim, tetapi tidak tercatat di riwayatmu. Masuk agar laporan muncul di “Laporan saya”.', 'Guest reports are still sent, but are not kept in your history. Sign in to see them under “My reports”.'), sudah: tr('Laporanmu tercatat di “Laporan saya”.', 'Your reports are recorded under “My reports”.') }} />
        {!pasang.terpasang && (pasang.bisaPasang || pasang.ios) && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-5 py-4">
            <p className="m-0 text-sm">
              {pasang.bisaPasang
                ? tr('Pasang PyraOps di layar utama agar terbuka seperti aplikasi, juga saat offline.', 'Install PyraOps on your home screen so it opens like an app, even offline.')
                : tr('Di iPhone: ketuk Bagikan, lalu "Tambahkan ke Layar Utama".', 'On iPhone: tap Share, then "Add to Home Screen".')}
            </p>
            {pasang.bisaPasang && <Button size="sm" onClick={pasang.pasang}><Download size={14} aria-hidden="true" /> {tr('Pasang aplikasi', 'Install app')}</Button>}
          </div>
        )}

        <Pulau tr={tr} lat={latV} lon={lonV} lokasiOk={lokasiOk} tingkat={tingkat} catatan={catatan} fotoUrl={fotoUrl} siap={siap} />
        <div className="h-16" aria-hidden="true" />
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0">
            <form onSubmit={simpan} noValidate aria-label={tr('Laporan baru', 'New report')} className="space-y-3">
            {/* 01 Konsol radar: gelap, bercahaya, angka koordinat besar */}
            <section data-spot aria-labelledby="lg-01" className={`hero-malam relative isolate overflow-hidden rounded-3xl border border-line p-4 sm:p-5 ${bayang}`}>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_90%_at_88%_45%,color-mix(in_srgb,var(--ember)_34%,transparent),transparent_70%),radial-gradient(55%_70%_at_0%_100%,color-mix(in_srgb,var(--canopy)_26%,transparent),transparent_70%)]" />
              <Kepala id="lg-01" no="01" selesai={lokasiOk} aksen={<span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-ember-ink">{tr('Wajib', 'Required')}</span>}>{tr('Lokasi', 'Location')}</Kepala>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
                <div className="min-w-0" aria-live="polite">
                  <p className="m-0 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2">{tr('Koordinat', 'Coordinates')}</p>
                  <div key={gps.status === 'gagal' ? 'gagal' : punyaGps ? 'ada' : 'cari'} className="min-h-[5.25rem] motion-safe:[animation:tab-ganti_.4s_var(--ease-snap)]">
                    {!punyaGps && gps.status === 'mencari' && <p className="m-0 mt-2 flex items-center gap-2 text-lg"><LoaderCircle size={18} aria-hidden="true" className="shrink-0 animate-spin text-ember-ink" />{tr('Mencari lokasi GPS…', 'Finding your GPS location…')}</p>}
                    {punyaGps && (
                      <>
                        <p className={`m-0 mt-1.5 font-mono text-xl font-semibold leading-tight tabular-nums transition-opacity duration-300 sm:text-2xl ${gps.status === 'mencari' ? 'opacity-50' : ''}`}><span className="whitespace-nowrap">{gps.lat.toFixed(5)},</span> <span className="whitespace-nowrap text-ember-ink">{gps.lon.toFixed(5)}</span></p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-ink-2">
                          <span className="h-2 w-28 shrink-0 overflow-hidden rounded-full bg-line" aria-hidden="true"><span className="block h-full rounded-full bg-canopy transition-[width] duration-700 ease-snap" style={{ width: `${lebarAkurasi}%` }} /></span>
                          <span>{gps.status === 'mencari' ? tr('Memperbarui…', 'Updating…') : <>{akurasi} · ±{Math.round(gps.accuracy)} m{gps.waktu && <span className="text-ink-2/80"> · {new Date(gps.waktu).toLocaleTimeString(b === 'en' ? 'en-GB' : 'id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB</span>}</>}</span>
                        </div>
                      </>
                    )}
                    {gps.status === 'gagal' && <p className="m-0 mt-2 text-base leading-snug">{{
                      ditolak: tr('Izin lokasi diblokir. Klik ikon gembok di bilah alamat, pilih Lokasi lalu Izinkan, kemudian tekan Coba lagi. Atau isi koordinat manual.', 'Location permission is blocked. Click the padlock in the address bar, choose Location then Allow, then press Try again. Or enter the coordinates manually.'),
                      'tidak-tersedia': tr('Perangkat belum bisa menentukan posisi (sinyal GPS atau Wi-Fi lemah). Coba di tempat terbuka, atau isi koordinat manual.', 'The device cannot work out its position yet (weak GPS or Wi-Fi signal). Try somewhere open, or enter the coordinates manually.'),
                      waktu: tr('Pencarian lokasi terlalu lama. Coba lagi di tempat terbuka, atau isi koordinat manual.', 'Finding your location took too long. Try again somewhere open, or enter the coordinates manually.'),
                      'tidak-didukung': tr('Browser ini tidak mendukung lokasi. Isi koordinat manual di bawah.', 'This browser does not support location. Enter the coordinates manually below.'),
                      'tak-aman': tr('Lokasi hanya bisa dipakai lewat HTTPS atau localhost. Isi koordinat manual di bawah.', 'Location only works over HTTPS or localhost. Enter the coordinates manually below.'),
                    }[gps.alasan] ?? tr('Lokasi otomatis tidak tersedia. Isi koordinat manual di bawah.', 'Automatic location is unavailable. Enter the coordinates manually below.')}</p>}
                  </div>
                  <Button type="button" variant="secondary" size="sm" className="mt-3 h-8" id="lokasi-cari" onClick={() => gps.cari()} disabled={gps.status === 'mencari' || gps.alasan === 'tidak-didukung' || gps.alasan === 'tak-aman'}><LocateFixed size={14} aria-hidden="true" className={gps.status === 'mencari' ? 'motion-safe:animate-pulse' : ''} /> {gps.status === 'gagal' ? tr('Coba lagi', 'Try again') : gps.status === 'mencari' ? tr('Mencari…', 'Finding…') : tr('Cari ulang', 'Retry')}</Button>
                </div>
                <div className="mx-auto w-24 sm:w-32"><PadLokasi status={gps.status === 'mencari' || gps.status === 'gagal' ? gps.status : 'ok'} akurasi={gps.accuracy ?? 0} /></div>
              </div>
              <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-snap ${gps.status === 'gagal' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="min-h-0 overflow-hidden" inert={gps.status === 'gagal' ? undefined : ''}>
                  <div id="lokasi-manual" className="-m-1 grid grid-cols-2 gap-3 p-1 pt-6">
                    <Field label={tr('Lintang', 'Latitude')} inputMode="decimal" placeholder="-2.2000" value={manual.lat} onChange={(e) => setManual({ ...manual, lat: e.target.value })} />
                    <Field label={tr('Bujur', 'Longitude')} inputMode="decimal" placeholder="113.9000" value={manual.lon} onChange={(e) => setManual({ ...manual, lon: e.target.value })} />
                  </div>
                </div>
              </div>
              {galat.lokasi && <p className="mt-3 text-sm font-semibold text-flame" role="alert">{tr('Isi koordinat yang valid, atau izinkan akses lokasi.', 'Enter valid coordinates, or allow location access.')}</p>}
            </section>

            {/* 02 Tuts keparahan: tombol fisik yang menekan, seluruh panel berubah warna mengikuti pilihan */}
            <section data-spot aria-labelledby="lg-02" style={{ '--w': tingkat ? WARNA[tingkat] : 'var(--text-2)' }} className={`relative isolate overflow-hidden rounded-3xl border bg-surface p-4 transition-[border-color,--w] duration-500 sm:p-5 ${bayang} ${tingkat ? 'border-[var(--w)]' : 'border-line'}`}>
              <span aria-hidden="true" className="absolute inset-0 -z-10 transition-opacity duration-700 ease-snap" style={{ opacity: tingkat ? 0 : 1, background: 'linear-gradient(115deg, color-mix(in srgb, var(--canopy) 12%, transparent), color-mix(in srgb, var(--amber) 12%, transparent) 50%, color-mix(in srgb, var(--flame) 14%, transparent))' }} />
              <span aria-hidden="true" className="absolute inset-0 -z-10 transition-opacity duration-700 ease-snap" style={{ opacity: tingkat ? 1 : 0, background: 'radial-gradient(110% 100% at 100% 100%, color-mix(in srgb, var(--w) 46%, transparent), transparent 70%)' }} />
              <Kepala id="lg-02" no="02" selesai={TINGKAT.includes(tingkat)} aksen={<span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-ember-ink">{tr('Wajib', 'Required')}</span>}>{tr('Seberapa parah?', 'How severe?')}</Kepala>
              <fieldset className="m-0 mt-3 border-0 p-0" aria-describedby={galat.tingkat ? 'err-tingkat' : undefined}>
                <legend className="sr-only">{tr('Tingkat keparahan', 'Severity')}</legend>
                <div className="grid grid-cols-3 gap-3 pb-2 sm:gap-4">
                  {TINGKAT.map((k) => (
                    <label key={k} className="relative cursor-pointer">
                      <input type="radio" name="tingkat" value={k} checked={tingkat === k} onChange={() => { setTingkat(k); setGalat((g) => ({ ...g, tingkat: false })) }} className="peer sr-only" />
                      <span style={{ '--w': WARNA[k] }} className="group/kunci flex h-24 flex-col justify-between rounded-2xl sm:flex-row sm:items-center sm:justify-start sm:gap-3 border-2 border-[color-mix(in_srgb,var(--w)_38%,var(--border))] bg-[color-mix(in_srgb,var(--w)_9%,var(--surface))] p-3 shadow-[0_6px_0_0_color-mix(in_srgb,var(--w)_38%,var(--border)),0_14px_22px_-12px_rgb(0_0_0/0.5)] transition-[translate,border-color,background-color,box-shadow] duration-200 ease-snap hover:-translate-y-1 hover:border-[var(--w)] hover:shadow-[0_8px_0_0_color-mix(in_srgb,var(--w)_38%,var(--border)),0_18px_26px_-12px_rgb(0_0_0/0.5)] active:translate-y-[4px] active:shadow-[0_2px_0_0_var(--w),0_4px_10px_-6px_rgb(0_0_0/0.5)] peer-checked:translate-y-[4px] peer-checked:border-[var(--w)] peer-checked:bg-[color-mix(in_srgb,var(--w)_20%,var(--surface))] peer-checked:shadow-[0_2px_0_0_var(--w),0_4px_10px_-6px_rgb(0_0_0/0.5)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ">
                        <Flame size={UKURAN_KUNCI[k]} strokeWidth={1.6} style={tingkat === k ? { color: 'var(--w)' } : undefined} className={`origin-bottom transition-[color] duration-300 ${tingkat === k ? 'motion-safe:animate-[api-kedip_1.4s_ease-in-out_infinite]' : 'text-[var(--w)] opacity-80 group-hover/kunci:opacity-100'}`} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="judul-display block text-xl leading-none sm:text-2xl">{tr(...KEPARAHAN[k][0])}</span>
                          <span className="mt-1.5 block text-xs leading-snug text-ink-2 max-sm:sr-only">{tr(...KEPARAHAN[k][1])}</span>
                        </span>
                      </span>
                      {tingkat === k && <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-10 motion-reduce:hidden">{Array.from({ length: 10 }, (_, i) => <span key={i} className="percik absolute -ml-1 -mt-1 size-2 rounded-full" style={{ '--a': `${i * 36}deg`, '--k': i % 3, background: WARNA[k] }} />)}</span>}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div aria-live="polite" className="mt-5">
                {tingkat === 'berat' ? (
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border-2 border-ember-ink bg-bg/60 p-4">
                    <p className="m-0 min-w-[14rem] flex-1 text-sm leading-relaxed text-ink-2"><strong className="block text-base text-ink">{tr('Api besar atau menyebar cepat?', 'Large or fast-spreading fire?')}</strong>{tr('Selamatkan diri dulu dan telepon 112. Laporan ini bisa menyusul.', 'Get to safety first and call 112. This report can follow.')}</p>
                    <Button as="a" href="tel:112"><Phone size={16} aria-hidden="true" /> {tr('Telepon 112', 'Call 112')}</Button>
                  </div>
                ) : tingkat ? <p key={tingkat} data-no-rv className="m-0 text-base leading-relaxed text-ink [animation:tile-masuk_.45s_var(--ease-snap)]">{tr(...PANDUAN[tingkat])}</p>
                  : <p className="m-0 text-sm text-ink-2">{tr('Pilih yang paling mendekati apa yang kamu lihat.', 'Pick whichever is closest to what you see.')}</p>}
              </div>
              {galat.tingkat && <p id="err-tingkat" className="mt-3 text-sm font-semibold text-flame" role="alert">{tr('Pilih tingkat keparahan.', 'Choose a severity level.')}</p>}
            </section>

            {/* 03 Buku catatan dan foto polaroid: kertas bergaris dan foto yang miring, lain bahan dari dua panel di atas */}
            <section data-spot aria-labelledby="lg-03" className={`relative isolate overflow-hidden rounded-3xl border border-line bg-[linear-gradient(150deg,color-mix(in_srgb,var(--amber)_20%,var(--surface)),color-mix(in_srgb,var(--ember)_9%,var(--surface)))] p-4 sm:p-5 ${bayang}`}>
              <Kepala id="lg-03" no="03" selesai={!!(catatan || foto)} aksen={<span className="ml-auto font-mono text-[11px] uppercase tracking-widest text-ink-2">{tr('Opsional', 'Optional')}</span>}>{tr('Detail', 'Details')}</Kepala>
              <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] sm:items-start sm:gap-6">
                <div>
                  <label htmlFor="catatan-lapor" className="block text-sm font-medium">{tr('Catatan', 'Notes')}</label>
                  <textarea id="catatan-lapor" rows={3} maxLength={500} value={catatan} onChange={(e) => setCatatan(e.target.value)} aria-describedby="catatan-bantu" placeholder={tr('Contoh: asap tebal ke arah timur, dekat kebun sawit', 'Example: thick smoke heading east, near a palm plantation')}
                    className="mt-1 block w-full resize-none bg-transparent placeholder:text-ink-2/70 px-0 text-base leading-8 text-ink outline-none [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(2rem-1px),color-mix(in_srgb,var(--text-2)_55%,transparent)_calc(2rem-1px),color-mix(in_srgb,var(--text-2)_55%,transparent)_2rem)] [background-attachment:local] focus-visible:[background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(2rem-1px),var(--ember-ink)_calc(2rem-1px),var(--ember-ink)_2rem)]" />
                  <p id="catatan-bantu" className="m-0 mt-2 flex justify-between gap-3 text-xs text-ink-2"><span>{tr('Misalnya: arah angin, jenis lahan, akses jalan.', 'For example: wind direction, land type, road access.')}</span><span className={`font-mono tabular-nums transition-colors duration-200 ${catatan.length >= 450 ? 'font-semibold text-flame' : ''}`}>{catatan.length}/500</span></p>
                </div>
                <div className="px-2 pt-2">
                  <input id="foto-lapor" type="file" accept="image/*" capture="environment" onChange={(e) => { pilihFoto(e.target.files?.[0]); e.target.value = '' }} className="peer sr-only" />
                  <label htmlFor="foto-lapor" onDragOver={(e) => { e.preventDefault(); setSeret(true) }} onDragLeave={() => setSeret(false)} onDrop={(e) => { e.preventDefault(); setSeret(false); pilihFoto(e.dataTransfer.files?.[0]) }}
                    className={`group/foto relative mx-auto block max-w-32 cursor-pointer rounded-md bg-surface p-2 pb-8 shadow-[0_2px_3px_rgb(0_0_0/0.2),0_22px_40px_-16px_rgb(0_0_0/0.5)] transition-[rotate,translate,box-shadow] duration-500 ease-snap hover:-translate-y-1 hover:rotate-0 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 ${seret ? 'rotate-0 ring-2 ring-ember-ink' : '-rotate-3'}`}>
                    <span aria-hidden="true" className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-2 bg-amber/45 shadow-sm backdrop-blur-[1px]" />
                    <span className="relative flex aspect-square items-center justify-center overflow-hidden rounded-sm bg-bg text-ink-2">
                      {fotoUrl
                        ? <img key={fotoUrl} src={fotoUrl} alt={tr('Pratinjau foto laporan', 'Report photo preview')} className="absolute inset-0 size-full object-cover motion-safe:[animation:cuci_1.3s_var(--ease-snap)_both]" />
                        : <span className="flex flex-col items-center gap-2 px-3 text-center text-sm"><Camera size={30} aria-hidden="true" className="transition-[translate,color] duration-300 ease-snap group-hover/foto:-translate-y-1 group-hover/foto:text-ember-ink" /><span className="font-semibold text-ink">{tr('Ambil atau pilih foto', 'Take or choose a photo')}</span></span>}
                    </span>
                    <span className="absolute inset-x-3 bottom-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-ink-2"><span>{tr('Foto', 'Photo')}</span>{fotoUrl && <span>{Math.round(foto.size / 1024)} KB</span>}</span>
                  </label>
                  {fotoUrl && <button type="button" onClick={hapusFoto} className="mx-auto mt-4 flex items-center gap-1 text-xs text-ink-2 underline underline-offset-4 hover:text-ink"><X size={12} aria-hidden="true" />{tr('Hapus foto', 'Remove photo')}</button>}
                </div>
              </div>
              <p className="m-0 mt-5 text-sm text-ink-2">{tr('Ketuk untuk menambahkan ke catatan:', 'Tap to add to your notes:')}</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={tr('Tambah catatan cepat', 'Quick notes')}>
                    {SARAN.map(([id, en]) => {
                      const t = tr(id, en)
                      const on = pecah(catatan).includes(t)
                      return <button key={id} type="button" aria-pressed={on} onClick={() => alihSaran(t)} className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-[border-color,background-color,color,translate] duration-150 ease-snap active:translate-y-px ${on ? 'border-ember-ink bg-[color-mix(in_srgb,var(--ember-ink)_14%,transparent)] text-ink' : 'border-line-strong text-ink-2 hover:border-ink hover:text-ink'}`}>{on ? <Check size={14} strokeWidth={3} aria-hidden="true" className="pop-cek text-ember-ink" /> : <Plus size={14} aria-hidden="true" />}{t}</button>
                    })}
                  </div>
            </section>

              <div className="sticky bottom-0 z-10 -mx-4 flex items-center justify-between gap-4 border-t border-line bg-bg px-4 py-4 sm:static sm:mx-0 sm:px-0 sm:pb-0 sm:pt-6">
                <div data-no-rv aria-live="polite" className="min-w-0">
                  <p className="m-0 text-sm leading-snug">
                    {terkirim ? <span className="font-semibold text-canopy">{tr('Laporan tersimpan di perangkat', 'Report saved on this device')}</span>
                      : siap ? <><span className="font-semibold text-canopy">{tr('Siap dikirim', 'Ready to send')}</span><span className="text-ink-2"> · {ringkas}</span></>
                      : <span className="text-ink-2">{!lokasiOk && !tingkatOk ? tr('Dua langkah lagi: lokasi dan tingkat keparahan.', 'Two steps to go: location and severity.') : !lokasiOk ? tr('Tinggal lokasi, lalu siap dikirim.', 'Just the location, then you are ready.') : tr('Tinggal pilih seberapa parah apinya.', 'Just pick how bad the fire is.')}</span>}
                  </p>
                  <div aria-hidden="true" className="mt-2 flex gap-1.5">
                    {[lokasiOk, tingkatOk].map((o, i) => <span key={i} className={`h-1 w-10 rounded-full transition-colors duration-300 ease-snap ${o ? 'bg-canopy' : 'bg-line-strong'}`} />)}
                  </div>
                </div>
                <Button type="submit" disabled={menyimpan} className="shrink-0 !min-h-12 !px-6 !text-base">
                  {menyimpan ? <LoaderCircle size={18} aria-hidden="true" className="motion-safe:animate-spin" /> : terkirim ? <Check size={18} strokeWidth={3} aria-hidden="true" className="pop-cek" /> : <Send size={18} aria-hidden="true" className="transition-transform duration-200 ease-snap motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:translate-x-0.5" />} {menyimpan ? tr('Menyimpan…', 'Saving…') : terkirim ? tr('Tersimpan', 'Saved') : labelSimpan}
                </Button>
              </div>
            </form>

            <div role="status" aria-label={tr('Status laporan terakhir', 'Latest report status')}><KonfirmasiLaporan laporan={laporan?.find((r) => r.id === ultimaId)} online={online} /></div>

            <p className="m-0 mt-6 text-xs leading-relaxed text-ink-2">{tr('Laporan ini bukan pengganti panggilan darurat. Untuk bahaya langsung, hubungi', 'This report is not a substitute for an emergency call. For immediate danger, call')} <strong className="text-ink">112</strong>.</p>
          </div>

          {/* Buku catatan: tanpa kotak. Angka besar, alur sebagai jalur bersambung, laporan sebagai baris berpemisah garis rambut */}
        <aside aria-labelledby="antrean-lapor" className="grid gap-7 rounded-3xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 id="antrean-lapor" className="m-0 text-3xl leading-none sm:text-4xl">{tr('Antrean laporan', 'Report queue')}</h2>
              <Button variant="secondary" size="sm" disabled={sedang} onClick={() => (online ? sinkronkan(true) : toast.show(tr('Masih offline. Sinkronisasi berjalan otomatis saat online.', 'Still offline. Syncing runs automatically once you are online.'), 'info'))}>
                <RefreshCw size={14} className={sedang ? 'animate-spin' : ''} aria-hidden="true" /> {sedang ? tr('Menyinkronkan…', 'Syncing…') : tr('Sinkronkan', 'Sync')}
              </Button>
            </div>
            <ul className="m-0 mt-7 grid list-none grid-cols-3 divide-x divide-line p-0">
              {[[tr('Terkirim', 'Sent'), hitung.synced, 'var(--canopy)'], [tr('Antre', 'Queued'), hitung.pending, 'var(--amber)'], [tr('Gagal', 'Failed'), hitung.failed, 'var(--flame)']].map(([t, n, w]) => (
                <li key={t} className="px-4 first:pl-0 last:pr-0"><p className="judul-display m-0 text-5xl leading-none tabular-nums" style={{ color: n ? w : 'var(--text-2)' }}>{n}</p><p className="m-0 mt-2 text-xs text-ink-2">{t}</p></li>
              ))}
            </ul>
            <ol className="m-0 mt-9 grid list-none grid-cols-3 p-0 text-xs text-ink-2" aria-label={tr('Alur laporan', 'Report flow')}>
              {[tr('Tersimpan di perangkat', 'Saved on device'), tr('Antre saat offline', 'Queued offline'), tr('Terkirim otomatis', 'Sent automatically')].map((t, k) => (
                <li key={t} className="relative pr-2 after:absolute after:left-9 after:right-2 after:top-3.5 after:h-px after:bg-line last:after:hidden">
                  <span className="relative z-10 flex size-7 items-center justify-center rounded-full border border-ink-2/50 bg-bg font-mono text-[11px] text-ink" aria-hidden="true">{k + 1}</span>
                  <span className="mt-2 block leading-snug">{t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            {laporan === null && <p className="m-0 text-sm text-ink-2" role="status">{tr('Memuat laporan…', 'Loading reports…')}</p>}
            {laporan?.length === 0 && <p className="m-0 border-t border-line pt-5 text-sm leading-relaxed text-ink-2">{tr('Belum ada laporan. Laporan yang kamu buat akan muncul di sini, lengkap dengan status kirimnya.', 'No reports yet. Reports you create will appear here, with their sending status.')}</p>}
            {laporan?.length > 0 && <p className="m-0 mb-2 font-mono text-[11px] uppercase tracking-widest text-ink-2">{laporan.length > 3 ? tr(`Menampilkan 3 dari ${laporan.length}. Gulir untuk melihat sisanya`, `Showing 3 of ${laporan.length}. Scroll for the rest`) : tr(`${laporan.length} laporan`, `${laporan.length} report(s)`)}</p>}
            <ul tabIndex={laporan?.length > 3 ? 0 : undefined} aria-label={tr('Daftar laporan', 'Report list')} className="m-0 max-h-[18.5rem] list-none overflow-y-auto overscroll-contain p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              {laporan?.map((r) => (
                <li key={r.id} data-no-rv className={`group/baris [animation:tile-masuk_.45s_var(--ease-snap)_both] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 overflow-hidden border-t border-line px-2 py-3 transition-[background-color,max-height,padding,opacity,translate] duration-300 ease-snap first:border-t-0 hover:bg-ink/5 ${keluar === r.id ? 'max-h-0 -translate-x-4 !py-0 opacity-0' : 'max-h-32'}`}>
                  <span aria-hidden="true" className="h-11 w-1 rounded-full transition-[scale] duration-300 ease-snap group-hover/baris:scale-y-110" style={{ background: WARNA[r.severity] }} />
                  <div className="min-w-0">
                    <span className="flex items-center gap-2"><span className="judul-display text-2xl leading-none">{tr(...KEPARAHAN[r.severity][0])}</span><Pill variant={NAMA_STATUS[r.status]} /></span>
                    <p className="m-0 mt-1 truncate text-xs text-ink-2">{waktu(r.createdAt)} WIB · <span className="font-mono">{r.lat.toFixed(4)}, {r.lon.toFixed(4)}</span>{r.photo ? ` · ${tr('foto', 'photo')}` : ''}</p>
                    {r.status === 'failed' && <p className="m-0 mt-0.5 text-xs text-ink-2">{tr(`Percobaan ke-${r.tries} gagal. Dicoba lagi otomatis.`, `Attempt ${r.tries} failed. It will be retried automatically.`)}</p>}
                  </div>
                  {hapusId === r.id
                    ? <span className="flex items-center gap-1.5"><button type="button" onClick={() => hapus(r.id)} className="min-h-9 rounded-full bg-flame px-3 text-xs font-semibold text-on-ember transition-[filter] hover:brightness-110">{tr('Hapus', 'Delete')}</button><button type="button" onClick={() => setHapusId(null)} className="min-h-9 rounded-full px-2 text-xs text-ink-2 hover:text-ink">{tr('Batal', 'Cancel')}</button></span>
                    : <button type="button" onClick={() => setHapusId(r.id)} aria-label={tr(`Hapus laporan ${tr(...KEPARAHAN[r.severity][0])} ${waktu(r.createdAt)}`, `Delete ${tr(...KEPARAHAN[r.severity][0])} report ${waktu(r.createdAt)}`)} className="flex size-9 items-center justify-center rounded-full text-ink-2 transition-[color,background-color] duration-200 hover:bg-flame/15 hover:text-flame focus-visible:bg-flame/15 focus-visible:text-flame"><Trash2 size={16} aria-hidden="true" /></button>}
                </li>
              ))}
            </ul>
          </div>
        </aside>
        </div>
      </Container>
    </>
  )
}
