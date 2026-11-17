import { useEffect, useState } from 'react'

/** Prompt pasang aplikasi: Android/Chrome lewat beforeinstallprompt; iOS lewat petunjuk manual. */
export function usePasang() {
  const [evt, setEvt] = useState(null)
  const [terpasang, setTerpasang] = useState(() => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true)
  useEffect(() => {
    const siap = (e) => { e.preventDefault(); setEvt(e) }
    const selesai = () => { setEvt(null); setTerpasang(true) }
    window.addEventListener('beforeinstallprompt', siap)
    window.addEventListener('appinstalled', selesai)
    return () => { window.removeEventListener('beforeinstallprompt', siap); window.removeEventListener('appinstalled', selesai) }
  }, [])
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return { bisaPasang: !!evt, terpasang, ios, pasang: async () => { await evt.prompt(); setEvt(null) } }
}
