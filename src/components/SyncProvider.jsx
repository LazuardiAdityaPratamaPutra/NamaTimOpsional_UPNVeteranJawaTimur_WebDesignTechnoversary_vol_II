import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SyncCtx } from './syncContext'
import { useToast } from './ui'
import { useBahasa } from '../i18n'

export default function SyncProvider({ children }) {
  const toast = useToast()
  const b = useBahasa()
  const [online, setOnline] = useState(() => navigator.onLine)
  const [laporan, setLaporan] = useState(null) // null = sedang memuat
  const [sedang, setSedang] = useState(false)

  const jalanRef = useRef(null) // tombol "Coba sekarang" di toast memanggil sinkron terbaru
  const jalan = useCallback(async (paksa = false) => {
    if (!navigator.onLine) return null
    setSedang(true)
    try {
      // Dexie dan logika sinkronisasi dimuat belakangan agar tidak membebani bundel awal
      const { sinkronkan: jalankanSinkron } = await import('../lib/sync')
      const hasil = await jalankanSinkron({ paksa })
      // Umpan balik harus sesuai keadaan sebenarnya (toast memakai kunci yang sama agar menggantikan "Menyinkronkan…"):
      // diterima server ≠ tercatat di hosting demo tanpa server ≠ gagal (akan dicoba lagi)
      const en = b === 'en'
      if (hasil.berhasil > 0) toast.show(en ? `${hasil.berhasil} report(s) received by the server.` : `${hasil.berhasil} laporan diterima server.`, 'sukses', { kunci: 'sinkron' })
      else if (hasil.demo > 0) toast.show(en ? `${hasil.demo} report(s) recorded on this device only (demo hosting without a receiving server).` : `${hasil.demo} laporan hanya tercatat di perangkat ini (hosting demo tanpa server penerima).`, 'info', { kunci: 'sinkron', durasi: 7000 })
      if (hasil.gagal > 0) toast.show(en ? `${hasil.gagal} report(s) could not be sent. They stay on this device and will be retried automatically.` : `${hasil.gagal} laporan belum terkirim. Tetap tersimpan di perangkat dan akan dicoba lagi otomatis.`, 'peringatan', { kunci: 'sinkron-gagal', durasi: 9000, aksi: { label: en ? 'Retry now' : 'Coba sekarang', jalankan: () => { jalanRef.current?.(true) } } })
      return hasil
    } finally { setSedang(false) }
  }, [toast, b])
  useEffect(() => { jalanRef.current = jalan }, [jalan])

  // Daftar laporan selalu mengikuti isi IndexedDB
  useEffect(() => {
    let langganan, batal = false
    Promise.all([import('dexie'), import('../lib/db')]).then(([{ liveQuery }, { db }]) => {
      if (batal) return
      langganan = liveQuery(() => db.reports.orderBy('createdAt').reverse().toArray())
        .subscribe({ next: setLaporan, error: () => setLaporan([]) })
    }).catch(() => setLaporan([]))
    return () => { batal = true; langganan?.unsubscribe() }
  }, [])

  // Pemicu otomatis: saat aplikasi dibuka, saat kembali online, dan interval (untuk coba ulang backoff)
  useEffect(() => {
    const naik = () => { setOnline(true); jalan() }
    const turun = () => setOnline(false)
    window.addEventListener('online', naik)
    window.addEventListener('offline', turun)
    const awal = setTimeout(() => jalan(), 0)
    const interval = setInterval(() => jalan(), 30000)
    return () => {
      window.removeEventListener('online', naik); window.removeEventListener('offline', turun)
      clearTimeout(awal); clearInterval(interval)
    }
  }, [jalan])

  // Umpan balik koneksi: aplikasi dipakai di lapangan, jadi pengguna perlu tahu saat sinyal hilang dan kembali
  useEffect(() => {
    const en = b === 'en'
    const putus = () => toast.show(en ? 'You are offline. Reports are saved on this device and sent automatically later.' : 'Kamu offline. Laporan tetap tersimpan di perangkat dan dikirim otomatis nanti.', 'peringatan', { kunci: 'koneksi', durasi: 7000 })
    const sambung = () => toast.show(en ? 'Back online.' : 'Kembali online.', 'sukses', { kunci: 'koneksi', durasi: 3000 })
    window.addEventListener('offline', putus); window.addEventListener('online', sambung)
    return () => { window.removeEventListener('offline', putus); window.removeEventListener('online', sambung) }
  }, [toast, b])

  useEffect(() => {
    const siap = () => toast.show(b === 'en' ? 'The app is ready to use offline.' : 'Aplikasi siap dipakai offline.', 'sukses')
    window.addEventListener('pwa-offline-siap', siap)
    return () => window.removeEventListener('pwa-offline-siap', siap)
  }, [toast, b])

  const antrean = laporan ? laporan.filter((r) => r.status !== 'synced').length : 0
  const nilai = useMemo(() => ({ online, laporan, antrean, sedang, sinkronkan: jalan }), [online, laporan, antrean, sedang, jalan])
  return <SyncCtx.Provider value={nilai}>{children}</SyncCtx.Provider>
}
