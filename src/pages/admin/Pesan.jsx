import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Check, Mail, Reply, Trash2, X } from 'lucide-react'
import { Kepala, Kosong, Waktu, chip, tunda } from './kit'
import { useAdmin } from '../../components/useAdmin'
import { useAuth } from '../../components/authContext'
import { catat, hapusPesan, kembalikanPesan, tandaiBaca } from '../../lib/admin'
import { useToast } from '../../components/ui/toastContext'
import { kurangiGerak } from '../../lib/gerak'
import { useJudul } from '../../lib/useJudul'
import { useSorot } from '../../lib/sorot'
import { lokal, useBahasa, useTr } from '../../i18n'

const awal = (n) => n.trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('')

// Panel baca satu pesan: dipakai di kolom kanan (desktop) dan di bawah baris terpilih (ponsel).
function Baca({ p, topik, hapus, tutup }) {
  const tr = useTr()
  const btn = 'inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition-[scale,filter,border-color,color] duration-150 ease-snap active:scale-95'
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-full bg-canopy font-display text-lg font-extrabold text-on-ember [font-stretch:76%]">{awal(p.nama)}</span>
        <div className="min-w-0 flex-1">
          <p className="m-0 text-lg font-bold leading-tight">{p.nama}</p>
          <p className="m-0 truncate text-sm text-ink-2">{p.email}</p>
        </div>
        {tutup && <button type="button" onClick={tutup} aria-label={tr('Tutup pesan', 'Close message')} className="flex size-9 items-center justify-center rounded-lg border border-line text-ink-2 lg:hidden"><X size={16} aria-hidden="true" /></button>}
      </div>
      <p className="m-0 mt-4 flex items-center gap-2 text-xs text-ink-2"><span className="rounded-full border border-line px-2 py-0.5 font-medium text-ink">{topik}</span><Waktu t={p.waktu} /></p>
      <p className="m-0 mt-4 whitespace-pre-wrap text-base leading-relaxed">{p.pesan}</p>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
        <a href={`mailto:${p.email}?subject=${encodeURIComponent('Re: PyraOps')}`} className={`${btn} bg-ember-ink text-on-ember hover:brightness-110`}><Reply size={15} aria-hidden="true" />{tr('Balas', 'Reply')}</a>
        <button type="button" onClick={() => tandaiBaca(p.id, false)} className={`${btn} border border-line text-ink-2 hover:border-ink-2 hover:text-ink`}><Check size={15} aria-hidden="true" />{tr('Tandai belum dibaca', 'Mark unread')}</button>
        <button type="button" onClick={() => hapus(p)} className={`${btn} border border-line text-ink-2 hover:border-flame hover:text-flame`}><Trash2 size={15} aria-hidden="true" />{tr('Hapus', 'Delete')}</button>
      </div>
    </div>
  )
}

export default function Pesan() {
  const tr = useTr()
  const b = useBahasa()
  useJudul(tr('Pesan masuk', 'Inbox'))
  const { sesi } = useAuth()
  const { pesan } = useAdmin()
  const loc = useLocation()
  const [buka, setBuka] = useState(() => loc.state?.buka ?? null)
  const [saring, setSaring] = useState('semua')
  const [keluar, setKeluar] = useState(null) // id pesan yang sedang menyusut keluar sebelum benar-benar dihapus
  const toast = useToast()
  useSorot()
  // Tiba dari pencarian: buka pesannya dan tampilkan semua pesan agar tidak tersaring
  const [kunciLoc, setKunciLoc] = useState(loc.key)
  if (kunciLoc !== loc.key) { setKunciLoc(loc.key); if (loc.state?.buka) { setBuka(loc.state.buka); setSaring('semua') } }
  const TOPIK = { saran: tr('Saran', 'Suggestion'), galat: tr('Laporan galat', 'Bug report'), kolaborasi: tr('Kolaborasi', 'Collaboration'), lain: tr('Lainnya', 'Other') }
  const belum = pesan.filter((p) => !p.baca).length
  const tampil = pesan.filter((p) => saring === 'semua' || (saring === 'belum' ? !p.baca : p.baca))
  const aktif = tampil.find((p) => p.id === buka) ?? tampil[0]

  const bukaPesan = (p) => {
    setBuka(p.id)
    if (!p.baca) { tandaiBaca(p.id, true); catat([`Membaca pesan dari ${p.nama}`, `Read a message from ${p.nama}`], sesi?.nama) }
  }
  // Hapus: baris menyusut dulu (≈300 ms), lalu dihapus; toast menawarkan Urungkan yang mengembalikan pesan ke posisinya
  const hapus = (p) => {
    const asli = pesan.find((x) => x.id === p.id) ?? p
    const posisi = pesan.findIndex((x) => x.id === p.id)
    const selesai = () => {
      hapusPesan(p.id); setKeluar(null); setBuka(null)
      catat([`Menghapus pesan dari ${p.nama}`, `Deleted a message from ${p.nama}`], sesi?.nama)
      toast.show(tr(`Pesan dari ${p.nama} dihapus.`, `Message from ${p.nama} deleted.`), 'info', {
        kunci: `pesan-${p.id}`,
        aksi: { label: tr('Urungkan', 'Undo'), urungkan: true, jalankan: () => {
          kembalikanPesan(asli, Math.max(0, posisi)); setBuka(p.id)
          catat([`Mengembalikan pesan dari ${p.nama}`, `Restored a message from ${p.nama}`], sesi?.nama)
        } },
      })
    }
    if (kurangiGerak()) { selesai(); return }
    setKeluar(p.id); setTimeout(selesai, 300)
  }

  return (
    <>
      <Kepala kicker={tr('Kontak', 'Contact')} judul={tr('Pesan masuk', 'Inbox')}
        ket={tr(`${belum} belum dibaca. Pesan dari form Kontak yang dikirim di perangkat ini muncul di sini, bersama beberapa contoh.`, `${belum} unread. Messages sent through the Contact form on this device show up here, along with a few samples.`)} />
      <div className="flex flex-wrap gap-2" role="group" aria-label={tr('Saring pesan', 'Filter messages')}>
        {[['semua', tr('Semua', 'All')], ['belum', tr('Belum dibaca', 'Unread')], ['dibaca', tr('Sudah dibaca', 'Read')]].map(([k, l]) => <button key={k} type="button" aria-pressed={saring === k} onClick={() => setSaring(k)} className={chip(saring === k)}>{l}</button>)}
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {tampil.length === 0 ? <div className="lg:col-span-2"><Kosong teks={tr('Tidak ada pesan di sini.', 'No messages here.')} /></div> : (
          <>
            <ul className="m-0 grid list-none gap-0 p-0 [&>li>div]:pb-2">
              {tampil.map((raw, i) => {
                const p = lokal(raw, b)
                const dipilih = aktif?.id === p.id
                const pergi = keluar === p.id
                return (
                  <li key={p.id} style={tunda(Math.min(i, 8))} className={`baris-masuk-halus grid transition-[grid-template-rows,opacity,translate] duration-300 ease-snap ${pergi ? 'pointer-events-none -translate-x-6 grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr]'}`}>
                    <div className={`min-h-0 ${pergi ? 'overflow-hidden' : ''}`}>
                    <button type="button" id={`pesan-${p.id}`} onClick={() => bukaPesan(p)} aria-pressed={dipilih}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-[border-color,background-color,translate] duration-200 ease-snap hover:-translate-y-px ${dipilih ? 'border-ink-2 bg-surface lg:shadow-[0_0_0_1px_var(--ember)]' : 'border-line bg-bg hover:border-ink-2'}`}>
                      <span aria-hidden="true" className={`relative flex size-11 shrink-0 items-center justify-center rounded-full font-display text-base font-extrabold [font-stretch:76%] ${p.baca ? 'border border-line text-ink-2' : 'bg-ember-ink text-on-ember'}`}>{awal(p.nama)}{!p.baca && <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-bg bg-flame" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2"><span className={`truncate text-sm ${p.baca ? 'font-medium' : 'font-bold'}`}>{p.nama}</span><span className="shrink-0 text-xs text-ink-2"><Waktu t={p.waktu} /></span></span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ember-ink"><Mail size={11} aria-hidden="true" />{TOPIK[p.topik] ?? p.topik}{!p.baca && <span className="sr-only"> · {tr('belum dibaca', 'unread')}</span>}</span>
                        <span className="mt-1 line-clamp-2 block text-sm text-ink-2">{p.pesan}</span>
                      </span>
                    </button>
                    {buka === p.id && <div className="mt-2 lg:hidden"><Baca p={p} topik={TOPIK[p.topik] ?? p.topik} hapus={hapus} tutup={() => setBuka(null)} /></div>}
                    </div>
                  </li>
                )
              })}
            </ul>
            <div className="sticky top-20 hidden lg:block">
              {aktif && <div key={aktif.id} className="tab-ganti"><Baca p={lokal(aktif, b)} topik={TOPIK[aktif.topik] ?? aktif.topik} hapus={hapus} /></div>}
            </div>
          </>
        )}
      </div>
    </>
  )
}
