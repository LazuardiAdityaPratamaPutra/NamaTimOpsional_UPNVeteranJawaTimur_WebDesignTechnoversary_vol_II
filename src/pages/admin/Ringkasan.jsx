import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Check, Info, MapPinned, Siren, TriangleAlert } from 'lucide-react'
import hotspots from '../../data/hotspot.json'
import Angka from './Angka'
import { KartuBelajar, KartuSipongi } from './RingkasanData'
import { Denyut } from './viz'
import { JINGGA, KARTU, KILAU, Kosong, Segmen, SEV, tunda, Waktu, WARNA_KAT, WARNA_SEV, WARNA_STATUS } from './kit'
import { useAuth } from '../../components/authContext'
import { useToast } from '../../components/ui/toastContext'
import { useAdmin } from '../../components/useAdmin'
import { useSinkron } from '../../components/syncContext'
import { catat, gabungLaporan, hitungLaporan, risikoSemua, setTindak, statusTindak, terdekat, TINDAK, TINDAK_LABEL } from '../../lib/admin'
import { namaArah, namaLahan } from '../../lib/format'
import { useJudul } from '../../lib/useJudul'
import { useBahasa, useTr } from '../../i18n'

const BOBOT = { berat: 3, sedang: 2, ringan: 1 }
const URUT_CONF = { high: 0, nominal: 1, low: 2 }
const IKON_SEV = { berat: Siren, sedang: TriangleAlert, ringan: Info }

const Judul = ({ children, aksi }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="m-0 !font-sans !text-lg !font-semibold !tracking-normal text-ink-2 ![font-stretch:100%]">{children}</h2>
    {aksi}
  </div>
)

const Tautan = ({ to, children }) => <Link to={to} className="inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-bg/60 px-3 text-sm font-medium text-ink-2 transition-colors duration-150 hover:text-ink">{children}</Link>

export default function Ringkasan() {
  const tr = useTr()
  const b = useBahasa()
  const en = b === 'en'
  useJudul(tr('Dashboard admin', 'Admin dashboard'))
  const { sesi } = useAuth()
  const { tindak, log } = useAdmin()

  // Setiap perubahan status bisa diurungkan dari toast (atau Ctrl/Cmd+Z) selama beberapa detik
  const toast = useToast()
  const umumkan = (r, lama, baru) => {
    const nm = terdekat(r.lat, r.lon).nama
    toast.show(tr(`${nm}: ${TINDAK_LABEL[lama][0]} → ${TINDAK_LABEL[baru][0]}.`, `${nm}: ${TINDAK_LABEL[lama][1]} → ${TINDAK_LABEL[baru][1]}.`), 'sukses', {
      kunci: `status-${r.id}`,
      aksi: { label: tr('Urungkan', 'Undo'), urungkan: true, jalankan: () => {
        setTindak(r.id, lama)
        catat([`Status laporan ${nm} → ${TINDAK_LABEL[lama][0]} (diurungkan)`, `Report near ${nm} → ${TINDAK_LABEL[lama][1]} (undone)`], sesi?.nama)
      } },
    })
  }
  const { laporan: dariDb } = useSinkron()
  const semua = useMemo(() => gabungLaporan(dariDb ?? []), [dariDb])
  const risiko = useMemo(() => risikoSemua(), [])
  const { tingkat, status } = useMemo(() => hitungLaporan(semua, tindak), [semua, tindak])
  const [sekarang] = useState(Date.now)
  // Di ponsel mulai dari 24 jam: 8 kolom grafik cukup lebar untuk disentuh (target ≥ 24px); 48 jam tetap bisa dipilih
  const [rentang, setRentang] = useState(() => (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 639px)').matches ? 8 : 16))
  const [sev, setSev] = useState({ berat: true, sedang: true, ringan: true })
  const [urutBar, setUrutBar] = useState('angin')
  const kritis = risiko.filter((r) => r.kategori === 'kritis').length
  const tinggi2 = risiko.filter((r) => r.kategori === 'tinggi').length
  const beratTunda = semua.filter((r) => r.severity === 'berat' && ['baru', 'verifikasi'].includes(statusTindak(r.id, tindak))).length
  const antrean = useMemo(() => semua.filter((r) => statusTindak(r.id, tindak) === 'baru').sort((a, c) => BOBOT[c.severity] - BOBOT[a.severity] || c.createdAt - a.createdAt), [semua, tindak])
  const bins = useMemo(() => {
    const t = Array.from({ length: 16 }, () => ({ ringan: 0, sedang: 0, berat: 0 }))
    for (const r of semua) { const u = (sekarang - r.createdAt) / 3600_000; const i = 15 - Math.floor(u / 3); if (u >= 0 && i >= 0 && i < 16) t[i][r.severity]++ }
    return t
  }, [semua, sekarang])
  const nama1 = sesi?.nama.split(' ')[0]
  const tingkatSiaga = beratTunda > 0 || kritis > 0 ? 2 : status.baru > 0 || tinggi2 > 0 ? 1 : 0
  const NAMA_SIAGA = [tr('Aman', 'Clear'), tr('Waspada', 'Watch'), tr('Siaga', 'Alert')]
  const WARNA_SIAGA = ['var(--canopy)', 'var(--amber)', 'var(--flame)']
  const hariIni = new Date(sekarang).toLocaleDateString(en ? 'en-GB' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long' })
  const kalimat = beratTunda > 0
    ? tr(`${beratTunda} laporan berat belum selesai ditangani, dan ${risiko.length} pemukiman berada di jalur api.`, `${beratTunda} severe reports are still open, and ${risiko.length} settlements lie in the fire’s path.`)
    : tr(`Tidak ada laporan berat yang tertunda. ${risiko.length} pemukiman tetap dipantau di jalur api.`, `No severe reports are waiting. ${risiko.length} settlements stay under watch in the fire’s path.`)

  // Grafik utama
  const binsTampil = bins.slice(16 - rentang).map((x) => ({ ringan: sev.ringan ? x.ringan : 0, sedang: sev.sedang ? x.sedang : 0, berat: sev.berat ? x.berat : 0 }))
  const jml = (x) => x.ringan + x.sedang + x.berat
  const totalTampil = binsTampil.reduce((a, x) => a + jml(x), 0)
  const kini = bins.slice(-8).reduce((a, x) => a + jml(x), 0)
  const lalu = bins.slice(0, 8).reduce((a, x) => a + jml(x), 0)
  const naik = kini > lalu
  const persen = lalu ? Math.round((Math.abs(kini - lalu) / lalu) * 100) : null

  // Kartu bertumpuk: status yang sedang berlaku di depan, dua lainnya mengintip di belakang
  const tumpuk = [0, 1, 2].filter((i) => i !== tingkatSiaga).concat(tingkatSiaga)

  const verifikasi = (r) => {
    const nm = terdekat(r.lat, r.lon).nama
    const lama = statusTindak(r.id, tindak)
    setTindak(r.id, 'verifikasi')
    umumkan(r, lama, 'verifikasi')
    catat([`Status laporan ${nm} → ${TINDAK_LABEL.verifikasi[0]}`, `Report near ${nm} → ${TINDAK_LABEL.verifikasi[1]}`], sesi?.nama)
  }

  // Batang hotspot
  const batang = useMemo(() => [...hotspots].sort((a, c) => (urutBar === 'angin' ? c.angin.U - a.angin.U || a.id.localeCompare(c.id) : a.id.localeCompare(c.id))), [urutBar])
  const teratas = useMemo(() => [...hotspots].sort((a, c) => c.angin.U - a.angin.U || URUT_CONF[a.confidence] - URUT_CONF[c.confidence])[0], [])
  const [pilihBar, setPilihBar] = useState(null)
  const hb = hotspots.find((h) => h.id === (pilihBar ?? teratas.id))
  const mU = Math.max(1, ...hotspots.map((h) => h.angin.U))
  const confNama = { high: tr('tinggi', 'high'), nominal: tr('sedang', 'medium'), low: tr('rendah', 'low') }

  const kejadian = [
    ...log.map((l) => ({ t: l.t, teks: en ? l.en : l.id, warna: 'var(--ember)' })),
    ...semua.slice(0, 6).map((r) => ({ t: r.createdAt, teks: tr(`Laporan ${SEV[r.severity][0].toLowerCase()} dekat ${terdekat(r.lat, r.lon).nama}`, `${SEV[r.severity][1]} report near ${terdekat(r.lat, r.lon).nama}`), warna: WARNA_SEV[r.severity] })),
  ].sort((a, c) => c.t - a.t).slice(0, 5)
  const atas = risiko[0]

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h1 className="m-0 text-3xl leading-none sm:text-4xl">{tr(`Halo, ${nama1}`, `Hello, ${nama1}`)}</h1>
        <p className="m-0 text-sm text-ink-2">{hariIni} · {kalimat}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        {/* Grafik besar: laporan masuk */}
        <section aria-labelledby="grafik-h" className={`${KARTU} xl:col-span-8`} style={{ ...KILAU, ...tunda(0) }}>
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div>
              <h2 id="grafik-h" className="m-0 !font-sans !text-lg !font-semibold !tracking-normal text-ink-2 ![font-stretch:100%]">{tr('Laporan masuk', 'Incoming reports')}</h2>
              <p className="m-0 mt-1 flex flex-wrap items-center gap-3">
                <span className="judul-display text-[clamp(2.75rem,5vw,3.75rem)] font-bold leading-none tabular-nums"><Angka n={totalTampil} /></span>
                {persen !== null && <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${naik ? '' : 'text-canopy'}`} style={{ background: `color-mix(in oklab, ${naik ? 'var(--flame)' : 'var(--canopy)'} 14%, transparent)`, color: naik ? 'color-mix(in oklab, var(--flame), var(--text) 35%)' : undefined }}>{naik ? '↑' : '↓'} {persen}%<span className="font-normal text-ink-2">{tr('vs 24 jam lalu', 'vs prior 24 h')}</span></span>}
              </p>
            </div>
            <Segmen label={tr('Rentang waktu', 'Time range')} nilai={rentang} onUbah={setRentang} opsi={[[8, tr('24 jam', '24 h')], [16, tr('48 jam', '48 h')]]} />
          </div>
          <div className="mt-5"><Denyut key={rentang} bins={binsTampil} tinggi="h-52 lg:h-64" /></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-2">
            <span>{tr('Rata-rata per 3 jam', 'Average per 3 h')} <b className="ml-1 text-ink tabular-nums">{(totalTampil / binsTampil.length).toFixed(1).replace('.', en ? '.' : ',')}</b></span>
            <div role="group" aria-label={tr('Tampilkan tingkat', 'Show severity')} className="flex flex-wrap gap-4">
              {[['berat', tr('Berat', 'Severe')], ['sedang', tr('Sedang', 'Moderate')], ['ringan', tr('Ringan', 'Light')]].map(([k, l]) => (
                <button key={k} type="button" aria-pressed={sev[k]} onClick={() => setSev((o) => ({ ...o, [k]: !o[k] }))} className={`inline-flex min-h-8 items-center gap-2 rounded-full transition-opacity duration-150 ${sev[k] ? 'text-ink' : 'opacity-45'}`}>
                  <span aria-hidden="true" className="size-3 rounded-[4px]" style={{ background: sev[k] ? WARNA_SEV[k] : 'transparent', border: `2px solid ${WARNA_SEV[k]}` }} />{l}<span className="tabular-nums text-ink-2">{tingkat[k]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Kolom kanan tinggi: kartu bertumpuk (situasi), dua tombol, daftar perlu tindakan */}
        <section aria-labelledby="situasi-h" className={`${KARTU} flex flex-col xl:col-span-4 xl:row-span-2`} style={{ background: 'linear-gradient(180deg, color-mix(in oklab, var(--ember) 36%, var(--surface)) 0%, var(--surface) 58%)', ...tunda(1) }}>
          <Judul aksi={<Tautan to="/admin/peta"><MapPinned size={14} aria-hidden="true" />{tr('Peta risiko', 'Risk map')}</Tautan>}><span id="situasi-h" className="!text-ink">{tr('Situasi sekarang', 'Situation now')}</span></Judul>
          <div className="relative mt-1 h-[15.5rem]">
            {tumpuk.map((idx, i) => {
              const depan = i === tumpuk.length - 1
              return (
                <div key={idx} aria-hidden={depan ? undefined : 'true'} className={`absolute rounded-2xl border border-line transition-[top,inset] duration-500 ease-snap ${depan ? 'bg-bg p-4' : 'px-4 pt-2'}`}
                  style={depan ? { top: 54, insetInline: 0, height: '10.5rem', boxShadow: '0 14px 30px -12px color-mix(in oklab, var(--bg) 80%, transparent)' } : { top: i * 26, insetInline: `${(tumpuk.length - 1 - i) * 3}%`, height: '7rem', background: `color-mix(in oklab, var(--ember) ${22 - i * 8}%, var(--surface))` }}>
                  {depan ? (
                    <div className="flex h-full flex-col justify-between">
                      <div className="flex items-start justify-between"><p className="m-0 text-sm text-ink-2">{tr('Tingkat siaga', 'Alert level')}</p><span aria-hidden="true" className="relative mt-1 flex size-3">{idx > 0 && <span className="absolute inset-0 rounded-full motion-safe:animate-ping" style={{ background: WARNA_SIAGA[idx], opacity: 0.5 }} />}<span className="relative size-3 rounded-full" style={{ background: WARNA_SIAGA[idx] }} /></span></div>
                      <p className="judul-display m-0 text-[3.5rem] font-extrabold leading-[0.9]" style={{ color: WARNA_SIAGA[idx] }}>{NAMA_SIAGA[idx]}</p>
                      <div className="flex items-end justify-between gap-2">
                        <p className="m-0 text-xs text-ink-2">{tr('Laporan menunggu', 'Reports waiting')}<b className="judul-display mt-0.5 block text-2xl leading-none text-ink tabular-nums"><Angka n={status.baru} /></b></p>
                        <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'color-mix(in oklab, var(--flame) 15%, transparent)', color: 'color-mix(in oklab, var(--flame), var(--text) 35%)' }}>{tr(`${beratTunda} berat`, `${beratTunda} severe`)}</span>
                      </div>
                    </div>
                  ) : <p className="m-0 flex items-center justify-between text-xs font-medium text-ink-2"><span>{NAMA_SIAGA[idx]}</span><span className="size-1.5 rounded-full" style={{ background: WARNA_SIAGA[idx] }} /></p>}
                </div>
              )
            })}
          </div>
          <p className="m-0 mt-4 text-sm leading-snug text-ink-2">{kalimat}</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link to="/admin/laporan" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-bg/70 px-4 text-sm font-semibold transition-[background-color,scale] duration-150 ease-snap hover:bg-bg active:scale-95">{tr('Semua laporan', 'All reports')}</Link>
            <Link to="/admin/laporan?status=baru" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold text-on-ember transition-[filter,scale] duration-150 ease-snap hover:brightness-110 active:scale-95" style={JINGGA}>{tr('Tinjau baru', 'Review new')}<ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <h2 className="m-0 !font-sans !text-lg !font-semibold !tracking-normal ![font-stretch:100%]">{tr('Perlu tindakan', 'Needs action')}</h2>
            <span className="rounded-full bg-bg/70 px-2.5 py-0.5 text-sm font-semibold tabular-nums">{antrean.length}</span>
          </div>
          {antrean.length === 0 ? <div className="mt-3"><Kosong teks={tr('Semua laporan sudah ditinjau.', 'Every report has been reviewed.')} /></div> : (
            <ul className="m-0 mt-3 grid list-none gap-2.5 p-0">
              {antrean.slice(0, 4).map((r) => {
                const Ikon = IKON_SEV[r.severity]
                const dekat = terdekat(r.lat, r.lon)
                return (
                  <li key={r.id} className="tab-ganti grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-line bg-bg/60 p-2.5 transition-colors duration-150 hover:bg-bg">
                    <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-xl bg-band" style={{ color: WARNA_SEV[r.severity] }}><Ikon size={20} /></span>
                    <Link to={`/admin/laporan?r=${r.id}`} className="min-w-0 no-underline">
                      <span className="block truncate text-sm font-semibold text-ink">{dekat.nama}</span>
                      <span className="block text-xs text-ink-2"><Waktu t={r.createdAt} /> · <span style={{ color: WARNA_SEV[r.severity] }}>{tr(SEV[r.severity][0], SEV[r.severity][1])}</span></span>
                    </Link>
                    <button type="button" onClick={() => verifikasi(r)} aria-label={`${tr('Verifikasi', 'Verify')}: ${dekat.nama}`} className="inline-flex size-10 items-center justify-center rounded-full bg-ember text-on-ember transition-[scale,filter] duration-150 ease-snap hover:brightness-110 active:scale-90"><Check size={18} aria-hidden="true" /></button>
                  </li>
                )
              })}
            </ul>
          )}
          {antrean.length > 4 && <Link to="/admin/laporan?status=baru" className="mt-3 inline-flex min-h-9 items-center gap-1 self-start text-sm font-semibold text-ember-ink underline-offset-4 hover:underline">{tr(`+${antrean.length - 4} lagi`, `+${antrean.length - 4} more`)}<ArrowRight size={14} aria-hidden="true" /></Link>}
        </section>

        {/* Kartu sorotan oranye */}
        <section aria-labelledby="sorot-h" className={`${KARTU} flex flex-col justify-between border-transparent text-on-ember xl:col-span-3`} style={{ ...JINGGA, ...tunda(2) }}>
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -right-12 -z-10 size-52 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--on-ember) 38%, transparent), color-mix(in oklab, var(--on-ember) 6%, transparent) 70%)' }} />
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-6 right-16 -z-10 size-28 rounded-full" style={{ background: 'radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--on-ember) 26%, transparent), transparent 70%)' }} />
          <div>
            <p className="m-0 text-sm font-semibold opacity-80">{tr('Paling terancam', 'Most at risk')}</p>
            <h2 id="sorot-h" className="judul-display m-0 mt-2 text-[2rem] leading-[1.05]">{atas ? atas.nama : tr('Belum ada', 'None yet')}</h2>
            {atas && <p className="m-0 mt-2 text-sm leading-snug opacity-90">{tr(`Skor ${atas.skor} dari 100. Api diperkirakan tiba ±${atas.zona} jam dari ${atas.hotspotId}.`, `Score ${atas.skor} of 100. Fire expected in ~${atas.zona} h from ${atas.hotspotId}.`)}</p>}
          </div>
          <div className="mt-6">
            <ul aria-hidden="true" className="m-0 mb-4 flex list-none p-0">
              {hotspots.slice(0, 4).map((h, i) => <li key={h.id} className="-ml-2 flex size-9 items-center justify-center rounded-full border-2 font-mono text-[10px] font-bold first:ml-0" style={{ borderColor: 'color-mix(in oklab, var(--ember) 70%, var(--amber))', background: 'var(--bg)', color: 'var(--text)', zIndex: 4 - i }}>{h.id.slice(2)}</li>)}
              <li className="-ml-2 flex size-9 items-center justify-center rounded-full border-2 text-xs font-bold" style={{ borderColor: 'color-mix(in oklab, var(--ember) 70%, var(--amber))', background: 'var(--ember)' }}>+{hotspots.length - 4}</li>
            </ul>
            <Link to="/admin/peta" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-bg text-base font-bold text-ink transition-[scale,box-shadow] duration-150 ease-snap hover:shadow-lg active:scale-[0.97]">{tr('Buka peta risiko', 'Open the risk map')}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          </div>
        </section>

        {/* Batang hotspot: satu batang menyala */}
        <section aria-labelledby="angin-h" className={`${KARTU} xl:col-span-5`} style={{ ...KILAU, ...tunda(3) }}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="angin-h" className="m-0 !font-sans !text-lg !font-semibold !tracking-normal text-ink-2 ![font-stretch:100%]">{tr('Angin di tiap hotspot', 'Wind at each hotspot')}</h2>
              <p className="m-0 mt-1 flex items-center gap-3"><span className="judul-display text-[2.5rem] font-bold leading-none tabular-nums">{hb.angin.U}<span className="ml-1 text-base font-medium text-ink-2">m/s</span></span><span className="rounded-full px-2.5 py-1 text-sm font-semibold text-ember-ink" style={{ background: 'color-mix(in oklab, var(--ember) 15%, transparent)' }}>{hb.id}</span></p>
            </div>
            <Segmen label={tr('Urutan', 'Order')} nilai={urutBar} onUbah={setUrutBar} opsi={[['angin', tr('Angin', 'Wind')], ['id', 'ID']]} />
          </div>
          <ul className="m-0 mt-5 flex h-44 list-none items-end gap-2 p-0" onMouseLeave={() => setPilihBar(null)}>
            {batang.map((h) => {
              const on = h.id === hb.id
              return (
                <li key={h.id} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                  <button type="button" aria-pressed={on} aria-label={`${h.id}: ${h.angin.U} m/s`} onMouseEnter={() => setPilihBar(h.id)} onFocus={() => setPilihBar(h.id)} onClick={() => setPilihBar(h.id)} className="group relative flex h-full w-full flex-col justify-end outline-none">
                    <span className={`mb-1.5 block text-center text-[11px] tabular-nums transition-colors duration-200 ${on ? 'font-bold text-ink' : 'text-ink-2'}`}>{h.angin.U}</span>
                    <span className="block w-full rounded-t-lg border-t-[3px] transition-[height,background,box-shadow,border-color] duration-500 ease-snap group-focus-visible:outline-2 group-focus-visible:outline-ember-ink"
                      style={{ height: `${Math.max(14, (h.angin.U / mU) * 78)}%`, borderColor: on ? 'var(--ember)' : 'color-mix(in oklab, var(--ember) 40%, transparent)', background: on ? 'linear-gradient(to top, transparent, color-mix(in oklab, var(--ember) 75%, transparent))' : 'linear-gradient(to top, transparent, color-mix(in oklab, var(--ember) 22%, transparent))', boxShadow: on ? '0 -8px 24px -6px color-mix(in oklab, var(--ember) 60%, transparent)' : 'none' }} />
                  </button>
                </li>
              )
            })}
          </ul>
          <ul aria-hidden="true" className="m-0 mt-2 flex list-none gap-2 p-0">{batang.map((h) => <li key={h.id} className={`min-w-0 flex-1 text-center font-mono text-[10px] ${h.id === hb.id ? 'font-bold text-ink' : 'text-ink-2'}`}>{h.id.slice(2)}</li>)}</ul>
          <p className="m-0 mt-4 text-sm leading-snug text-ink-2" aria-live="polite">{tr(`${hb.id} · ${namaLahan(hb.jenisLahan, b)} · api menjalar ke ${namaArah((hb.angin.theta + 180) % 360, b)} · kepercayaan ${confNama[hb.confidence]}`, `${hb.id} · ${namaLahan(hb.jenisLahan, b)} · fire spreads ${namaArah((hb.angin.theta + 180) % 360, b)} · ${confNama[hb.confidence]} confidence`)}</p>
        </section>

        {/* Baris ketiga: ranking pemukiman, aktivitas, alur tindak lanjut */}
        <section aria-labelledby="pem-h" className={`${KARTU} xl:col-span-5`} style={{ ...KILAU, ...tunda(4) }}>
          <Judul aksi={<Tautan to="/admin/peta">{tr('Peta risiko', 'Risk map')}<ArrowUpRight size={13} aria-hidden="true" /></Tautan>}><span id="pem-h">{tr('Pemukiman di jalur api', 'Settlements in the fire’s path')}</span></Judul>
          {risiko.length === 0 ? <Kosong teks={tr('Belum ada pemukiman dalam zona sebaran.', 'No settlements are inside a spread zone yet.')} /> : (
            <ol className="m-0 grid list-none gap-2 p-0">
              {risiko.map((r) => (
                <li key={r.nama} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1.5 rounded-2xl bg-bg/50 px-3.5 py-3">
                  <span className="min-w-0 truncate text-sm font-semibold">{r.nama}</span>
                  <span className="judul-display text-xl font-bold leading-none tabular-nums" style={{ color: WARNA_KAT[r.kategori] }}>{r.skor}</span>
                  <span role="img" aria-label={tr(`Skor ${r.skor} dari 100`, `Score ${r.skor} out of 100`)} className="block h-1.5 overflow-hidden rounded-full bg-line/70"><span className="block h-full rounded-full transition-[width] duration-700 ease-snap" style={{ width: `${r.skor}%`, background: WARNA_KAT[r.kategori] }} /></span>
                  <span className="text-xs text-ink-2">±{r.zona} {tr('jam', 'h')}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="akt-h" className={`${KARTU} xl:col-span-4`} style={{ ...KILAU, ...tunda(5) }}>
          <Judul aksi={<Tautan to="/admin/aktivitas">{tr('Log', 'Log')}<ArrowRight size={13} aria-hidden="true" /></Tautan>}><span id="akt-h">{tr('Aktivitas terbaru', 'Latest activity')}</span></Judul>
          {kejadian.length === 0 ? <Kosong teks={tr('Belum ada aktivitas.', 'No activity yet.')} /> : (
            <ol className="m-0 grid list-none gap-2 p-0">
              {kejadian.map((k, i) => (
                <li key={`${k.t}-${i}`} className="grid grid-cols-[0.5rem_minmax(0,1fr)] items-start gap-x-3 rounded-2xl bg-bg/50 px-3.5 py-3">
                  <span aria-hidden="true" className="mt-1.5 size-2 rounded-full" style={{ background: k.warna }} />
                  <span className="min-w-0"><span className="line-clamp-2 block text-sm leading-snug">{k.teks}</span><span className="mt-0.5 block font-mono text-[11px] text-ink-2"><Waktu t={k.t} /></span></span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-labelledby="alur-h" className={`${KARTU} xl:col-span-3`} style={{ ...KILAU, ...tunda(6) }}>
          <Judul><span id="alur-h">{tr('Tindak lanjut', 'Follow-up')}</span></Judul>
          <p className="m-0 flex items-baseline gap-2"><span className="judul-display text-[2.75rem] font-bold leading-none tabular-nums"><Angka n={status.selesai} /></span><span className="text-sm text-ink-2">{tr(`dari ${semua.length} selesai`, `of ${semua.length} resolved`)}</span></p>
          <div role="img" aria-label={tr(`${status.selesai} dari ${semua.length} laporan selesai`, `${status.selesai} of ${semua.length} reports resolved`)} className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full">
            {TINDAK.map((st) => <span key={st} className="h-full min-w-1 rounded-full transition-[flex-grow] duration-700 ease-snap" style={{ flexGrow: status[st] || 0.01, flexBasis: 0, background: WARNA_STATUS[st] }} />)}
          </div>
          <ul className="m-0 mt-5 grid list-none gap-2 p-0">
            {TINDAK.map((st) => (
              <li key={st}><Link to={`/admin/laporan?status=${st}`} className="flex items-center justify-between gap-3 rounded-2xl bg-bg/50 px-3.5 py-2.5 text-sm no-underline transition-colors duration-150 hover:bg-bg">
                <span className="flex items-center gap-2.5 font-medium text-ink"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: WARNA_STATUS[st] }} />{tr(...TINDAK_LABEL[st])}</span>
                <b className="judul-display text-xl leading-none tabular-nums text-ink">{status[st]}</b>
              </Link></li>
            ))}
          </ul>
        </section>

        {/* Data sisi pengunjung: titik panas nyata (sama dengan Peta) dan kemajuan belajar di perangkat ini */}
        <KartuSipongi />
        <KartuBelajar />
      </div>
    </>
  )
}
