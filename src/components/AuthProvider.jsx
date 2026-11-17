import { useCallback, useMemo, useState } from 'react'
import { AuthCtx } from './authContext'
import { bacaPernah, bacaSesi, catatPernah, cocokkan, hapusSesi, simpanSesi } from '../lib/auth'
import { catat } from '../lib/admin'
import { setRuang } from '../lib/ruang'

// Sesi login demo (lihat lib/auth.js). Masuk dan keluar admin dicatat ke log aktivitas.
export default function AuthProvider({ children }) {
  const [sesi, setSesi] = useState(() => { const s = bacaSesi(); setRuang(s?.email); return s }) // ruang disetel sebelum halaman membaca progres
  // Layar sambutan sesudah masuk. Disimpan di sini (bukan di halaman Masuk) karena halaman dipasang ulang saat sesi berubah.
  const [sambut, setSambut] = useState(null) // { pernah: waktu masuk sebelumnya | null }
  const tutupSambut = useCallback(() => setSambut(null), [])
  const masuk = useCallback(async (email, sandi) => {
    const akun = cocokkan(email, sandi)
    if (!akun) return { ok: false }
    const pernah = bacaPernah(akun.email) // dibaca sebelum dicatat ulang: null = pertama kali di perangkat ini
    const s = simpanSesi(akun)
    catatPernah(akun.email)
    setSambut({ pernah })
    setRuang(s.email)
    setSesi(s)
    if (s.peran === 'admin') catat(['Masuk ke dashboard', 'Signed in to the dashboard'], s.nama)
    return { ok: true, sesi: s }
  }, [])
  const keluar = useCallback(() => {
    if (sesi?.peran === 'admin') catat(['Keluar dari dashboard', 'Signed out of the dashboard'], sesi.nama)
    hapusSesi()
    setRuang(null)
    setSesi(null)
    setSambut(null)
  }, [sesi])
  const nilai = useMemo(() => ({ sesi, admin: sesi?.peran === 'admin', masuk, keluar, sambut, tutupSambut }), [sesi, masuk, keluar, sambut, tutupSambut])
  return <AuthCtx.Provider value={nilai}>{children}</AuthCtx.Provider>
}
