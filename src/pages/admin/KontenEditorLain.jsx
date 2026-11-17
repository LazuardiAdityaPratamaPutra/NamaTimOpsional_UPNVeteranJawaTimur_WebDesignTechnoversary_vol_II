import { useState } from 'react'
import { AlertCircle, ArrowLeft, Check } from 'lucide-react'
import { Isian } from './KontenEditor'
import UnggahGambar from './UnggahGambar'
import { TAHAP } from '../../data/checklist'
import { BATAS_CHECKLIST, BATAS_GALERI, BATAS_KUIS, bacaFormKonten, validasiChecklist, validasiGaleri, validasiKuis } from '../../lib/kontenEdukasi'
import { lokal, useBahasa, useTr } from '../../i18n'

const JUDUL = {
  galeri: [['Lukisan baru', 'New painting'], ['Sunting lukisan', 'Edit painting']],
  kuis: [['Soal baru', 'New question'], ['Sunting soal', 'Edit question']],
  checklist: [['Butir persiapan baru', 'New preparation item'], ['Sunting butir persiapan', 'Edit preparation item']],
}
const HURUF = ['A', 'B', 'C', 'D']
const VALIDASI = { galeri: validasiGaleri, kuis: validasiKuis, checklist: validasiChecklist }
// Galat bahasa Inggris memakai awalan "en" (enJudul, enOpsi0, ...)
const keEn = (k) => `en${k[0].toUpperCase()}${k.slice(1)}`

/**
 * Formulir buat/sunting untuk galeri, kuis, dan checklist persiapan (artikel memakai KontenEditor).
 * `onSimpan(form, terbitkan)` dipanggil bila isian sah (terbitkan null = suntingan); `onTutup` kembali ke daftar.
 */
export default function KontenEditorLain({ jenis, id, grupAwal, onSimpan, onTutup, gagal }) {
  const tr = useTr()
  const b = useBahasa()
  const baru = !id
  const [awal] = useState(() => bacaFormKonten(jenis, id, { grup: grupAwal }))
  const [form, setForm] = useState(awal)
  const [bhs, setBhs] = useState('id')
  const [dicoba, setDicoba] = useState(false)
  const [yakin, setYakin] = useState(false)
  const galat = dicoba ? VALIDASI[jenis](form, b, { baru }) : {}
  const nEn = Object.keys(galat).filter((k) => k.startsWith('en')).length
  const nId = Object.keys(galat).length - nEn
  const berubah = JSON.stringify(form) !== JSON.stringify(awal)
  const g = (k) => galat[bhs === 'en' ? keEn(k) : k]
  const nilai = form[bhs]
  const set = (k) => (v) => setForm((f) => ({ ...f, [bhs]: { ...f[bhs], [k]: v } }))
  const setOpsi = (i) => (v) => setForm((f) => ({ ...f, [bhs]: { ...f[bhs], opsi: f[bhs].opsi.map((o, j) => (j === i ? v : o)) } }))
  const pid = (k) => `ek-${k}`

  const kirim = (terbitkan) => {
    setDicoba(true)
    const k = VALIDASI[jenis](form, b, { baru })
    const kunci = Object.keys(k)
    if (kunci.length) {
      const diEn = kunci.every((x) => x.startsWith('en'))
      setBhs(diEn ? 'en' : 'id')
      const pertama = kunci.find((x) => diEn === x.startsWith('en'))
      const asal = diEn ? pertama.slice(2, 3).toLowerCase() + pertama.slice(3) : pertama
      requestAnimationFrame(() => document.getElementById(pid(asal))?.focus())
      return
    }
    onSimpan(form, terbitkan)
  }
  const batal = () => { if (berubah && !yakin) { setYakin(true); return } onTutup() }
  const tombol = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-5 text-sm font-semibold transition-[scale,filter,border-color,color] duration-150 ease-snap active:scale-95'
  const label = (i, e) => (bhs === 'id' ? tr(i, e) : e)

  return (
    <section aria-labelledby="ek-judul-halaman" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <button type="button" onClick={batal} className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-ink-2 hover:text-ink"><ArrowLeft size={15} aria-hidden="true" />{tr('Kembali ke daftar', 'Back to the list')}</button>
          <h1 id="ek-judul-halaman" className="judul-display m-0 mt-1 text-4xl leading-tight sm:text-5xl">{tr(...JUDUL[jenis][baru ? 0 : 1])}</h1>
        </div>
        <div role="group" aria-label={tr('Bahasa isian', 'Language')} className="flex rounded-xl border border-line p-0.5">
          {[['id', 'Bahasa Indonesia', nId], ['en', 'English', nEn]].map(([k, nama, n]) => (
            <button key={k} type="button" aria-pressed={bhs === k} onClick={() => setBhs(k)} lang={k}
              className={`min-h-10 rounded-[10px] px-3.5 text-sm font-semibold transition-colors duration-150 ease-snap ${bhs === k ? 'bg-ember-ink text-on-ember' : 'text-ink-2 hover:text-ink'}`}>
              {nama}{n > 0 && <span className="sr-only">{tr(`, ${n} isian perlu diperbaiki`, `, ${n} fields need fixing`)}</span>}{n > 0 && <span aria-hidden="true" className="ml-1.5 font-mono text-xs">!{n}</span>}
            </button>
          ))}
        </div>
      </div>
      <p className="m-0 mt-3 max-w-[64ch] text-sm leading-relaxed text-ink-2">
        {bhs === 'id' ? tr('Bahasa Indonesia wajib diisi. Tersimpan di perangkat ini dan langsung dipakai halaman Edukasi setelah diterbitkan.', 'Indonesian is required. Saved on this device and used on the Learn page once published.')
          : tr('Terjemahan Inggris boleh dikosongkan; pembaca berbahasa Inggris akan melihat teks Indonesia. Bila diisi, semua kolom Inggris harus lengkap.', 'English is optional; English readers will see the Indonesian text if it is empty. If you fill it in, every English field is required.')}
      </p>
      {gagal && <p role="alert" className="m-0 mt-3 flex items-start gap-2 rounded-xl border border-flame p-3 text-sm font-medium text-flame"><AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0" />{gagal}</p>}

      <form noValidate onSubmit={(e) => { e.preventDefault(); kirim(baru ? false : null) }} className="mt-6 grid max-w-3xl content-start gap-5" aria-label={tr(...JUDUL[jenis][baru ? 0 : 1])}>
        {jenis === 'galeri' && (
          <>
            {bhs === 'id' && <UnggahGambar label={tr('Gambar lukisan', 'Painting image')} wajib={baru} nilai={form.gambar} onChange={(v) => setForm((f) => ({ ...f, gambar: v }))}
              bawaan={!form.kustom ? `/foto/galeri-${id}.webp` : null} galat={galat.gambar} rasio="1408 / 768"
              bantu={tr('Rasio lebar sekitar 16:9 paling pas di pigura. Pastikan kamu berhak memakai gambarnya dan tulis sumbernya di kolom kredit.', 'A wide ratio around 16:9 fits the frame best. Make sure you may use the image and credit the source below.')} />}
            <Isian id={pid('judul')} label={label('Judul lukisan', 'Painting title')} nilai={nilai.judul} onChange={set('judul')} maks={BATAS_GALERI.judul} galat={g('judul')} lang={bhs} />
            <Isian id={pid('keterangan')} label={label('Keterangan di plakat', 'Label text')} nilai={nilai.keterangan} onChange={set('keterangan')} maks={BATAS_GALERI.keterangan} galat={g('keterangan')} baris={3} lang={bhs} />
            <Isian id={pid('alt')} label={label('Teks alternatif (untuk pembaca layar)', 'Alt text (for screen readers)')} nilai={nilai.alt} onChange={set('alt')} maks={BATAS_GALERI.alt} galat={g('alt')} baris={3} lang={bhs}
              bantu={tr('Jelaskan isi gambarnya, bukan maknanya. Contoh: "Peta sebaran asap dari timur ke barat menuju permukiman".', 'Describe what is in the image. Example: "Map of smoke drifting west toward a settlement".')} />
            {form.kustom && bhs === 'id' && <Isian id={pid('atribusi')} label={tr('Kredit dan sumber gambar', 'Image credit and source')} nilai={form.atribusi} onChange={(v) => setForm((f) => ({ ...f, atribusi: v }))} maks={BATAS_GALERI.atribusi} galat={galat.atribusi}
              bantu={tr('Contoh: "Foto: Nama Fotografer, CC BY 4.0" atau "Ilustrasi karya tim".', 'Example: "Photo: Photographer Name, CC BY 4.0" or "Illustration by the team".')} />}
          </>
        )}

        {jenis === 'kuis' && (
          <>
            {form.kustom && <Isian id={pid('topik')} label={label('Topik singkat (tampil di ubin kuis)', 'Short topic (shown on the quiz tile)')} nilai={nilai.topik} onChange={set('topik')} maks={BATAS_KUIS.topik} galat={g('topik')} lang={bhs} />}
            <Isian id={pid('tanya')} label={label('Pertanyaan', 'Question')} nilai={nilai.tanya} onChange={set('tanya')} maks={BATAS_KUIS.tanya} galat={g('tanya')} baris={2} lang={bhs} />
            <fieldset className="m-0 grid gap-3 border-0 p-0">
              <legend className="mb-1 text-sm font-semibold">{label('Pilihan jawaban', 'Answer choices')}{bhs === 'id' && <span className="font-normal text-ink-2"> · {tr('tandai yang benar', 'mark the correct one')}</span>}</legend>
              {nilai.opsi.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  {bhs === 'id' ? (
                    <label className={`mt-1 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2 font-mono font-bold transition-colors ${form.benar === i ? 'border-canopy bg-canopy text-on-ember' : 'border-line-strong text-ink-2 hover:border-ink-2'}`}>
                      <input type="radio" name="ek-benar" checked={form.benar === i} onChange={() => setForm((f) => ({ ...f, benar: i }))} className="sr-only" />
                      {form.benar === i ? <Check size={18} aria-hidden="true" /> : HURUF[i]}<span className="sr-only">{tr(`Jawaban ${HURUF[i]} benar`, `Answer ${HURUF[i]} is correct`)}</span>
                    </label>
                  ) : <span aria-hidden="true" className={`mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl border-2 font-mono font-bold ${form.benar === i ? 'border-canopy text-canopy' : 'border-line text-ink-2'}`}>{HURUF[i]}</span>}
                  <div className="min-w-0 flex-1"><Isian id={pid(`opsi${i}`)} label={`${label('Pilihan', 'Choice')} ${HURUF[i]}`} nilai={o} onChange={setOpsi(i)} maks={BATAS_KUIS.opsi} galat={g(`opsi${i}`)} lang={bhs} /></div>
                </div>
              ))}
            </fieldset>
            <Isian id={pid('jelasan')} label={label('Penjelasan jawaban', 'Answer explanation')} nilai={nilai.jelasan} onChange={set('jelasan')} maks={BATAS_KUIS.jelasan} galat={g('jelasan')} baris={3} lang={bhs} />
            <Isian id={pid('sumber')} label={label('Sumber rujukan', 'Source')} nilai={nilai.sumber} onChange={set('sumber')} maks={BATAS_KUIS.sumber} galat={g('sumber')} lang={bhs}
              bantu={tr('Wajib: tulis lembaga atau dokumen yang bisa dicek, misalnya "BMKG, 7 Sep 2026".', 'Required: name an institution or document that can be checked, e.g. "BMKG, 7 Sep 2026".')} />
          </>
        )}

        {jenis === 'checklist' && (
          <>
            {bhs === 'id' && (
              <div className="grid gap-5 sm:grid-cols-2">
                <fieldset className="m-0 border-0 p-0" disabled={!form.kustom}>
                  <legend className="text-sm font-semibold">{tr('Kelompok', 'Group')}</legend>
                  <div className="mt-1.5 flex gap-2">
                    {[['keluarga', 'Keluarga', 'Family'], ['sekolah', 'Sekolah', 'School']].map(([k, i, e]) => (
                      <label key={k} className={`inline-flex min-h-11 cursor-pointer items-center rounded-xl border-2 px-4 text-sm font-semibold ${form.grup === k ? 'border-ember-ink text-ink' : 'border-line text-ink-2'} ${form.kustom ? '' : 'cursor-not-allowed opacity-70'}`}>
                        <input type="radio" name="ek-grup" checked={form.grup === k} onChange={() => setForm((f) => ({ ...f, grup: k }))} className="sr-only" />{tr(i, e)}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor={pid('tahap')} className="text-sm font-semibold">{tr('Tahap', 'Stage')}</label>
                  <select id={pid('tahap')} value={form.tahap} onChange={(e) => setForm((f) => ({ ...f, tahap: e.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-line-strong bg-bg px-3 text-base text-ink focus:border-ember-ink">
                    {TAHAP.map((t, i) => <option key={t.id} value={t.id}>{String(i + 1).padStart(2, '0')} · {lokal(t, b).judul}</option>)}
                  </select>
                </div>
              </div>
            )}
            <Isian id={pid('teks')} label={label('Butir persiapan', 'Preparation item')} nilai={nilai.teks} onChange={set('teks')} maks={BATAS_CHECKLIST.teks} galat={g('teks')} baris={2} lang={bhs} />
            <Isian id={pid('kenapa')} label={label('Alasan "Kenapa?" (opsional)', '"Why?" reason (optional)')} nilai={nilai.kenapa} onChange={set('kenapa')} maks={BATAS_CHECKLIST.kenapa} galat={g('kenapa')} baris={3} lang={bhs}
              bantu={tr('Satu-dua kalimat dari sumber yang jelas. Bila kosong, tombol "Kenapa?" tidak tampil.', 'One or two sentences from a clear source. If empty, the "Why?" button is hidden.')} />
          </>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
          {baru ? (
            <>
              <button type="button" onClick={() => kirim(true)} className={`${tombol} bg-ember-ink text-on-ember hover:brightness-110`}>{tr('Terbitkan', 'Publish')}</button>
              <button type="button" onClick={() => kirim(false)} className={`${tombol} border border-line-strong text-ink hover:border-ink-2`}>{tr('Simpan sebagai draf', 'Save as draft')}</button>
            </>
          ) : <button type="submit" className={`${tombol} bg-ember-ink text-on-ember hover:brightness-110`}>{tr('Simpan perubahan', 'Save changes')}</button>}
          <button type="button" onClick={batal} className={`${tombol} text-ink-2 hover:text-ink ${yakin ? '!text-flame' : ''}`}>{yakin ? tr('Buang perubahan?', 'Discard changes?') : tr('Batal', 'Cancel')}</button>
        </div>
        <p role="status" className="sr-only">{dicoba && Object.keys(galat).length ? tr(`${Object.keys(galat).length} isian perlu diperbaiki`, `${Object.keys(galat).length} fields need fixing`) : ''}</p>
      </form>
    </section>
  )
}
