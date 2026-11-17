import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../components/authContext'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, BookOpenText, Bug, Check, Copy, Flame, Handshake, Layers, Lightbulb, Mail, MessageCircle, Pencil, Phone, Plus, Send, WifiOff } from 'lucide-react'
import FotoZoom from '../components/FotoZoom'
import { Button, Container, useToast } from '../components/ui'
import { tambahPesan } from '../lib/admin'
import { TIM } from '../data/tim'
import { validasiKontak, buatMailto, BATAS } from '../lib/kontak'
import { adalahPlaceholder } from '../lib/format'
import { useJudul } from '../lib/useJudul'
import { lokal, useBahasa, useTr } from '../i18n'

// Ruang lingkup tiap peran (urutan sama dengan TIM.anggota)
const RINCI = [
  { ikon: Layers, ket: ['Halaman, tema terang-gelap, peta, elips api 3, 6, 12 jam, dan skor risiko pemukiman.', 'Pages, light and dark themes, the map, 3, 6, 12 h fire ellipses, and settlement risk scores.'], chip: [['Antarmuka', 'Interface'], ['Peta', 'Map'], ['Simulasi', 'Simulation']] },
  { ikon: WifiOff, ket: ['Mode offline, asisten AI, dan materi edukasi.', 'Offline mode, the AI assistant, and educational content.'], chip: [['Offline', 'Offline'], ['AI', 'AI'], ['Edukasi', 'Education']] },
]

const BAYANG = 'shadow-[0_1px_0_0_color-mix(in_oklab,var(--text)_10%,transparent)_inset,0_2px_4px_-1px_rgb(0_0_0/0.18),0_28px_60px_-28px_rgb(0_0_0/0.45)]'

// Kalimat pembuka mengurangi beratnya halaman kosong
const AWAL = {
  saran: [['Saya ingin PyraOps punya fitur…', 'I would love PyraOps to have…'], ['Yang membingungkan bagi saya…', 'Something that confused me…'], ['Akan lebih berguna jika…', 'It would help if…']],
  galat: [['Halaman: ', 'Page: '], ['Yang terjadi: ', 'What happened: '], ['Perangkat dan peramban: ', 'Device and browser: ']],
  kolaborasi: [['Kami dari … dan ingin …', 'We are from … and would like to …'], ['Kegiatan yang kami rencanakan: ', 'The activity we plan: '], ['Kami butuh bantuan untuk…', 'We would need help with…']],
  lain: [['Saya ingin bertanya tentang…', 'I would like to ask about…'], ['Saya ingin berterima kasih…', 'I would like to say thank you…']],
}

// Logo merek digambar sendiri (lucide versi ini tidak memuat logo merek).
const LogoInstagram = (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}><rect x="3" y="3" width="18" height="18" rx="5.2" /><circle cx="12" cy="12" r="4.1" /><circle cx="17.4" cy="6.6" r="0.6" fill="currentColor" /></svg>
const LogoGithub = (p) => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.921.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>

// Kontak langsung sebagai tiga bola logo: bentuk bulat agar lain dari daftar topik. Nilai yang masih [placeholder] tampil redup dengan label "Segera".
function Orb({ label, nilai, href, Logo, gaya, tr, ket }) {
  const ada = !adalahPlaceholder(nilai)
  const isi = (
    <>
      <span className={`relative flex size-[4.5rem] items-center justify-center rounded-full border-2 transition-[scale,rotate,background-color,border-color] duration-300 ease-snap sm:size-[4.75rem] ${ada ? `${gaya} group-hover/o:-rotate-6 group-hover/o:scale-110` : 'border-ink-2/30 text-ink-2'}`}>
        {ada && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full border border-current opacity-0 group-hover/o:opacity-70 group-hover/o:motion-safe:animate-[denyut_1s_ease-out_2]" />}
        <Logo className="size-7 sm:size-8" />
      </span>
      <span className="mt-3 block text-center">
        <span className="block text-sm font-bold leading-tight">{label}</span>
        <span className="mt-0.5 block max-w-24 truncate text-xs text-ink-2">{ada ? (ket ?? nilai.replace(/^https?:\/\/(www\.)?/, '')) : tr('Segera', 'Soon')}</span>
      </span>
    </>
  )
  return ada
    ? <a href={href} data-mag target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="group/o flex flex-col items-center">{isi}<span className="sr-only">: {nilai}</span></a>
    : <span role="group" aria-label={`${label}: ${tr('belum tersedia', 'not available yet')}`} className="group/o flex flex-col items-center opacity-70">{isi}</span>
}

// Gelembung percakapan: tim di kiri, jawaban pengunjung di kanan.
function Gelembung({ children, kelas = '' }) {
  return (
    <div className="gelembung-kiri flex max-w-[34rem] items-end gap-3">
      <span aria-hidden="true" className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,color-mix(in_srgb,var(--ember)_70%,white),var(--ember)_60%,color-mix(in_srgb,var(--ember)_72%,black))] text-on-ember shadow-[0_8px_18px_-8px_var(--ember)]"><img src="/icons/logo-pyraops.png" alt="" className="h-6 w-auto" /></span>
      <div className={`rounded-[1.4rem] rounded-bl-md border border-line bg-[linear-gradient(160deg,color-mix(in_srgb,var(--w,var(--ember))_13%,var(--surface)),var(--surface)_75%)] px-5 py-3.5 text-base leading-relaxed text-ink shadow-[0_1px_0_0_color-mix(in_oklab,var(--text)_10%,transparent)_inset,0_14px_30px_-18px_rgb(0_0_0/0.5)] ${kelas}`}>{children}</div>
    </div>
  )
}

function Jawab({ onUbah, label, warna, children }) {
  return (
    <button type="button" onClick={onUbah} aria-label={label} style={warna ? { '--w': warna } : undefined} className="gelembung-kanan group/j relative ml-auto block max-w-[28rem] rounded-[1.4rem] rounded-br-md bg-[linear-gradient(150deg,color-mix(in_srgb,var(--w,var(--ember))_80%,white),var(--w,var(--ember))_55%,color-mix(in_srgb,var(--w,var(--ember))_75%,var(--amber)))] px-5 py-3.5 text-left text-base font-medium leading-snug text-bg shadow-[0_1px_0_0_rgb(255_255_255/0.35)_inset,0_16px_32px_-16px_var(--w,var(--ember))] transition-[translate,scale] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 active:scale-[0.98]">
      <span className="flex items-center gap-2.5 whitespace-pre-wrap break-words">{children}</span>
      <span aria-hidden="true" className="absolute -left-3 -top-3 flex size-7 scale-50 items-center justify-center rounded-full bg-ink text-bg opacity-0 transition-[scale,opacity] duration-300 ease-snap group-hover/j:scale-100 group-hover/j:opacity-100 group-focus-visible/j:scale-100 group-focus-visible/j:opacity-100"><Pencil size={13} /></span>
    </button>
  )
}

function Mengetik({ label }) {
  return (
    <div className="gelembung-kiri flex items-end gap-3" role="status" aria-label={label}>
      <span aria-hidden="true" className="size-9 shrink-0 rounded-full bg-ember/30" />
      <span className="flex gap-1.5 rounded-[1.4rem] rounded-bl-md border border-line bg-surface px-5 py-4" aria-hidden="true">{[0, 1, 2].map((i) => <span key={i} className="ketik-titik size-2 rounded-full bg-ink-2" style={{ animationDelay: `${i * 0.15}s` }} />)}</span>
    </div>
  )
}

// Kolom jawaban satu baris berbentuk pil, dengan tombol panah bulat.
function Balas({ nama, type = 'text', auto, label, nilai, onChange, galat, placeholder, tr }) {
  return (
    <div className="gelembung-kanan ml-auto w-full max-w-md [animation-delay:.25s]">
      <div className="flex items-center gap-2 rounded-full border-2 border-[var(--w)] bg-surface p-1.5 pl-5 shadow-[0_0_0_6px_color-mix(in_srgb,var(--w)_16%,transparent)] transition-shadow duration-500 focus-within:shadow-[0_0_0_10px_color-mix(in_srgb,var(--w)_24%,transparent)]">
        <input name={nama} type={type} autoComplete={auto} aria-label={label} value={nilai} onChange={onChange} placeholder={placeholder} autoFocus aria-invalid={galat ? 'true' : undefined} aria-describedby={galat ? `${nama}-galat` : undefined} className="min-w-0 flex-1 border-0 bg-transparent text-lg text-ink outline-none placeholder:text-ink-2/70 focus-visible:outline-none!" />
        <button type="submit" aria-label={tr('Lanjut', 'Continue')} className="group/b flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--w)] text-bg transition-[scale] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-110 active:scale-90"><ArrowRight size={20} aria-hidden="true" className="transition-[translate] duration-300 ease-snap group-hover/b:translate-x-0.5" /></button>
      </div>
      {galat && <p id={`${nama}-galat`} role="alert" className="m-0 mt-2 pr-4 text-right text-sm text-flame">{galat}</p>}
    </div>
  )
}

// Cincin hitung karakter: terisi mengikuti panjang pesan.
function CincinHitung({ n, maks }) {
  const r = 11, k = 2 * Math.PI * r, p = Math.min(1, n / maks)
  return (
    <svg viewBox="0 0 28 28" className="size-8 -rotate-90" aria-hidden="true">
      <circle cx="14" cy="14" r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle cx="14" cy="14" r={r} fill="none" stroke={p > 0.9 ? 'var(--flame)' : 'var(--ember)'} strokeWidth="3" strokeLinecap="round" strokeDasharray={k} strokeDashoffset={k * (1 - p)} className="transition-[stroke-dashoffset,stroke] duration-300 ease-snap" />
    </svg>
  )
}

// Salin alamat email dengan satu ketukan (tampil bila email sudah diisi).
function SalinEmail({ nilai, tr, toast }) {
  const [tersalin, setTersalin] = useState(false)
  const salin = async () => {
    try { await navigator.clipboard.writeText(nilai); setTersalin(true); setTimeout(() => setTersalin(false), 1600) }
    catch { toast.show(tr('Tidak dapat menyalin. Salin manual ya.', 'Could not copy. Please copy it manually.'), 'galat') }
  }
  return (
    <button type="button" onClick={salin} className="mt-3 flex w-full items-center justify-between gap-3 rounded-full border border-line px-4 py-2.5 text-sm font-semibold transition-[border-color,scale] duration-200 ease-snap hover:border-ember-ink active:scale-[0.98]">
      <span className="truncate font-mono text-ink">{nilai}</span>
      <span className="flex shrink-0 items-center gap-1.5 text-ink-2">{tersalin ? <><Check size={15} className="text-canopy" aria-hidden="true" />{tr('Tersalin', 'Copied')}</> : <><Copy size={15} aria-hidden="true" />{tr('Salin', 'Copy')}</>}</span>
    </button>
  )
}

export default function Contact() {
  const b = useBahasa()
  const tr = useTr()
  useJudul(tr('Kontak', 'Contact'))
  const toast = useToast()
  const TOPIK = [
    { id: 'saran', warna: 'var(--ember)', ikon: Lightbulb, label: tr('Saran', 'Suggestion'), ket: tr('Ide agar PyraOps lebih berguna', 'An idea to make PyraOps more useful'), judul: tr('Kirim saran', 'Send a suggestion'), petunjuk: tr('Apa yang membuat PyraOps lebih berguna bagimu atau komunitasmu?', 'What would make PyraOps more useful to you or your community?') },
    { id: 'galat', warna: 'var(--flame)', ikon: Bug, label: tr('Laporan galat', 'Bug report'), ket: tr('Ada yang rusak atau membingungkan', 'Something broke or is confusing'), judul: tr('Laporkan galat', 'Report a bug'), petunjuk: tr('Halaman mana, apa yang kamu lakukan, dan apa yang terjadi? Sebutkan perangkat dan peramban bila tahu.', 'Which page, what did you do, and what happened? Mention your device and browser if you know.') },
    { id: 'kolaborasi', warna: 'var(--canopy)', ikon: Handshake, label: tr('Kolaborasi', 'Collaboration'), ket: tr('Sekolah, komunitas, atau lembaga', 'Schools, communities, or organizations'), judul: tr('Ajak kami berkolaborasi', 'Invite us to collaborate'), petunjuk: tr('Siapa kamu atau lembagamu, dan apa yang ingin dikerjakan bersama?', 'Who are you or your organization, and what would you like to do together?') },
    { id: 'lain', warna: 'var(--amber)', ikon: MessageCircle, label: tr('Lainnya', 'Other'), ket: tr('Hal lain yang ingin kamu sampaikan', 'Anything else you would like to say'), judul: tr('Kirim pesan', 'Send a message'), petunjuk: tr('Ceritakan apa yang ada di pikiranmu.', 'Tell us what is on your mind.') },
  ]
  const [jenis, setJenis] = useState('saran')
  const topik = TOPIK.find((t) => t.id === jenis)
  const { sesi } = useAuth()
  const [nilai, setNilai] = useState({ nama: sesi?.nama ?? '', email: sesi?.email ?? '', pesan: '' }) // akun login: nama dan email terisi otomatis
  const [coba, setCoba] = useState(false) // sudah pernah menekan kirim: pesan galat tampil dan mengikuti bahasa
  const galat = coba ? validasiKontak(nilai, b) : {}
  const ubah = (k) => (e) => setNilai({ ...nilai, [k]: e.target.value })
  const formRef = useRef(null)
  const sisip = (teks) => {
    setNilai((n) => ({ ...n, pesan: `${n.pesan ? `${n.pesan.trimEnd()}\n` : ''}${teks}`.slice(0, BATAS.pesan[1]) }))
    setTimeout(() => formRef.current?.elements.pesan?.focus(), 0)
  }
  // Percakapan: 0 topik, 1 nama, 2 email, 3 pesan, 4 kirim. `edit` = jawaban lama yang sedang diubah di tempatnya (gelembung berikutnya tetap terlihat).
  const [peran, setPeran] = useState(null) // peran tim yang disorot pada diagram irisan
  const [langkah, setLangkah] = useState(0)
  const [edit, setEdit] = useState(null)
  const [mengetik, setMengetik] = useState(false)
  const akhirRef = useRef(null)
  const KUNCI = [null, 'nama', 'email', 'pesan']
  const aktif = edit ?? langkah
  const pindah = (n) => {
    setMengetik(true)
    const tunda = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800
    setTimeout(() => { setMengetik(false); setLangkah(n) }, tunda)
  }
  const lanjut = () => {
    const k = KUNCI[aktif]
    if (k && validasiKontak(nilai, b)[k]) { setCoba(true); return }
    setCoba(false)
    if (edit !== null) { setEdit(null); return }
    pindah(langkah + 1)
  }
  const pilih = (id) => { setJenis(id); setCoba(false); if (edit !== null) setEdit(null); else pindah(1) }
  useEffect(() => {
    if (langkah > 0) akhirRef.current?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [langkah, mengetik, edit])

  const kirim = (e) => {
    e.preventDefault()
    if (langkah < 4 || edit !== null) { lanjut(); return }
    const g = validasiKontak(nilai, b)
    if (Object.keys(g).length) {
      // kembali ke jawaban pertama yang bermasalah
      setCoba(true)
      setEdit(['nama', 'email', 'pesan'].findIndex((k) => g[k]) + 1)
      return
    }
    tambahPesan({ nama: nilai.nama, email: nilai.email, topik: jenis, pesan: nilai.pesan }) // salinan untuk kotak masuk admin (demo, di perangkat ini)
    toast.show(tr('Membuka aplikasi email di perangkatmu…', 'Opening the email app on your device…'), 'info')
    window.location.href = buatMailto(TIM.email, { ...nilai, pesan: `[${topik.label}] ${nilai.pesan}` }, b)
  }

  const JALUR = [
    { ke: 'tel:112', ikon: Phone, judul: tr('Ada kebakaran sekarang?', 'A fire right now?'), isi: tr('Telepon 112, jangan kirim email.', 'Call 112, do not email.'), tanda: '112', luar: true },
    { ke: '/lapor', ikon: Flame, judul: tr('Melihat titik api?', 'Seen a fire point?'), isi: tr('Lapor lewat form lapangan, bisa offline.', 'Report through the field form, works offline.') },
    { ke: '/edukasi', ikon: BookOpenText, judul: tr('Ingin belajar dulu?', 'Want to learn first?'), isi: tr('Bacaan singkat, kuis, dan checklist.', 'Short reads, a quiz, and a checklist.') },
  ]
  const TANYA = [
    [tr('Ke mana pesanku dikirim?', 'Where does my message go?'), tr('Tombol kirim membuka aplikasi email di perangkatmu dengan isi yang sudah terisi. PyraOps tidak mengirim pesanmu ke server; satu salinan hanya tersimpan di perangkat ini untuk kotak masuk admin demo.', 'The send button opens the email app on your device with the message pre-filled. PyraOps does not send your message to any server; one copy is only kept on this device for the demo admin inbox.')],
    [tr('Apakah PyraOps bisa dipakai untuk keadaan darurat?', 'Can PyraOps be used in an emergency?'), tr('Tidak. PyraOps adalah alat edukasi dan simulasi. Untuk bahaya langsung, hubungi 112 atau BPBD setempat.', 'No. PyraOps is an education and simulation tool. For immediate danger, call 112 or your local disaster agency (BPBD).')],
    [tr('Datanya nyata atau demo?', 'Is the data real or demo?'), tr('Sebagian besar angka dalam simulasi berlabel demo atau ilustrasi. Rinciannya ada di bagian Data pada halaman Tentang.', 'Most numbers in the simulation are labeled demo or illustrative. Details are in the Data section of the About page.')],
    [tr('Bagaimana melaporkan titik api?', 'How do I report a fire point?'), tr('Buka halaman Lapor. Laporan tersimpan di perangkat dan terkirim otomatis begitu sinyal kembali.', 'Open the Report page. Reports are saved on your device and sent automatically once the signal returns.')],
  ]

  return (
    <>
      {/* Halaman 1 berlatar foto lembah berkabut. Tiga jalur cepat berupa tiket bertumpuk yang mengembang saat disorot */}
      <header className="hero-malam relative isolate overflow-hidden pb-14 pt-28 md:pb-16 md:pt-32">
        <FotoZoom mode="atas" src="/foto/kontak-lembah.webp" aria-hidden="true" className="absolute inset-0 -z-10 size-full object-cover" style={{ objectPosition: '50% 55%', filter: 'sepia(0.35) saturate(1.2) contrast(1.05)' }} />
        <div className="absolute inset-0 -z-10 bg-canopy/20 mix-blend-soft-light" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 -z-10 h-[25%] bg-gradient-to-b from-bg/60 to-transparent" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-bg via-bg/55 to-bg/25" aria-hidden="true" />
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            <div>
              <p className="alis m-0">{tr('Kontak', 'Contact')}</p>
              <h1 className="mt-4 text-[clamp(3.25rem,8.6vw,7.75rem)] leading-[1.02]">{tr('Mari bicara.', 'Let’s talk.')}</h1>
              <p className="m-0 mt-6 max-w-[34rem] text-lg leading-relaxed text-ink">{tr('Punya saran, temuan galat, atau ingin berkolaborasi untuk lingkungan? Pilih topiknya, tulis pesannya, dan kami senang mendengarnya.', 'Have a suggestion, a bug to report, or want to collaborate for the environment? Pick a topic, write your message, and we would love to hear it.')}</p>
            </div>
            <div>
              <p className="m-0 mb-4 font-mono text-xs uppercase tracking-[0.2em] text-ink-2">{tr('Mungkin yang kamu cari', 'You may be looking for')}</p>
              <ul className="group/fan relative m-0 h-[21.5rem] list-none p-0">
                {JALUR.map((j, i) => {
                  const bahan = [
                    'bg-ember text-on-ember shadow-[0_26px_50px_-20px_var(--ember)]',
                    'hero-malam border border-line bg-[radial-gradient(90%_120%_at_100%_0%,color-mix(in_srgb,var(--ember)_30%,transparent),transparent_70%),var(--bg)] text-ink shadow-[0_26px_50px_-20px_rgb(0_0_0/.6)]',
                    'hutan border border-line shadow-[0_26px_50px_-24px_rgb(0_0_0/.5)]',
                  ][i]
                  const letak = ['top-0 z-[1]', 'top-[7rem] z-[2]', 'top-[14rem] z-[3]'][i]
                  const miring = ['-rotate-3', 'rotate-2', '-rotate-1'][i]
                  // Area sorot (li) diam; hanya tiket di dalamnya yang bergerak, jadi tidak ada kedip saat kursor di tepi.
                  const kelas = `tkt flex h-full items-start gap-4 rounded-3xl p-5 will-change-transform transition-[translate,rotate,scale,box-shadow] duration-[650ms] ease-[cubic-bezier(.22,1,.36,1)] ${miring} group-hover/t:-translate-y-3 group-hover/t:rotate-0 group-hover/t:scale-[1.04] group-focus-within/t:-translate-y-3 group-focus-within/t:rotate-0 group-focus-within/t:scale-[1.04] ${bahan}`
                  const isi = (
                    <>
                      <span className={`flex size-12 shrink-0 items-center justify-center rounded-full transition-[rotate] duration-[650ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover/t:-rotate-12 ${i === 0 ? 'bg-on-ember/15' : 'bg-ember text-on-ember'}`}><j.ikon size={22} aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1"><span className="judul-display block text-2xl leading-none">{j.judul}</span><span className="mt-1.5 block text-sm leading-snug opacity-80">{j.isi}</span></span>
                      <ArrowUpRight size={20} aria-hidden="true" className="shrink-0 transition-[translate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/t:-translate-y-1 group-hover/t:translate-x-1" />
                    </>
                  )
                  // Tiket di bawah yang disorot menyingkir sedikit; z-index naik langsung saat masuk dan turun terlambat saat keluar.
                  return (
                    <li key={j.ke} className={`group/t absolute inset-x-0 h-[7.5rem] transition-[z-index] duration-0 delay-[650ms] hover:z-10 hover:delay-0 focus-within:z-10 focus-within:delay-0 [&:hover~li>.tkt]:translate-y-4 [&:focus-within~li>.tkt]:translate-y-4 ${letak}`}>
                      {j.luar ? <a href={j.ke} className={kelas}>{isi}</a> : <Link to={j.ke} className={kelas}>{isi}</Link>}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Container>
      </header>

      <div className="relative">
        <Container className="py-12 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-16">
            {/* Percakapan: formulir ditanyakan satu per satu, jawaban jadi gelembung yang bisa diubah */}
            <section aria-labelledby="form-kontak" style={{ '--w': topik.warna }} className="relative isolate min-w-0 max-w-2xl">
              <span aria-hidden="true" className="pointer-events-none absolute -left-24 -top-16 -z-10 size-[26rem] rounded-full bg-[var(--w)] opacity-[0.13] blur-[90px] transition-[background-color] duration-700" />
              <p className="m-0 font-mono text-xs uppercase tracking-[0.2em] text-ember-ink">{tr('Percakapan', 'Conversation')}</p>
              <h2 id="form-kontak" className="mt-3 text-4xl leading-none md:text-5xl">{tr('Tulis ke tim PyraOps', 'Write to the PyraOps team')}</h2>
              <span className="mt-5 flex h-1.5 max-w-xs gap-1.5" role="img" aria-label={tr(`Langkah ${langkah + 1} dari 5`, `Step ${langkah + 1} of 5`)}>{[0, 1, 2, 3, 4].map((n) => <span key={n} className="h-full flex-1 overflow-hidden rounded-full bg-line"><span className={`block h-full origin-left rounded-full transition-[scale,background-color] duration-500 ease-snap ${n <= langkah ? 'scale-x-100' : 'scale-x-0'} bg-[var(--w)]`} /></span>)}</span>

              <form ref={formRef} onSubmit={kirim} noValidate className="mt-8">
                <div role="log" aria-live="polite" className="flex flex-col gap-4">
                  <Gelembung>{tr('Halo! Aku dari tim PyraOps. Mau bicara soal apa?', 'Hi! I am from the PyraOps team. What would you like to talk about?')}</Gelembung>
                  {aktif === 0
                    ? (
                      <div role="radiogroup" aria-label={tr('Pilih topik', 'Choose a topic')} className="gelembung-kanan ml-auto flex max-w-[34rem] flex-wrap justify-end gap-3 [animation-delay:.25s]">
                        {TOPIK.map((t) => (
                          <button key={t.id} type="button" role="radio" aria-checked={jenis === t.id} onClick={() => pilih(t.id)} style={{ '--w': t.warna }}
                            className="group/t flex min-h-12 items-center gap-2.5 rounded-full border border-[color-mix(in_srgb,var(--w)_55%,var(--border))] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--w)_18%,var(--surface)),var(--surface))] py-1.5 pl-2 pr-5 text-base font-semibold shadow-[0_5px_0_0_color-mix(in_srgb,var(--w)_55%,var(--border))] transition-[translate,box-shadow,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1 hover:border-[var(--w)] hover:shadow-[0_9px_0_0_color-mix(in_srgb,var(--w)_70%,var(--border)),0_18px_28px_-14px_var(--w)] active:translate-y-[4px] active:shadow-[0_1px_0_0_color-mix(in_srgb,var(--w)_55%,var(--border))]">
                            <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-[var(--w)] text-bg transition-[rotate] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover/t:-rotate-12"><t.ikon size={16} /></span>{t.label}
                          </button>
                        ))}
                      </div>
                    )
                    : <Jawab warna={topik.warna} label={tr(`Ubah topik: ${topik.label}`, `Change topic: ${topik.label}`)} onUbah={() => setEdit(0)}><topik.ikon size={18} aria-hidden="true" />{topik.label}</Jawab>}

                  {langkah >= 1 && <Gelembung>{tr('Senang mendengarnya. Siapa namamu?', 'Great to hear it. What is your name?')}</Gelembung>}
                  {langkah >= 1 && (aktif === 1
                    ? <Balas tr={tr} nama="nama" auto="name" label={tr('Nama', 'Name')} nilai={nilai.nama} onChange={ubah('nama')} galat={galat.nama} placeholder={tr('Nama kamu', 'Your name')} />
                    : <Jawab label={tr('Ubah nama', 'Change name')} onUbah={() => setEdit(1)}>{nilai.nama}</Jawab>)}

                  {langkah >= 2 && <Gelembung>{tr(`Halo, ${nilai.nama.trim().split(/\s+/)[0]}! Email mana yang bisa kami hubungi?`, `Hello, ${nilai.nama.trim().split(/\s+/)[0]}! Which email can we reach you at?`)}</Gelembung>}
                  {langkah >= 2 && (aktif === 2
                    ? <Balas tr={tr} nama="email" type="email" auto="email" label="Email" nilai={nilai.email} onChange={ubah('email')} galat={galat.email} placeholder={tr('kamu@email.com', 'you@email.com')} />
                    : <Jawab label={tr('Ubah email', 'Change email')} onUbah={() => setEdit(2)}>{nilai.email}</Jawab>)}

                  {langkah >= 3 && <Gelembung>{topik.petunjuk}</Gelembung>}
                  {langkah >= 3 && (aktif === 3
                    ? (
                    <div className="gelembung-kanan ml-auto w-full max-w-lg [animation-delay:.25s]">
                      <div className="mb-2.5 flex flex-wrap justify-end gap-2" role="group" aria-label={tr('Kalimat pembuka', 'Starter phrases')}>
                        {AWAL[jenis].map(([id, en], k) => <button key={id} type="button" onClick={() => sisip(tr(id, en))} className={`inline-flex min-h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-xs font-medium text-ink-2 transition-[border-color,color,scale,rotate,background-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-0.5 hover:border-[var(--w)] hover:bg-[color-mix(in_srgb,var(--w)_14%,transparent)] hover:text-ink hover:rotate-0 active:scale-95 ${['-rotate-1', 'rotate-1', '-rotate-[0.5deg]'][k % 3]}`}><Plus size={12} aria-hidden="true" />{tr(id, en).replace(/…$/, '').replace(/: $/, '')}</button>)}
                      </div>
                      <div className="rounded-[1.6rem] border-2 border-[var(--w)] bg-surface p-4 pb-3 shadow-[0_0_0_6px_color-mix(in_srgb,var(--w)_16%,transparent)] transition-shadow duration-500 focus-within:shadow-[0_0_0_10px_color-mix(in_srgb,var(--w)_24%,transparent)]">
                        <textarea name="pesan" aria-label={tr('Pesan', 'Message')} rows={4} value={nilai.pesan} onChange={ubah('pesan')} placeholder={tr('Tulis di sini…', 'Write here…')} autoFocus maxLength={BATAS.pesan[1] + 50} aria-invalid={galat.pesan ? 'true' : undefined} aria-describedby={galat.pesan ? 'pesan-galat' : undefined} className="block w-full resize-none border-0 bg-transparent text-lg leading-relaxed text-ink outline-none placeholder:text-ink-2/70 focus-visible:outline-none!" />
                        <div className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2 font-mono text-xs tabular-nums text-ink-2"><CincinHitung n={nilai.pesan.length} maks={BATAS.pesan[1]} />{nilai.pesan.length}/{BATAS.pesan[1]}</span>
                          <button type="submit" aria-label={tr('Lanjut', 'Continue')} className="group/b flex size-11 items-center justify-center rounded-full bg-[var(--w)] text-bg transition-[scale] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:scale-110 active:scale-90"><ArrowRight size={20} aria-hidden="true" className="transition-[translate] duration-300 ease-snap group-hover/b:translate-x-0.5" /></button>
                        </div>
                      </div>
                      {galat.pesan && <p id="pesan-galat" role="alert" className="m-0 mt-2 pr-4 text-right text-sm text-flame">{galat.pesan}</p>}
                    </div>
                    )
                    : <Jawab label={tr('Ubah pesan', 'Change message')} onUbah={() => setEdit(3)}>{nilai.pesan}</Jawab>)}

                  {langkah >= 4 && <Gelembung>{tr('Siap! Pesan ini akan kubuka di aplikasi emailmu, tinggal kamu kirim dari sana.', 'Ready! I will open this message in your email app, and you just press send there.')}</Gelembung>}
                  {mengetik && <Mengetik label={tr('Tim sedang mengetik', 'The team is typing')} />}
                </div>
                {langkah >= 4 && (
                  <div className="gelembung-kanan mt-5 flex flex-wrap items-center justify-end gap-x-5 gap-y-3">
                    <p className="m-0 min-w-0 flex-1 basis-56 text-xs text-ink-2">{tr('Tidak ada data yang dikirim ke server; hanya satu salinan tersimpan di perangkat ini untuk kotak masuk admin demo.', 'No data is sent to a server; only one copy is kept on this device for the demo admin inbox.')}</p>
                    <Button type="submit" className="group/kirim kilau min-h-12 rounded-full px-7 text-base">{tr('Buka aplikasi email', 'Open email app')}<Send size={17} aria-hidden="true" className="transition-[translate,rotate] duration-300 ease-snap group-hover/kirim:-translate-y-0.5 group-hover/kirim:translate-x-1 group-hover/kirim:-rotate-12" /></Button>
                  </div>
                )}
                <span ref={akhirRef} aria-hidden="true" className="block h-px" />
              </form>
            </section>

            {/* Kontak langsung: kartu nama miring berisi tiga bola logo */}
            <aside aria-labelledby="info-tim" style={{ "--w": topik.warna }} className="lg:sticky lg:top-28">
              <section data-spot className={`relative -rotate-1 overflow-hidden rounded-[1.75rem] border border-line bg-[linear-gradient(155deg,color-mix(in_srgb,var(--w,var(--ember))_26%,var(--surface)),color-mix(in_srgb,var(--ember)_14%,var(--surface)))] p-6 transition-[rotate,background] duration-700 ease-[cubic-bezier(.22,1,.36,1)] hover:rotate-0 ${BAYANG}`}>
                <h2 id="info-tim" className="m-0 !font-mono !text-xs !font-normal !leading-normal uppercase !tracking-[0.2em] text-ink-2 ![font-stretch:100%]">{tr('Atau hubungi tim kami', 'Or contact our team directly')}</h2>
                <div className="mt-5 flex items-start justify-between gap-3">
                  <Orb tr={tr} label="Email" nilai={TIM.email} href={`mailto:${TIM.email}`} Logo={Mail} ket={tr('Kirim email', 'Send an email')} gaya="border-ember bg-ember text-on-ember shadow-[0_14px_30px_-10px_var(--ember)]" />
                  <Orb tr={tr} label="Instagram" nilai={TIM.instagramAkun} href={TIM.instagram} Logo={LogoInstagram} ket={TIM.instagramAkun} gaya="border-transparent bg-[linear-gradient(135deg,var(--amber),var(--ember)_48%,var(--flame))] text-on-ember shadow-[0_14px_30px_-10px_var(--flame)]" />
                  <Orb tr={tr} label="GitHub" nilai={TIM.githubAkun} href={TIM.github} Logo={LogoGithub} ket={tr('Lihat kode', 'View code')} gaya="border-ink bg-ink text-bg shadow-[0_14px_30px_-10px_rgb(0_0_0/.5)]" />
                </div>
                {!adalahPlaceholder(TIM.email) && <SalinEmail nilai={TIM.email} tr={tr} toast={toast} />}
              </section>
            </aside>
          </div>
        </Container>
      </div>

      {/* Di balik PyraOps: dua lingkaran peran yang beririsan. Irisannya satu tujuan; sorot satu peran untuk membacanya. */}
      <section aria-labelledby="tim-judul" className="border-t border-line bg-[color-mix(in_srgb,var(--canopy)_6%,var(--bg))] py-14 md:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="tim-judul" className="m-0 text-4xl leading-[1.02] sm:text-5xl">{tr('Di balik PyraOps', 'Behind PyraOps')}</h2>
            <p className="m-0 max-w-[36ch] text-base text-ink-2">{tr('Dua orang, satu tujuan: membuat karhutla lebih mudah dipahami.', 'Two people, one goal: making wildfires easier to understand.')}</p>
          </div>
          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-24">
            <div className="mx-auto lg:mx-0">
              <div
                onPointerMove={(e) => {
                  const k = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty('--ry', `${(((e.clientX - k.left) / k.width - 0.5) * 12).toFixed(2)}deg`)
                  e.currentTarget.style.setProperty('--rx', `${((0.5 - (e.clientY - k.top) / k.height) * 10).toFixed(2)}deg`)
                }}
                onPointerLeave={(e) => { e.currentTarget.style.setProperty('--ry', '0deg'); e.currentTarget.style.setProperty('--rx', '0deg'); if (e.pointerType === 'mouse') setPeran(null) }}
                className="[--d:clamp(10.5rem,25vw,24rem)] [perspective:1000px]">
                <div className="relative h-[var(--d)] w-[calc(var(--d)*1.62)] isolate transition-transform duration-300 ease-out [transform-style:preserve-3d] [transform:rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]">
                  <span aria-hidden="true" className="pointer-events-none absolute -left-[12%] top-[8%] -z-10 size-[70%] rounded-full bg-ember opacity-25 blur-[80px] transition-opacity duration-700" style={{ opacity: peran === 1 ? 0.08 : 0.28 }} />
                  <span aria-hidden="true" className="pointer-events-none absolute -right-[10%] bottom-[0%] -z-10 size-[70%] rounded-full bg-canopy opacity-25 blur-[80px] transition-opacity duration-700" style={{ opacity: peran === 0 ? 0.08 : 0.28 }} />
                  {TIM.anggota.map((a, i) => {
                    const m = lokal(a, b)
                    const on = peran === i
                    const redup = peran !== null && !on
                    return (
                      <button key={a.peran} type="button" aria-pressed={on} aria-describedby="tim-baca"
                        onPointerEnter={(e) => { if (e.pointerType === 'mouse') setPeran(i) }} onFocus={() => setPeran(i)} onClick={() => setPeran(i)}
                        style={{ left: i === 0 ? 0 : 'calc(var(--d) * 0.62)', '--c': i === 0 ? 'var(--ember)' : 'var(--canopy)' }}
                        className={`absolute top-0 flex size-[var(--d)] flex-col justify-center rounded-full border-0 ${i === 0 ? 'items-start pl-[13%] pr-[40%] text-left text-on-ember bg-ember' : 'items-end pl-[40%] pr-[13%] text-right text-bg bg-canopy'} transition-[opacity,filter,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${on ? 'z-20 shadow-[0_40px_80px_-30px_var(--c)]' : 'z-[1] shadow-[0_24px_50px_-30px_var(--c)]'} ${redup ? 'opacity-70 saturate-[.85]' : ''}`}
                        >
                        <span className="contents">
                          <span className="font-mono text-[clamp(0.6rem,1.1vw,0.75rem)] font-bold uppercase tracking-[0.2em] opacity-70">0{i + 1}</span>
                          <span className="judul-display mt-1 block text-[clamp(1.1rem,2.3vw,2.1rem)] leading-[1.02]">{m.peran}</span>
                        </span>
                        <span aria-hidden="true" className={`absolute inset-0 rounded-full ring-2 ring-inset transition-[opacity] duration-500 ${on ? 'opacity-100 ring-white/50' : 'opacity-0'}`} />
                      </button>
                    )
                  })}
                  <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-30 [clip-path:circle(calc(var(--d)/2)_at_calc(var(--d)/2)_50%)]">
                    <span className="absolute inset-0 bg-[color-mix(in_srgb,var(--amber)_88%,var(--ember))] [[data-theme=light]_&]:bg-[color-mix(in_srgb,var(--amber)_38%,white)] shadow-[0_0_60px_10px_color-mix(in_srgb,var(--amber)_45%,transparent)] [clip-path:circle(calc(var(--d)/2)_at_calc(var(--d)*0.62+var(--d)/2)_50%)]" />
                  </span>
                </div>
              </div>
              <p className="m-0 mt-6 flex items-center justify-center gap-2.5 text-center text-sm text-ink-2"><span aria-hidden="true" className="size-2.5 rounded-full bg-amber [[data-theme=light]_&]:bg-[color-mix(in_srgb,var(--amber)_38%,white)] [[data-theme=light]_&]:ring-1 [[data-theme=light]_&]:ring-ink-2" />{tr('Irisan: satu tujuan yang sama', 'The overlap: one shared goal')}</p>
            </div>

            <div id="tim-baca" aria-live="polite" className="min-h-[19rem]">
              {peran === null
                ? (
                  <div key="x" className="motion-safe:[animation:tile-masuk_.5s_var(--ease-snap)_both]">
                    <p className="m-0 font-mono text-xs uppercase tracking-[0.2em] text-ember-ink">{tr('Dua peran', 'Two roles')}</p>
                    <p className="judul-display m-0 mt-3 text-[clamp(2.25rem,4.6vw,4rem)] leading-[1.02]">{tr('Dua lingkaran, satu irisan.', 'Two circles, one overlap.')}</p>
                    <p className="m-0 mt-5 max-w-[44ch] text-lg text-ink-2">{tr('Sorot atau ketuk salah satu lingkaran untuk melihat apa yang dikerjakan.', 'Hover or tap a circle to see what each person works on.')}</p>
                  </div>
                )
                : (() => {
                  const a = TIM.anggota[peran]; const m = lokal(a, b); const r = RINCI[peran] ?? RINCI[0]; const Ikon = r.ikon
                  const w = peran === 0 ? 'var(--ember)' : 'var(--canopy)'
                  return (
                    <div key={peran} style={{ '--w': w }} className="motion-safe:[animation:tile-masuk_.5s_var(--ease-snap)_both]">
                      <div className="flex items-center gap-4">
                        <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-[var(--w)] text-bg shadow-[0_16px_30px_-12px_var(--w)]"><Ikon size={26} /></span>
                        <span aria-hidden="true" className="judul-display text-[clamp(3.5rem,7vw,6rem)] leading-none text-transparent [-webkit-text-stroke:1.5px_var(--w)]">0{peran + 1}</span>
                      </div>
                      <h3 className="judul-display m-0 mt-4 text-[clamp(2rem,4vw,3.25rem)] leading-[1.02]">{m.peran}</h3>
                      <p className="m-0 mt-4 max-w-[46ch] text-lg leading-relaxed text-ink">{tr(...r.ket)}</p>
                      <ul className="m-0 mt-6 flex list-none flex-wrap gap-2.5 p-0">
                        {r.chip.map((c, k) => <li key={c[0]} style={{ animationDelay: `${120 + k * 70}ms` }} className="rounded-full border-2 border-[var(--w)] bg-[color-mix(in_srgb,var(--w)_16%,transparent)] px-4 py-1.5 text-sm font-semibold text-ink motion-safe:[animation:tile-masuk_.45s_var(--ease-snap)_both]">{tr(...c)}</li>)}
                      </ul>
                    </div>
                  )
                })()}
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="faq-judul" className="border-t border-line py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <h2 id="faq-judul" className="m-0 text-4xl leading-[1.02] sm:text-5xl">{tr('Sebelum menulis, cek ini', 'Before you write, check this')}</h2>
            <div className="flex flex-col gap-3">
              {TANYA.map(([t, j], i) => (
                <details key={t} style={{ '--w': ['var(--ember)', 'var(--flame)', 'var(--canopy)', 'var(--amber)'][i % 4] }} className="group rounded-2xl border border-line border-l-[6px] border-l-[var(--w)] bg-[linear-gradient(100deg,color-mix(in_srgb,var(--w)_9%,var(--surface)),var(--surface)_60%)] transition-[box-shadow,translate,background-color] duration-300 ease-snap hover:-translate-y-0.5 open:shadow-[0_24px_50px_-26px_color-mix(in_srgb,var(--w)_70%,transparent)]">
                  <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    <span aria-hidden="true" className="font-mono text-xs text-ink-2">0{i + 1}</span>
                    <span className="flex-1">{t}</span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-lg leading-none transition-[rotate,background-color,color] duration-300 ease-snap group-open:rotate-45 group-open:border-transparent group-open:bg-[var(--w)] group-open:text-bg" aria-hidden="true">+</span>
                  </summary>
                  <p className="m-0 max-w-[60ch] px-5 pb-5 pl-14 text-base leading-relaxed text-ink-2">{j}</p>
                </details>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
