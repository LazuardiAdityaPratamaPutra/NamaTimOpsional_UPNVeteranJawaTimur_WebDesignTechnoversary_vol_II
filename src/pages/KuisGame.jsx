import { kurangiGerak } from '../lib/gerak'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Flame, RotateCcw, X } from 'lucide-react'
import { daftarKuis } from '../lib/kontenEdukasi'
import { nilaiKuis, pesanHasil, ekspresiHasil } from '../lib/kuis'
import { Adegan, HURUF as WARNA } from '../components/AdeganKuis'
import { simpanSkor } from '../lib/progres'
import { adalahPlaceholder } from '../lib/format'
import { useJudul } from '../lib/useJudul'
import { POLA, sentuhan } from '../lib/sentuhan'
import { useBahasa, useTr } from '../i18n'

const HURUF = 'ABCD'

const kocok = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] } return r }

/** Susun urutan opsi tiap soal: posisi jawaban benar disebar rata ke A–D (tidak pernah selalu A), sisanya diacak. */
function susunUrutan(soal) {
  const target = kocok(soal.map((_, i) => i % 4))
  return soal.map((q, i) => {
    const lain = kocok(q.opsi.map((_, k) => k).filter((k) => k !== q.benar))
    const hasil = []
    for (let p = 0; p < q.opsi.length; p++) hasil.push(p === Math.min(target[i], q.opsi.length - 1) ? q.benar : lain.pop())
    return hasil
  })
}

const IDENTITAS = (soal) => soal.map((q) => q.opsi.map((_, k) => k))

/** Kuis layar penuh bergaya permainan: satu soal per layar, jawab langsung, umpan balik instan. */
export default function KuisGame() {
  const b = useBahasa()
  const tr = useTr()
  const navigate = useNavigate()
  useJudul(tr('Kuis karhutla', 'Wildfire quiz'))
  const dasar = daftarKuis(b) // soal bawaan + buatan admin yang berstatus terbit
  const [urutan, setUrutan] = useState(() => IDENTITAS(dasar))
  // Soal sebagaimana ditampilkan: opsi diurutkan ulang, `benar` mengikuti posisi barunya
  const soal = useMemo(() => dasar.map((q, k) => ({ ...q, opsi: urutan[k].map((j) => q.opsi[j]), benar: urutan[k].indexOf(q.benar) })), [dasar, urutan])
  const [fase, setFase] = useState('mulai') // mulai | main | hasil
  const [i, setI] = useState(0)
  const [jawaban, setJawaban] = useState([])
  const [runtun, setRuntun] = useState(0)
  const [terbaik, setTerbaik] = useState(0)
  const [sumbu, setSumbu] = useState(0) // 0 padam, 1 tersulut saat tombol disorot, 2 menyala penuh
  const timer = useRef(null)
  const judul = useRef(null)
  const lanjutBtn = useRef(null)
  const sudah = jawaban[i] !== undefined
  const q = soal[i]
  const { skor } = nilaiKuis(soal, jawaban)

  useEffect(() => () => clearTimeout(timer.current), [])
  const keluar = useCallback(() => navigate('/edukasi?tab=kuis'), [navigate])

  // Kunci gulir halaman di belakang, Esc untuk keluar
  useEffect(() => {
    const awal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') keluar() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = awal; window.removeEventListener('keydown', onKey) }
  }, [keluar])

  // Pindahkan fokus ke judul tiap layar baru agar pembaca layar mengikuti
  useEffect(() => { judul.current?.focus() }, [fase, i])
  useEffect(() => { if (sudah) lanjutBtn.current?.focus() }, [sudah])

  const jawab = (n) => {
    if (fase !== 'main' || jawaban[i] !== undefined) return
    const j = [...jawaban]; j[i] = n; setJawaban(j)
    const betul = n === soal[i].benar
    sentuhan(betul ? POLA.ok : POLA.salah)
    setRuntun((r) => { const x = betul ? r + 1 : 0; setTerbaik((t) => Math.max(t, x)); return x })
  }

  // Pintasan: 1–4 atau A–D memilih jawaban (ref menjaga pendengar tetap satu dan selalu memakai state terbaru)
  const jawabTerbaru = useRef(jawab)
  useEffect(() => { jawabTerbaru.current = jawab })
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      const n = '1234'.includes(k) && k ? Number(k) - 1 : HURUF.indexOf(k)
      if (k.length === 1 && n >= 0 && n < 4) jawabTerbaru.current(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Tombol mulai menyulut sumbu: api merambat di sepanjang delapan titik, baru permainan dibuka
  const sulut = () => {
    if (sumbu === 2) return
    if (kurangiGerak()) { mulai(); return }
    setSumbu(2)
    timer.current = setTimeout(mulai, 1000)
  }
  const mulai = () => { setSumbu(0); setUrutan(susunUrutan(dasar)); setJawaban([]); setRuntun(0); setTerbaik(0); setI(0); setFase('main') }
  const lanjut = () => { if (i === soal.length - 1) { simpanSkor(nilaiKuis(soal, jawaban).skor, soal.length); setFase('hasil') } else setI(i + 1) }

  const hasil = nilaiKuis(soal, jawaban)
  const kartu = 'rounded-3xl border-2 border-line-strong bg-surface shadow-[0_6px_0_0_var(--line-strong)]'
  const utama = 'group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border-2 border-ember bg-ember px-7 text-base font-extrabold text-on-ember shadow-[0_5px_0_0_color-mix(in_oklab,var(--ember)_55%,var(--bg))] transition-[transform,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-[0_1px_0_0_color-mix(in_oklab,var(--ember)_55%,var(--bg))]'
  const tepi = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-line-strong bg-surface px-6 text-base font-bold text-ink shadow-[0_4px_0_0_var(--line-strong)] transition-[transform,box-shadow,border-color] duration-150 ease-snap hover:border-ember active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--line-strong)]'
  const betulSoal = sudah && jawaban[i] === q.benar
  // Gelembung TORA: kalimat berganti menurut soal dan hasil jawaban, supaya tidak monoton
  const SEMANGAT = [tr('Tepat! Kamu cepat belajar.', 'Spot on! You learn fast.'), tr('Mantap, lanjut!', 'Nice, keep going!'), tr('Benar sekali!', 'Exactly right!'), tr('Kamu paham betul.', 'You really get it.')]
  const HIBUR = [tr('Tenang, kita bahas ya.', "No worries, let's go through it."), tr('Belum, tapi sekarang kamu tahu.', 'Not yet, but now you know.'), tr('Hampir! Baca penjelasannya.', 'Close! Read the explanation.')]
  const bubble = fase === 'mulai' ? tr('Siap? Ayo kita mulai!', "Ready? Let's go!")
    : fase === 'hasil' ? pesanHasil(hasil.persen, b)
    : !sudah ? (i === soal.length - 1 ? tr('Soal terakhir. Kamu pasti bisa!', 'Last one. You can do it!') : tr(`Soal ${i + 1} dari ${soal.length}. Pilih satu!`, `Question ${i + 1} of ${soal.length}. Pick one!`))
    : betulSoal ? (runtun >= 3 ? tr(`Beruntun ${runtun}! Api menyala.`, `${runtun} in a row! You're on fire.`) : SEMANGAT[i % SEMANGAT.length]) : HIBUR[i % HIBUR.length]
  const reaksi = fase === 'hasil' ? (hasil.persen >= 75 ? 'loncat' : '') : sudah ? (betulSoal ? 'loncat' : 'lesu') : ''
  const ekspresi = fase === 'hasil' ? ekspresiHasil(hasil.persen) : betulSoal ? 'merayakan' : sudah ? 'sedih' : 'ramah'

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-bg text-ink" role="region" aria-label={tr('Kuis karhutla', 'Wildfire quiz')}>
      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-4 py-5 sm:px-6 md:py-8 lg:px-8">
        {/* Bilah atas: keluar, delapan api (kemajuan), beruntun dan skor */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button type="button" onClick={keluar} aria-label={tr('Keluar dari kuis', 'Exit the quiz')} className="grid size-11 shrink-0 place-items-center rounded-2xl border-2 border-line-strong bg-surface shadow-[0_3px_0_0_var(--line-strong)] transition-[transform,box-shadow,border-color] duration-150 ease-snap hover:border-ember active:translate-y-[2px] active:shadow-none"><X size={18} aria-hidden="true" /></button>
          {fase === 'main' && (
            <>
              <div className="flex flex-1 items-center justify-center gap-0.5 sm:gap-1.5" aria-hidden="true">
                {soal.map((s, k) => {
                  const dijawab = jawaban[k] !== undefined
                  const ok = dijawab && jawaban[k] === s.benar
                  return <Flame key={s.id} strokeWidth={2} className={`size-6 transition-colors duration-300 ease-snap sm:size-8 ${ok ? 'nyala-pop fill-ember text-ember' : dijawab ? 'nyala-pop text-flame' : k === i ? 'text-ink' : 'text-line-strong'}`} />
                })}
              </div>
              <p className="m-0 flex shrink-0 items-center gap-2 text-sm font-bold tabular-nums">
                <span className={`inline-flex items-center gap-1 rounded-xl border-2 px-2.5 py-1 transition-[border-color,color,background-color] duration-300 ${runtun >= 2 ? 'border-ember bg-ember text-on-ember' : 'border-line-strong text-ink-2'}`} title={tr('Jawaban benar beruntun', 'Correct in a row')}><Flame size={15} aria-hidden="true" className="transition-transform duration-300" />{runtun}<span className="sr-only"> {tr('benar beruntun', 'correct in a row')}</span></span>
                <span className="hidden sm:inline">{tr('Skor', 'Score')} {skor}</span>
              </p>
            </>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-center py-6 md:py-8">
          <div className={`grid ${kartu} lg:min-h-[34rem] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:overflow-clip`}>
            <Adegan dekat="lg" bubble={bubble} ekspresi={ekspresi} reaksi={reaksi} kunci={`${fase}-${i}-${sudah}`} dekoratif={fase === 'main' && sudah} lekat kompak kelas="h-[9.75rem] max-lg:sticky max-lg:top-0 max-lg:z-30 max-lg:rounded-t-[1.4rem] max-lg:border-b-2 max-lg:border-line-strong sm:h-[13rem] lg:h-auto lg:min-h-0" />

            <div className="bg-bg p-5 sm:p-8 lg:p-10">
              {fase === 'mulai' && (
                <section aria-labelledby="jdl" className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <p className="m-0 flex items-center gap-2 text-sm font-bold text-ember-ink"><Flame aria-hidden="true" size={18} strokeWidth={2.25} />{tr('Kuis karhutla', 'Wildfire quiz')}</p>
                    <h1 id="jdl" ref={judul} tabIndex={-1} className="mt-3 max-w-[10ch] text-[clamp(2.75rem,6vw,5rem)] leading-[0.96] sin-cincin">{tr('Seberapa siap kamu?', 'How ready are you?')}</h1>
                    <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-ink-2 sm:text-lg">{tr('Satu soal per layar, jawab, lalu baca penjelasannya. Posisi jawaban benar diacak tiap putaran.', 'One question per screen: answer, then read why. The correct answer moves around every round.')}</p>
                  </div>

                  {/* Delapan api = delapan soal. Satu menyala saat tombol disorot, semuanya menyala berurutan saat ditekan. */}
                  <div aria-hidden="true">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      {soal.map((s, k) => {
                        const nyala = sumbu === 2 || (sumbu === 1 && k === 0)
                        return <Flame key={s.id} strokeWidth={2} className={`size-8 transition-[color,fill,scale] duration-300 ease-snap sm:size-10 ${nyala ? 'scale-110 fill-ember text-ember' : 'text-line-strong'}`} style={{ transitionDelay: sumbu === 2 ? `${k * 105}ms` : '0ms' }} />
                      })}
                    </div>
                    <p className="m-0 mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-2">
                      <span><b className="text-base text-ink">{soal.length}</b> {tr('soal', 'questions')}</span>
                      <span><b className="text-base text-ink">±3</b> {tr('menit', 'min')}</span>
                      <span>{tr('tombol 1–4 untuk menjawab', 'keys 1–4 to answer')}</span>
                    </p>
                  </div>
                  <button type="button" disabled={!soal.length} onClick={sulut} onPointerEnter={() => sumbu === 0 && setSumbu(1)} onPointerLeave={() => sumbu === 1 && setSumbu(0)} onFocus={() => sumbu === 0 && setSumbu(1)} onBlur={() => sumbu === 1 && setSumbu(0)} className={`${utama} min-h-14 w-fit px-10 text-lg`}>{tr('Mulai game', 'Start game')}<ArrowRight size={20} aria-hidden="true" className="transition-transform duration-150 ease-snap group-hover:translate-x-1" /></button>
                </section>
              )}

              {fase === 'main' && (
                <section key={q.id} aria-labelledby="tanya">
                  <div className={`${kartu} p-5 sm:p-6`}>
                    <p className="m-0 font-mono text-xs font-bold uppercase tracking-[0.2em] text-ember-ink" aria-hidden="true">{String(i + 1).padStart(2, '0')} / {String(soal.length).padStart(2, '0')}</p>
                    <h1 id="tanya" ref={judul} tabIndex={-1} className="mt-3 font-display text-[clamp(1.6rem,2.8vw,2.3rem)] font-extrabold leading-[1.08] [font-stretch:76%] sin-cincin">
                      <span className="sr-only">{tr(`Soal ${i + 1} dari ${soal.length}. `, `Question ${i + 1} of ${soal.length}. `)}</span>{q.tanya}
                    </h1>
                    <div role="group" aria-labelledby="tanya" className="mt-5 grid gap-3">
                      {q.opsi.map((o, n) => {
                        const benar = sudah && n === q.benar
                        const salah = sudah && n === jawaban[i] && n !== q.benar
                        return (
                          <button key={o} type="button" onClick={() => jawab(n)} aria-disabled={sudah || undefined} style={{ animationDelay: `${n * 70}ms` }}
                            className={`relative flex min-h-16 items-center gap-4 rounded-2xl border-2 px-3 py-2.5 text-left text-base font-bold leading-snug transition-[transform,box-shadow,border-color,background-color,color,opacity] duration-150 ease-snap motion-safe:animate-[tile-masuk_500ms_var(--ease-snap,ease-out)_both] sm:text-lg ${
                              benar ? 'translate-y-[3px] border-canopy bg-canopy text-on-ember shadow-[0_2px_0_0_color-mix(in_oklab,var(--canopy)_55%,var(--bg))]'
                              : salah ? 'translate-y-[3px] border-flame bg-flame text-on-ember shadow-[0_2px_0_0_color-mix(in_oklab,var(--flame)_55%,var(--bg))]'
                              : `border-line-strong bg-bg text-ink shadow-[0_5px_0_0_var(--line-strong)] ${sudah ? 'opacity-45' : 'hover:border-ember hover:shadow-[0_5px_0_0_var(--ember)] active:translate-y-[4px] active:shadow-[0_1px_0_0_var(--line-strong)]'}`}`}>
                            <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-xl font-display text-xl font-extrabold leading-none text-on-ember [font-stretch:76%] ${benar || salah ? 'bg-on-ember/25' : WARNA[n % 4]}`}>{HURUF[n]}</span>
                            <span className="flex-1">{o}</span>
                            <span className="hidden sm:block" aria-hidden="true">{benar ? <Check size={24} strokeWidth={3.5} /> : salah ? <X size={24} strokeWidth={3.5} /> : <kbd className="rounded-md border border-line-strong px-1.5 py-0.5 font-mono text-xs text-ink-2">{n + 1}</kbd>}</span>
                            <span className="sr-only">{benar ? tr('Benar', 'Correct') : salah ? tr('Salah', 'Wrong') : ''}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div role="status" className="mt-5 min-h-[8.5rem]">
                    {sudah && (
                      <div className={`rounded-2xl border-2 p-4 motion-safe:animate-[tile-masuk_400ms_var(--ease-snap,ease-out)_both] sm:p-5 ${betulSoal ? 'border-canopy bg-canopy/15' : 'border-flame bg-flame/10'}`}>
                        <p className={`m-0 font-display text-2xl font-extrabold leading-none [font-stretch:76%] ${betulSoal ? 'text-mint' : 'text-flame'}`}>{betulSoal ? tr('Tepat sekali', 'Spot on') : tr('Belum tepat', 'Not quite')}</p>
                        <p className="m-0 mt-2 max-w-[60ch] text-base leading-relaxed">{q.jelasan}</p>
                        {q.sumber && !adalahPlaceholder(q.sumber) && <p className="m-0 mt-1.5 text-sm leading-snug text-ink-2">{tr('Sumber', 'Source')}: {q.sumber}</p>}
                        <button ref={lanjutBtn} type="button" onClick={lanjut} className={`${utama} mt-4`}>{i === soal.length - 1 ? tr('Lihat hasil', 'See results') : tr('Soal berikutnya', 'Next question')}<ArrowRight size={20} aria-hidden="true" className="transition-transform duration-150 ease-snap group-hover:translate-x-1" /></button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {fase === 'hasil' && (
                <section aria-labelledby="hasil" className="flex flex-col gap-6">
                  <div>
                    <p className="m-0 flex items-center gap-2 text-sm font-bold text-ember-ink"><Flame aria-hidden="true" size={18} strokeWidth={2.25} />{tr('Hasil kuismu', 'Your result')}</p>
                    <h1 id="hasil" ref={judul} tabIndex={-1} aria-label={tr(`${hasil.skor} dari ${hasil.total} benar`, `${hasil.skor} of ${hasil.total} correct`)} className="m-0 mt-2 flex items-baseline gap-3 text-[clamp(5rem,12vw,8.5rem)] leading-[0.9] sin-cincin">
                      {hasil.skor}<span className="text-[0.38em] text-ink-2">/ {hasil.total}</span>
                    </h1>
                    <div aria-hidden="true" className="mt-4 flex items-center gap-1 sm:gap-1.5">
                      {soal.map((s, k) => <Flame key={s.id} strokeWidth={2} className={`size-7 sm:size-9 ${jawaban[k] === s.benar ? 'nyala-pop fill-ember text-ember' : 'text-flame'}`} style={{ animationDelay: `${k * 90}ms` }} />)}
                    </div>
                    <p className="m-0 mt-3 flex items-center gap-2 text-sm text-ink-2"><Flame size={15} className="text-ember-ink" aria-hidden="true" />{tr(`Rangkaian benar terpanjang: ${terbaik}`, `Longest correct streak: ${terbaik}`)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={mulai} className={utama}><RotateCcw size={18} aria-hidden="true" />{tr('Main lagi', 'Play again')}</button>
                    <Link to="/edukasi/penyebab" className={tepi}>{tr('Baca artikel', 'Read an article')}</Link>
                    <button type="button" onClick={keluar} className={tepi}>{tr('Keluar', 'Exit')}</button>
                  </div>
                </section>
              )}
            </div>
          </div>

          {fase === 'hasil' && (
            <ol aria-label={tr('Tinjauan jawaban', 'Answer review')} className="m-0 mt-6 grid list-none gap-3 p-0 text-sm lg:grid-cols-2">
              {soal.map((s, k) => {
                const ok = jawaban[k] === s.benar
                return (
                  <li key={s.id}>
                    <details className={`group ${kartu} open:shadow-[0_6px_0_0_var(--line-strong)]`}>
                      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                        <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-on-ember ${ok ? 'bg-canopy' : 'bg-flame'}`}>{ok ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : <X size={16} strokeWidth={3} aria-hidden="true" />}</span>
                        <span className="flex-1 text-base leading-snug"><span className="font-bold">{ok ? tr('Benar', 'Correct') : tr('Salah', 'Wrong')}</span> · <span className="text-ink-2">{s.tanya}</span></span>
                      </summary>
                      <div className="space-y-2 px-4 pb-4 pl-[3.75rem] leading-relaxed">
                        {!ok && <p className="m-0"><span className="text-ink-2">{tr('Jawabanmu', 'Your answer')}:</span> {s.opsi[jawaban[k]] ?? '–'}</p>}
                        <p className="m-0"><span className="text-ink-2">{tr('Jawaban benar', 'Correct answer')}:</span> {s.opsi[s.benar]}</p>
                        <p className="m-0 text-ink-2">{s.jelasan}</p>
                      </div>
                    </details>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
