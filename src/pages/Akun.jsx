import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenText, CheckCircle2, LogOut, MapPinned, Target, Trash2, Bookmark, ArrowUpRight, ArrowRight, ShieldCheck } from 'lucide-react'
import { Container, Pill } from '../components/ui'
import Parallax from '../components/Parallax'
import { useAuth } from '../components/authContext'
import { Tingkat, Waktu, Kosong } from './admin/kit'
import { daftarKuis, semuaChecklist } from '../lib/kontenEdukasi'
import { daftarArtikel } from '../lib/artikel'
import { hitungCentang, muatBaca, muatSkor } from '../lib/progres'
import { muatSimpan, alihSimpan } from '../lib/simpan'
import { hapusRuang, potretRuang, pulihkanRuang } from '../lib/ruang'
import { useToast } from '../components/ui/toastContext'
import { useJudul } from '../lib/useJudul'
import { useBahasa, useTr } from '../i18n'

// Ringkasan pribadi akun: ini yang tidak dimiliki tamu (progres, simpanan, dan riwayat laporan).

// Deretan segmen: tiap segmen = satu satuan (bacaan, soal, langkah). Masuk berurutan, jadi progres terasa "dinyalakan".
function Segmen({ n, isi, tebal }) {
  return (
    <span aria-hidden="true" className="flex w-full items-center gap-[3px]">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{ animationDelay: `${180 + i * 40}ms` }}
          className={`zona-masuk block flex-1 rounded-full ${tebal ? 'h-3.5' : 'h-2.5'} ${i < isi ? 'bg-ember' : 'bg-line'}`} />
      ))}
    </span>
  )
}

function Meter({ Ikon, label, nilai, n, isi, ke, tebal, ket }) {
  return (
    <li>
      <Link to={ke} className="group grid gap-2.5 py-4 transition-[translate] duration-300 ease-snap hover:translate-x-1">
        <span className="flex items-baseline justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-semibold"><Ikon size={16} aria-hidden="true" className="text-ember-ink" />{label}</span>
          <span className="flex items-baseline gap-2"><span className="judul-display text-3xl leading-none tabular-nums">{nilai}</span><ArrowRight size={15} aria-hidden="true" className="self-center text-ink-2 transition-[translate,color] duration-300 ease-snap group-hover:translate-x-1 group-hover:text-ember-ink" /></span>
        </span>
        <Segmen n={n} isi={isi} tebal={tebal} />
        <span className="text-xs text-ink-2">{ket}</span>
      </Link>
    </li>
  )
}

export default function Akun() {
  const { sesi, keluar } = useAuth()
  const b = useBahasa()
  const tr = useTr()
  useJudul(tr('Akun saya', 'My account'))
  const semua = daftarArtikel(b)
  const [baca, setBaca] = useState(muatBaca)
  const [skor, setSkor] = useState(muatSkor)
  const [centang, setCentang] = useState(hitungCentang)
  const [simpan, setSimpan] = useState(muatSimpan)
  const [laporan, setLaporan] = useState(null)
  const [konfirmasi, setKonfirmasi] = useState(false)

  useEffect(() => {
    let langganan
    let batal = false
    // Dexie dimuat belakangan, sama seperti SyncProvider, agar bundel awal tetap kecil
    import('../lib/db').then(({ db }) =>
      import('dexie').then(({ liveQuery }) => {
        if (batal) return
        langganan = liveQuery(() => db.reports.orderBy('createdAt').reverse().toArray()).subscribe({
          next: (r) => setLaporan(r.filter((x) => x.pemilik === sesi.email)),
          error: () => setLaporan([]),
        })
      }),
    ).catch(() => setLaporan([]))
    return () => { batal = true; langganan?.unsubscribe() }
  }, [sesi.email])

  const nCentang = semuaChecklist(b).length
  const nKuis = daftarKuis(b).length
  const belumBaca = semua.find((a) => !baca.includes(a.slug))
  const tersimpan = simpan.map((s) => semua.find((a) => a.slug === s)).filter(Boolean)
  const nama1 = sesi.nama.split(' ')[0]

  const toast = useToast()
  const muatUlang = () => { setBaca(muatBaca()); setSkor(muatSkor()); setCentang(hitungCentang()); setSimpan(muatSimpan()) }
  // Progres dihapus, tapi salinannya disimpan sebentar: toast menawarkan Urungkan (atau Ctrl/Cmd+Z)
  const hapusProgres = () => {
    const salinan = potretRuang(sesi.email)
    hapusRuang(sesi.email)
    setBaca([]); setSkor(null); setCentang(0); setSimpan([]); setKonfirmasi(false)
    toast.show(tr('Progres diatur ulang.', 'Progress reset.'), 'info', { kunci: 'progres', aksi: { label: tr('Urungkan', 'Undo'), urungkan: true, jalankan: () => { pulihkanRuang(salinan); muatUlang() } } })
  }
  const lepas = (slug) => setSimpan(alihSimpan(slug))

  const nBaca = semua.length
  const total = Math.round(((baca.length / Math.max(nBaca, 1)) + (centang / Math.max(nCentang, 1)) + (skor ? skor.skor / Math.max(skor.total, 1) : 0)) / 3 * 100)
  const tingkat = total >= 100 ? tr('Penjaga api', 'Fire guardian') : total >= 60 ? tr('Siaga', 'Prepared') : total >= 25 ? tr('Pengamat', 'Observer') : tr('Pemula', 'Newcomer')

  return (
    <>
      <header className="hero-malam relative isolate overflow-hidden">
        <Parallax kecepatan={0.3} bleed={0.25} className="-z-10"><img src="/foto/hutan-kabut.webp" alt="" aria-hidden="true" className="size-full object-cover opacity-50" /></Parallax>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/60 to-bg/20" aria-hidden="true" />
        <Container className="pb-24 pt-28 md:pb-28 md:pt-36">
          <p className="m-0 font-mono text-xs uppercase tracking-[0.2em] text-ember-ink">{tr('Ruang pribadi · akun demo', 'Personal space · demo account')}</p>
          <h1 className="mt-2 text-[clamp(2.75rem,8vw,6.5rem)] leading-[0.98]">{tr(`Halo, ${nama1}`, `Hi, ${nama1}`)}</h1>
        </Container>
      </header>

      <div className="flow-root bg-band"><Container className="relative z-10 -mt-14 pb-14 md:-mt-16 md:pb-20">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-6">
          {/* Kartu identitas: tetap menempel saat konten kanan digulir */}
          <aside aria-label={tr('Identitas akun', 'Account identity')} className="grid gap-5 lg:sticky lg:top-24">
            <div data-spot className="rounded-3xl border border-line bg-surface p-6">
              <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                <span className="relative flex size-[7.5rem] shrink-0 items-center justify-center">
                  <svg viewBox="0 0 120 120" aria-hidden="true" className="absolute inset-0 size-full -rotate-90">
                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="5" stroke="currentColor" className="text-line" />
                    <circle cx="60" cy="60" r="54" fill="none" strokeWidth="5" strokeLinecap="round" stroke="currentColor" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - total} className="cincin-isi text-ember" />
                  </svg>
                  <span className="flex size-[5.5rem] items-center justify-center rounded-full bg-ember font-display text-5xl font-extrabold text-on-ember [font-stretch:76%]">{sesi.nama.trim()[0]?.toUpperCase()}</span>
                </span>
                <div className="min-w-0">
                  <p className="m-0 font-mono text-xs uppercase tracking-[0.18em] text-ember-ink">{tingkat}</p>
                  <p className="judul-display m-0 mt-1 text-5xl leading-none tabular-nums">{total}<span className="text-2xl text-ink-2">%</span></p>
                  <p className="m-0 mt-1 text-xs text-ink-2">{tr('kesiapan keseluruhan', 'overall readiness')}</p>
                </div>
              </div>
              <dl className="m-0 mt-6 grid gap-3 border-t border-line pt-5 text-sm">
                <div><dt className="text-xs text-ink-2">{tr('Nama', 'Name')}</dt><dd className="m-0 font-semibold">{sesi.nama}</dd></div>
                <div className="min-w-0"><dt className="text-xs text-ink-2">Email</dt><dd className="m-0 truncate font-semibold">{sesi.email}</dd></div>
                <div><dt className="text-xs text-ink-2">{tr('Peran', 'Role')}</dt><dd className="m-0 inline-flex items-center gap-1.5 font-semibold"><ShieldCheck size={14} aria-hidden="true" className="text-canopy" />{tr('Pengguna', 'User')}</dd></div>
              </dl>
              <button type="button" onClick={keluar} className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-ink-2/60 font-semibold transition-[background-color,color,scale] duration-200 ease-snap hover:bg-ink hover:text-bg active:scale-95">
                <LogOut size={16} aria-hidden="true" />{tr('Keluar', 'Sign out')}
              </button>
            </div>

            <section aria-labelledby="data-h" className="px-2">
              <h2 id="data-h" className="m-0 text-sm font-semibold">{tr('Data di perangkat ini', 'Data on this device')}</h2>
              <p className="m-0 mt-1 text-xs leading-relaxed text-ink-2">{tr('Demo tanpa server: progres, simpanan, dan riwayat hanya tersimpan di peramban ini.', 'Serverless demo: progress, saved items, and history live only in this browser.')}</p>
              {konfirmasi ? (
                <div className="mt-3 flex items-center gap-2" role="group" aria-label={tr('Konfirmasi hapus progres', 'Confirm progress reset')}>
                  <button type="button" onClick={hapusProgres} className="inline-flex min-h-10 items-center rounded-full bg-flame px-4 text-sm font-semibold text-on-ember active:scale-95">{tr('Ya, hapus', 'Yes, reset')}</button>
                  <button type="button" onClick={() => setKonfirmasi(false)} className="inline-flex min-h-10 items-center rounded-full border border-line px-4 text-sm font-semibold">{tr('Batal', 'Cancel')}</button>
                </div>
              ) : (
                <button type="button" onClick={() => setKonfirmasi(true)} className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-2 underline-offset-4 transition-colors duration-200 hover:text-flame hover:underline"><Trash2 size={15} aria-hidden="true" />{tr('Atur ulang progres', 'Reset progress')}</button>
              )}
            </section>
          </aside>

          <div className="grid min-w-0 gap-5">
            {/* Langkah berikutnya: satu ajakan besar, bukan kartu biasa */}
            <section aria-labelledby="lanjut-h" className="hutan relative isolate overflow-hidden rounded-3xl p-6 sm:p-8">
              <span aria-hidden="true" className="judul-display pointer-events-none absolute -bottom-10 right-2 -z-10 select-none text-[11rem] leading-none opacity-[0.12] sm:text-[15rem]">{belumBaca ? baca.length + 1 : '✓'}</span>
              <p className="m-0 font-mono text-xs uppercase tracking-[0.2em] opacity-90">{tr('Langkah berikutnya', 'Next up')}</p>
              {belumBaca ? (
                <>
                  <h2 id="lanjut-h" className="mt-3 max-w-[20ch] text-3xl leading-tight sm:text-4xl">{belumBaca.judul}</h2>
                  <p className="m-0 mt-2 max-w-[52ch] text-base opacity-95">{belumBaca.ringkas}</p>
                  <Link to={`/edukasi/${belumBaca.slug}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ember px-5 font-semibold text-on-ember transition-[scale] duration-200 ease-snap hover:scale-105 active:scale-95">{tr(`Baca · ${belumBaca.menit} menit`, `Read · ${belumBaca.menit} min`)}<ArrowUpRight size={16} aria-hidden="true" /></Link>
                </>
              ) : (
                <>
                  <h2 id="lanjut-h" className="mt-3 text-3xl leading-tight sm:text-4xl">{tr('Semua bacaan selesai', 'Every read finished')}</h2>
                  <p className="m-0 mt-2 max-w-[52ch] text-base opacity-95">{skor ? tr('Coba ulang kuis untuk menaikkan skor terbaikmu.', 'Retake the quiz to raise your best score.') : tr(`Uji pemahamanmu dengan ${nKuis} soal.`, `Test yourself with ${nKuis} questions.`)}</p>
                  <Link to="/kuis" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-ember px-5 font-semibold text-on-ember transition-[scale] duration-200 ease-snap hover:scale-105 active:scale-95">{tr('Main kuis', 'Play the quiz')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
                </>
              )}
            </section>

            {/* Progres: tiga meter bersegmen dengan ritme berbeda (4 balok, 5 soal, 17 langkah) */}
            <section aria-labelledby="siap-h" className="rounded-3xl border border-line bg-surface px-6 pb-2 pt-6 sm:px-8">
              <h2 id="siap-h" className="m-0 text-base font-semibold">{tr('Progres kesiapan', 'Readiness progress')}</h2>
              <ul className="m-0 mt-1 list-none divide-y divide-line p-0">
                <Meter Ikon={BookOpenText} label={tr('Bacaan selesai', 'Reads finished')} nilai={`${baca.length}/${nBaca}`} n={nBaca} isi={baca.length} ke="/edukasi?tab=artikel" tebal
                  ket={tr('Tiap balok satu artikel', 'One block per article')} />
                <Meter Ikon={Target} label={tr('Skor kuis terbaik', 'Best quiz score')} nilai={skor ? `${skor.skor}/${skor.total}` : '–'} n={skor?.total ?? nKuis} isi={skor?.skor ?? 0} ke="/kuis"
                  ket={skor ? tr('Tiap segmen satu soal benar', 'One segment per correct answer') : tr('Belum pernah main', 'Not played yet')} />
                <Meter Ikon={CheckCircle2} label={tr('Langkah siaga siap', 'Prep steps ready')} nilai={`${centang}/${nCentang}`} n={nCentang} isi={centang} ke="/edukasi?tab=checklist"
                  ket={tr('Tiap garis satu langkah persiapan', 'One tick per prep step')} />
              </ul>
            </section>

            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
              {/* Laporan: lini masa bertitik, bukan daftar baris */}
              <section id="laporan-saya" aria-labelledby="lap-h" className="scroll-mt-28 rounded-3xl border border-line bg-surface p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="lap-h" className="m-0 flex items-center gap-2 text-base font-semibold"><MapPinned size={17} aria-hidden="true" className="text-ember-ink" />{tr('Laporan saya', 'My reports')}{laporan && <span className="font-mono text-xs font-normal text-ink-2">{laporan.length}</span>}</h2>
                  <Link to="/lapor" className="inline-flex min-h-9 items-center text-sm font-semibold text-ember-ink underline-offset-4 hover:underline">{tr('Buat laporan', 'New report')}</Link>
                </div>
                <div className="mt-4">
                  {laporan === null ? <p role="status" className="m-0 text-sm text-ink-2">{tr('Memuat…', 'Loading…')}</p>
                    : laporan.length === 0 ? <Kosong teks={tr('Belum ada laporan dari akun ini. Laporan tamu tidak masuk ke daftar ini.', 'No reports from this account yet. Guest reports are not listed here.')} />
                    : (
                      <ol className="relative m-0 list-none p-0 before:absolute before:bottom-2 before:left-[5px] before:top-2 before:w-px before:bg-line">
                        {laporan.map((r) => (
                          <li key={r.id} className="relative grid gap-1.5 pb-5 pl-7 last:pb-0">
                            <span aria-hidden="true" className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-surface bg-ember ring-1 ring-ember" />
                            <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><Tingkat v={r.severity} /><span className="font-mono text-sm tabular-nums">{r.lat.toFixed(3)}, {r.lon.toFixed(3)}</span><span className="ml-auto"><Pill variant={r.status === 'synced' ? 'synced' : r.status === 'failed' ? 'gagal' : 'pending'} /></span></span>
                            <span className="text-sm text-ink-2"><Waktu t={r.createdAt} /></span>
                            {r.note && <p className="m-0 text-sm text-ink-2">{r.note}</p>}
                          </li>
                        ))}
                      </ol>
                    )}
                </div>
              </section>

              {/* Simpanan: rak penanda buku */}
              <section aria-labelledby="simpan-h" className="rounded-3xl border border-line bg-surface p-6">
                <h2 id="simpan-h" className="m-0 flex items-center gap-2 text-base font-semibold"><Bookmark size={17} aria-hidden="true" className="text-ember-ink" />{tr('Artikel tersimpan', 'Saved articles')}{tersimpan.length > 0 && <span className="font-mono text-xs font-normal text-ink-2">{tersimpan.length}</span>}</h2>
                {tersimpan.length === 0 ? (
                  <div className="mt-4"><Kosong teks={tr('Belum ada. Buka artikel lalu tekan Simpan; fitur ini hanya untuk akun.', 'Nothing yet. Open an article and press Save; this is for accounts only.')} /></div>
                ) : (
                  <ul className="m-0 mt-4 grid list-none gap-2 p-0">
                    {tersimpan.map((a) => (
                      <li key={a.slug} className="group/s relative flex items-stretch overflow-hidden rounded-xl border border-line transition-[border-color,translate] duration-300 ease-snap hover:-translate-y-0.5 hover:border-ember-ink/60">
                        <span aria-hidden="true" className="w-1.5 shrink-0 bg-ember transition-[width] duration-300 ease-snap group-hover/s:w-2.5" />
                        <Link to={`/edukasi/${a.slug}`} className="min-w-0 flex-1 px-4 py-3 font-semibold leading-snug hover:text-ember-ink">{a.judul}<span className="block text-sm font-normal text-ink-2">{tr(`${a.menit} menit baca`, `${a.menit} min read`)}</span></Link>
                        <button type="button" onClick={() => lepas(a.slug)} aria-label={tr(`Hapus ${a.judul} dari simpanan`, `Remove ${a.judul} from saved`)} className="flex w-11 shrink-0 items-center justify-center text-ink-2 transition-colors duration-200 hover:text-flame"><Trash2 size={15} aria-hidden="true" /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>
      </Container></div>
    </>
  )
}
