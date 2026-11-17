import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { TAHAP } from '../data/checklist'
import { daftarChecklist } from '../lib/kontenEdukasi'
import { lokal, useBahasa, useTr } from '../i18n'

const KONTAK = {
  keluarga: [['BPBD kabupaten/kota', 'District BPBD'], ['Ketua RT / kepala desa', 'Neighborhood head / village head'], ['Kerabat terdekat', 'Nearest relative']],
  sekolah: [['BPBD kabupaten/kota', 'District BPBD'], ['Kepala sekolah', 'Principal'], ['Puskesmas terdekat', 'Nearest health center']],
}

const tanggal = (b) => new Intl.DateTimeFormat(b === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())

/**
 * Lembar Siaga: versi cetak checklist yang dirancang khusus untuk kertas A4 (bukan tangkapan layar halaman).
 * Dipasang lewat portal langsung di <body> dan hanya tampil saat mencetak, sehingga isi halaman lain
 * bisa disembunyikan sepenuhnya (tanpa halaman kosong di belakang). Warna memakai nilai tetap, bukan token tema,
 * agar tema gelap tidak ikut tercetak.
 */
export default function LembarCetak({ grup, centang, catatan }) {
  const b = useBahasa()
  const tr = useTr()
  const [tgl, setTgl] = useState(() => tanggal(b))
  // Tanggal diperbarui tepat sebelum mencetak (halaman bisa terbuka berhari-hari)
  useEffect(() => {
    const segarkan = () => setTgl(tanggal(b))
    segarkan()
    window.addEventListener('beforeprint', segarkan)
    return () => window.removeEventListener('beforeprint', segarkan)
  }, [b])

  const daftar = daftarChecklist(grup, b)
  const selesai = daftar.filter((d) => centang.includes(d.id)).length
  const sekolah = grup === 'sekolah'
  // Nomor urut lanjut antartahap (1..n) mengikuti urutan tahap
  const urutan = TAHAP.flatMap((t) => daftar.filter((d) => d.tahap === t.id).map((d) => d.id))

  return createPortal(
    <article className="lembar-cetak" aria-hidden="true">
      <header className="lc-kepala">
        <span className="lc-merek"><img src="/icons/logo-pyraops.png" alt="" /> PyraOps</span>
        <span className="lc-label">{tr('Lembar siaga karhutla', 'Wildfire readiness sheet')} · {sekolah ? tr('Sekolah', 'School') : tr('Keluarga', 'Family')}</span>
      </header>

      <p className="lc-judul">{sekolah ? tr('Checklist kesiapsiagaan sekolah', 'School preparedness checklist') : tr('Checklist kesiapsiagaan keluarga', 'Family preparedness checklist')}</p>
      <p className="lc-sub">{tr('Tempel di tempat yang mudah dilihat. Centang dengan pena, lalu cek ulang setiap awal musim kemarau.', 'Put it somewhere easy to see. Tick with a pen, and review it at the start of every dry season.')}</p>

      <div className="lc-info">
        <section>
          <h2>{tr('Kontak darurat', 'Emergency contacts')}</h2>
          <p className="lc-baris lc-112"><span>{tr('Darurat', 'Emergency')}</span><b>112</b></p>
          {KONTAK[grup].map(([i, e]) => <p key={i} className="lc-baris"><span>{tr(i, e)}</span><i /></p>)}
        </section>
        <section>
          <h2>{tr('Titik kumpul', 'Meeting point')}</h2>
          {catatan?.titik ? <p className="lc-titik">{catatan.titik}</p> : <p className="lc-baris lc-kosong"><i /></p>}
          <p className="lc-baris"><span>{sekolah ? tr('Kelas / sekolah', 'Class / school') : tr('Nama keluarga', 'Family name')}</span><i /></p>
          <p className="lc-baris"><span>{tr('Dicek ulang tanggal', 'Reviewed on')}</span><i /></p>
        </section>
      </div>

      <p className="lc-progres">
        <span className="lc-kotak-kecil">{urutan.map((id) => <i key={id} className={centang.includes(id) ? 'isi' : ''} />)}</span>
        {tr(`${selesai} dari ${daftar.length} sudah siap per ${tgl}`, `${selesai} of ${daftar.length} ready as of ${tgl}`)}
      </p>

      {TAHAP.map((t0, i) => {
        const t = lokal(t0, b)
        const isi = daftar.filter((d) => d.tahap === t0.id)
        if (!isi.length) return null
        return (
          <section key={t0.id} className="lc-tahap">
            <h2><span>{String(i + 1).padStart(2, '0')}</span>{t.judul}<small>{t.ket}</small></h2>
            <ol>
              {isi.map((d) => {
                const cek = centang.includes(d.id)
                return (
                  <li key={d.id} className={cek ? 'cek' : ''}>
                    <span className="lc-kotak">{cek ? '✓' : ''}</span>
                    <div>
                      <p className="lc-teks"><b>{urutan.indexOf(d.id) + 1}.</b> {d.teks}</p>
                      {d.kenapa?.teks && <p className="lc-kenapa">{d.kenapa.teks}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      <footer className="lc-kaki">
        <b>{tr('Bahaya langsung? Telepon 112 atau BPBD setempat.', 'Immediate danger? Call 112 or your local BPBD.')}</b>
        <span>{tr(`Anjuran umum; ikuti arahan BPBD dan dinas setempat. Dicetak dari PyraOps, ${tgl}.`, `General advice; follow your local BPBD and authorities. Printed from PyraOps, ${tgl}.`)}</span>
      </footer>
    </article>,
    document.body,
  )
}
