import { useCallback, useEffect, useRef, useState } from 'react'

// Lokasi perangkat yang tahan gagal:
//  1. pencarian awal memakai akurasi tinggi dan terus menyempurnakan hasil beberapa detik (watchPosition),
//  2. bila gagal bukan karena izin, jatuh ke pencarian cepat tanpa akurasi tinggi (Wi-Fi/jaringan),
//  3. "Cari ulang" selalu mengambil posisi baru (maximumAge 0), bukan salinan lama,
//  4. alasan gagal dibedakan agar pengguna tahu harus berbuat apa,
//  5. bila izin diubah di pengaturan browser, pencarian otomatis diulang.
const AWAL = { status: 'mencari', lat: null, lon: null, accuracy: null, alasan: null, waktu: null }

function dukungan() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return 'tidak-didukung'
  if (typeof window !== 'undefined' && window.isSecureContext === false) return 'tak-aman'
  return null
}

export function useLokasi({ onPerbarui } = {}) {
  const [g, setG] = useState(() => { const a = dukungan(); return a ? { ...AWAL, status: 'gagal', alasan: a } : AWAL })
  const [izin, setIzin] = useState('prompt')
  const watchRef = useRef(null)
  const timerRef = useRef(null)
  const tiket = useRef(0)
  const dipanggil = useRef(onPerbarui)
  useEffect(() => { dipanggil.current = onPerbarui })

  const berhenti = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation?.clearWatch(watchRef.current)
    watchRef.current = null
    clearTimeout(timerRef.current)
  }, [])

  const batalkan = useCallback(() => { tiket.current++; berhenti() }, [berhenti])

  const cari = useCallback((awal = false) => {
    const a = dukungan()
    if (a) { setG((o) => ({ ...o, status: 'gagal', alasan: a })); return }
    berhenti()
    const id = ++tiket.current
    let terbaik = Infinity
    if (!awal) setG((o) => ({ ...o, status: 'mencari', alasan: null }))

    const sukses = (p) => {
      if (id !== tiket.current) return
      const acc = p.coords.accuracy
      if (acc >= terbaik) return // hanya terima yang lebih akurat dalam satu pencarian
      const pertama = terbaik === Infinity
      terbaik = acc
      const baru = { lat: p.coords.latitude, lon: p.coords.longitude, accuracy: acc }
      setG({ status: 'ok', ...baru, alasan: null, waktu: Date.now() })
      if (pertama) {
        dipanggil.current?.(baru, !awal)
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(berhenti, 12000) // sempurnakan 12 detik, lalu berhenti hemat baterai
      }
    }
    const habis = (e) => {
      if (id !== tiket.current || terbaik !== Infinity) return
      berhenti()
      setG((o) => ({ ...o, status: 'gagal', alasan: e.code === 1 ? 'ditolak' : e.code === 3 ? 'waktu' : 'tidak-tersedia' }))
    }
    const cadangan = (e) => {
      if (id !== tiket.current || terbaik !== Infinity) return
      if (e.code === 1) { habis(e); return }
      berhenti()
      navigator.geolocation.getCurrentPosition(sukses, habis, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 })
    }
    watchRef.current = navigator.geolocation.watchPosition(sukses, cadangan, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 })
    timerRef.current = setTimeout(() => cadangan({ code: 3 }), 13000)
  }, [berhenti])

  useEffect(() => {
    let hidup = true
    let status = null
    const mulai = setTimeout(() => { if (!dukungan()) cari(true) }, 0)
    navigator.permissions?.query?.({ name: 'geolocation' }).then((st) => {
      if (!hidup) return
      status = st
      setIzin(st.state)
      st.onchange = () => { setIzin(st.state); if (st.state === 'granted') cari() }
    }).catch(() => {})
    return () => { hidup = false; clearTimeout(mulai); batalkan(); if (status) status.onchange = null }
  }, [cari, batalkan])

  return { ...g, izin, cari }
}
