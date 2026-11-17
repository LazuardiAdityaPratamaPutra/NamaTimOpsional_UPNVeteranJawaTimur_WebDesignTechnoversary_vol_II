import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Flame } from 'lucide-react'
import { daftarKuis } from '../lib/kontenEdukasi'
import { muatSkor } from '../lib/progres'
import { Adegan, HURUF } from './AdeganKuis'
import { useBahasa, useTr } from '../i18n'

const NO = (n) => String(n).padStart(2, '0')
// Topik tiap soal (hanya judul pendek; soalnya sendiri baru tampil saat bermain)
const TOPIK = {
  'segitiga-api': ['Segitiga api', 'Fire triangle'], hotspot: ['Titik panas', 'Hotspots'], 'buka-lahan': ['Buka lahan', 'Land clearing'], gambut: ['Gambut', 'Peatland'],
  darurat: ['Saat darurat', 'Emergency'], angin: ['Angin', 'Wind'], asap: ['Asap', 'Smoke'], 'kabut-asap': ['Kabut asap', 'Haze'],
}
/**
 * Tab Kuis sebagai pintu masuk, bukan soal: TORA berdiri di bukit, delapan topik terlihat sebagai ubin, dan satu tombol besar
 * membawa ke permainan penuh (/kuis). Soal tidak tampil di sini. TORA melompat saat disentuh. Hanya dua ilustrasi TORA yang
 * tersedia dari tim (ramah dan ceria), jadi reaksinya lewat gerak.
 */
export default function Kuis() {
  const tr = useTr()
  const b = useBahasa()
  const [skor] = useState(muatSkor)
  const KUIS = daftarKuis(b)
  const n = KUIS.length
  const [lompat, setLompat] = useState(0) // naik tiap TORA disentuh agar animasi diulang
  const bubble = skor ? tr(`Skor terbaikmu ${skor.skor}/${skor.total}. Bisa lebih tinggi?`, `Your best is ${skor.skor}/${skor.total}. Can you beat it?`) : tr('Siap menguji pemahamanmu?', 'Ready to test what you know?')

  return (
    <section aria-labelledby="kuis-judul" className="relative isolate grid overflow-hidden rounded-3xl border-2 border-line-strong lg:min-h-[34rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <Adegan dekat="lg" bubble={bubble} ekspresi={lompat % 2 ? 'merayakan' : 'ramah'} reaksi={lompat ? 'loncat' : ''} kunci={lompat} onPointerEnter={() => setLompat((n) => n + 1)} kelas="min-h-[19rem] lg:min-h-0" />

      {/* Ajakan */}
      <div className="flex flex-col justify-between gap-8 bg-bg p-6 sm:p-8 lg:p-10">
        <div>
          <p className="m-0 flex items-center gap-2 text-sm font-bold text-ember-ink"><Flame aria-hidden="true" size={18} strokeWidth={2.25} />{tr('Kuis karhutla', 'Wildfire quiz')}</p>
          <h2 id="kuis-judul" className="m-0 mt-3 max-w-[10ch] text-[clamp(2.75rem,5.6vw,4.75rem)] leading-[0.96]">{tr('Seberapa siap kamu?', 'How ready are you?')}</h2>
          <p className="m-0 mt-4 max-w-[38ch] text-base leading-relaxed text-ink-2 sm:text-lg">{tr(`${n} soal tentang api, asap, dan pencegahan. Setiap jawaban disertai penjelasan, jadi sambil menguji kamu juga belajar.`, `${n} questions on fire, smoke, and prevention. Every answer comes with an explanation, so you learn as you test.`)}</p>
        </div>

        {/* Delapan topik: ubin bernomor, tanpa soalnya */}
        <ol aria-label={tr('Topik kuis', 'Quiz topics')} className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-4">
          {KUIS.map((s, n) => (
            <li key={s.id} style={{ '--d': `${200 + n * 70}ms` }} className="baris-masuk flex min-h-[3.75rem] flex-col justify-between rounded-2xl border-2 border-line-strong bg-surface px-3 py-2 shadow-[0_4px_0_0_var(--line-strong)]">
              <span aria-hidden="true" className={`grid size-6 place-items-center rounded-lg font-display text-sm font-extrabold leading-none text-on-ember [font-stretch:76%] ${HURUF[n % 4]}`}>{n + 1}</span>
              <span className="mt-1.5 text-sm font-bold leading-tight"><span className="sr-only">{tr('Soal', 'Question')} {n + 1}: </span>{TOPIK[s.id]?.[b === 'en' ? 1 : 0] ?? s.topik ?? s.tanya.slice(0, 24)}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          <Link to="/kuis" className="group inline-flex min-h-14 items-center gap-3 rounded-2xl border-2 border-ember bg-ember px-8 text-lg font-extrabold text-on-ember shadow-[0_6px_0_0_color-mix(in_oklab,var(--ember)_55%,var(--bg))] transition-[transform,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 active:translate-y-[5px] active:shadow-[0_1px_0_0_color-mix(in_oklab,var(--ember)_55%,var(--bg))]">
            {tr('Mulai kuis', 'Start the quiz')}<ArrowRight size={22} aria-hidden="true" className="transition-transform duration-150 ease-snap group-hover:translate-x-1" />
          </Link>
          <p className="m-0 text-sm leading-snug text-ink-2"><b className="text-base text-ink">±3 {tr('menit', 'min')}</b><br />{tr('tanpa batas waktu', 'no timer')}</p>
          {skor && <p className="m-0 text-sm leading-snug text-ink-2"><b className="text-base text-mint">{skor.skor}/{skor.total}</b><br />{tr('skor terbaikmu', 'your best score')}</p>}
        </div>
      </div>
    </section>
  )
}
