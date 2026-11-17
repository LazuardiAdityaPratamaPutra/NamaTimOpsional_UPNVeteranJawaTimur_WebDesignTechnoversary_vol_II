import { useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Bold, Eye, EyeOff, Heading2, Heading3, Italic, List, Quote } from 'lucide-react'
import Markdown from '../../components/Markdown'
import { BATAS_ARTIKEL, validasiArtikel } from '../../lib/artikel'
import { waktuBaca } from '../../lib/markdown'
import { useBahasa, useTr } from '../../i18n'
import UnggahGambar from './UnggahGambar'
import { SAMPUL, SAMPUL_UMUM } from '../../data/sampul'
import { gambarUnggahan } from '../../lib/kontenStore'

const KOSONG = { judul: '', ringkas: '', isi: '' }
const kelasIsian = (salah) => `w-full rounded-xl border bg-bg px-3.5 py-2.5 text-base text-ink placeholder:text-ink-2 transition-[border-color] duration-150 ease-snap hover:border-ink-2 focus:border-ember-ink ${salah ? 'border-flame' : 'border-line-strong'}`

export function Isian({ id, label, nilai, onChange, maks, galat, bantu, baris, lang, mono }) {
  const desc = [bantu ? `${id}-b` : null, galat ? `${id}-g` : null].filter(Boolean).join(' ') || undefined
  const Tag = baris ? 'textarea' : 'input'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
        {maks && <span aria-hidden="true" className={`font-mono text-xs tabular-nums ${nilai.trim().length > maks ? 'text-flame' : 'text-ink-2'}`}>{nilai.trim().length}/{maks}</span>}
      </div>
      <Tag id={id} name={id} value={nilai} onChange={(e) => onChange(e.target.value)} rows={baris} lang={lang} aria-invalid={galat ? 'true' : undefined} aria-describedby={desc}
        spellCheck autoComplete="off" className={`mt-1.5 ${kelasIsian(Boolean(galat))} ${baris ? 'resize-y leading-relaxed' : 'min-h-11'} ${mono ? 'font-mono text-[15px]' : ''}`} />
      {bantu && <p id={`${id}-b`} className="m-0 mt-1.5 text-xs leading-relaxed text-ink-2">{bantu}</p>}
      {galat && <p id={`${id}-g`} className="m-0 mt-1.5 flex items-start gap-1.5 text-sm font-medium text-flame"><AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />{galat}</p>}
    </div>
  )
}

/**
 * Formulir buat/sunting artikel. `awal` = hasil bacaArtikelLengkap (sunting) atau null (baru).
 * `onSimpan(form, terbitkan)` dipanggil hanya bila isian sah; `onTutup` kembali ke daftar.
 */
export default function KontenEditor({ awal, onSimpan, onTutup }) {
  const tr = useTr()
  const b = useBahasa()
  const baru = !awal
  const [form, setForm] = useState(() => ({ id: awal?.id ?? KOSONG, en: awal?.en ?? KOSONG }))
  const sampulAwal = awal ? gambarUnggahan(`artikel-${awal.slug}`) : null
  const [sampulBaru, setSampulBaru] = useState(sampulAwal)
  const [bhs, setBhs] = useState('id')
  const [dicoba, setDicoba] = useState(false)
  const [lihat, setLihat] = useState(false)
  const [yakin, setYakin] = useState(false)
  const area = useRef(null)
  const galat = dicoba ? validasiArtikel(form, b) : {}
  const galatId = ['judul', 'ringkas', 'isi'].filter((k) => galat[k]).length
  const galatEn = ['enJudul', 'enRingkas', 'enIsi'].filter((k) => galat[k]).length
  const berubah = JSON.stringify(form) !== JSON.stringify({ id: awal?.id ?? KOSONG, en: awal?.en ?? KOSONG }) || sampulBaru !== sampulAwal

  const nilai = form[bhs]
  const set = (k) => (v) => setForm((f) => ({ ...f, [bhs]: { ...f[bhs], [k]: v } }))
  const g = bhs === 'id' ? { judul: galat.judul, ringkas: galat.ringkas, isi: galat.isi } : { judul: galat.enJudul, ringkas: galat.enRingkas, isi: galat.enIsi }

  // Sisipkan penanda Markdown di posisi kursor: bungkus pilihan (tebal/miring) atau awali baris (judul, daftar, kutipan)
  const sisip = (awalan, akhiran = '') => {
    const el = area.current
    if (!el) return
    const { selectionStart: a, selectionEnd: z, value } = el
    let baruTeks, kursor
    if (akhiran) {
      const pilih = value.slice(a, z) || tr('teks', 'text')
      baruTeks = `${value.slice(0, a)}${awalan}${pilih}${akhiran}${value.slice(z)}`
      kursor = [a + awalan.length, a + awalan.length + pilih.length]
    } else {
      const mulai = value.lastIndexOf('\n', a - 1) + 1
      baruTeks = `${value.slice(0, mulai)}${awalan}${value.slice(mulai)}`
      kursor = [a + awalan.length, z + awalan.length]
    }
    set('isi')(baruTeks)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(kursor[0], kursor[1]) })
  }
  const ALAT = [
    [Heading2, tr('Judul bagian (##)', 'Section heading (##)'), '## '],
    [Heading3, tr('Subjudul (###)', 'Subheading (###)'), '### '],
    [Bold, tr('Tebal', 'Bold'), '**', '**'],
    [Italic, tr('Miring', 'Italic'), '*', '*'],
    [List, tr('Daftar poin', 'Bullet list'), '- '],
    [Quote, tr('Kutipan', 'Quote'), '> '],
  ]

  const kirim = (terbitkan) => {
    setDicoba(true)
    const k = validasiArtikel(form, b)
    const kunci = Object.keys(k)
    if (kunci.length) {
      const dalamEn = kunci.every((x) => x.startsWith('en'))
      if (dalamEn) setBhs('en'); else setBhs('id')
      const urut = dalamEn ? ['enJudul', 'enRingkas', 'enIsi'] : ['judul', 'ringkas', 'isi']
      const peta = { judul: 'ed-judul', ringkas: 'ed-ringkas', isi: 'ed-isi', enJudul: 'ed-judul', enRingkas: 'ed-ringkas', enIsi: 'ed-isi' }
      const pertama = urut.find((x) => k[x])
      requestAnimationFrame(() => document.getElementById(peta[pertama])?.focus())
      return
    }
    onSimpan({ ...form, sampul: sampulBaru, sampulBerubah: sampulBaru !== sampulAwal }, terbitkan)
  }
  const batal = () => { if (berubah && !yakin) { setYakin(true); return } onTutup() }

  const aktifJudul = nilai.judul.trim()
  const menit = waktuBaca(nilai.isi || ' ')
  const tombol = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-[scale,filter,border-color,color] duration-150 ease-snap active:scale-95'

  return (
    <section aria-labelledby="ed-judul-halaman" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={batal} className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft size={15} aria-hidden="true" />{tr('Kembali ke daftar', 'Back to the list')}</button>
          <h1 id="ed-judul-halaman" className="judul-display m-0 mt-1 text-4xl leading-tight sm:text-5xl">{baru ? tr('Artikel baru', 'New article') : tr('Sunting artikel', 'Edit article')}</h1>
        </div>
        <div role="group" aria-label={tr('Bahasa isi artikel', 'Article language')} className="flex rounded-xl border border-line p-0.5">
          {[['id', 'Bahasa Indonesia', galatId], ['en', 'English', galatEn]].map(([k, nama, n]) => (
            <button key={k} type="button" aria-pressed={bhs === k} onClick={() => setBhs(k)} lang={k}
              className={`min-h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-colors duration-150 ease-snap ${bhs === k ? 'bg-ember-ink text-on-ember' : 'text-ink-2 hover:text-ink'}`}>
              {nama}{n > 0 && <span className="sr-only">{tr(`, ${n} isian perlu diperbaiki`, `, ${n} fields need fixing`)}</span>}{n > 0 && <span aria-hidden="true" className="ml-1.5 font-mono text-xs">!{n}</span>}
            </button>
          ))}
        </div>
      </div>
      <p className="m-0 mt-3 max-w-[64ch] text-sm leading-relaxed text-ink-2">
        {bhs === 'id'
          ? tr('Bahasa Indonesia wajib diisi. Tersimpan di perangkat ini dan langsung tampil di halaman Edukasi setelah diterbitkan.', 'Indonesian is required. Saved on this device and shown on the Learn page once published.')
          : tr('Terjemahan Inggris boleh dikosongkan; pembaca berbahasa Inggris akan melihat teks Indonesia. Bila diisi, ketiga kolom harus lengkap.', 'The English version is optional; English readers will see the Indonesian text if it is empty. If you fill it in, all three fields are required.')}
      </p>

      <div className="mt-6 grid gap-8 xl:grid-cols-2">
        <form noValidate onSubmit={(e) => { e.preventDefault(); kirim(awal ? null : false) }} className="grid content-start gap-5" aria-label={tr('Formulir artikel', 'Article form')}>
          <UnggahGambar label={tr('Gambar sampul', 'Cover image')} nilai={sampulBaru} onChange={setSampulBaru}
            bawaan={awal && !awal.kustom ? (SAMPUL[awal.slug] ?? SAMPUL_UMUM).src : null}
            bantu={tr('Tampil di sampul buku perpustakaan dan di kepala artikel. Boleh dikosongkan: artikel baru memakai sampul umum. JPG, PNG, atau WebP, maksimal 8 MB; otomatis dikecilkan.', 'Shown on the library book cover and the article header. Optional: new articles use a general cover. JPG, PNG, or WebP up to 8 MB; resized automatically.')} />
          <Isian id="ed-judul" label={bhs === 'id' ? tr('Judul', 'Title') : 'Title'} nilai={nilai.judul} onChange={set('judul')} maks={BATAS_ARTIKEL.judul} galat={g.judul} lang={bhs} />
          <Isian id="ed-ringkas" label={bhs === 'id' ? tr('Ringkasan', 'Summary') : 'Summary'} nilai={nilai.ringkas} onChange={set('ringkas')} maks={BATAS_ARTIKEL.ringkas} galat={g.ringkas} baris={3} lang={bhs}
            bantu={tr('Tampil di kartu artikel dan di bawah judul.', 'Shown on the article card and under the title.')} />
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="ed-isi" className="text-sm font-semibold text-ink">{bhs === 'id' ? tr('Isi artikel', 'Article body') : 'Article body'}</label>
              <span aria-hidden="true" className="font-mono text-xs tabular-nums text-ink-2">{tr(`${menit} mnt baca`, `${menit} min read`)}</span>
            </div>
            <div role="toolbar" aria-label={tr('Format teks', 'Text formatting')} aria-controls="ed-isi" className="mt-1.5 flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-line-strong bg-bg p-1">
              {ALAT.map(([Ikon, nama, awalan, akhiran]) => (
                <button key={nama} type="button" onClick={() => sisip(awalan, akhiran)} aria-label={nama} title={nama}
                  className="flex size-9 items-center justify-center rounded-lg text-ink-2 transition-[color,background-color,scale] duration-150 ease-snap hover:bg-line/50 hover:text-ink active:scale-90"><Ikon size={16} aria-hidden="true" /></button>
              ))}
            </div>
            <textarea ref={area} id="ed-isi" name="ed-isi" value={nilai.isi} onChange={(e) => set('isi')(e.target.value)} rows={14} lang={bhs} spellCheck
              aria-invalid={g.isi ? 'true' : undefined} aria-describedby={`ed-isi-b${g.isi ? ' ed-isi-g' : ''}`}
              className={`${kelasIsian(Boolean(g.isi))} resize-y rounded-t-none font-mono text-[15px] leading-relaxed`} />
            <p id="ed-isi-b" className="m-0 mt-1.5 text-xs leading-relaxed text-ink-2">{tr('Format dasar: ## judul bagian, ### subjudul, - poin, > kutipan, **tebal**, *miring*, [teks](https://tautan).', 'Basic formatting: ## section heading, ### subheading, - bullet, > quote, **bold**, *italic*, [text](https://link).')}</p>
            {g.isi && <p id="ed-isi-g" className="m-0 mt-1.5 flex items-start gap-1.5 text-sm font-medium text-flame"><AlertCircle size={15} aria-hidden="true" className="mt-0.5 shrink-0" />{g.isi}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
            {baru ? (
              <>
                <button type="button" onClick={() => kirim(true)} className={`${tombol} bg-ember-ink text-on-ember hover:brightness-110`}>{tr('Terbitkan', 'Publish')}</button>
                <button type="button" onClick={() => kirim(false)} className={`${tombol} border border-line-strong text-ink hover:border-ink-2`}>{tr('Simpan sebagai draf', 'Save as draft')}</button>
              </>
            ) : (
              <button type="submit" className={`${tombol} bg-ember-ink text-on-ember hover:brightness-110`}>{tr('Simpan perubahan', 'Save changes')}</button>
            )}
            <button type="button" onClick={batal} className={`${tombol} text-ink-2 hover:text-ink ${yakin ? '!text-flame' : ''}`}>{yakin ? tr('Buang perubahan?', 'Discard changes?') : tr('Batal', 'Cancel')}</button>
            <button type="button" onClick={() => setLihat((v) => !v)} aria-pressed={lihat} className={`${tombol} ml-auto text-ink-2 hover:text-ink xl:hidden`}>{lihat ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}{tr('Pratinjau', 'Preview')}</button>
          </div>
          <p role="status" className="sr-only">{dicoba && Object.keys(galat).length ? tr(`${Object.keys(galat).length} isian perlu diperbaiki`, `${Object.keys(galat).length} fields need fixing`) : ''}</p>
        </form>

        <aside aria-label={tr('Pratinjau artikel', 'Article preview')} className={`min-w-0 xl:sticky xl:top-20 xl:self-start ${lihat ? '' : 'max-xl:hidden'}`}>
          <p className="m-0 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-2">{tr('Pratinjau', 'Preview')} · {bhs.toUpperCase()}</p>
          <div className="mt-2 max-h-[34rem] overflow-y-auto rounded-2xl border border-line bg-bg p-5">
            {aktifJudul || nilai.isi.trim() ? (
              <>
                <img src={sampulBaru ?? (awal ? (SAMPUL[awal.slug] ?? SAMPUL_UMUM).src : SAMPUL_UMUM.src)} alt="" className="mb-4 h-36 w-full rounded-xl object-cover" />
                <p className="m-0 font-mono text-xs text-ember-ink">{tr(`${menit} menit baca`, `${menit} min read`)}</p>
                <p className="judul-display m-0 mt-2 text-4xl leading-[1.05]">{aktifJudul || tr('Tanpa judul', 'Untitled')}</p>
                {nilai.ringkas.trim() && <p className="m-0 mt-3 text-base leading-relaxed text-ink-2">{nilai.ringkas.trim()}</p>}
                <div className="mt-5 border-t border-line pt-4 [&_h2]:!pt-6 [&_h2]:!text-2xl [&_h3]:!text-lg [&_p]:!text-base [&_li]:!text-base [&_blockquote]:!text-base"><Markdown sumber={nilai.isi} /></div>
              </>
            ) : <p className="m-0 py-10 text-center text-sm text-ink-2">{tr('Mulai mengetik di sebelah kiri; hasilnya tampil di sini.', 'Start typing on the left; the result shows up here.')}</p>}
          </div>
        </aside>
      </div>
    </section>
  )
}
