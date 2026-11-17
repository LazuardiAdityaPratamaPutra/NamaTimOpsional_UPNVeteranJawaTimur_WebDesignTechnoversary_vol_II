import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Phone, Radio, RotateCcw, Send, X } from 'lucide-react'
import { Container, Pill } from './ui'
import { MaskotAvatar, MaskotEkspresi } from './Maskot'
import { blokJawaban, kirimChat, susunRiwayat } from '../lib/chat'
import { labelAI } from '../lib/briefing'
import { parseInline, hrefAman } from '../lib/markdown'
import { kurangiGerak } from '../lib/gerak'
import { useBahasa, useTr } from '../i18n'

// "Pos Jaga TORA": asisten belajar karhutla yang melayang di pojok kanan bawah situs publik (khusus pengguna, bukan admin).
// Logika chat, batasan topik, dan API tidak berubah (lib/chat.js -> /api/chat -> Gemini). Yang baru hanya wujud dan tempatnya.
// Panel memakai token .hutan (hijau pinus pekat di dua tema) supaya berbeda tegas dari kertas situs; oranye hanya untuk aksi dan pesan pengguna.

const SARAN = {
  id: ['Apa penyebab karhutla?', 'Bagaimana melindungi diri dari asap?', 'Mengapa gambut sulit dipadamkan?'],
  en: ['What causes wildfires?', 'How do I protect myself from smoke?', 'Why is peat so hard to extinguish?'],
}
const KUNCI = 'pyraops-tora-chat'
const BUKA = 'buka-tora' // peristiwa window: bagian lain situs (mis. halaman Edukasi) bisa membuka asisten tanpa mengimpor komponen ini
const MAKS_PESAN = 40

const cocok = (q) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches
const ponsel = () => cocok('(max-width: 639px)')

// Percakapan hanya bertahan selama tab terbuka (sessionStorage), supaya pindah halaman atau memuat ulang tidak menghapusnya.
const muat = () => {
  try {
    const j = JSON.parse(sessionStorage.getItem(KUNCI) ?? '[]')
    return Array.isArray(j) ? j.filter((m) => m && ['user', 'model'].includes(m.peran) && typeof m.teks === 'string').slice(-MAKS_PESAN) : []
  } catch { return [] }
}

function Inline({ teks, tutup }) {
  return parseInline(teks).map((tk, i) => {
    if (tk.t === 'tebal') return <strong key={i}>{tk.v}</strong>
    if (tk.t === 'miring') return <em key={i}>{tk.v}</em>
    if (tk.t === 'tautan') {
      if (!hrefAman(tk.href)) return <span key={i}>{tk.v}</span>
      const kelas = 'font-semibold text-ember-ink underline underline-offset-2'
      if (tk.href.startsWith('/')) return <Link key={i} to={tk.href} onClick={tutup} className={kelas}>{tk.v}</Link>
      return <a key={i} href={tk.href} className={kelas} {...(/^https?:/i.test(tk.href) ? { target: '_blank', rel: 'noreferrer' } : {})}>{tk.v}</a>
    }
    return <span key={i}>{tk.v}</span>
  })
}

function Jawaban({ teks, tutup }) {
  return (
    <div className="space-y-2.5">
      {blokJawaban(teks).map((b, i) => {
        if (b.t === 'h') return <p key={i} className="font-bold"><Inline teks={b.v} tutup={tutup} /></p>
        if (b.t === 'ul') {
          const butir = b.item.map((x, j) => <li key={j}><Inline teks={x} tutup={tutup} /></li>)
          return b.urut
            ? <ol key={i} className="list-decimal space-y-1 pl-5 marker:text-ember-ink">{butir}</ol>
            : <ul key={i} className="list-disc space-y-1 pl-5 marker:text-ember-ink">{butir}</ul>
        }
        return <p key={i} className="whitespace-pre-line"><Inline teks={b.v} tutup={tutup} /></p>
      })}
    </div>
  )
}

const Label = ({ children, className = '' }) => (
  <p className={`m-0 font-mono text-[11px] uppercase leading-none tracking-[0.16em] ${className}`}>{children}</p>
)

export default function ChatEdukasi({ sembunyi = false }) {
  const b = useBahasa()
  const tr = useTr()
  const idJudul = useId()
  const { pathname } = useLocation()
  const [buka, setBuka] = useState(false)
  const [pesan, setPesan] = useState(muat)
  const [isi, setIsi] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [kakiTerlihat, setKakiTerlihat] = useState(false)
  const panelRef = useRef(null)
  const logRef = useRef(null)
  const inputRef = useRef(null)
  const peluncurRef = useRef(null)
  const pernahBuka = useRef(false)
  const generasi = useRef(0) // naik tiap "mulai ulang" agar jawaban yang terlambat tidak muncul di percakapan baru
  const terbuka = buka && !sembunyi

  useEffect(() => { try { sessionStorage.setItem(KUNCI, JSON.stringify(pesan.slice(-MAKS_PESAN))) } catch { /* penyimpanan tidak tersedia */ } }, [pesan])

  // Kirim selalu lewat versi terbaru (riwayat dan status memuat yang mutakhir), tanpa menaruh kirim di dependensi efek
  const kirimRef = useRef(null)

  // Bagian lain situs (kartu ajakan di Edukasi) membuka asisten; bila membawa detail.tanya, pertanyaan itu langsung dikirim
  useEffect(() => {
    const dibuka = (e) => {
      setBuka(true)
      const tanya = typeof e.detail?.tanya === 'string' ? e.detail.tanya.trim().slice(0, 500) : ''
      if (tanya) setTimeout(() => kirimRef.current?.(tanya), 0)
    }
    window.addEventListener(BUKA, dibuka)
    return () => window.removeEventListener(BUKA, dibuka)
  }, [])

  // Footer punya tombol "Kembali ke atas" sendiri di kanan bawah: selama footer terlihat, tombol TORA naik sedikit agar tidak menutupinya
  useEffect(() => {
    if (sembunyi) return undefined
    let raf = 0
    const ubah = () => {
      raf = 0
      const kaki = document.querySelector('footer')
      setKakiTerlihat(kaki ? kaki.getBoundingClientRect().top < window.innerHeight - 40 : false)
    }
    const periksa = () => { if (!raf) raf = requestAnimationFrame(ubah) }
    periksa()
    window.addEventListener('scroll', periksa, { passive: true }); window.addEventListener('resize', periksa)
    const pantau = typeof ResizeObserver === 'function' ? new ResizeObserver(periksa) : null // isi halaman (lazy) yang selesai dimuat mengubah tinggi tanpa memicu gulir
    pantau?.observe(document.body)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', periksa); window.removeEventListener('resize', periksa); pantau?.disconnect() }
  }, [sembunyi, pathname])

  // Fokus: kolom tulis saat dibuka (di layar sentuh ke panel saja, agar papan ketik tidak langsung menutupi saran); kembali ke tombol saat ditutup
  useEffect(() => {
    if (terbuka) {
      pernahBuka.current = true
      if (cocok('(pointer: fine)')) inputRef.current?.focus({ preventScroll: true })
      else panelRef.current?.focus({ preventScroll: true })
    } else if (pernahBuka.current) peluncurRef.current?.focus({ preventScroll: true })
  }, [terbuka])

  // Di ponsel panel memenuhi layar: kunci gulir halaman di belakangnya
  useEffect(() => {
    if (!terbuka || !ponsel()) return undefined
    const awal = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = awal }
  }, [terbuka])

  // Jawaban baru: tampilkan dari awal jawabannya (bukan dari ujung bawah); pertanyaan atau pengetikan: ke bawah
  useEffect(() => {
    const el = logRef.current
    if (!el) return
    const akhir = el.querySelector('[data-akhir]')
    const atas = pesan.at(-1)?.peran === 'model' && !memuat && akhir ? Math.max(0, akhir.offsetTop - 12) : el.scrollHeight
    if (typeof el.scrollTo === 'function') el.scrollTo({ top: atas, behavior: kurangiGerak() ? 'auto' : 'smooth' })
    else el.scrollTop = atas
  }, [pesan, memuat, terbuka])

  const kirim = async (teks) => {
    const t = teks.trim()
    if (!t || memuat) return
    const g = generasi.current
    const riwayat = susunRiwayat(pesan)
    setPesan((p) => [...p, { peran: 'user', teks: t }])
    setIsi(''); setMemuat(true)
    const jawab = await kirimChat(t, riwayat, { bahasa: b })
    if (g !== generasi.current) return
    setPesan((p) => [...p, { peran: 'model', ...jawab }])
    setMemuat(false)
  }
  useEffect(() => { kirimRef.current = kirim }) // setelah kirim dideklarasikan
  const mulaiUlang = () => { generasi.current += 1; setPesan([]); setMemuat(false); setIsi(''); inputRef.current?.focus({ preventScroll: true }) }
  const tutupDiPonsel = () => { if (ponsel()) setBuka(false) } // tautan ke artikel: di ponsel panel menutupi layar, jadi ditutup agar artikelnya terlihat

  const tekan = (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); setBuka(false); return }
    if (e.key !== 'Tab' || !ponsel()) return // jebakan fokus hanya saat panel memenuhi layar (modal)
    const fokus = [...panelRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]')]
    if (!fokus.length) return
    const [awal, akhir] = [fokus[0], fokus[fokus.length - 1]]
    if (e.shiftKey && (document.activeElement === awal || document.activeElement === panelRef.current)) { e.preventDefault(); akhir.focus() }
    else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus() }
  }

  if (sembunyi) return null

  return (
    <aside aria-label={tr('Asisten belajar TORA', 'TORA study assistant')}>
      {!terbuka && (
        <div className={`fixed bottom-4 right-4 z-[1550] transition-[translate] duration-300 ease-snap ${kakiTerlihat ? '-translate-y-[4.75rem]' : ''}`}>
          <button ref={peluncurRef} type="button" onClick={() => setBuka(true)} aria-haspopup="dialog"
            className="tora-peluncur tora-peluncur-masuk hutan group relative flex items-center gap-3 rounded-xl border border-line bg-bg py-2 pl-4 pr-2 text-left text-ink shadow-xl shadow-black/25 transition-[translate,scale] duration-200 ease-snap hover:-translate-y-0.5 active:scale-[0.97]">
            {/* TORA mengintip dari tepi atas tombol: kepala terpotong di garis tepi, naik sedikit saat disorot */}
            <span aria-hidden="true" className="pointer-events-none absolute bottom-full left-3 block h-11 w-16 overflow-hidden">
              <span className="block translate-y-2 transition-transform duration-300 ease-snap group-hover:translate-y-0 group-focus-visible:translate-y-0"><MaskotAvatar className="size-16" /></span>
            </span>
            <span className="min-w-0">
              <span className="block font-mono text-[10px] uppercase leading-none tracking-[0.18em] text-ink-2">{tr('Seputar karhutla', 'Wildfire Q&A')}</span>
              <span className="judul-display mt-1.5 block text-xl leading-none">{tr('Tanya TORA', 'Ask TORA')}</span>
            </span>
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-ember-ink text-on-ember"><Radio size={18} /></span>
          </button>
        </div>
      )}

      {terbuka && (
        <div ref={panelRef} role="dialog" aria-modal={ponsel() ? 'true' : 'false'} aria-labelledby={idJudul} tabIndex={-1} onKeyDown={tekan}
          className="tora-panel hutan fixed inset-0 z-[1650] flex flex-col bg-bg text-ink outline-none sm:inset-auto sm:bottom-4 sm:right-4 sm:h-[min(28rem,calc(100dvh_-_10rem))] sm:w-[21rem] sm:rounded-2xl sm:border sm:border-line sm:shadow-2xl sm:shadow-black/40">
          {/* TORA mengintip dari atas panel (layar lebar); di ponsel wajahnya ada di dalam kepala panel */}
          <span aria-hidden="true" className="pointer-events-none absolute bottom-full left-5 hidden h-14 w-20 overflow-hidden sm:block">
            <span className={`block translate-y-2 ${memuat ? 'tora-intip' : ''}`}><MaskotAvatar className="size-20" /></span>
          </span>

          <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 sm:rounded-t-2xl">
            <span aria-hidden="true" className={`sm:hidden ${memuat ? 'tora-intip' : ''}`}><MaskotAvatar className="size-12" /></span>
            <div className="min-w-0 flex-1">
              <Label className="text-ember-ink">{tr('Teman belajar PyraOps', 'PyraOps study buddy')}</Label>
              <h2 id={idJudul} className="judul-display mt-1.5 text-2xl leading-none">{tr('Tanya TORA', 'Ask TORA')}</h2>
            </div>
            {pesan.length > 0 && (
              <button type="button" onClick={mulaiUlang} aria-label={tr('Mulai percakapan baru', 'Start a new conversation')} title={tr('Mulai percakapan baru', 'Start a new conversation')}
                className="flex size-11 items-center justify-center rounded-lg text-ink-2 transition-[background-color,color] duration-150 ease-snap hover:bg-line/50 hover:text-ink sm:size-9"><RotateCcw size={17} aria-hidden="true" /></button>
            )}
            <button type="button" onClick={() => setBuka(false)} aria-label={tr('Tutup asisten', 'Close assistant')} title={tr('Tutup asisten', 'Close assistant')}
              className="flex size-11 items-center justify-center rounded-lg text-ink-2 transition-[background-color,color] duration-150 ease-snap hover:bg-line/50 hover:text-ink sm:size-9"><X size={19} aria-hidden="true" /></button>
          </header>

          <div ref={logRef} role="log" aria-label={tr('Percakapan', 'Conversation')} aria-live="polite" tabIndex={0}
            className="sembunyi-gulir relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg px-4 py-4">
            <ul className="space-y-4">
              <li>
                <Label className="text-ink-2">TORA</Label>
                <p className="mt-2 border-l-2 border-ember-ink pl-3 text-[15px] leading-relaxed">
                  {tr('Halo, aku TORA. Tanyakan seputar penyebab, gambut, asap, atau pencegahan karhutla, lalu kita pelajari bersama.', 'Hi, I’m TORA. Ask about causes, peat, smoke, or preventing wildfires, and we’ll learn it together.')}
                </p>
              </li>
              {pesan.map((m, i) => {
                const akhir = i === pesan.length - 1 ? { 'data-akhir': '' } : {}
                if (m.peran === 'user') return (
                  <li key={i} {...akhir} className="baris-masuk-halus flex flex-col items-end">
                    <Label className="text-ink-2">{tr('Kamu', 'You')}</Label>
                    <p className="mt-2 max-w-[88%] whitespace-pre-line break-words rounded-lg rounded-br-none bg-ember-ink px-3.5 py-2.5 text-[15px] font-medium leading-snug text-on-ember">{m.teks}</p>
                  </li>
                )
                return (
                  <li key={i} {...akhir} className="baris-masuk-halus">
                    <Label className="text-ink-2">TORA</Label>
                    <div className="mt-2 break-words border-l-2 border-ember-ink pl-3 text-[15px] leading-relaxed">
                      <Jawaban teks={m.teks} tutup={tutupDiPonsel} />
                      {m.tautan && (
                        <Link to={m.tautan.ke} onClick={tutupDiPonsel}
                          className="group/t mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm font-semibold transition-[border-color] duration-150 ease-snap hover:border-ember-ink/70">
                          <span>{m.tautan.label}</span>
                          <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-ember-ink transition-transform duration-150 ease-snap group-hover/t:translate-x-0.5 group-hover/t:-translate-y-0.5" />
                        </Link>
                      )}
                      {(m.sumber === 'cadangan' || m.sumber === 'ai') && (
                        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-2">
                          {m.sumber === 'cadangan' && <Pill variant="offline">{tr('Mode cadangan', 'Fallback mode')}</Pill>}
                          {m.sumber === 'ai' && labelAI(b)}
                        </p>
                      )}
                    </div>
                  </li>
                )
              })}
              {memuat && (
                <li className="baris-masuk-halus">
                  <Label className="text-ink-2">TORA</Label>
                  <p className="mt-2 flex items-center gap-1.5 border-l-2 border-ember-ink py-1.5 pl-3">
                    <span className="sr-only">{tr('TORA sedang mengetik…', 'TORA is typing…')}</span>
                    {[0, 1, 2].map((n) => <span key={n} aria-hidden="true" className="ketik-titik size-1.5 rounded-full bg-ink-2" style={{ animationDelay: `${n * 0.15}s` }} />)}
                  </p>
                </li>
              )}
            </ul>

            {pesan.length === 0 && (
              <div className="mt-6">
                <Label className="text-ember-ink">{tr('Mulai dari sini', 'Start here')}</Label>
                <ul className="mt-3 border-t border-line">
                  {SARAN[b].map((s, i) => (
                    <li key={s}>
                      <button type="button" onClick={() => kirim(s)}
                        className="group/s flex min-h-12 w-full items-center gap-3 border-b border-line py-2.5 text-left text-[15px] font-medium transition-[color] duration-150 ease-snap hover:text-ember-ink">
                        <span aria-hidden="true" className="angka font-mono text-xs text-ember-ink">{String(i + 1).padStart(2, '0')}</span>
                        <span className="flex-1">{s}</span>
                        <ArrowRight size={16} aria-hidden="true" className="shrink-0 text-ink-2 transition-[translate,color] duration-150 ease-snap group-hover/s:translate-x-1 group-hover/s:text-ember-ink" />
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-ink-2">{tr('Asisten ini hanya menjawab seputar karhutla.', 'This assistant only answers questions about wildfires.')}</p>
              </div>
            )}
          </div>

          <div className="border-t border-line bg-surface sm:rounded-b-2xl">
            {/* Strip darurat selalu terlihat: bantuan nyata ada di telepon, bukan di chat */}
            <a href="tel:112" className="flex min-h-9 items-center justify-between gap-3 border-b border-line px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 transition-[color] duration-150 ease-snap hover:text-ink">
              <span className="flex items-center gap-2"><span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-flame" />{tr('Darurat nyata? Telepon 112', 'Real emergency? Call 112')}</span>
              <Phone size={14} aria-hidden="true" />
            </a>
            <form onSubmit={(e) => { e.preventDefault(); kirim(isi) }} className="flex gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <label className="sr-only" htmlFor={`${idJudul}-isi`}>{tr('Pertanyaanmu tentang karhutla', 'Your question about wildfires')}</label>
              <div className="relative min-w-0 flex-1">
                <input id={`${idJudul}-isi`} ref={inputRef} value={isi} onChange={(e) => setIsi(e.target.value)} maxLength={500} autoComplete="off" enterKeyHint="send"
                  placeholder={tr('Tanya soal karhutla…', 'Ask about wildfires…')}
                  className="min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-base text-ink placeholder:text-ink-2 sm:text-[15px]" />
                {isi.length > 400 && <span aria-hidden="true" className="angka pointer-events-none absolute -top-5 right-1 font-mono text-[11px] text-ink-2">{isi.length}/500</span>}
              </div>
              <button type="submit" disabled={memuat || !isi.trim()} aria-label={tr('Kirim', 'Send')} data-mag
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-ember-ink text-on-ember transition-[filter,transform,opacity] duration-150 ease-snap hover:brightness-110 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-40"><Send size={18} aria-hidden="true" /></button>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}

// ---------------------------------------------------------------------------------------------------------------------------
// Kartu ajakan di halaman Edukasi ("Pos Jaga TORA"). Bukan spanduk datar: peta kontur sebagai latar, TORA naik dari bawah kartu,
// dan tiap pertanyaan adalah baris yang bila diklik langsung dikirim ke asisten (peristiwa BUKA dengan detail.tanya).
// Kedalaman datang dari tiga lapis (kontur, TORA, gelembung) yang bergeser berbeda mengikuti kursor (hanya mouse, mati saat gerak dikurangi).
// ---------------------------------------------------------------------------------------------------------------------------

// Garis kontur ala peta topografi: kurva tertutup berombak yang dihitung sekali (deterministik), tiap garis keempat ditebalkan sebagai garis indeks.
const KONTUR = Array.from({ length: 9 }, (_, i) => {
  const r = 38 + i * 33
  const titik = Array.from({ length: 73 }, (_, k) => {
    const a = (k / 72) * Math.PI * 2
    const w = 1 + 0.09 * Math.sin(3 * a + i * 0.6) + 0.05 * Math.sin(5 * a + 1.3 + i * 0.35) + 0.03 * Math.sin(8 * a + i)
    return `${(300 + Math.cos(a) * r * w * 1.22).toFixed(1)} ${(300 + Math.sin(a) * r * w).toFixed(1)}`
  })
  return { d: `M${titik.join('L')}Z`, indeks: i % 4 === 0 }
})

export function AjakTora() {
  const b = useBahasa()
  const tr = useTr()
  const idJudul = useId()
  const kartu = useRef(null)
  const raf = useRef(0)
  // Tanpa IntersectionObserver atau saat gerak dikurangi, kartu langsung tampil penuh
  const [tampil, setTampil] = useState(() => typeof IntersectionObserver === 'undefined' || kurangiGerak())

  useEffect(() => {
    if (tampil || !kartu.current) return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setTampil(true); io.disconnect() } }, { threshold: 0.2 })
    io.observe(kartu.current)
    return () => io.disconnect()
  }, [tampil])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const geser = (x, y) => {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => { kartu.current?.style.setProperty('--px', x.toFixed(3)); kartu.current?.style.setProperty('--py', y.toFixed(3)) })
  }
  const gerak = (e) => {
    if (e.pointerType !== 'mouse' || kurangiGerak() || !kartu.current) return
    const r = kartu.current.getBoundingClientRect()
    geser(((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  const tanya = (tanyaan) => window.dispatchEvent(new CustomEvent(BUKA, { detail: tanyaan ? { tanya: tanyaan } : {} }))

  return (
    <section aria-labelledby={idJudul} className="bg-band pb-16 pt-32 md:pb-24 md:pt-28">
      <Container>
        <div ref={kartu} data-tampil={tampil ? '' : undefined} onPointerMove={gerak} onPointerLeave={() => geser(0, 0)}
          className="tora-ajak hutan relative isolate rounded-[2rem] border border-line-strong bg-bg text-ink">
          {/* Latar: peta kontur dan cahaya api unggun di belakang TORA, dipotong mengikuti sudut kartu */}
          <div aria-hidden="true" className="tora-ajak-latar pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
            <svg viewBox="0 0 600 600" className="tora-kontur absolute -bottom-72 -right-44 w-[44rem] overflow-visible text-line md:-bottom-60 md:-right-24 md:w-[50rem]" fill="none" stroke="currentColor">
              {KONTUR.map((k, i) => <path key={i} d={k.d} strokeWidth={k.indeks ? 1.8 : 1} opacity={k.indeks ? 0.9 : 0.55} vectorEffect="non-scaling-stroke" />)}
            </svg>
          </div>

          <div className="relative grid gap-8 px-6 pb-9 pt-24 sm:px-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] md:gap-4 md:px-14 md:pb-14 md:pt-14">
            <div className="min-w-0">
              <p className="alis flex items-center gap-2.5"><Radio size={15} aria-hidden="true" />{tr('Pos jaga TORA', 'TORA’s ranger post')}</p>
              <h2 id={idJudul} className="judul-display mt-3 text-[2.6rem] leading-[0.95] sm:text-5xl md:text-[2.6rem] lg:text-6xl">
                <span className="block">{tr('Masih ada yang', 'Still have')}</span>
                <span className="relative inline-block whitespace-nowrap">
                  {tr('mengganjal?', 'a question?')}
                  <svg aria-hidden="true" viewBox="0 0 220 14" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-3 w-full text-ember" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round">
                    <path d="M3 9c34-7 62 4 98-2s70-5 116 1" vectorEffect="non-scaling-stroke" />
                  </svg>
                </span>
              </h2>
              <p className="mt-6 max-w-[40ch] text-lg leading-relaxed text-ink-2">{tr('Pilih satu pertanyaan, TORA langsung menjawab. Atau tulis pertanyaanmu sendiri.', 'Pick a question and TORA answers right away. Or write your own.')}</p>

              <ul className="mt-8 space-y-3">
                {SARAN[b].map((s, i) => (
                  <li key={s} className={i === 1 ? 'md:ml-6' : i === 2 ? 'md:ml-12' : ''}>
                    <button type="button" onClick={() => tanya(s)}
                      className="tora-tanya group flex min-h-14 w-full max-w-[28rem] items-center gap-4 rounded-2xl border border-line bg-surface/60 py-2 pl-4 pr-2.5 text-left text-base font-semibold">
                      <span aria-hidden="true" className="angka font-mono text-sm text-ember-ink transition-colors duration-200 group-hover:text-on-ember group-focus-visible:text-on-ember">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1 leading-snug">{s}</span>
                      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-xl border border-ember-ink/60 text-ember-ink transition-[background-color,color,border-color,translate] duration-300 ease-snap group-hover:translate-x-0.5 group-hover:border-on-ember group-hover:bg-on-ember group-hover:text-ember group-focus-visible:bg-on-ember group-focus-visible:text-ember"><ArrowRight size={17} /></span>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button type="button" onClick={() => tanya('')}
                  className="inline-flex min-h-12 items-center gap-2.5 rounded-xl border border-line-strong px-5 font-semibold transition-[background-color,border-color] duration-200 ease-snap hover:border-ember-ink hover:bg-surface">
                  <Send size={17} aria-hidden="true" className="text-ember-ink" />{tr('Tulis pertanyaanmu', 'Write your question')}
                </button>
                <a href="tel:112" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-2 transition-colors duration-150 hover:text-ink">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-flame" />{tr('Darurat nyata? Telepon 112', 'Real emergency? Call 112')}
                </a>
              </div>
            </div>
          </div>

          {/* TORA naik dari tepi bawah kartu saat kartu masuk layar; di ponsel ia mengintip dari tepi atas */}
          <div aria-hidden="true" className="tora-sosok pointer-events-none absolute right-3 top-0 w-44 -translate-y-[58%] sm:right-8 sm:w-52 md:bottom-0 md:right-6 md:top-auto md:w-[19rem] md:translate-y-0 lg:right-8 lg:w-[28rem]">
            <div className="tora-sosok-dalam relative">
              <div className="tora-gelembung absolute -top-3 left-1 hidden w-max max-w-[15rem] rounded-2xl rounded-bl-sm border border-line-strong bg-surface px-4 py-2.5 text-sm font-bold leading-snug lg:-top-9 lg:left-4 lg:block">
                {tr('Ada yang mau kamu tanyakan?', 'Anything you’d like to ask?')}
              </div>
              <MaskotEkspresi ekspresi="ramah" className="w-full drop-shadow-2xl" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
