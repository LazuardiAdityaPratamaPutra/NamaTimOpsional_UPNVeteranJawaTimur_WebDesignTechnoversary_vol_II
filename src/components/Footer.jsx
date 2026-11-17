import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight, Phone, Share2 } from 'lucide-react'
import { useToast } from './ui'
import { useKamus, useTr } from '../i18n'
import { kurangiGerak, setGerak } from '../lib/gerak'


/** Tautan dengan garis bawah yang "tumbuh" saat disorot. */
const Tautan = ({ to, href, children, ...rest }) => {
  const kelas = 'group inline-flex w-fit items-center gap-1 py-1 text-base text-ink transition-colors duration-200 ease-snap hover:text-ember-ink'
  const isi = <span className="bg-gradient-to-r from-current to-current bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 ease-snap group-hover:bg-[length:100%_1px]">{children}</span>
  return href ? <a href={href} className={kelas} {...rest}>{isi}</a> : <Link to={to} className={kelas}>{isi}</Link>
}


/** Baris aksi: nomor mono, label besar, ikon. Latar oranye menyapu dari kiri saat disorot atau difokus. */
function Aksi({ no, to, href, onClick, ikon: Ikon, children }) {
  const kelas = 'group relative isolate flex min-h-14 w-full items-center gap-4 overflow-hidden border-b border-ink-2/40 px-1 py-3 text-left text-ink transition-[color,padding] duration-300 ease-snap before:absolute before:inset-0 before:-z-10 before:origin-left before:scale-x-0 before:bg-ember before:transition-transform before:duration-500 before:ease-snap hover:px-4 hover:text-on-ember hover:before:scale-x-100 focus-visible:px-4 focus-visible:text-on-ember focus-visible:before:scale-x-100 active:before:scale-x-100'
  const isi = (
    <>
      <span aria-hidden="true" className="font-mono text-xs tabular-nums text-ink-2 transition-colors duration-300 group-hover:text-on-ember group-focus-visible:text-on-ember">{no}</span>
      <span className="flex-1 font-display text-2xl font-extrabold leading-none [font-stretch:76%] sm:text-3xl">{children}</span>
      <Ikon size={22} aria-hidden="true" className="shrink-0 transition-transform duration-300 ease-snap group-hover:rotate-12 group-hover:scale-110" />
    </>
  )
  if (to) return <Link to={to} className={kelas}>{isi}</Link>
  if (href) return <a href={href} className={kelas}>{isi}</a>
  return <button type="button" onClick={onClick} className={kelas}>{isi}</button>
}

const Kolom = ({ judul, children, lebar = false }) => (
  <div className={lebar ? 'col-span-2 sm:col-span-1' : undefined}>
    <h2 className="m-0 text-sm font-semibold uppercase tracking-wide text-ink-2">{judul}</h2>
    <nav aria-label={judul} className={`mt-3 flex gap-0.5 ${lebar ? 'flex-row flex-wrap gap-x-6 sm:flex-col sm:gap-x-0' : 'flex-col'}`}>{children}</nav>
  </div>
)

export default function Footer() {
  const t = useKamus()
  const tr = useTr()

  const toast = useToast()
  const bagikan = async () => {
    const data = { title: 'PyraOps', text: t.tagline, url: window.location.origin }
    try {
      if (navigator.share) await navigator.share(data)
      else { await navigator.clipboard.writeText(data.url); toast.show(tr('Tautan disalin. Bagikan ke temanmu!', 'Link copied. Share it with your friends!'), 'sukses') }
    } catch { /* pengguna membatalkan berbagi */ }
  }
  const keAtas = () => window.scrollTo({ top: 0, behavior: kurangiGerak() ? 'auto' : 'smooth' })

  return (
    <footer className="border-t border-line">
      <div className="relative z-10 bg-bg">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 md:pt-20">
        {/* Baris atas: judul besar di kiri, di kanan daftar aksi bergaris (tanpa kartu): baris menyapu oranye saat disorot */}
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-20">
          <h2 className="m-0 max-w-[16ch] text-[clamp(2.25rem,5.5vw,4.25rem)] leading-[1.04]">{tr('Pantau api. Lindungi sekitarmu.', 'Watch the fire. Protect your surroundings.')}</h2>
          <div>
            <p className="m-0 max-w-[40ch] text-base leading-relaxed text-ink-2">{t.tagline}</p>
            <ul className="m-0 mt-5 list-none border-t border-ink-2/40 p-0">
              <li><Aksi no="01" to="/peta" ikon={ArrowUpRight}>{tr('Buka peta simulasi', 'Open the simulation map')}</Aksi></li>
              <li><Aksi no="02" href="tel:112" ikon={Phone}>{tr('Darurat: 112', 'Emergency: 112')}</Aksi></li>
              <li><Aksi no="03" onClick={bagikan} ikon={Share2}>{tr('Bagikan', 'Share')}</Aksi></li>
            </ul>
          </div>
        </div>

        {/* Baris menu: hak cipta + tiga kolom tautan */}
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9 border-t border-line pt-8 sm:grid-cols-3 md:mt-14 md:pt-10 lg:gap-x-12">
          <Kolom judul={tr('Jelajahi', 'Explore')}>
            <Tautan to="/">{t.nav.home}</Tautan>
            <Tautan to="/about">{t.nav.about}</Tautan>
            <Tautan to="/edukasi">{t.nav.edukasi}</Tautan>
            <Tautan to="/peta">{t.nav.peta}</Tautan>
            <Tautan to="/lapor">{t.nav.lapor}</Tautan>
          </Kolom>
          <Kolom judul={tr('Pelajari', 'Learn')}>
            <Tautan to="/edukasi/penyebab">{tr('Penyebab', 'Causes')}</Tautan>
            <Tautan to="/edukasi/dampak">{tr('Dampak', 'Impacts')}</Tautan>
            <Tautan to="/edukasi/gambut">{tr('Gambut', 'Peatland')}</Tautan>
            <Tautan to="/edukasi/pencegahan">{tr('Pencegahan', 'Prevention')}</Tautan>
            <Tautan to="/edukasi?tab=kuis">{tr('Kuis', 'Quiz')}</Tautan>
          </Kolom>
          <Kolom judul={tr('Kontak', 'Contact')} lebar>
            <Tautan to="/contact">{t.nav.contact}</Tautan>
            <Tautan href="tel:112">{tr('Darurat 112', 'Emergency 112')}</Tautan>
            <Tautan to="/lapor">{tr('Laporkan titik api', 'Report a fire')}</Tautan>
          </Kolom>
        </div>

      </div>
      </div>

      {/* Panel foto "tirai": gambar menempel di dasar layar, terbuka saat halaman digulir ke bawah dan tertutup lagi saat digulir ke atas */}
      <div className="relative h-[22rem] [clip-path:inset(0)] md:h-[28rem]">
        <div className="hero-malam fixed inset-x-0 bottom-0 flex h-[22rem] flex-col justify-end overflow-hidden md:h-[28rem]">
          <img src="/foto/footer-kabut.webp" alt="" loading="lazy" decoding="async" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/40 to-bg/30" aria-hidden="true" />
          <div className="mx-auto w-full max-w-6xl px-4 pb-6">
            <p aria-hidden="true" className="m-0 select-none font-display text-[clamp(3rem,12vw,10rem)] font-extrabold uppercase leading-[0.8] text-ink [font-stretch:76%]">PyraOps</p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-line pt-4 text-sm text-ink-2">
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>{tr('PyraOps. Hak cipta dilindungi.', 'PyraOps. All rights reserved.')}</span>
                {/* Pengaturan aksesibilitas: efek gerak mengikuti sistem, bisa dipaksa penuh atau hemat. Halaman dimuat ulang agar semua efek ikut. */}
                <button type="button" aria-pressed={!kurangiGerak()} onClick={() => { setGerak(kurangiGerak()); window.location.reload() }}
                  className="inline-flex min-h-11 items-center underline decoration-line underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ember-ink">
                  {kurangiGerak() ? tr('Efek gerak: hemat. Aktifkan', 'Motion effects: reduced. Turn on') : tr('Efek gerak: penuh. Hemat', 'Motion effects: full. Reduce')}
                </button>
              </span>
              <button type="button" onClick={keAtas} className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 font-semibold text-ink transition-[transform,border-color] duration-200 ease-snap hover:border-ember-ink active:scale-[0.97]">
                {tr('Kembali ke atas', 'Back to top')}<ArrowUp size={16} aria-hidden="true" className="transition-transform duration-200 ease-snap group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
