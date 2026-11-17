import { useEffect, useRef } from 'react'
import { MaskotEkspresi } from './Maskot'
import { statusKonfirmasi } from '../lib/laporStatus'
import { kurangiGerak } from '../lib/gerak'
import { useTr } from '../i18n'

// Konfirmasi untuk laporan yang baru dibuat. Teks, jalur tiga langkah, dan TORA mengikuti status tersimpan, bukan sekadar "sudah disimpan":
// hanya pengiriman yang dijawab ok oleh server yang disebut diterima, dan hanya itu yang disertai TORA.
// Keadaan tiap langkah: selesai | jalan | tunggu | gagal | tidak (tidak ada server penerima).
const JALUR = {
  lokal: ['selesai', 'tunggu', 'tunggu'],
  menunggu: ['selesai', 'jalan', 'tunggu'],
  gagal: ['selesai', 'gagal', 'tunggu'],
  demo: ['selesai', 'tidak', 'tidak'],
  terkonfirmasi: ['selesai', 'selesai', 'selesai'],
}

export default function KonfirmasiLaporan({ laporan, online }) {
  const tr = useTr()
  const st = statusKonfirmasi(laporan, online)
  const ref = useRef(null)
  // Setelah menekan Simpan, bilah kirim ada di dasar layar dan konfirmasinya di bawah formulir: bawa ke penglihatan
  useEffect(() => { if (st) ref.current?.scrollIntoView?.({ block: 'nearest', behavior: kurangiGerak() ? 'auto' : 'smooth' }) }, [!!st]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!st) return null
  const isi = {
    lokal: [tr('Tersimpan di perangkat', 'Saved on this device'), tr('Kamu sedang offline. Laporan dikirim otomatis saat kembali online.', 'You are offline. The report is sent automatically once you are back online.'), 'border-amber'],
    menunggu: [tr('Menunggu pengiriman', 'Waiting to be sent'), tr('Laporan sudah aman di perangkat dan sedang dikirim ke server. Status berubah setelah server menerimanya.', 'The report is safe on this device and is being sent to the server. This changes once the server has received it.'), 'border-amber'],
    gagal: [tr('Pengiriman belum berhasil', 'Sending did not succeed yet'), tr('Laporan tetap aman di perangkat dan akan dicoba lagi otomatis.', 'The report stays safe on this device and will be retried automatically.'), 'border-flame'],
    demo: [tr('Tercatat di perangkat (mode demo)', 'Recorded on this device (demo mode)'), tr('Hosting ini tidak punya server penerima, jadi laporan belum sampai ke petugas.', 'This hosting has no receiving server, so the report has not reached any officer.'), 'border-line-strong'],
    terkonfirmasi: [tr('Diterima server', 'Received by the server'), tr('Terima kasih sudah melapor. Laporanmu sudah diterima server dan siap ditinjau.', 'Thank you for reporting. The server has received your report and it is ready for review.'), 'border-canopy'],
  }[st]
  const langkah = [tr('Tersimpan di perangkat', 'Saved on device'), tr('Dikirim ke server', 'Sent to server'), tr('Diterima server', 'Received by server')]
  const NAMA = { selesai: tr('selesai', 'done'), jalan: tr('sedang berjalan', 'in progress'), tunggu: tr('menunggu', 'waiting'), gagal: tr('gagal, dicoba lagi', 'failed, retrying'), tidak: tr('tidak tersedia', 'not available') }
  return (
    <div ref={ref} data-no-rv data-status={st} className={`mt-8 border-l-4 pl-5 motion-safe:animate-[tile-masuk_400ms_var(--ease-snap,ease-out)_both] ${isi[2]}`}>
      <div className="flex items-center gap-4">
        {st === 'terkonfirmasi' && <MaskotEkspresi ekspresi="berterima-kasih" className="w-20 shrink-0" />}
        <div>
          <p className="m-0 text-base font-semibold">{isi[0]}</p>
          <p className="m-0 mt-1 text-sm leading-relaxed text-ink-2">{isi[1]}</p>
        </div>
      </div>
      <ol aria-label={tr('Perjalanan laporan', 'Report journey')} className="m-0 mt-5 grid list-none grid-cols-3 gap-3 p-0">
        {langkah.map((t, k) => {
          const ks = JALUR[st][k]
          return (
            <li key={t} data-langkah={ks} className="text-xs leading-snug text-ink-2">
              <span aria-hidden="true" className={`block h-1 rounded-full ${ks === 'selesai' ? 'bg-canopy' : ks === 'jalan' ? 'bg-ember-ink motion-safe:animate-[napas_1.4s_ease-in-out_infinite]' : ks === 'gagal' ? 'bg-flame' : 'bg-line-strong/50'}`} />
              <span className={`mt-2 block ${ks === 'selesai' ? 'font-semibold text-ink' : ''}`}>{t}</span>
              <span className="sr-only">: {NAMA[ks]}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
