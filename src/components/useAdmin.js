import { useSyncExternalStore } from 'react'
import { langgananArtikel, potretArtikel } from '../lib/artikelStore'
import { langganan, potret } from '../lib/admin'

/** Data admin reaktif: { tindak, log, pesan, konten } (potret tidak berubah bila tidak ada perubahan). */
export const useAdmin = () => useSyncExternalStore(langganan, potret)

/** Artikel buatan admin dan suntingan artikel bawaan; render ulang saat berubah. */
export const useArtikelSimpan = () => useSyncExternalStore(langgananArtikel, potretArtikel)
