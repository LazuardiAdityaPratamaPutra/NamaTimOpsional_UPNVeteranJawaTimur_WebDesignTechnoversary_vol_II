import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Flame, Footprints, RotateCcw, X } from 'lucide-react'
import AdeganPatroli from '../components/AdeganPatroli'
import { PATROLI } from '../data/patroli'
import { KUIS } from '../data/kuis'
import { ekspresiHasil } from '../lib/kuis'
import { kurangiGerak } from '../lib/gerak'
import { muatPatroli, simpanPatroli } from '../lib/progres'
import { POLA, sentuhan } from '../lib/sentuhan'
import { useJudul } from '../lib/useJudul'
import { lokal, useBahasa, useTr } from '../i18n'

const HURUF = 'ABC'
const JARAK = 900 // jarak antartitik di dunia permainan (px)
const BATAS = 170 // TORA berhenti sekian px sebelum titik
const KECEPATAN = 230 // px per detik

const kartu = 'rounded-3xl border-2 border-line-strong bg-surface shadow-[0_6px_0_0_var(--line-strong)]'
const utama = 'group inline-flex min-h-12 items-center justify-center gap-2.5 rounded-2xl border-2 border-ember bg-ember px-7 text-base font-extrabold text-on-ember shadow-[0_5px_0_0_color-mix(in_oklab,var(--ember)_55%,var(--bg))] transition-[transform,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 active:translate-y-[4px] active:shadow-[0_1px_0_0_color-mix(in_oklab,var(--ember)_55%,var(--bg))]'
const tepi = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-line-strong bg-surface px-6 text-base font-bold text-ink shadow-[0_4px_0_0_var(--line-strong)] transition-[transform,box-shadow,border-color] duration-150 ease-snap hover:border-ember active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--line-strong)]'

/** Game patroli hutan 2.5D: TORA berjalan menyusuri hutan, menemukan titik api, lalu memilih tindakan yang benar. */
export default function Patroli() {
  const b = useBahasa()
  const tr = useTr()
  const navigate = useNavigate()
  useJudul(tr('Patroli hutan', 'Forest patrol'))
  const soal = useMemo(() => PATROLI.map((p) => lokal(p, b)), [b])
  const n = soal.length
  const titik = useMemo(() => soal.map((p, k) => ({ id: p.id, visual: p.visual, x: JARAK * (k + 1) })), [soal])
  const akhir = JARAK * (n + 1)

  const [fase, setFase] = useState('mulai') // mulai | jalan | tanya | jelas | hasil
  const [idx, setIdx] = useState(0)
  const [pilihan, setPilihan] = useState([])
  const [otomatis, setOtomatis] = useState(false)
  const [terbaik] = useState(muatPatroli)
  const adegan = useRef(null)
  const judul = useRef(null)
  // Keadaan yang dibaca tiap frame disimpan di ref, agar berjalan tidak memicu render ulang React
  const st = useRef({ x: 0, tahan: false, otomatis: false, fase: 'mulai', idx: 0 })

  const ubahFase = useCallback((f) => { st.current.fase = f; setFase(f) }, [])
  const keluar = useCallback(() => navigate('/edukasi'), [navigate])

  const hasil = pilihan.map((p, k) => (p === undefined ? undefined : p === soal[k].benar))
  const skor = hasil.filter(Boolean).length
  const persen = Math.round((skor / n) * 100)
  const q = soal[idx]
  const betul = fase === 'jelas' && hasil[idx]

  // Kunci gulir halaman di belakang; Esc untuk keluar
  useEffect(() => {
    const awal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') keluar() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = awal; window.removeEventListener('keydown', onKey) }
  }, [keluar])

  // Pindahkan fokus ke judul panel tiap layar baru agar pembaca layar mengikuti
  const pertama = useRef(true)
  useEffect(() => { if (pertama.current) { pertama.current = false; return } judul.current?.focus() }, [fase, idx])
  useEffect(() => { if (fase === 'hasil') simpanPatroli(skor, n) }, [fase, skor, n])

  // Putaran gerak: menggeser --x (paralaks) selama TORA berjalan, berhenti di titik berikutnya
  useEffect(() => {
    let raf, terakhir = performance.now()
    const tick = (t) => {
      const dt = Math.min(0.05, (t - terakhir) / 1000); terakhir = t
      const s = st.current, el = adegan.current
      const jalan = s.fase === 'jalan' && (s.tahan || s.otomatis)
      if (el) {
        if (jalan) {
          const target = (s.idx < n ? JARAK * (s.idx + 1) : akhir) - BATAS
          s.x = kurangiGerak() ? target : Math.min(target, s.x + KECEPATAN * dt)
          el.style.setProperty('--x', s.x.toFixed(1))
          el.dataset.jalan = s.x < target ? '1' : '0'
          if (s.x >= target) { s.tahan = false; ubahFase(s.idx < n ? 'tanya' : 'hasil') }
        } else if (el.dataset.jalan !== '0') el.dataset.jalan = '0'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [n, akhir, ubahFase])

  const tahan = (v) => { st.current.tahan = v }
  useEffect(() => { st.current.otomatis = otomatis }, [otomatis])
  useEffect(() => {
    const lepas = () => { st.current.tahan = false }
    window.addEventListener('blur', lepas)
    return () => window.removeEventListener('blur', lepas)
  }, [])

  const mulai = () => {
    st.current.x = 0; st.current.idx = 0; st.current.tahan = false
    adegan.current?.style.setProperty('--x', '0')
    setIdx(0); setPilihan([]); ubahFase('jalan')
  }
  const jawab = (k) => {
    if (st.current.fase !== 'tanya') return
    const p = [...pilihan]; p[idx] = k; setPilihan(p)
    sentuhan(k === soal[idx].benar ? POLA.ok : POLA.salah)
    ubahFase('jelas')
  }
  const lanjut = () => { st.current.idx = idx + 1; setIdx(idx + 1); ubahFase('jalan') }

  // Pintasan: panah kanan atau D untuk jalan (tahan); 1–3 atau A–C untuk memilih tindakan
  const jawabTerbaru = useRef(jawab)
  useEffect(() => { jawabTerbaru.current = jawab })
  useEffect(() => {
    const turun = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toUpperCase()
      if (e.key === 'ArrowRight' || k === 'D') { st.current.tahan = true; return }
      const nomor = '123'.includes(k) && k ? Number(k) - 1 : HURUF.indexOf(k)
      if (k.length === 1 && nomor >= 0 && nomor < 3) jawabTerbaru.current(nomor)
    }
    const naik = (e) => { if (e.key === 'ArrowRight' || e.key.toUpperCase() === 'D') st.current.tahan = false }
    window.addEventListener('keydown', turun)
    window.addEventListener('keyup', naik)
    return () => { window.removeEventListener('keydown', turun); window.removeEventListener('keyup', naik) }
  }, [])

  const SEMANGAT = [tr('Tepat! Apinya tertangani.', 'Spot on! The fire is handled.'), tr('Mantap, lanjut patroli!', 'Nice, back on patrol!'), tr('Benar sekali!', 'Exactly right!')]
  const HIBUR = [tr('Aduh, apinya membesar. Kita pelajari ya.', 'Oh no, it grew. Let us learn from it.'), tr('Belum tepat, tapi sekarang kamu tahu.', 'Not yet, but now you know.')]
  const pesanAkhir = persen >= 80 ? tr('Hutannya aman berkat patrolimu!', 'The forest is safe thanks to your patrol!') : persen >= 50 ? tr('Patroli yang bagus. Satu dua titik masih bisa kita perbaiki.', 'A good patrol. A point or two we can still improve.') : tr('Tidak apa-apa. Coba lagi dan baca penjelasannya.', 'That is okay. Try again and read the explanations.')
  const gelembung = fase === 'mulai' ? tr('Ayo patroli! Aku tunjukkan jalannya.', 'Let us patrol! I will show the way.')
    : fase === 'jalan' ? (idx < n ? tr('Waspada, ada yang mencurigakan di depan.', 'Stay alert, something looks off ahead.') : tr('Pos jaga sudah dekat.', 'The ranger post is close.'))
    : fase === 'tanya' ? tr('Ada api! Apa yang harus kita lakukan?', 'Fire! What should we do?')
    : fase === 'jelas' ? (betul ? SEMANGAT[idx % SEMANGAT.length] : HIBUR[idx % HIBUR.length])
    : pesanAkhir
  const ekspresi = (fase === 'jelas' && betul) || (fase === 'hasil' && persen >= 75) ? 'merayakan' : fase === 'hasil' ? ekspresiHasil(persen) : 'ramah'
  const reaksi = fase === 'jelas' ? (betul ? 'loncat' : 'geleng') : fase === 'hasil' && persen >= 75 ? 'loncat' : ''
  const sumber = fase === 'jelas' || fase === 'tanya' ? lokal(KUIS.find((k) => k.id === q.dari) ?? {}, b).sumber : null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg text-ink" role="region" aria-label={tr('Patroli hutan', 'Forest patrol')}>
      <div className="flex shrink-0 items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-5">
        <button type="button" onClick={keluar} aria-label={tr('Keluar dari patroli', 'Exit the patrol')} className="grid size-11 shrink-0 place-items-center rounded-2xl border-2 border-line-strong bg-surface shadow-[0_3px_0_0_var(--line-strong)] transition-[transform,box-shadow,border-color] duration-150 ease-snap hover:border-ember active:translate-y-[2px] active:shadow-[0_1px_0_0_var(--line-strong)]"><X size={20} aria-hidden="true" /></button>
        <h1 className="m-0 text-2xl leading-none sm:text-3xl">{tr('Patroli hutan', 'Forest patrol')}</h1>
        <div className="ml-auto flex items-center gap-0.5 sm:gap-1.5" role="img" aria-label={tr(`${skor} dari ${n} titik tertangani`, `${skor} of ${n} points handled`)}>
          {soal.map((s, k) => (
            <Flame key={s.id} aria-hidden="true" strokeWidth={2} className={`size-6 transition-colors duration-300 ease-snap sm:size-8 ${hasil[k] === true ? 'nyala-pop fill-ember text-ember' : hasil[k] === false ? 'nyala-pop text-flame' : fase !== 'mulai' && k === idx && fase !== 'hasil' ? 'text-ink' : 'text-line-strong'}`} />
          ))}
        </div>
      </div>

      <div className="relative min-h-[13rem] flex-1 md:min-h-[40%]">
        <AdeganPatroli adeganRef={adegan} titik={titik} akhir={akhir} hasil={hasil} fase={fase} ekspresi={ekspresi} reaksi={reaksi} gelembung={gelembung} />
      </div>

      <div className="max-h-[56%] shrink-0 overflow-y-auto border-t-2 border-line-strong bg-surface px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-4 md:max-h-[50%]" aria-live="polite">
        <div className={`mx-auto ${fase === "tanya" ? "max-w-5xl" : "max-w-2xl"}`}>
          {fase === 'mulai' && (
            <>
              <h2 ref={judul} tabIndex={-1} className="m-0 text-3xl outline-none sm:text-4xl">{tr('Patroli bersama TORA', 'Patrol with TORA')}</h2>
              <p className="mt-2 max-w-[52ch] text-base leading-relaxed text-ink-2">{tr(`Jalan menyusuri hutan, temukan titik api, lalu pilih tindakan yang benar. Ada ${n} titik di rute ini.`, `Walk through the forest, find the fire points, then pick the right action. There are ${n} points on this route.`)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                <button type="button" onClick={mulai} className={utama}><Footprints size={20} aria-hidden="true" />{tr('Mulai patroli', 'Start patrol')}</button>
                {terbaik && <p className="m-0 text-sm font-semibold text-ink-2">{tr(`Skor terbaikmu ${terbaik.skor} dari ${terbaik.total}`, `Your best score ${terbaik.skor} of ${terbaik.total}`)}</p>}
              </div>
            </>
          )}

          {fase === 'jalan' && (
            <>
              <h2 ref={judul} tabIndex={-1} className="m-0 text-2xl outline-none">{idx < n ? tr(`Menuju titik ${idx + 1} dari ${n}`, `Heading to point ${idx + 1} of ${n}`) : tr('Menuju pos jaga', 'Heading to the ranger post')}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); tahan(true) }} onPointerUp={() => tahan(false)} onPointerCancel={() => tahan(false)} onLostPointerCapture={() => tahan(false)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') tahan(true) }} onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') tahan(false) }} onContextMenu={(e) => e.preventDefault()}
                  className={`${utama} touch-none select-none`}><Footprints size={20} aria-hidden="true" />{tr('Tahan untuk jalan', 'Hold to walk')}</button>
                <button type="button" aria-pressed={otomatis} onClick={() => setOtomatis((v) => !v)} className={`${tepi} ${otomatis ? 'border-ember' : ''}`}>{otomatis ? <Check size={18} aria-hidden="true" /> : null}{tr('Jalan otomatis', 'Auto-walk')}</button>
              </div>
              <p className="mt-3 text-sm text-ink-2">{tr('Di papan ketik, tahan tombol panah kanan atau D.', 'On a keyboard, hold the right arrow or D.')}</p>
            </>
          )}

          {fase === 'tanya' && (
            <>
              <p className="m-0 text-sm font-bold text-ember-ink">{tr(`Titik ${idx + 1} dari ${n}`, `Point ${idx + 1} of ${n}`)}</p>
              <h2 ref={judul} tabIndex={-1} className="m-0 mt-0.5 text-xl outline-none sm:text-3xl">{q.judul}</h2>
              <p className="mt-1 max-w-[60ch] text-[0.9375rem] leading-snug text-ink sm:text-base sm:leading-relaxed">{q.cerita}</p>
              <p className="mb-2 mt-3 text-sm font-bold text-ink-2 max-md:sr-only">{tr('Apa tindakan yang tepat?', 'What is the right action?')}</p>
              <ul className="m-0 mt-2.5 grid list-none gap-2 p-0 md:mt-0 md:grid-cols-3 md:gap-3">
                {q.opsi.map((o, k) => (
                  <li key={o} className="flex">
                    <button type="button" onClick={() => jawab(k)} className="flex w-full items-start gap-3 rounded-2xl border-2 border-line-strong bg-bg p-2.5 text-left text-[0.9375rem] font-semibold sm:p-3 sm:text-base leading-snug text-ink shadow-[0_4px_0_0_var(--line-strong)] transition-[transform,box-shadow,border-color] duration-150 ease-snap hover:border-ember active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--line-strong)]">
                      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-lg border-2 border-line-strong text-sm font-extrabold">{HURUF[k]}</span>
                      <span className="pt-0.5">{o}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {fase === 'jelas' && (
            <>
              <h2 ref={judul} tabIndex={-1} className={`m-0 flex items-center gap-2 text-2xl outline-none sm:text-3xl ${betul ? 'text-canopy' : 'text-flame'}`}>
                {betul ? <Check size={26} aria-hidden="true" /> : <X size={26} aria-hidden="true" />}{betul ? tr('Tepat! Api tertangani.', 'Right! The fire is handled.') : tr('Belum tepat. Apinya membesar.', 'Not quite. The fire grew.')}
              </h2>
              {!betul && <p className="mt-2 text-base font-semibold leading-snug"><span className="text-ink-2">{tr('Yang tepat: ', 'The right action: ')}</span>{q.opsi[q.benar]}</p>}
              <p className="mt-2 max-w-[60ch] text-base leading-relaxed text-ink">{q.jelasan}</p>
              {sumber && <p className="mt-2 text-sm text-ink-2">{tr('Sumber: ', 'Source: ')}{sumber}</p>}
              <button type="button" autoFocus onClick={lanjut} className={`${utama} mt-4`}>{idx === n - 1 ? tr('Lanjut ke pos jaga', 'Go to the ranger post') : tr('Lanjut patroli', 'Continue patrol')}</button>
            </>
          )}

          {fase === 'hasil' && (
            <>
              <h2 ref={judul} tabIndex={-1} className="m-0 text-3xl outline-none sm:text-4xl">{tr(`${skor} dari ${n} titik tertangani`, `${skor} of ${n} points handled`)}</h2>
              <p className="mt-1.5 text-base text-ink">{pesanAkhir}</p>
              <ul className={`${kartu} mt-4 grid list-none gap-0 p-0`}>
                {soal.map((s, k) => (
                  <li key={s.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5 last:border-b-0">
                    {hasil[k] ? <Check size={18} aria-label={tr('Benar', 'Correct')} className="shrink-0 text-canopy" /> : <X size={18} aria-label={tr('Kurang tepat', 'Not quite')} className="shrink-0 text-flame" />}
                    <span className="text-base font-semibold">{s.judul}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" onClick={mulai} className={utama}><RotateCcw size={18} aria-hidden="true" />{tr('Patroli lagi', 'Patrol again')}</button>
                <button type="button" onClick={keluar} className={tepi}>{tr('Kembali ke Edukasi', 'Back to Learn')}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
