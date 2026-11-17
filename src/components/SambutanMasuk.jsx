import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, CheckCircle2, MapPinned, Target } from 'lucide-react'
import { Adegan } from './AdeganKuis'
import { semuaChecklist } from '../lib/kontenEdukasi'
import { daftarArtikel } from '../lib/artikel'
import { lalu, sapaanJam } from '../lib/auth'
import { hitungCentang, muatBaca, muatSkor } from '../lib/progres'
import { useBahasa, useTr } from '../i18n'

const WARNA = ['bg-ember', 'bg-amber', 'bg-canopy']
const BIBIR = 'color-mix(in_oklab,var(--ember)_55%,var(--bg))'
const UBIN = 'rounded-2xl border-2 border-line-strong bg-surface px-4 py-3 shadow-[0_4px_0_0_var(--line-strong)]'

// Layar sambutan sesudah masuk. Pertama kali: TORA memperkenalkan diri dan menunjuk tiga titik mulai.
// Sudah pernah: sapaan menurut jam, kapan terakhir masuk, dan ringkasan progres yang benar-benar tersimpan di akun ini.
export default function SambutanMasuk({ sesi, pernah, tujuan, balik, onLanjut }) {
  const tr = useTr()
  const b = useBahasa()
  const judul = useRef(null)
  const [data] = useState(() => {
    if (sesi.peran !== 'pengguna' || pernah == null) return null
    const semua = daftarArtikel(b)
    const baca = muatBaca()
    return { semua, baca, skor: muatSkor(), centang: hitungCentang(), nCentang: semuaChecklist(b).length, belum: semua.find((a) => !baca.includes(a.slug)) }
  })
  useEffect(() => { window.scrollTo(0, 0); judul.current?.focus({ preventScroll: true }) }, []) // formulir tadi mungkin tergulir; sambutan mulai dari atas
  const [sentuh, setSentuh] = useState(0) // berapa kali TORA disentuh: tiap sentuhan melompat dan berganti kalimat

  const baru = pernah == null
  const admin = sesi.peran === 'admin'
  // Nama akun demo berbahasa Indonesia ("Pengguna Demo"); di antarmuka Inggris disapa "User"
  const nama1 = b === 'en' && /^Pengguna\b/.test(sesi.nama) ? 'User' : sesi.nama.split(' ')[0]
  const sapa = sapaanJam(new Date().getHours(), b)
  const bubble = baru
    ? (admin ? tr('Halo! Aku TORA. Selamat bergabung di dashboard.', 'Hi! I am TORA. Welcome to the dashboard.') : tr('Halo! Aku TORA. Aku temani kamu belajar soal karhutla.', 'Hi! I am TORA. I will keep you company while you learn about wildfires.'))
    : tr(`Senang bertemu lagi, ${nama1}!`, `Good to see you again, ${nama1}!`)
  const aksi = admin ? tr('Buka dashboard', 'Open the dashboard') : balik ? tr('Lanjut ke halaman tadi', 'Back to where you were') : tr('Mulai menjelajah', 'Start exploring')
  const sentuhan = [tr('Hehe, geli!', 'Hehe, that tickles!'), tr('Ayo, kita mulai!', 'Come on, let us begin!'), tr('Semangat ya!', 'Keep it up!'), tr('Jangan lupa cek peta hari ini.', 'Do not forget to check the map today.')]
  const ada = data && (data.baca.length || data.skor || data.centang)

  return (
    <div className="mx-auto grid w-full max-w-6xl items-stretch gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-12 lg:py-16">
      <Adegan kompak dekat dekoratif bubble={sentuh ? sentuhan[(sentuh - 1) % sentuhan.length] : bubble} ekspresi={baru || sentuh ? 'merayakan' : 'ramah'} reaksi="loncat" kunci={sentuh} onClick={() => setSentuh((n) => n + 1)}
        kelas="min-h-[16rem] rounded-[1.75rem] border-2 border-line-strong shadow-[0_8px_0_0_var(--line-strong)] sm:min-h-[20rem] lg:min-h-[34rem]" />

      <section aria-labelledby="sambut-judul" className="motion-safe:[animation:tile-masuk_.55s_cubic-bezier(.2,.8,.2,1)_both] flex flex-col justify-center rounded-[1.75rem] border-2 border-line-strong bg-surface p-6 shadow-[0_8px_0_0_var(--line-strong)] sm:p-9">
        <p className="m-0 text-sm font-bold text-ember-ink">
          {baru ? tr('Pertama kali masuk', 'First sign-in') : <>{sapa} · {tr('terakhir masuk', 'last signed in')} {lalu(pernah, b)}</>}
        </p>
        <h1 id="sambut-judul" ref={judul} tabIndex={-1} className="judul-display m-0 mt-2 text-4xl leading-[1.04] outline-none sm:text-5xl">
          {baru ? tr(`Selamat datang, ${nama1}!`, `Welcome, ${nama1}!`) : tr(`Selamat datang kembali, ${nama1}!`, `Welcome back, ${nama1}!`)}
        </h1>

        {admin && (
          <p className="m-0 mt-4 text-base leading-relaxed text-ink-2">
            {baru ? tr('Dashboard pemantauan siap dipakai: laporan masuk, peta risiko, konten, pesan, dan log aktivitas.', 'The monitoring dashboard is ready: incoming reports, risk map, content, messages, and the activity log.')
              : tr('Dashboard menunggumu: periksa laporan masuk dan pesan terbaru.', 'The dashboard is waiting: check incoming reports and the latest messages.')}
          </p>
        )}

        {/* Pertama kali (pengguna): tiga titik mulai */}
        {!admin && baru && (
          <>
            <p className="m-0 mt-5 text-sm font-bold text-ink-2">{tr('Mulai dari mana?', 'Where to start?')}</p>
            <ul className="m-0 mt-2 grid list-none gap-3 p-0">
              {[
                [BookOpenText, '/edukasi', tr('Baca artikel pertama', 'Read your first article'), tr('Kenali penyebab dan cara mencegah karhutla.', 'Learn what causes wildfires and how to prevent them.')],
                [Target, '/edukasi?tab=kuis', tr('Coba kuis bersama TORA', 'Try the quiz with TORA'), tr('Delapan soal, tanpa batas waktu.', 'Eight questions, no timer.')],
                [MapPinned, '/peta', tr('Lihat peta titik api', 'See the fire-point map'), tr('Pantau sebaran dan perkiraan arah api.', 'Follow the spread and the forecast direction.')],
              ].map(([Ikon, ke, j, k], i) => (
                <li key={ke}>
                  <Link to={ke} className={`${UBIN} group flex items-center gap-3 transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 hover:shadow-[0_6px_0_0_var(--line-strong)]`}>
                    <span aria-hidden="true" className={`${WARNA[i]} flex size-10 shrink-0 items-center justify-center rounded-xl text-on-ember`}><Ikon size={20} /></span>
                    <span className="min-w-0"><span className="block text-sm font-extrabold leading-tight">{j}</span><span className="mt-0.5 block text-xs leading-snug text-ink-2">{k}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Sudah pernah (pengguna): progres nyata dari akun ini */}
        {data && (
          <>
            <p className="m-0 mt-5 text-sm font-bold text-ink-2">{ada ? tr('Progresmu sejauh ini', 'Your progress so far') : tr('Belum ada progres tersimpan. Mulai dari artikel pertama.', 'No progress saved yet. Start with the first article.')}</p>
            {ada ? (
              <ul className="m-0 mt-2 grid list-none grid-cols-3 gap-3 p-0">
                {[
                  [BookOpenText, `${data.baca.length}/${data.semua.length}`, tr('artikel dibaca', 'articles read')],
                  [Target, data.skor ? `${data.skor.skor}/${data.skor.total}` : '–', tr('skor kuis terbaik', 'best quiz score')],
                  [CheckCircle2, `${data.centang}/${data.nCentang}`, tr('langkah checklist', 'checklist steps')],
                ].map(([Ikon, n, ket], i) => (
                  <li key={ket} className={`${UBIN} px-3`}>
                    <span aria-hidden="true" className={`${WARNA[i]} flex size-8 items-center justify-center rounded-lg text-on-ember`}><Ikon size={17} /></span>
                    <b className="judul-display mt-2 block text-2xl leading-none tabular-nums">{n}</b>
                    <span className="mt-1 block text-xs leading-snug text-ink-2">{ket}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            {data.belum && (
              <Link to={`/edukasi/${data.belum.slug}`} className="group mt-3 flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-line-strong px-4 py-3 text-sm transition-colors duration-150 hover:bg-band">
                <span><span className="block text-xs font-bold text-ink-2">{data.baca.length ? tr('Lanjut baca', 'Keep reading') : tr('Artikel pertama', 'First article')}</span><span className="block font-extrabold leading-snug">{data.belum.judul}</span></span>
                <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-ember-ink transition-transform duration-150 ease-snap group-hover:translate-x-1" />
              </Link>
            )}
          </>
        )}

        <button type="button" onClick={onLanjut} style={{ '--bibir': BIBIR }}
          className="group mt-6 inline-flex min-h-14 items-center justify-between gap-2 rounded-2xl border-2 border-ember bg-ember px-6 text-lg font-extrabold text-on-ember shadow-[0_6px_0_0_var(--bibir)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-[0_1px_0_0_var(--bibir)]">
          <span>{aksi}</span>
          <ArrowRight size={22} aria-hidden="true" className="transition-transform duration-150 ease-snap group-hover:translate-x-1" />
        </button>
        <span className="sr-only" aria-hidden="true">{tujuan}</span>
      </section>
    </div>
  )
}
