import { useState } from 'react'
import { useTr } from '../../i18n'

// Potongan tampilan bersama dashboard admin ("ruang kendali": label mono, garis halus, angka besar)
export function Kepala({ kicker, judul, ket, aksi }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {kicker && <p className="m-0 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ember-ink"><span aria-hidden="true" className="h-px w-6 bg-ember-ink" />{kicker}</p>}
        <h1 className="judul-display m-0 mt-2 text-4xl leading-[1.02] sm:text-5xl">{judul}</h1>
        {ket && <p className="m-0 mt-2 max-w-[62ch] text-[15px] leading-relaxed text-ink-2">{ket}</p>}
      </div>
      {aksi}
    </header>
  )
}

/** Kotak konten: judul panel berupa label mono kecil, bukan judul besar, supaya angka dan data yang jadi fokus. */
export const Panel = ({ judul, aksi, children, className = '', ...rest }) => (
  <section {...rest} className={`min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5 ${className}`}>
    {(judul || aksi) && (
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="m-0 !font-mono !text-[11px] !font-medium !uppercase !tracking-[0.2em] text-ink-2 ![font-stretch:100%]">{judul}</h2>
        {aksi}
      </div>
    )}
    {children}
  </section>
)

export const Kosong = ({ teks }) => <p className="m-0 rounded-xl border border-line px-4 py-8 text-center text-sm text-ink-2">{teks}</p>

export function Waktu({ t }) {
  const tr = useTr()
  const [sekarang] = useState(Date.now) // dibekukan saat dirender; cukup untuk label relatif di dashboard
  const m = Math.max(0, Math.round((sekarang - t) / 60000))
  const teks = m < 1 ? tr('baru saja', 'just now') : m < 60 ? tr(`${m} menit lalu`, `${m} min ago`) : m < 1440 ? tr(`${Math.round(m / 60)} jam lalu`, `${Math.round(m / 60)} h ago`) : tr(`${Math.round(m / 1440)} hari lalu`, `${Math.round(m / 1440)} d ago`)
  return <time dateTime={new Date(t).toISOString()} title={new Date(t).toLocaleString()}>{teks}</time>
}

export const SEV = { ringan: ['Ringan', 'Light', 'border-canopy bg-canopy/15', 'bg-canopy'], sedang: ['Sedang', 'Moderate', 'border-amber bg-amber/15', 'bg-amber'], berat: ['Berat', 'Severe', 'border-flame bg-flame/15', 'bg-flame'] }
export function Tingkat({ v }) {
  const tr = useTr()
  const [i, e, cls, dot] = SEV[v] ?? SEV.ringan
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium text-ink ${cls}`}><span className={`size-1.5 rounded-full ${dot}`} aria-hidden="true" />{tr(i, e)}</span>
}

/** Kelas tombol saring (chip) yang sama di semua halaman admin. */
export const chip = (aktif) => `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-[background-color,border-color,color,scale] duration-150 ease-snap active:scale-95 ${aktif ? 'border-ember-ink bg-ember-ink text-on-ember' : 'border-line text-ink-2 hover:border-ink-2 hover:text-ink'}`

/** Warna menurut kategori risiko / tingkat laporan. */
export const WARNA_KAT = { kritis: 'var(--flame)', tinggi: 'var(--ember)', waspada: 'var(--amber)' }
export const WARNA_SEV = { berat: 'var(--flame)', sedang: 'var(--amber)', ringan: 'var(--canopy)' }
export const WARNA_STATUS = { baru: 'var(--flame)', verifikasi: 'var(--amber)', ditangani: 'var(--ember)', selesai: 'var(--canopy)' }

// ---- Bahasa visual "kaca hangat" bersama (Ringkasan, Laporan): kartu bersudut besar, kilau oranye halus, kontrol berbentuk pil ----
export const KARTU = 'relative isolate overflow-hidden rounded-[1.75rem] border border-line p-5 shadow-[inset_0_1px_0_0_color-mix(in_oklab,var(--text)_9%,transparent)] sm:p-6 motion-safe:[animation:tile-masuk_.6s_cubic-bezier(.2,.8,.2,1)_both]'
export const KILAU = { background: 'radial-gradient(120% 95% at 0% 0%, color-mix(in oklab, var(--ember) 14%, var(--surface)), var(--surface) 62%)' }
export const JINGGA = { background: 'linear-gradient(150deg, var(--ember), color-mix(in oklab, var(--ember) 55%, var(--amber)))' }
export const tunda = (i) => ({ animationDelay: `${i * 70}ms` })

/** Kontrol segmen berbentuk pil: pilihan yang aktif "terangkat". opsi = [[nilai, label], ...] */
export function Segmen({ label, nilai, opsi, onUbah }) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-full border border-line bg-bg p-1">
      {opsi.map(([v, l]) => (
        <button key={v} type="button" aria-pressed={nilai === v} onClick={() => onUbah(v)}
          className={`min-h-8 rounded-full px-3.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200 ease-snap ${nilai === v ? 'bg-surface text-ink shadow-[0_1px_0_0_var(--border),0_0_0_1px_var(--border)]' : 'text-ink-2 hover:text-ink'}`}>{l}</button>
      ))}
    </div>
  )
}
