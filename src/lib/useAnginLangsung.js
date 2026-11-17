import { useEffect, useState } from 'react'
import { ambilAnginLangsung } from './angin'

/**
 * Angin langsung untuk satu lokasi. status: 'memuat' | 'siap' | 'gagal'.
 * Tanpa setState sinkron di efek: status diturunkan dengan membandingkan kunci permintaan dengan hasil terakhir.
 * `ulang` (angka) dinaikkan untuk mencoba lagi.
 */
export function useAnginLangsung(lat, lon, aktif = true, ulang = 0) {
  const kunci = `${lat},${lon},${ulang}`
  const [hasil, setHasil] = useState({ kunci: null, seri: null })
  useEffect(() => {
    if (!aktif) return
    const ac = new AbortController()
    ambilAnginLangsung(lat, lon, { signal: ac.signal })
      .then((seri) => setHasil({ kunci, seri }))
      .catch(() => { if (!ac.signal.aborted) setHasil({ kunci, seri: null }) })
    return () => ac.abort()
  }, [lat, lon, aktif, kunci])
  if (!aktif) return { status: 'mati', seri: null }
  if (hasil.kunci !== kunci) return { status: 'memuat', seri: null }
  return hasil.seri ? { status: 'siap', seri: hasil.seri } : { status: 'gagal', seri: null }
}
