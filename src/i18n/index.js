import { useApp } from '../components/appContext'
import { id } from './id'
import { en } from './en'

export const KAMUS = { id, en }

/** Bahasa aktif ('id' | 'en'); 'id' bila dipakai di luar AppProvider. */
export function useBahasa() {
  const app = useApp()
  return app?.bahasa ?? 'id'
}
/** tr('teks Indonesia', 'English text'): memilih teks sesuai bahasa aktif. */
export function useTr() {
  const b = useBahasa()
  return (teksId, teksEn) => (b === 'en' ? teksEn : teksId)
}
/** Kamus bersama untuk bahasa aktif. */
export const useKamus = () => KAMUS[useBahasa()]

/** Item data bilingual: { ...bidangIndonesia, en: { ...bidangInggris } } -> versi bahasa yang diminta. */
export const lokal = (item, bahasa) => (bahasa === 'en' && item.en ? { ...item, ...item.en } : item)
