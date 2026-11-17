import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ToastCtx } from './toastContext'
import { kurangiGerak } from '../../lib/gerak'

const NADA = { info: 'border-l-ember-ink', sukses: 'border-l-canopy', galat: 'border-l-flame', peringatan: 'border-l-amber' }
const WARNA_GARIS = { info: 'bg-ember-ink', sukses: 'bg-canopy', galat: 'bg-flame', peringatan: 'bg-amber' }

const bisaSunting = (el) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/**
 * Satu toast. Waktunya berhenti selama disorot kursor atau difokus papan ketik (supaya sempat dibaca dan tombolnya sempat ditekan),
 * lalu lanjut dari sisa waktunya. Garis tipis di bawah menunjukkan sisa waktu itu.
 */
function Toast({ t, tutup }) {
  const [jeda, setJeda] = useState(false)
  const sisa = useRef(t.durasi)
  useEffect(() => {
    if (jeda || t.keluar) return undefined
    const mulai = Date.now()
    const id = setTimeout(() => tutup(t.id), sisa.current)
    return () => { clearTimeout(id); sisa.current = Math.max(400, sisa.current - (Date.now() - mulai)) }
  }, [jeda, t.id, t.keluar, tutup])
  const tahan = { onMouseEnter: () => setJeda(true), onMouseLeave: () => setJeda(false), onFocus: () => setJeda(true), onBlur: () => setJeda(false) }
  return (
    <div {...tahan} onClick={(e) => { if (!e.target.closest('button')) tutup(t.id) }}
      className={`${t.keluar ? 'toast-keluar' : 'toast-masuk'} pointer-events-auto relative flex max-w-sm cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-l-4 border-line bg-surface py-2.5 pl-4 pr-2 text-sm shadow-lg ${NADA[t.nada] ?? NADA.info}`}>
      <span className="min-w-0 flex-1 py-0.5">{t.pesan}</span>
      {t.aksi && (
        <button type="button" onClick={() => { t.aksi.jalankan(); tutup(t.id) }}
          className="shrink-0 rounded-lg px-2.5 py-1.5 font-semibold text-ember-ink transition-[background-color,scale] duration-150 ease-snap hover:bg-ember/12 active:scale-95">
          {t.aksi.label}{t.aksi.urungkan && <kbd aria-hidden="true" className="ml-1.5 hidden rounded border border-line px-1 font-mono text-[11px] font-medium text-ink-2 sm:[@media(hover:hover)]:inline">Ctrl Z</kbd>}
        </button>
      )}
      <button type="button" onClick={() => tutup(t.id)} aria-label={t.labelTutup}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-2 transition-[background-color,color] duration-150 hover:bg-line/50 hover:text-ink"><X size={15} aria-hidden="true" /></button>
      <span aria-hidden="true" className={`toast-waktu absolute bottom-0 left-0 h-0.5 w-full origin-left opacity-60 ${WARNA_GARIS[t.nada] ?? WARNA_GARIS.info}`}
        style={{ animationDuration: `${t.durasi}ms`, animationPlayState: jeda || t.keluar ? 'paused' : 'running' }} />
    </div>
  )
}

/**
 * Toast dibacakan pembaca layar lewat aria-live. show(pesan, nada, opsi):
 * opsi.aksi = { label, jalankan, urungkan? } menambah tombol (mis. "Urungkan"; Ctrl/Cmd+Z menjalankan urungkan terbaru),
 * opsi.kunci mengganti toast lama dengan kunci yang sama (tidak menumpuk), opsi.durasi dalam ms.
 */
export default function ToastProvider({ children }) {
  const [daftar, setDaftar] = useState([])
  const daftarRef = useRef(daftar)
  useEffect(() => { daftarRef.current = daftar })
  const tutup = useCallback((id) => {
    setDaftar((d) => d.map((x) => (x.id === id ? { ...x, keluar: true } : x)))
    setTimeout(() => setDaftar((d) => d.filter((x) => x.id !== id)), kurangiGerak() ? 0 : 220)
  }, [])
  const show = useCallback((pesan, nada = 'info', opsi = {}) => {
    const id = `${Date.now()}-${Math.random()}`
    const en = typeof document !== 'undefined' && document.documentElement.lang === 'en'
    const t = { id, pesan, nada, aksi: opsi.aksi, kunci: opsi.kunci, durasi: opsi.durasi ?? (opsi.aksi ? 8000 : 4500), labelTutup: en ? 'Close notification' : 'Tutup notifikasi' }
    setDaftar((d) => [...(opsi.kunci ? d.filter((x) => x.kunci !== opsi.kunci) : d), t].slice(-4))
    return id
  }, [])
  const nilai = useMemo(() => ({ show, tutup }), [show, tutup])

  // Ctrl/Cmd+Z menjalankan "Urungkan" pada toast terbaru, kecuali sedang mengetik (biar urungkan bawaan isian tetap jalan)
  useEffect(() => {
    const tekan = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'z' || bisaSunting(e.target)) return
      const t = [...daftarRef.current].reverse().find((x) => x.aksi?.urungkan && !x.keluar)
      if (!t) return
      e.preventDefault(); t.aksi.jalankan(); tutup(t.id)
    }
    window.addEventListener('keydown', tekan)
    return () => window.removeEventListener('keydown', tekan)
  }, [tutup])

  return (
    <ToastCtx.Provider value={nilai}>
      {children}
      <div role="status" aria-live="polite" className="tumpuk-toast pointer-events-none fixed inset-x-4 bottom-4 z-[2000] flex flex-col items-end gap-2">
        {daftar.map((t) => <Toast key={t.id} t={t} tutup={tutup} />)}
      </div>
    </ToastCtx.Provider>
  )
}
