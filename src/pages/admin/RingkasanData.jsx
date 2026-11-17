import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, ExternalLink, ListChecks, Satellite, Target, UserRound } from 'lucide-react'
import { KARTU, KILAU, Kosong, tunda } from './kit'
import { belajarPerangkat, ringkasSipongi } from '../../lib/dataPengguna'
import { useBahasa, useTr } from '../../i18n'

const tanggalPendek = (t, b) => new Intl.DateTimeFormat(b === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${t}T00:00:00`))

/** Titik panas nyata SiPongi: snapshot yang sama dengan layer SiPongi di halaman Peta pengunjung. */
export function KartuSipongi({ i = 7 }) {
  const tr = useTr()
  const b = useBahasa()
  const d = useMemo(() => ringkasSipongi(), [])
  const [wil, setWil] = useState('kaltim')
  const kab = wil === 'kaltim' ? d.kabKaltim : d.kabLuar
  const maks = Math.max(...d.perTanggal.map((x) => x[wil]), 1)
  return (
    <section aria-labelledby="sp-h" className={`${KARTU} xl:col-span-7`} style={{ ...KILAU, ...tunda(i) }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="sp-h" className="m-0 flex items-center gap-2 !font-sans !text-lg !font-semibold !tracking-normal text-ink-2 ![font-stretch:100%]"><Satellite size={17} aria-hidden="true" className="text-ember-ink" />{tr('Titik panas nyata (SiPongi)', 'Real hotspots (SiPongi)')}</h2>
          <p className="m-0 mt-1 text-sm text-ink-2">{tr('Data yang sama dengan layer SiPongi di Peta pengunjung', 'The same data as the SiPongi layer on the visitor Map')} · {tanggalPendek(d.perTanggal[0].t, b)}–{tanggalPendek(d.perTanggal.at(-1).t, b)} 2026</p>
        </div>
        <div role="group" aria-label={tr('Wilayah', 'Region')} className="flex rounded-full border border-line p-0.5">
          {[['kaltim', tr('Kaltim', 'East Kalimantan')], ['luar', tr('Provinsi lain', 'Other provinces')]].map(([k, l]) => (
            <button key={k} type="button" aria-pressed={wil === k} onClick={() => setWil(k)} className={`min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${wil === k ? 'bg-ember-ink text-on-ember' : 'text-ink-2 hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className="m-0 judul-display text-[clamp(2.5rem,4.5vw,3.5rem)] font-bold leading-none tabular-nums">{(wil === 'kaltim' ? d.totalKaltim : d.totalLuar).toLocaleString(b === 'en' ? 'en-GB' : 'id-ID')}</p>
          <p className="m-0 mt-1 text-sm text-ink-2">{tr('titik panas dalam 3 hari', 'hotspots over 3 days')}</p>
          <ul className="m-0 mt-4 grid list-none gap-2 p-0">
            {d.perTanggal.map((x) => (
              <li key={x.t} className="grid grid-cols-[4.5rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                <span className="font-mono text-xs text-ink-2">{tanggalPendek(x.t, b)}</span>
                <span aria-hidden="true" className="h-2.5 overflow-hidden rounded-full bg-line/60"><span className="block h-full rounded-full bg-ember transition-[width] duration-500 ease-snap" style={{ width: `${(x[wil] / maks) * 100}%` }} /></span>
                <b className="text-right tabular-nums">{x[wil]}</b>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">{tr('Kabupaten terbanyak', 'Top districts')}</p>
          <ol className="m-0 mt-2 grid list-none gap-1.5 p-0">
            {kab.map((k, n) => (
              <li key={k.nama} className="flex items-center justify-between gap-3 rounded-xl bg-bg/50 px-3 py-2 text-sm">
                <span className="min-w-0 truncate"><span className="mr-2 font-mono text-xs text-ember-ink">{String(n + 1).padStart(2, '0')}</span>{k.nama}</span><b className="tabular-nums">{k.n}</b>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <p className="m-0 mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-2">
        <span>{tr('Sumber', 'Source')}: <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-ember-ink underline underline-offset-2">{d.sumber}<ExternalLink size={11} aria-hidden="true" /></a>. {tr('Titik panas adalah indikasi, perlu verifikasi lapangan. Simulasi tetap memakai 10 hotspot demo.', 'Hotspots are indications that need field checks. The simulation still uses the 10 demo hotspots.')}</span>
        <Link to="/admin/peta" className="inline-flex items-center gap-1 font-semibold text-ink underline-offset-4 hover:underline">{tr('Lihat di peta', 'View on the map')}<ArrowRight size={12} aria-hidden="true" /></Link>
      </p>
    </section>
  )
}

/** Kemajuan belajar pengunjung yang tersimpan di perangkat ini (tamu dan akun yang pernah masuk). */
export function KartuBelajar({ i = 8 }) {
  const tr = useTr()
  const b = useBahasa()
  const d = useMemo(() => belajarPerangkat(b), [b])
  const maksArtikel = Math.max(1, ...d.artikel.map((a) => a.n))
  return (
    <section aria-labelledby="bl-h" className={`${KARTU} xl:col-span-5`} style={{ ...KILAU, ...tunda(i) }}>
      <h2 id="bl-h" className="m-0 flex items-center gap-2 !font-sans !text-lg !font-semibold !tracking-normal text-ink-2 ![font-stretch:100%]"><UserRound size={17} aria-hidden="true" className="text-canopy" />{tr('Kemajuan belajar pengunjung', 'Visitor learning progress')}</h2>
      <p className="m-0 mt-1 text-sm text-ink-2">{tr('Dari akun dan tamu yang memakai PyraOps di perangkat ini (demo tanpa server).', 'From accounts and guests that used PyraOps on this device (demo, no server).')}</p>
      {d.ruang.length === 0 ? <div className="mt-4"><Kosong teks={tr('Belum ada pengunjung yang membaca, menjawab kuis, atau mencentang persiapan di perangkat ini.', 'No visitor has read, taken the quiz, or ticked the checklist on this device yet.')} /></div> : (
        <ul className="m-0 mt-4 grid list-none gap-2 p-0">
          {d.ruang.map((r) => (
            <li key={r.nama ?? 'tamu'} className="rounded-2xl bg-bg/50 px-3.5 py-3">
              <p className="m-0 text-sm font-semibold">{r.nama ?? tr('Tamu (belum masuk)', 'Guest (not signed in)')}</p>
              <dl className="m-0 mt-2 grid grid-cols-3 gap-2 text-xs text-ink-2">
                <div><dt className="flex items-center gap-1"><BookOpenText size={12} aria-hidden="true" />{tr('Bacaan', 'Reads')}</dt><dd className="m-0 mt-0.5 text-base font-bold tabular-nums text-ink">{r.bacaan.length}/{d.nArtikel}</dd></div>
                <div><dt className="flex items-center gap-1"><Target size={12} aria-hidden="true" />{tr('Kuis terbaik', 'Best quiz')}</dt><dd className="m-0 mt-0.5 text-base font-bold tabular-nums text-ink">{r.skor ? `${r.skor.skor}/${r.skor.total}` : '–'}</dd></div>
                <div><dt className="flex items-center gap-1"><ListChecks size={12} aria-hidden="true" />{tr('Persiapan', 'Prep')}</dt><dd className="m-0 mt-0.5 text-base font-bold tabular-nums text-ink">{r.centang}/{d.nCentang}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
      <p className="m-0 mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2">{tr('Buku yang sudah dibaca', 'Books read')}</p>
      <ul className="m-0 mt-2 grid list-none gap-1.5 p-0">
        {d.artikel.map((a) => (
          <li key={a.slug} className="grid grid-cols-[minmax(0,1fr)_5rem_1.5rem] items-center gap-3 text-sm">
            <span className="truncate">{a.judul}</span>
            <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-line/60"><span className="block h-full rounded-full bg-canopy" style={{ width: `${(a.n / maksArtikel) * 100}%` }} /></span>
            <b className="text-right tabular-nums">{a.n}</b>
          </li>
        ))}
      </ul>
    </section>
  )
}
