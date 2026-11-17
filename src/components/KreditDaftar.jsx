import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, Flame, Map as Peta, Wind } from 'lucide-react'
import { KREDIT } from '../data/kredit'
import { lokal, useBahasa, useTr } from '../i18n'

const BELUM_DIISI = /\[ISI/
// Baris yang atribusinya belum lengkap tidak ditampilkan ke pengunjung (cek:rilis tetap menahannya sampai terisi).
const lengkap = (r) => ![r.nama, r.lisensi, r.sumber].some((s) => BELUM_DIISI.test(String(s ?? '')))
const SEPERTI_DOMAIN = /^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i
const TEPI = 'border-[rgb(0_0_0/0.9)]'
const BAYANG = 'shadow-[7px_7px_0_0_rgb(0_0_0/0.9)]'

// Tiap jenis data: satu bidang warna penuh. Kelas ditulis utuh agar terbaca oleh Tailwind.
const DATA = {
  'Data peta': { Ikon: Peta, warna: 'bg-canopy', miring: 'md:-rotate-[1.4deg]' },
  'Data cuaca': { Ikon: Wind, warna: 'bg-amber', miring: 'md:rotate-[1deg] md:translate-y-3' },
  'Data karhutla': { Ikon: Flame, warna: 'bg-ember', miring: 'md:-rotate-[0.7deg]' },
}
const CHIP = ['bg-ember', 'bg-amber', 'bg-canopy', 'bg-flame']
const MIRING_CHIP = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2']

/** True setelah elemen terlihat di layar (atau bila IntersectionObserver tak ada): memicu animasi masuk sekali. */
function useTerlihat() {
  const ref = useRef(null)
  const [lihat, setLihat] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (lihat || !ref.current) return undefined
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLihat(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [lihat])
  return [ref, lihat]
}

function Sumber({ teks }) {
  const tr = useTr()
  const kelas = 'mt-auto inline-flex min-h-9 w-fit items-center gap-2 break-all pt-6 text-sm font-bold text-bg'
  if (!SEPERTI_DOMAIN.test(teks)) return <p className={`m-0 ${kelas}`}>{teks}</p>
  return (
    <a href={`https://${teks}`} target="_blank" rel="noreferrer" className={`${kelas} underline decoration-2 underline-offset-4 transition-[gap] duration-200 ease-snap hover:gap-3`}>
      {teks}<ArrowUpRight size={16} strokeWidth={3} aria-hidden="true" className="shrink-0" /><span className="sr-only"> ({tr('buka di tab baru', 'opens in a new tab')})</span>
    </a>
  )
}

/** Kredit bergaya poster: tiga bidang warna penuh dengan bayangan keras, lalu pita pustaka yang berjalan. */
export default function KreditDaftar() {
  const tr = useTr()
  const b = useBahasa()
  const [buka, setBuka] = useState(false)
  const [ref, lihat] = useTerlihat()
  const baris = KREDIT.filter(lengkap)
  const data = baris.filter((r) => DATA[r.jenis])
  const pustaka = baris.filter((r) => !DATA[r.jenis])
  const chip = (r, i, kunci) => (
    <li key={kunci + r.jenis + r.nama} className={`inline-flex shrink-0 items-center rounded-lg border-2 ${TEPI} px-4 py-2 text-sm font-bold ${CHIP[i % CHIP.length] === 'bg-ember' ? 'text-on-ember' : 'text-bg'} ${CHIP[i % CHIP.length]} ${MIRING_CHIP[i % MIRING_CHIP.length]} transition-transform duration-200 ease-snap hover:-translate-y-1 hover:rotate-0`}>{lokal(r, b).jenis}</li>
  )

  return (
    <div ref={ref} className="grid gap-9">
      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
        {data.map((r, n) => {
          const k = lokal(r, b)
          const d = DATA[r.jenis]
          return (
            <li key={r.jenis} style={{ '--r0': n % 2 ? '8deg' : '-8deg', '--d': `${n * 130}ms` }} className={`${lihat ? 'kartu-masuk' : 'opacity-0'} ${d.miring} transition-transform duration-300 ease-snap hover:rotate-0`}>
              <div className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 ${TEPI} ${d.warna} p-6 text-bg ${BAYANG} transition-[translate,box-shadow] duration-200 ease-snap hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[11px_11px_0_0_rgb(0_0_0/0.9)]`}>
                <d.Ikon aria-hidden="true" size={170} strokeWidth={1.25} className="pointer-events-none absolute -bottom-10 -right-8 text-bg opacity-15 transition-transform duration-500 ease-snap group-hover:-rotate-12 group-hover:scale-110" />
                <span aria-hidden="true" className="pointer-events-none absolute right-4 top-2 font-display text-7xl leading-none text-transparent [-webkit-text-stroke:2px_var(--bg)] [font-stretch:76%] opacity-40">{String(n + 1).padStart(2, '0')}</span>
                <span aria-hidden="true" className={`grid size-12 place-items-center rounded-xl border-2 ${TEPI} bg-bg text-ink transition-transform duration-300 ease-snap group-hover:-rotate-12`}><d.Ikon size={24} /></span>
                <p className="m-0 mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.2em]">{k.jenis}</p>
                <p className="m-0 mt-2 text-lg font-bold leading-snug">{k.nama}</p>
                <p className="m-0 mt-4"><span className={`inline-block -rotate-2 rounded-md border-2 ${TEPI} bg-bg px-2.5 py-1 font-mono text-xs font-bold leading-snug text-ink`}>{k.lisensi}</span></p>
                <Sumber teks={k.sumber} />
              </div>
            </li>
          )
        })}
      </ul>

      <div className={`relative overflow-hidden rounded-2xl border-2 ${TEPI} bg-ink p-6 text-bg ${BAYANG} sm:p-8`}>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <div>
            <h3 className="m-0 text-3xl leading-none text-bg sm:text-4xl">{tr('Pustaka dan aset', 'Libraries and assets')}</h3>
            <p className="m-0 mt-2 text-sm font-medium leading-relaxed opacity-80">{tr('Semuanya terbuka dan dipakai sesuai lisensinya.', 'All open, used under their licences.')}</p>
          </div>
          <button type="button" aria-expanded={buka} onClick={() => setBuka(!buka)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-bg px-5 text-sm font-bold text-ink transition-[transform,background-color,color] duration-200 ease-snap hover:bg-ember hover:text-on-ember active:scale-[0.97]">
            {buka ? tr('Sembunyikan rincian', 'Hide details') : tr('Lihat rincian', 'See details')}
            <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ease-snap ${buka ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {!buka && (
          <div className="mt-7 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] motion-reduce:[mask-image:none]">
            <div className="flex w-max animate-[jalan_38s_linear_infinite] hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:animate-none">
              <ul className="m-0 flex list-none gap-3 p-0 pr-3 motion-reduce:flex-wrap">{pustaka.map((r, i) => chip(r, i, 'a'))}</ul>
              <ul aria-hidden="true" className="m-0 flex list-none gap-3 p-0 pr-3 motion-reduce:hidden">{pustaka.map((r, i) => chip(r, i, 'b'))}</ul>
            </div>
          </div>
        )}
        {buka && (
          <ul className="m-0 mt-7 grid list-none gap-x-8 p-0 sm:grid-cols-2">
            {pustaka.map((r, i) => { const k = lokal(r, b); return (
              <li key={r.jenis + r.nama} className="grid grid-cols-[0.875rem_minmax(0,1fr)] gap-x-3 border-t-2 border-dashed border-bg/30 py-3">
                <span aria-hidden="true" className={`mt-1.5 size-3 rounded-sm border-2 ${TEPI} ${CHIP[i % CHIP.length]}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{k.jenis}</span>
                  <span className="mt-0.5 block text-sm leading-snug">{k.nama}</span>
                  <span className="mt-1 block text-xs leading-relaxed opacity-75">{k.lisensi} · {k.sumber}</span>
                </span>
              </li>
            ) })}
          </ul>
        )}
      </div>
    </div>
  )
}
