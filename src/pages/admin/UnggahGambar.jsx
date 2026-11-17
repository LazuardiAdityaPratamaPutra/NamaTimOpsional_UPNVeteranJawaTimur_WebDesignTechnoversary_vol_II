import { useId, useRef, useState } from 'react'
import { AlertCircle, ImagePlus, LoaderCircle, RotateCcw, Upload } from 'lucide-react'
import { kompresGambar } from '../../lib/gambar'
import { useTr } from '../../i18n'

/**
 * Unggah gambar (sampul artikel atau lukisan galeri): klik atau seret berkas, gambar dikecilkan di perangkat lalu dipratinjau.
 * nilai = data URL unggahan (atau null); bawaan = gambar asli yang dipakai bila tidak ada unggahan.
 */
export default function UnggahGambar({ label, nilai, bawaan, onChange, galat, bantu, rasio = '16 / 9', wajib = false }) {
  const tr = useTr()
  const id = useId()
  const input = useRef(null)
  const [proses, setProses] = useState(false)
  const [salah, setSalah] = useState(null)
  const [info, setInfo] = useState(null)
  const [seret, setSeret] = useState(false)

  const olah = async (berkas) => {
    if (!berkas) return
    setSalah(null); setProses(true)
    try {
      const h = await kompresGambar(berkas)
      onChange(h.url); setInfo(tr(`${h.w}×${h.h} px · sekitar ${h.kb} KB`, `${h.w}×${h.h} px · about ${h.kb} KB`))
    } catch (e) {
      setSalah(e.message === 'jenis' ? tr('Gunakan berkas JPG, PNG, atau WebP.', 'Use a JPG, PNG, or WebP file.')
        : e.message === 'besar' ? tr('Berkas terlalu besar (maksimal 8 MB).', 'The file is too large (8 MB max).')
          : tr('Gambar tidak bisa dibaca. Coba berkas lain.', 'The image could not be read. Try another file.'))
    } finally { setProses(false); if (input.current) input.current.value = '' }
  }
  const tampil = nilai ?? bawaan
  const pesan = salah ?? galat
  return (
    <div>
      <p className="m-0 text-sm font-semibold text-ink" id={`${id}-l`}>{label}{wajib && <span className="text-flame"> *</span>}</p>
      <div onDragOver={(e) => { e.preventDefault(); setSeret(true) }} onDragLeave={() => setSeret(false)}
        onDrop={(e) => { e.preventDefault(); setSeret(false); olah(e.dataTransfer.files?.[0]) }}
        className={`relative mt-1.5 overflow-hidden rounded-xl border-2 border-dashed transition-colors duration-150 ${seret ? 'border-ember-ink bg-ember-ink/10' : pesan ? 'border-flame' : 'border-line-strong'}`}
        style={{ aspectRatio: rasio }}>
        {tampil ? <img src={tampil} alt="" className="absolute inset-0 size-full object-cover" /> : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm text-ink-2"><ImagePlus size={28} aria-hidden="true" />{tr('Seret gambar ke sini atau pilih berkas', 'Drag an image here or choose a file')}</div>
        )}
        {tampil && <span className="absolute left-2 top-2 rounded-full bg-bg/85 px-2.5 py-1 text-xs font-semibold text-ink backdrop-blur-sm">{nilai ? tr('Unggahan baru', 'New upload') : tr('Gambar bawaan', 'Default image')}</span>}
        {proses && <div className="absolute inset-0 flex items-center justify-center bg-bg/70"><LoaderCircle size={26} aria-hidden="true" className="animate-spin text-ember-ink" /><span className="sr-only">{tr('Memproses gambar', 'Processing image')}</span></div>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input ref={input} id={`${id}-f`} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-describedby={`${id}-b${pesan ? ` ${id}-g` : ''}`} onChange={(e) => olah(e.target.files?.[0])} />
        <label htmlFor={`${id}-f`} className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-line-strong px-3.5 text-sm font-semibold text-ink transition-colors hover:border-ink-2 has-[:focus-visible]:outline">
          <Upload size={15} aria-hidden="true" />{tampil ? tr('Ganti gambar', 'Replace image') : tr('Pilih gambar', 'Choose image')}<span className="sr-only">: {label}</span>
        </label>
        {nilai && <button type="button" onClick={() => { onChange(null); setInfo(null) }} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-ink-2 hover:text-ink"><RotateCcw size={14} aria-hidden="true" />{bawaan ? tr('Pakai gambar bawaan', 'Use the default image') : tr('Hapus gambar', 'Remove image')}</button>}
        <span className="text-xs text-ink-2" aria-live="polite">{proses ? '' : info}</span>
      </div>
      <p id={`${id}-b`} className="m-0 mt-1.5 text-xs leading-relaxed text-ink-2">{bantu ?? tr('JPG, PNG, atau WebP, maksimal 8 MB. Gambar otomatis dikecilkan dan disimpan di perangkat ini.', 'JPG, PNG, or WebP, up to 8 MB. The image is resized automatically and stored on this device.')}</p>
      {pesan && <p id={`${id}-g`} className="m-0 mt-1.5 flex items-start gap-1.5 text-sm font-medium text-flame"><AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />{pesan}</p>}
    </div>
  )
}
