import { useState } from 'react'
import { Activity, BookOpenText, ClipboardCheck, KeyRound, Mail } from 'lucide-react'
import { Kepala, Kosong, Panel, tunda } from './kit'
import { useAdmin } from '../../components/useAdmin'
import { useJudul } from '../../lib/useJudul'
import { useBahasa, useTr } from '../../i18n'

// Jenis aktivitas ditebak dari awal kalimat log (log hanya menyimpan teks), cukup untuk ikon dan ringkasan.
const JENIS = [
  ['status', /^(Status laporan)/, ClipboardCheck, 'var(--amber)'],
  ['konten', /^(Menerbitkan|Menarik)/, BookOpenText, 'var(--canopy)'],
  ['pesan', /(pesan)/i, Mail, 'var(--ember)'],
  ['sesi', /^(Masuk|Keluar)/, KeyRound, 'var(--text-2)'],
]
const jenisDari = (teks) => JENIS.find(([, re]) => re.test(teks)) ?? ['lain', null, Activity, 'var(--text-2)']

export default function Aktivitas() {
  const tr = useTr()
  const b = useBahasa()
  useJudul(tr('Log aktivitas', 'Activity log'))
  const { log } = useAdmin()
  const [sekarang] = useState(() => Date.now())
  const NAMA = { status: tr('Status laporan', 'Report status'), konten: tr('Konten', 'Content'), pesan: tr('Pesan', 'Messages'), sesi: tr('Sesi', 'Sessions'), lain: tr('Lainnya', 'Other') }
  const loc = b === 'en' ? 'en-US' : 'id-ID'
  const hariKe = (t) => new Date(t).toLocaleDateString('sv-SE') // kunci hari lokal YYYY-MM-DD
  const hariIni = hariKe(sekarang), kemarin = hariKe(sekarang - 86_400_000)
  const label = (k, t) => (k === hariIni ? tr('Hari ini', 'Today') : k === kemarin ? tr('Kemarin', 'Yesterday') : new Date(t).toLocaleDateString(loc, { day: 'numeric', month: 'long' }))
  const grup = []
  for (const l of log) {
    const k = hariKe(l.t)
    const g = grup.find((x) => x.k === k)
    if (g) g.isi.push(l); else grup.push({ k, t: l.t, isi: [l] })
  }
  const hitung = {}
  for (const l of log) { const j = jenisDari(l.id)[0]; hitung[j] = (hitung[j] ?? 0) + 1 }

  return (
    <>
      <Kepala kicker={tr('Jejak', 'Trail')} judul={tr('Log aktivitas', 'Activity log')} ket={tr('Riwayat tindakan admin di perangkat ini. Menyimpan 60 catatan terakhir.', 'A history of admin actions on this device. Keeps the last 60 entries.')} />
      {log.length === 0 ? <Kosong teks={tr('Belum ada aktivitas.', 'No activity yet.')} /> : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="grid gap-6">
            {grup.map((g) => (
              <section key={g.k} aria-label={label(g.k, g.t)}>
                <p className="m-0 mb-3 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2"><span>{label(g.k, g.t)}</span><span aria-hidden="true" className="h-px flex-1 bg-line" /><span>{g.isi.length}</span></p>
                <ol className="m-0 grid list-none gap-2 p-0">
                  {g.isi.map((l, i) => {
                    const [, , Ikon, warna] = jenisDari(l.id)
                    return (
                      <li key={`${l.t}-${i}`} style={tunda(Math.min(i, 8))} className="baris-masuk-halus flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-3 transition-[border-color,translate] duration-200 ease-snap hover:-translate-y-px hover:border-ink-2">
                        <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `color-mix(in srgb, ${warna} 16%, transparent)`, color: warna }}><Ikon size={17} /></span>
                        <span className="min-w-0 flex-1"><span className="block text-sm font-medium leading-snug">{b === 'en' ? l.en : l.id}</span><span className="block text-xs text-ink-2">{l.oleh}</span></span>
                        <time dateTime={new Date(l.t).toISOString()} className="shrink-0 font-mono text-xs text-ink-2">{new Date(l.t).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })}</time>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ))}
          </div>
          <Panel judul={tr('Ringkasan', 'Summary')} className="lg:sticky lg:top-20">
            <p className="judul-display m-0 text-6xl leading-none tabular-nums">{log.length}</p>
            <p className="m-0 mt-1 text-sm text-ink-2">{tr('catatan tersimpan', 'entries kept')}</p>
            <ul className="m-0 mt-5 grid list-none gap-2.5 p-0">
              {Object.entries(hitung).map(([j, n]) => {
                const [, , Ikon, warna] = JENIS.find((x) => x[0] === j) ?? ['lain', null, Activity, 'var(--text-2)']
                return <li key={j} className="flex items-center gap-2.5 text-sm"><Ikon size={15} aria-hidden="true" style={{ color: warna }} /><span className="flex-1">{NAMA[j]}</span><span className="font-mono tabular-nums text-ink-2">{n}</span></li>
              })}
            </ul>
          </Panel>
        </div>
      )}
    </>
  )
}
