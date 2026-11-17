import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Info, MapPin, Search, Siren, TriangleAlert, X } from 'lucide-react'
import Angka from './Angka'
import { JINGGA, Kosong, Segmen, SEV, Waktu, WARNA_SEV, WARNA_STATUS } from './kit'
import { useAdmin } from '../../components/useAdmin'
import { useSinkron } from '../../components/syncContext'
import { catat, gabungLaporan, setTindak, statusTindak, terdekat, TINDAK, TINDAK_LABEL } from '../../lib/admin'
import { useAuth } from '../../components/authContext'
import { useToast } from '../../components/ui/toastContext'
import { useJudul } from '../../lib/useJudul'
import { useSorot } from '../../lib/sorot'
import { lokal, useBahasa, useTr } from '../../i18n'

const IKON_SEV = { berat: Siren, sedang: TriangleAlert, ringan: Info }
const KACA = 'rounded-[1.75rem] border border-line shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--text)_9%,transparent)]'

// Rincian satu laporan: kartu bernuansa tingkat, ubin info, dan jalur status empat langkah dengan tombol "majukan".
function Rincian({ r, st, ubahStatus, tutup }) {
  const tr = useTr()
  const b = useBahasa()
  const dekat = terdekat(r.lat, r.lon)
  const km = dekat.km.toFixed(1).replace('.', b === 'en' ? '.' : ',')
  const idx = TINDAK.indexOf(st)
  const berikut = TINDAK[idx + 1]
  const warna = WARNA_SEV[r.severity]
  const Ikon = IKON_SEV[r.severity]
  return (
    <div key={r.id} className={`${KACA} tab-ganti relative isolate overflow-hidden p-5 sm:p-6`} style={{ background: `linear-gradient(180deg, color-mix(in oklab, ${warna} 24%, var(--surface)) 0%, var(--surface) 52%)` }}>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 inline-flex items-center gap-2 rounded-full border border-line bg-bg/60 px-3 py-1 text-sm font-medium text-ink-2"><Ikon size={15} aria-hidden="true" style={{ color: warna }} />{tr('Tingkat', 'Severity')}</p>
        {tutup && <button type="button" onClick={tutup} aria-label={tr('Tutup rincian', 'Close details')} className="flex size-9 items-center justify-center rounded-full border border-line bg-bg/60 text-ink-2 lg:hidden"><X size={16} aria-hidden="true" /></button>}
      </div>
      <p className="judul-display m-0 mt-3 text-[4.25rem] font-extrabold leading-[0.9]" style={{ color: warna }}>{tr(SEV[r.severity][0], SEV[r.severity][1])}</p>
      <p className="m-0 mt-4 text-base leading-relaxed">{lokal(r, b).note || <span className="text-ink-2">{tr('Tanpa catatan', 'No note')}</span>}</p>

      <dl className="m-0 mt-5 grid grid-cols-2 gap-2.5 text-sm">
        <div className="rounded-2xl border border-line bg-bg/60 p-3.5"><dt className="m-0 text-xs text-ink-2">{tr('Diterima', 'Received')}</dt><dd className="m-0 mt-1 font-semibold"><Waktu t={r.createdAt} /></dd></div>
        <div className="rounded-2xl border border-line bg-bg/60 p-3.5"><dt className="m-0 text-xs text-ink-2">{tr('Sumber', 'Source')}</dt><dd className="m-0 mt-1 font-semibold">{r.demo ? tr('Contoh demo', 'Demo sample') : r.sync === 'synced' ? tr('Tersinkron', 'Synced') : tr('Belum terkirim', 'Not sent')}</dd></div>
        <div className="col-span-2 rounded-2xl border border-line bg-bg/60 p-3.5">
          <dt className="m-0 flex items-center gap-1.5 text-xs text-ink-2"><MapPin size={13} aria-hidden="true" />{tr('Pemukiman terdekat', 'Nearest settlement')}</dt>
          <dd className="m-0 mt-1 flex items-baseline justify-between gap-3 font-semibold"><span>{dekat.nama}</span><span className="font-mono text-xs font-normal text-ink-2">{r.lat.toFixed(3)}, {r.lon.toFixed(3)}</span></dd>
          <dd className="m-0 mt-2.5 flex items-center gap-3 text-xs text-ink-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/70" aria-hidden="true"><span className="block h-full rounded-full" style={{ width: `${Math.max(6, 100 - Math.min(dekat.km, 10) * 10)}%`, background: dekat.km < 3 ? 'var(--flame)' : 'var(--amber)' }} /></span>±{km} km</dd>
        </div>
      </dl>

      <fieldset className="m-0 mt-6 border-0 p-0">
        <legend className="mb-3 p-0 text-sm font-semibold text-ink-2">{tr('Status tindak lanjut', 'Follow-up status')}</legend>
        <div className="relative">
          <span aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-[1.3rem] h-0.5 rounded-full bg-line" />
          <span aria-hidden="true" className="absolute left-[12.5%] top-[1.3rem] h-0.5 rounded-full bg-ember transition-[width] duration-500 ease-snap" style={{ width: `${(idx / 3) * 75}%` }} />
          <div className="relative grid grid-cols-4">
            {TINDAK.map((s, i) => {
              const on = st === s
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => ubahStatus(r, s)} className="group flex min-h-11 flex-col items-center gap-1.5 rounded-xl py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ember-ink">
                  <span className={`flex size-[2.6rem] items-center justify-center rounded-full border-2 text-sm font-bold transition-[background-color,border-color,color,scale] duration-300 ease-snap group-hover:scale-110 group-active:scale-90 ${on ? 'text-on-ember' : i < idx ? 'border-ember text-ember-ink' : 'border-line bg-surface text-ink-2'}`} style={on ? { background: WARNA_STATUS[s], borderColor: WARNA_STATUS[s] } : i < idx ? { background: 'var(--surface)' } : undefined}>{i < idx ? <Check size={16} aria-hidden="true" /> : i + 1}</span>
                  <span className={`text-center text-[11px] leading-tight ${on ? 'font-bold text-ink' : 'text-ink-2'}`}>{tr(...TINDAK_LABEL[s])}</span>
                </button>
              )
            })}
          </div>
        </div>
      </fieldset>
      {berikut ? (
        <button type="button" onClick={() => ubahStatus(r, berikut)} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-base font-bold text-on-ember transition-[filter,scale] duration-150 ease-snap hover:brightness-110 active:scale-[0.97]" style={JINGGA}>{tr(`Majukan ke ${TINDAK_LABEL[berikut][0]}`, `Move to ${TINDAK_LABEL[berikut][1]}`)}<ArrowRight size={17} aria-hidden="true" /></button>
      ) : <p className="m-0 mt-5 rounded-full border border-line bg-bg/60 px-4 py-3 text-center text-sm font-medium text-ink-2">{tr('Laporan ini sudah selesai ditangani.', 'This report has been resolved.')}</p>}
      <Link to="/admin/peta" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-ember-ink underline-offset-4 hover:underline">{tr('Lihat di peta risiko', 'See it on the risk map')}<ArrowRight size={14} aria-hidden="true" /></Link>
    </div>
  )
}

export default function Laporan() {
  const tr = useTr()
  const b = useBahasa()
  useJudul(tr('Laporan lapangan', 'Field reports'))
  const { sesi } = useAuth()
  const { tindak } = useAdmin()

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
  const [sp] = useSearchParams()
  const semua = useMemo(() => gabungLaporan(dariDb ?? []), [dariDb])
  const [status, setStatus] = useState(() => (TINDAK.includes(sp.get('status')) ? sp.get('status') : 'semua'))
  const [tingkat, setTingkat] = useState('semua')
  const [cari, setCari] = useState('')
  const [pilihId, setPilih] = useState(() => sp.get('r'))
  useSorot()
  // Tiba dari pencarian (?r=id): pilih laporannya dan buka semua saringan agar tidak tersembunyi
  const [rLama, setRLama] = useState(sp.get('r'))
  if (sp.get('r') !== rLama) {
    setRLama(sp.get('r'))
    if (sp.get('r')) { setPilih(sp.get('r')); setStatus('semua'); setTingkat('semua'); setCari('') }
  }

  const hitung = (s) => semua.filter((r) => statusTindak(r.id, tindak) === s).length
  const tampil = semua.filter((r) => {
    if (status !== 'semua' && statusTindak(r.id, tindak) !== status) return false
    if (tingkat !== 'semua' && r.severity !== tingkat) return false
    const q = cari.trim().toLowerCase()
    return !q || `${lokal(r, b).note ?? ''} ${terdekat(r.lat, r.lon).nama}`.toLowerCase().includes(q)
  })
  const aktif = tampil.find((r) => r.id === pilihId) ?? tampil[0]

  const ubahStatus = (r, s) => {
    const lama = statusTindak(r.id, tindak)
    if (lama === s) return
    setTindak(r.id, s)
    umumkan(r, lama, s)
    catat([`Status laporan ${terdekat(r.lat, r.lon).nama} → ${TINDAK_LABEL[s][0]}`, `Report near ${terdekat(r.lat, r.lon).nama} → ${TINDAK_LABEL[s][1]}`], sesi?.nama)
  }

  // Triase lewat papan ketik: panah atau J/K memilih laporan, angka 1-4 menandai status. Tidak aktif saat mengetik di isian.
  const kunci = useRef(null)
  useEffect(() => { kunci.current = { tampil, aktif, ubahStatus } })
  useEffect(() => {
    const tekan = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      const { tampil: daftar, aktif: a, ubahStatus: ubah } = kunci.current
      if (!daftar.length) return
      const idx = Math.max(0, daftar.findIndex((r) => r.id === a?.id))
      if (['ArrowDown', 'j'].includes(e.key) || ['ArrowUp', 'k'].includes(e.key)) {
        e.preventDefault()
        const baru = daftar[Math.min(daftar.length - 1, Math.max(0, idx + (['ArrowDown', 'j'].includes(e.key) ? 1 : -1)))]
        setPilih(baru.id)
        document.getElementById(`lap-${baru.id}`)?.scrollIntoView({ block: 'nearest' })
      } else if (/^[1-4]$/.test(e.key) && a && TINDAK[Number(e.key) - 1]) {
        ubah(a, TINDAK[Number(e.key) - 1])
      }
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [])

  const jumlahSemua = semua.length || 1
  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
        <h1 className="m-0 text-3xl leading-none sm:text-4xl">{tr('Laporan lapangan', 'Field reports')}</h1>
        <p className="m-0 text-sm text-ink-2">{tr('Pilih laporan untuk melihat rincian, lalu majukan tindak lanjutnya.', 'Pick a report to see its details, then move its follow-up forward.')}</p>
      </div>

      {/* Ubin status: sekaligus saringan. Yang aktif menyala. */}
      <div role="group" aria-label={tr('Saring menurut status', 'Filter by status')} className="sembunyi-gulir -mx-4 flex scroll-px-4 snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-5">
        {[['semua', tr('Semua', 'All'), semua.length, 'var(--ember)'], ...TINDAK.map((s) => [s, tr(...TINDAK_LABEL[s]), hitung(s), WARNA_STATUS[s]])].map(([k, l, n, w], i) => {
          const on = status === k
          return (
            <button key={k} type="button" aria-pressed={on} onClick={() => setStatus(k)} style={{ animationDelay: `${i * 60}ms`, background: on ? `linear-gradient(150deg, color-mix(in oklab, ${w} 30%, var(--surface)), var(--surface) 75%)` : 'var(--surface)', borderColor: on ? w : undefined }}
              className={`${KACA} group relative p-4 text-left outline-none transition-[border-color,background,translate] duration-300 ease-snap focus-visible:outline-2 focus-visible:outline-ember-ink motion-safe:[animation:tile-masuk_.5s_cubic-bezier(.2,.8,.2,1)_both] max-sm:min-w-[8.75rem] max-sm:shrink-0 max-sm:snap-start ${on ? '' : 'hover:-translate-y-0.5 hover:border-line-strong'}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-ink-2"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: w }} />{l}</span>
              <span className="judul-display mt-2 block text-5xl font-bold leading-none tabular-nums"><Angka n={n} /></span>
              <span aria-hidden="true" className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line/60"><span className="block h-full rounded-full transition-[width] duration-700 ease-snap" style={{ width: `${(n / jumlahSemua) * 100}%`, background: w }} /></span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="relative block min-w-[14rem] flex-1 sm:max-w-sm">
          <span className="sr-only">{tr('Cari laporan', 'Search reports')}</span>
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2" aria-hidden="true" />
          <input type="search" value={cari} onChange={(e) => setCari(e.target.value)} placeholder={tr('Cari catatan atau desa…', 'Search notes or village…')} className="min-h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm" />
        </label>
        <Segmen label={tr('Saring tingkat', 'Filter severity')} nilai={tingkat} onUbah={setTingkat} opsi={[['semua', tr('Semua tingkat', 'All levels')], ...Object.keys(SEV).map((k) => [k, tr(SEV[k][0], SEV[k][1])])]} />
        <p className="m-0 ml-auto hidden items-center gap-2 text-xs text-ink-2 xl:flex"><kbd className="rounded-md border border-line-strong px-1.5 font-mono text-[11px] text-ink">↑↓</kbd>{tr('pilih', 'select')}<kbd className="rounded-md border border-line-strong px-1.5 font-mono text-[11px] text-ink">1–4</kbd>{tr('status', 'status')}</p>
        <p role="status" className="m-0 font-mono text-xs text-ink-2 max-xl:ml-auto">{tr(`${tampil.length} dari ${semua.length} laporan`, `${tampil.length} of ${semua.length} reports`)}</p>
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div>
          {tampil.length === 0 ? <Kosong teks={tr('Tidak ada laporan yang cocok dengan saringan ini.', 'No reports match these filters.')} /> : (
            <ul className="m-0 grid list-none gap-2.5 p-0">
              {tampil.map((r) => {
                const st = statusTindak(r.id, tindak)
                const dipilih = aktif?.id === r.id
                const Ikon = IKON_SEV[r.severity]
                return (
                  <li key={r.id}>
                    <button type="button" id={`lap-${r.id}`} onClick={() => setPilih(r.id)} aria-pressed={pilihId === r.id || (!pilihId && dipilih)}
                      className={`grid w-full grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2 rounded-3xl border p-3.5 text-left transition-[border-color,background-color,translate] duration-200 ease-snap sm:grid-cols-[auto_minmax(0,1fr)_auto] ${dipilih ? 'border-ember' : 'border-line hover:-translate-y-px hover:border-line-strong'}`}
                      style={{ background: dipilih ? 'linear-gradient(120deg, color-mix(in oklab, var(--ember) 14%, var(--surface)), var(--surface) 70%)' : 'var(--surface)' }}>
                      <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-2xl bg-band" style={{ color: WARNA_SEV[r.severity] }}><Ikon size={22} /></span>
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5"><b className="text-[15px] font-semibold">{terdekat(r.lat, r.lon).nama}</b><span className="text-xs text-ink-2"><Waktu t={r.createdAt} /></span>{r.demo && <span className="rounded-full border border-line px-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-2">Demo</span>}</span>
                        <span className="mt-1 line-clamp-2 block text-sm leading-snug text-ink-2">{lokal(r, b).note || tr('Tanpa catatan', 'No note')}</span>
                        <span className="mt-2 block text-xs font-semibold" style={{ color: WARNA_SEV[r.severity] }}>{tr(SEV[r.severity][0], SEV[r.severity][1])}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 justify-self-start rounded-full border border-line bg-bg/60 px-3 py-1.5 text-xs font-semibold max-sm:col-start-2 sm:justify-self-end"><span aria-hidden="true" className="size-2 rounded-full" style={{ background: WARNA_STATUS[st] }} />{tr(...TINDAK_LABEL[st])}</span>
                    </button>
                    {pilihId === r.id && <div className="mt-2.5 lg:hidden"><Rincian r={r} st={st} ubahStatus={ubahStatus} tutup={() => setPilih(null)} /></div>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <div className="sticky top-20 hidden lg:block">
          {aktif ? <Rincian r={aktif} st={statusTindak(aktif.id, tindak)} ubahStatus={ubahStatus} /> : <Kosong teks={tr('Belum ada laporan terpilih.', 'No report selected.')} />}
        </div>
      </div>
    </>
  )
}
