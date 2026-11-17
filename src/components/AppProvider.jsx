import { useCallback, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { AppCtx } from './appContext'
import { kurangiGerak } from '../lib/gerak'

// Menyimpan tema (terang/gelap) dan bahasa (id/en). Peran (pengunjung/user/admin) ada di AuthProvider.
export default function AppProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const [bahasa, setBahasa] = useState(() => {
    try { const s = localStorage.getItem('pyraops-lang'); if (s === 'en' || s === 'id') return s } catch { /* abaikan */ }
    return 'id'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem('pyraops-theme', theme) } catch { /* abaikan */ }
  }, [theme])
  // Gelap/terang: peramban memotret halaman lama dan baru lalu memudarkannya di GPU (View Transitions), jadi tidak ada
  // ribuan elemen yang bertransisi sekaligus dan adegan WebGL tidak tersendat. Tanpa dukungan atau saat gerak dikurangi: langsung ganti.
  const gantiTema = useCallback((t) => {
    const terapkan = () => { document.documentElement.dataset.theme = t; setTheme(t) }
    if (typeof document.startViewTransition === 'function' && !kurangiGerak()) document.startViewTransition(() => flushSync(terapkan))
    else terapkan()
  }, [])
  useEffect(() => {
    document.documentElement.lang = bahasa // dibaca pembaca layar dan mesin pencari
    try { localStorage.setItem('pyraops-lang', bahasa) } catch { /* abaikan */ }
  }, [bahasa])

  return <AppCtx.Provider value={{ theme, setTheme: gantiTema, bahasa, setBahasa }}>{children}</AppCtx.Provider>
}
