import { useEffect, useRef, useState } from 'react'
import { Backpack, BedDouble, Check, CookingPot, Droplets, FileText, Flashlight, Flower2, Gamepad2, Guitar, Pill, RotateCcw, X } from 'lucide-react'
import { MaskotEkspresi } from './Maskot'
import { BARANG_TAS, KAPASITAS_TAS, masukkanBarang } from '../lib/checklist'
import { POLA, sentuhan } from '../lib/sentuhan'
import { useTr } from '../i18n'

// Masker tidak ada di set ikon; digambar sederhana dengan gaya garis yang sama
function Masker(p) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width={p.size} height={p.size}>
      <path d="M5 9c3-2 11-2 14 0v4c0 3-4 5-7 5s-7-2-7-5Z" /><path d="M5 10H3a1 1 0 0 0-1 1v1a3 3 0 0 0 3 3M19 10h2a1 1 0 0 1 1 1v1a3 3 0 0 1-3 3M9 12h6M9 15h6" />
    </svg>
  )
}
const IKON = { air: Droplets, obat: Pill, senter: Flashlight, dokumen: FileText, masker: Masker, bantal: BedDouble, konsol: Gamepad2, gitar: Guitar, panci: CookingPot, pot: Flower2 }
const AWAL = { isi: [], salah: [] }
// Urutan acak tetap per permainan, agar barang benar tidak selalu di depan
const acak = () => [...BARANG_TAS].map((b) => [Math.random(), b]).sort((a, c) => a[0] - c[0]).map(([, b]) => b)

/**
 * Mini game "Kemas tas siaga": pilih (ketuk atau seret) barang ke tas. Barang penting masuk, pengecoh ditolak dan TORA
 * menjelaskan alasannya. Selesai bila kelima barang penting sudah masuk; butir checklist tas siaga lalu bisa ditandai.
 */
export default function KemasTas({ open, onClose, onSelesai }) {
  const tr = useTr()
  const ref = useRef(null)
  const [urut, setUrut] = useState(acak)
  const [st, setSt] = useState(AWAL)
  const [ucap, setUcap] = useState(null) // { teks, nada: 'ramah'|'merayakan'|'sedih', k }
  const [geleng, setGeleng] = useState({ id: null, k: 0 })
  const [diatas, setDiatas] = useState(false) // barang sedang diseret di atas tas
  const selesai = st.isi.length === KAPASITAS_TAS

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  const ulang = () => { setSt(AWAL); setUcap(null); setUrut(acak()) }
  const pilih = (id) => {
    const b = BARANG_TAS.find((x) => x.id === id)
    const { keadaan, hasil } = masukkanBarang(st, id)
    if (hasil === 'abaikan') return
    setSt(keadaan)
    if (hasil === 'tolak') {
      setGeleng((g) => ({ id, k: g.k + 1 })); sentuhan(POLA.salah)
      setUcap({ teks: tr(...b.alasan), nada: 'sedih', k: (ucap?.k ?? 0) + 1 })
    } else {
      sentuhan(hasil === 'selesai' ? POLA.sukses : POLA.ok)
      setUcap({ teks: hasil === 'selesai' ? tr('Tas siaga lengkap! Letakkan di dekat pintu supaya mudah diangkat.', 'Your emergency bag is complete! Keep it by the door so it is easy to grab.') : tr(...b.alasan), nada: 'merayakan', k: (ucap?.k ?? 0) + 1 })
    }
  }
  const sapa = ucap ?? { teks: tr(`Tas ini muat ${KAPASITAS_TAS} barang. Mana yang paling penting kalau harus pergi cepat?`, `This bag fits ${KAPASITAS_TAS} items. Which matter most if you have to leave fast?`), nada: 'ramah', k: 0 }

  return (
    <dialog ref={ref} onClose={onClose} aria-labelledby="kemas-judul" onClick={(e) => { if (e.target === ref.current) onClose() }}
      className="m-auto max-h-[92dvh] w-[min(94vw,56rem)] overflow-y-auto overscroll-contain rounded-[1.75rem] border-2 border-ink bg-surface p-0 text-ink shadow-[8px_8px_0_0_var(--ember)] backdrop:bg-ink/60">
      {open && (
        <div className="p-5 sm:p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="alis m-0">{tr('Mini game · tas siaga', 'Mini game · emergency bag')}</p>
              <h2 id="kemas-judul" className="judul-display m-0 mt-1.5 text-3xl leading-none sm:text-4xl">{tr('Kemas tas siaga', 'Pack the emergency bag')}</h2>
            </div>
            <button type="button" onClick={onClose} aria-label={tr('Tutup', 'Close')} className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-line-strong text-ink-2 transition-[color,border-color,scale] duration-150 ease-snap hover:border-ink hover:text-ink active:scale-90 md:hidden"><X size={18} aria-hidden="true" /></button>
          </div>
          <p className="m-0 mt-2 text-sm text-ink-2">{tr('Ketuk barang, atau seret ke tas. Barang yang tidak perlu akan ditolak.', 'Tap an item, or drag it into the bag. Items you do not need are turned away.')}</p>
          {/* Di layar sempit tas dan TORA di atas (menempel) supaya hasil tiap ketukan langsung terlihat */}
          <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="max-md:order-2">
            <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0 sm:grid-cols-3 lg:grid-cols-4" aria-label={tr('Barang di rumah', 'Things at home')}>
              {urut.map((b, i) => {
                const Ikon = IKON[b.id], masuk = st.isi.includes(b.id), tolak = st.salah.includes(b.id)
                return (
                  <li key={b.id} style={{ animationDelay: `${i * 30}ms` }} className="baris-masuk-halus">
                    <button type="button" draggable={!masuk && !selesai} onDragStart={(e) => { e.dataTransfer.setData('text/plain', b.id); e.dataTransfer.effectAllowed = 'move' }}
                      onClick={() => pilih(b.id)} disabled={masuk || selesai} aria-label={`${tr(...b.nama)}${masuk ? tr(', sudah di tas', ', already in the bag') : tolak ? tr(', tidak perlu', ', not needed') : ''}`}
                      key={geleng.id === b.id ? geleng.k : 0}
                      className={`group flex h-full min-h-[5.5rem] w-full flex-col items-start justify-between gap-2 rounded-2xl border-2 p-3 text-left text-sm font-bold leading-tight transition-[translate,box-shadow,border-color,opacity] duration-150 ease-snap
                        ${geleng.id === b.id ? 'barang-tolak' : ''}
                        ${masuk ? 'border-canopy bg-canopy/10 opacity-60' : tolak ? 'border-flame/70 text-ink-2' : 'cursor-grab border-ink bg-bg shadow-[3px_3px_0_0_var(--text)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--text)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}>
                      <span className={`flex size-9 items-center justify-center rounded-lg ${masuk ? 'bg-canopy text-on-ember' : tolak ? 'bg-flame/15 text-flame' : 'bg-band text-ink'}`}>{masuk ? <Check size={18} aria-hidden="true" /> : <Ikon size={19} aria-hidden="true" />}</span>
                      <span className={tolak ? 'line-through decoration-flame decoration-2' : ''}>{tr(...b.nama)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Tas dan TORA */}
          <div className="flex flex-col gap-4 max-md:sticky max-md:-top-5 max-md:z-10 max-md:order-1 max-md:-mx-5 max-md:gap-3 max-md:bg-surface max-md:px-5 max-md:pb-3 max-md:pt-2">
            <div className="relative flex items-end gap-3">
              <MaskotEkspresi key={`tora-${sapa.k}`} ekspresi={sapa.nada} className="w-16 shrink-0 md:w-24 motion-safe:[animation:pop_.4s_var(--ease-snap)]" />
              <p key={`ucap-${sapa.k}`} aria-live="polite" className="baris-masuk relative m-0 mb-4 rounded-2xl md:mb-6 border-2 border-line-strong bg-bg px-3.5 py-2.5 text-sm font-bold leading-snug shadow-[0_3px_0_0_var(--line-strong)]">
                {sapa.teks}
                <span aria-hidden="true" className="absolute -left-[9px] bottom-4 size-4 rotate-45 border-b-2 border-l-2 border-line-strong bg-bg" />
              </p>
            </div>
            <div onDragOver={(e) => { if (!selesai) { e.preventDefault(); setDiatas(true) } }} onDragLeave={() => setDiatas(false)}
              onDrop={(e) => { e.preventDefault(); setDiatas(false); pilih(e.dataTransfer.getData('text/plain')) }}
              className={`relative rounded-[1.5rem] border-2 border-ink bg-ember p-4 pt-8 text-on-ember shadow-[5px_5px_0_0_var(--text)] transition-[scale,box-shadow] duration-200 ease-snap ${diatas ? 'scale-[1.03] shadow-[8px_8px_0_0_var(--text)]' : ''} ${selesai ? 'tas-selesai' : ''}`}>
              <span aria-hidden="true" className="absolute -top-4 left-1/2 h-7 w-20 -translate-x-1/2 rounded-t-full border-2 border-b-0 border-ink" />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-extrabold"><Backpack size={18} aria-hidden="true" />{tr('Tas siaga', 'Emergency bag')}</span>
                <span className="font-mono text-sm font-bold tabular-nums" aria-label={tr(`${st.isi.length} dari ${KAPASITAS_TAS} terisi`, `${st.isi.length} of ${KAPASITAS_TAS} packed`)}>{st.isi.length}/{KAPASITAS_TAS}</span>
              </div>
              <ul className="m-0 mt-3 grid list-none grid-cols-5 gap-1.5 p-0" aria-label={tr('Isi tas', 'Bag contents')}>
                {Array.from({ length: KAPASITAS_TAS }, (_, k) => {
                  const id = st.isi[k], Ikon = id && IKON[id]
                  return (
                    <li key={k} className={`flex aspect-square items-center justify-center rounded-lg border-2 ${id ? 'border-ink bg-surface text-ink' : 'border-dashed border-on-ember/50'}`}>
                      {id && <span key={id} className="tas-isi flex" title={tr(...BARANG_TAS.find((x) => x.id === id).nama)}><Ikon size={18} aria-hidden="true" /></span>}
                    </li>
                  )
                })}
              </ul>
              {st.salah.length > 0 && <p className="m-0 mt-3 text-xs font-bold">{tr(`${st.salah.length} barang ditolak`, `${st.salah.length} items turned away`)}</p>}
            </div>
            {selesai ? (
              <div className="grid gap-2">
                <button type="button" onClick={() => { onSelesai(); onClose() }} autoFocus
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-canopy px-4 font-extrabold text-on-ember shadow-[4px_4px_0_0_var(--text)] transition-[translate,box-shadow] duration-150 ease-snap hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none">
                  <Check size={18} aria-hidden="true" />{tr('Tandai tas siaga selesai', 'Mark the bag as done')}
                </button>
                <button type="button" onClick={ulang} className="inline-flex min-h-10 items-center justify-center gap-2 text-sm font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline"><RotateCcw size={15} aria-hidden="true" />{tr('Main lagi', 'Play again')}</button>
              </div>
            ) : (
              <button type="button" onClick={onClose} className="hidden min-h-10 items-center justify-center gap-2 rounded-xl border-2 border-line-strong text-sm font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink md:inline-flex">{tr('Tutup', 'Close')}</button>
            )}
          </div>
          </div>
        </div>
      )}
    </dialog>
  )
}
