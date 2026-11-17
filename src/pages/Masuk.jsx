import { useState } from 'react'
import { Navigate, Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowBigUp, Bookmark, LoaderCircle, BookOpen, CircleAlert, ClipboardList, Eye, EyeOff, Flame, LayoutDashboard, Lock, LockKeyhole, Mail, MapPinned, MessagesSquare, ShieldCheck, UserRound } from 'lucide-react'
import { useAuth } from '../components/authContext'
import SambutanMasuk from '../components/SambutanMasuk'
import { AKUN, pesanMasuk, tujuanSetelahMasuk, validasiMasuk } from '../lib/auth'
import { kurangiGerak } from '../lib/gerak'
import { POLA, sentuhan } from '../lib/sentuhan'
import { useJudul } from '../lib/useJudul'
import { useBahasa, useTr } from '../i18n'

// Kolom berkotak dengan ikon di kiri dan "bibir" bawah yang berubah oranye saat difokus (bahasa visual yang sama dengan tombol dan kuis)
const KOLOM = 'peer block min-h-14 w-full rounded-2xl border-2 bg-bg pl-12 pr-4 text-base text-ink shadow-[0_3px_0_0_var(--line-strong)] outline-none transition-[border-color,box-shadow,translate] duration-150 ease-snap placeholder:text-ink-2/70 focus:border-ember-ink focus:shadow-[0_3px_0_0_var(--ember-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-ink'
const IKON = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-2 transition-colors duration-150 peer-focus:text-ember-ink'
const HURUF = ['bg-ember', 'bg-amber', 'bg-canopy'] // satu warna per ubin, urutan tetap
const MASUK = 'motion-safe:[animation:tile-masuk_.55s_cubic-bezier(.2,.8,.2,1)_both]'
const BIBIR = 'color-mix(in_oklab,var(--ember)_55%,var(--bg))'
const lapis = (persen) => ({ fill: `color-mix(in oklab, var(--canopy) ${persen}%, var(--bg))` })

// Latar datar: langit, matahari, tiga lapis bukit polos (tanpa pohon). Kedalaman dari lapisan warna, bukan dari foto atau cahaya.
// Dengan kursor, tiap lapis bergeser berbeda (yang dekat paling jauh), dan matahari terbit pelan saat halaman dibuka.
const LAPIS = [
  ['M0 150 C180 88 340 150 520 118 S880 36 1100 96 S1360 78 1440 100 V360 H0Z', 26, '-8px', '-3px'],
  ['M0 232 C200 172 380 232 600 198 S1000 150 1200 200 S1380 190 1440 202 V360 H0Z', 56, '-18px', '-6px'],
  ['M0 300 C260 262 520 306 760 284 S1200 250 1440 286 V360 H0Z', 100, '-30px', '-9px'],
]
function Latar() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-band">
      <span className="matahari-terbit absolute left-[42%] top-[11%] size-16 rounded-full bg-amber transition-[translate] duration-700 ease-out [translate:calc(var(--mx,0)*-6px)_calc(var(--my,0)*-4px)] max-lg:hidden xl:left-[46%] xl:size-24" />
      {LAPIS.map(([d, p, x, y]) => (
        <svg key={p} viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice" style={{ translate: `calc(var(--mx,0) * ${x}) calc(var(--my,0) * ${y})` }}
          className="absolute -bottom-4 left-[-2.5rem] h-[min(46%,22rem)] w-[calc(100%+5rem)] transition-[translate] duration-500 ease-out">
          <path d={d} style={lapis(p)} />
        </svg>
      ))}
    </div>
  )
}

// Halaman masuk: pilih peran dulu, lalu isi. Sisi kiri menunjukkan apa yang didapat tiap peran.
// Sesudah berhasil, layar sambutan TORA tampil dulu (pertama kali vs sudah pernah) sebelum pindah halaman.
export default function Masuk() {
  const tr = useTr()
  const b = useBahasa()
  useJudul(tr('Masuk', 'Sign in'))
  const { sesi, masuk, sambut, tutupSambut } = useAuth()
  const lokasi = useLocation()
  const pindah = useNavigate()
  const [isi, setIsi] = useState({ email: '', sandi: '' })
  const [peran, setPeran] = useState(null) // null = belum memilih; hanya mengisi akun demo dan menyorot manfaatnya
  const [lihat, setLihat] = useState(false)
  const [coba, setCoba] = useState(false)
  const [salah, setSalah] = useState(false)
  const [sibuk, setSibuk] = useState(false)
  const [kapital, setKapital] = useState(false) // Caps Lock menyala saat mengetik kata sandi
  const cekKapital = (e) => setKapital(Boolean(e.getModifierState?.('CapsLock')))
  const galat = coba ? validasiMasuk(isi, b) : {}
  const next = lokasi.state?.next
  const alasan = lokasi.state?.alasan // halaman yang mengarahkan tamu ke sini: lapor | kuis | persiapan

  if (sesi && !sambut) return <Navigate to={tujuanSetelahMasuk(sesi.peran, next)} replace />
  const geser = (e) => {
    if (e.pointerType !== 'mouse' || kurangiGerak()) return
    const k = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', ((e.clientX - k.left) / k.width - 0.5).toFixed(3))
    e.currentTarget.style.setProperty('--my', ((e.clientY - k.top) / k.height - 0.5).toFixed(3))
  }
  const diam = (e) => { e.currentTarget.style.setProperty('--mx', '0'); e.currentTarget.style.setProperty('--my', '0') }
  const lanjut = () => { tutupSambut(); pindah(tujuanSetelahMasuk(sesi.peran, next), { replace: true }) }

  const ubah = (k) => (e) => { setIsi({ ...isi, [k]: e.target.value }); setSalah(false) }
  const pilih = (p) => {
    const a = AKUN.find((x) => x.peran === p)
    setPeran(p); setIsi({ email: a.email, sandi: a.sandi }); setSalah(false); setCoba(false)
  }
  // Formulir bergetar sekali saat email atau kata sandi salah (dimulai ulang tiap gagal)
  const getar = () => { const f = document.getElementById('masuk-form'); if (!f) return; f.classList.remove('getar'); void f.offsetWidth; f.classList.add('getar') }
  const kirim = async (e) => {
    e.preventDefault()
    setCoba(true)
    if (Object.keys(validasiMasuk(isi, b)).length) { setTimeout(() => e.target.querySelector('[aria-invalid="true"]')?.focus(), 0); return }
    setSibuk(true)
    const hasil = await masuk(isi.email, isi.sandi)
    setSibuk(false)
    if (!hasil.ok) { getar(); sentuhan(POLA.salah); setSalah(true); setIsi((v) => ({ ...v, sandi: '' })); setTimeout(() => document.getElementById('masuk-sandi')?.focus(), 0) }
  }

  const PERAN = [
    { id: 'pengguna', Ikon: UserRound, nama: tr('Pengguna', 'User'), ket: tr('Belajar, lapor, dan peta', 'Learn, report, and map') },
    { id: 'admin', Ikon: ShieldCheck, nama: 'Admin', ket: tr('Dashboard pemantauan', 'Monitoring dashboard') },
  ]
  const MANFAAT = {
    pengguna: [
      [BookOpen, tr('Progres belajar tersimpan', 'Learning progress kept'), tr('Bacaan, kuis, dan checklist menetap di akunmu, terpisah dari tamu.', 'Reads, quizzes, and checklists stay in your account, apart from guests.')],
      [Bookmark, tr('Artikel simpanan', 'Saved articles'), tr('Tandai bacaan untuk dilanjutkan nanti.', 'Mark reads to continue later.')],
      [ClipboardList, tr('Laporan saya', 'My reports'), tr('Riwayat laporan titik api dari akunmu.', 'History of fire-point reports from your account.')],
    ],
    admin: [
      [LayoutDashboard, tr('Ringkasan dan laporan masuk', 'Overview and incoming reports'), tr('Pantau laporan warga dan statusnya dari satu layar.', 'Follow citizen reports and their status from one screen.')],
      [MapPinned, tr('Peta risiko dan konten', 'Risk map and content'), tr('Lihat sebaran risiko, lalu kelola bacaan dan data.', 'See where risk spreads, then manage reads and data.')],
      [MessagesSquare, tr('Pesan dan log aktivitas', 'Messages and activity log'), tr('Balas pesan masuk, dan telusuri siapa mengubah apa.', 'Reply to incoming messages and trace who changed what.')],
    ],
  }
  const tampil = peran ?? 'pengguna'
  const sapaan = tampil === 'admin' ? tr('Pantau semua titik api dari satu layar.', 'Watch every fire point from one screen.') : tr('Lanjutkan dari titik terakhirmu.', 'Pick up where you left off.')

  return (
    <div onPointerMove={geser} onPointerLeave={diam} className="relative isolate flex min-h-[calc(100dvh-57px)] overflow-hidden">
      <Latar />

      {sesi && sambut ? (
        <SambutanMasuk sesi={sesi} pernah={sambut.pernah} tujuan={tujuanSetelahMasuk(sesi.peran, next)} balik={sesi.peran !== 'admin' && tujuanSetelahMasuk(sesi.peran, next) !== '/'} onLanjut={lanjut} />
      ) : (
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:py-16">
          <div className="max-lg:order-2">
            <p className="m-0 inline-flex items-center gap-2 rounded-full border-2 border-line-strong bg-surface px-3.5 py-1.5 text-sm font-bold text-ink shadow-[0_3px_0_0_var(--line-strong)]">
              <Flame size={16} className="text-ember-ink" aria-hidden="true" />{tr('Pusat kendali karhutla', 'Wildfire control centre')}
            </p>
            <p key={tampil} className="judul-display baris-masuk m-0 mt-5 max-w-[14ch] text-[clamp(2.5rem,5.2vw,4.75rem)] leading-[1.02] text-ink">{sapaan}</p>
            <p className="m-0 mt-7 text-sm font-bold text-ink-2" aria-live="polite">
              {tampil === 'admin' ? tr('Yang kamu kelola sebagai admin', 'What you manage as admin') : tr('Yang kamu dapat setelah masuk', 'What you get after signing in')}
            </p>
            {/* Tiga ubin berwarna, bergeser bertahap; isinya bertukar mengikuti peran yang dipilih */}
            <ul key={`m-${tampil}`} className="m-0 mt-3 grid max-w-xl list-none gap-3.5 p-0" aria-label={tr('Yang kamu dapat setelah masuk', 'What you get after signing in')}>
              {MANFAAT[tampil].map(([Ikon, j, k], i) => (
                <li key={j} style={{ animationDelay: `${i * 90}ms` }} className={`${MASUK} group flex items-start gap-4 rounded-2xl border-2 border-line-strong bg-surface px-4 py-3.5 shadow-[0_4px_0_0_var(--line-strong)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--line-strong)] ${['', 'lg:ml-8', 'lg:ml-16'][i]}`}>
                  <span aria-hidden="true" className={`${HURUF[i]} flex size-11 shrink-0 items-center justify-center rounded-xl text-on-ember transition-transform duration-300 ease-snap group-hover:-rotate-6 group-hover:scale-110`}><Ikon size={22} /></span>
                  <span>
                    <span className="block text-base font-extrabold leading-tight text-ink">{j}</span>
                    <span className="mt-1 block text-sm leading-snug text-ink-2">{k}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <section aria-labelledby="masuk-judul" className={`${MASUK} rounded-[1.75rem] border-2 border-line-strong bg-surface p-6 shadow-[0_8px_0_0_var(--line-strong)] sm:p-9 max-lg:order-1`}>
            <h1 id="masuk-judul" className="judul-display m-0 text-4xl leading-[1.04] sm:text-5xl">{tr('Masuk ke PyraOps', 'Sign in to PyraOps')}</h1>
            {['lapor', 'kuis', 'persiapan'].includes(alasan) && (
              <div role="status" className="mt-5 flex items-start gap-3 rounded-2xl border-2 border-ember-ink/60 bg-ember/10 px-4 py-3 text-sm leading-relaxed">
                <Lock size={16} className="mt-1 shrink-0 text-ember-ink" aria-hidden="true" />
                <p className="m-0">
                  <strong>{alasan === 'lapor' ? tr('Melapor titik api perlu akun.', 'Reporting a fire point needs an account.') : alasan === 'kuis' ? tr('Kuis perlu akun.', 'The quiz needs an account.') : tr('Checklist persiapan perlu akun.', 'The prep checklist needs an account.')}</strong>{' '}
                  {tr('Masuk dulu, lalu kamu langsung kembali ke halaman tadi.', 'Sign in first and you go straight back to that page.')}
                  {alasan === 'lapor' && <> <a href="tel:112" className="font-bold text-ember-ink underline underline-offset-4">{tr('Bahaya langsung? Telepon 112 sekarang, tanpa masuk.', 'In immediate danger? Call 112 now, no sign-in needed.')}</a></>}
                </p>
              </div>
            )}

            {/* Pilihan peran: saklar bergeser, bukan dua kartu */}
            <fieldset className="m-0 mt-7 border-0 p-0">
              <legend className="mb-2 p-0 text-sm font-semibold">{tr('Masuk sebagai', 'Sign in as')}</legend>
              <div className="relative grid grid-cols-2 rounded-full border border-line bg-bg p-1">
                <span aria-hidden="true" className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-ember transition-[translate,opacity] duration-400 ease-snap ${peran ? 'opacity-100' : 'opacity-0'} ${peran === 'admin' ? 'translate-x-full' : ''}`} />
                {PERAN.map(({ id, Ikon, nama, ket }) => (
                  <label key={id} className="relative cursor-pointer">
                    <input type="radio" name="peran" value={id} checked={peran === id} onChange={() => pilih(id)} aria-label={`${nama}. ${ket}`} className="peer sr-only" />
                    <span className="flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold text-ink-2 transition-colors duration-300 peer-checked:text-on-ember peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ember-ink hover:text-ink peer-checked:hover:text-on-ember">
                      <Ikon size={17} aria-hidden="true" />{nama}
                    </span>
                  </label>
                ))}
              </div>
              <p className="m-0 mt-2 text-xs leading-relaxed text-ink-2" aria-live="polite">{peran ? tr('Akun demo terisi otomatis. Kamu juga bisa mengetik akunmu sendiri.', 'The demo account is filled in. You can also type your own account.') : tr('Pilih untuk mengisi akun demo, atau ketik di bawah.', 'Pick one to fill in a demo account, or type below.')}</p>
            </fieldset>

            <form id="masuk-form" onSubmit={kirim} noValidate className="mt-6 grid gap-5">
              <div>
                <label htmlFor="masuk-email" className="mb-1.5 block text-sm font-bold">Email</label>
                <div className="relative">
                  <input id="masuk-email" type="email" autoComplete="username" inputMode="email" value={isi.email} onChange={ubah('email')} placeholder={tr('nama@email.com', 'name@email.com')}
                    aria-invalid={galat.email ? true : undefined} aria-describedby={galat.email ? 'masuk-email-err' : undefined}
                    className={`${KOLOM} ${galat.email ? 'border-flame' : 'border-line-strong'}`} />
                  <Mail size={19} aria-hidden="true" className={IKON} />
                </div>
                {galat.email && <p id="masuk-email-err" className="m-0 mt-1.5 flex items-start gap-1.5 text-sm"><CircleAlert size={16} className="mt-0.5 shrink-0 text-flame" aria-hidden="true" />{galat.email}</p>}
              </div>
              <div>
                <label htmlFor="masuk-sandi" className="mb-1.5 block text-sm font-bold">{tr('Kata sandi', 'Password')}</label>
                <div className="relative">
                  <input id="masuk-sandi" type={lihat ? 'text' : 'password'} autoComplete="current-password" value={isi.sandi} onChange={ubah('sandi')} onKeyDown={cekKapital} onKeyUp={cekKapital} onBlur={() => setKapital(false)} placeholder={tr('Kata sandi akunmu', 'Your account password')}
                    aria-invalid={galat.sandi ? true : undefined} aria-describedby={galat.sandi ? 'masuk-sandi-err' : undefined}
                    className={`${KOLOM} pr-14 ${galat.sandi ? 'border-flame' : 'border-line-strong'}`} />
                  <LockKeyhole size={19} aria-hidden="true" className={IKON} />
                  <button type="button" onClick={() => setLihat(!lihat)} aria-pressed={lihat} aria-label={lihat ? tr('Sembunyikan kata sandi', 'Hide password') : tr('Tampilkan kata sandi', 'Show password')}
                    className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink-2 transition-colors duration-150 ease-snap hover:bg-band hover:text-ink">
                    {lihat ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                  </button>
                </div>
                {kapital && <p className="baris-masuk-halus m-0 mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink" aria-live="polite"><ArrowBigUp size={16} aria-hidden="true" className="text-ember-ink" />{tr('Caps Lock menyala', 'Caps Lock is on')}</p>}
                {galat.sandi && <p id="masuk-sandi-err" className="m-0 mt-1.5 flex items-start gap-1.5 text-sm"><CircleAlert size={16} className="mt-0.5 shrink-0 text-flame" aria-hidden="true" />{galat.sandi}</p>}
              </div>
              {salah && <p role="alert" className="m-0 flex items-start gap-2 rounded-xl border border-flame bg-flame/10 px-3.5 py-3 text-sm"><CircleAlert size={18} className="mt-0.5 shrink-0 text-flame" aria-hidden="true" />{pesanMasuk('salah', b)}</p>}
              <button type="submit" disabled={sibuk}
                style={{ '--bibir': BIBIR }}
                className="group mt-1 inline-flex min-h-14 items-center justify-between gap-2 rounded-2xl border-2 border-ember bg-ember px-6 text-lg font-extrabold text-on-ember shadow-[0_6px_0_0_var(--bibir)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-[0_1px_0_0_var(--bibir)] disabled:opacity-60 disabled:hover:translate-y-0">
                <span>{sibuk ? tr('Memeriksa…', 'Checking…') : tr('Masuk', 'Sign in')}</span>
                {sibuk && <LoaderCircle size={22} aria-hidden="true" className="animate-spin" />}
                {!sibuk && <ArrowRight size={22} aria-hidden="true" className="transition-transform duration-150 ease-snap group-hover:translate-x-1" />}
              </button>
            </form>

            <p className="m-0 mt-6 text-xs leading-relaxed text-ink-2">{tr('Peragaan tanpa server: sesi dan data akun tersimpan di perangkatmu. Jangan pakai kata sandi aslimu.', 'A serverless demo: the session and account data stay on your device. Do not use your real password.')}</p>
            <p className="m-0 mt-4 border-t-2 border-dashed border-line pt-4 text-sm"><Link to="/" className="font-semibold text-ember-ink underline underline-offset-4">{tr('Lanjut tanpa masuk', 'Continue without signing in')}</Link> <span className="text-ink-2">· {tr('sebagai tamu', 'as a guest')}</span></p>
          </section>
        </div>
      )}
    </div>
  )
}
