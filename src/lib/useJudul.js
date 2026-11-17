import { useEffect } from 'react'

/** Mengatur judul tab per halaman. */
export function useJudul(judul) {
  useEffect(() => { document.title = judul ? `${judul} · PyraOps` : 'PyraOps' }, [judul])
}
