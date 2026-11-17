import { useState } from 'react'
import { Info } from 'lucide-react'
import { RISIKO } from '../lib/config'
import { namaTipe, desimal } from '../lib/format'
import { Pill } from './ui'
import { useBahasa, useTr } from '../i18n'

const WARNA = { kritis: 'bg-flame', tinggi: 'bg-ember', waspada: 'bg-amber' }

export default function RiskList({ daftar, aktif, onPilih }) {
  const [info, setInfo] = useState(false)
  const b = useBahasa()
  const tr = useTr()
  const koma = (n) => desimal(n, b)
  const { skorZona: z, faktorKelas: f, faktorKhusus: s } = RISIKO

  return (
    <section aria-label={tr('Pemukiman terancam', 'Settlements at risk')} data-tur="risiko" className="border-t border-line pt-4">
      <div className="flex items-center justify-between">
        <h3 className="!m-0 !font-mono !text-[11px] !font-normal !uppercase !leading-normal !tracking-[0.16em] text-ink-2">{tr('Pemukiman terancam', 'Settlements at risk')} <span className="text-ink">({daftar.length})</span></h3>
        <button onClick={() => setInfo(!info)} aria-expanded={info} aria-label={tr('Cara skor dihitung', 'How the score is calculated')}
          className="rounded-md p-1 text-ink-2 hover:text-ink"><Info size={16} /></button>
      </div>

      {info && (
        <div className="mt-2 rounded-md bg-bg p-2 text-xs text-ink-2">
          <p>{tr(`Skor = skor zona tercepat x faktor kerentanan, maksimum ${RISIKO.maks}.`, `Score = fastest-zone score x vulnerability factor, maximum ${RISIKO.maks}.`)}</p>
          <p className="mt-1">{tr(`Skor zona: 3 jam = ${z[3]}, 6 jam = ${z[6]}, 12 jam = ${z[12]}.`, `Zone score: 3 h = ${z[3]}, 6 h = ${z[6]}, 12 h = ${z[12]}.`)}</p>
          <p className="mt-1">{tr(
            `Faktor: permukiman kecil ${koma(f.kecil)}, sedang ${koma(f.sedang)}, besar ${koma(f.besar)}; sekolah dan fasilitas kesehatan ${koma(s.sekolah)}.`,
            `Factors: small settlement ${koma(f.kecil)}, medium ${koma(f.sedang)}, large ${koma(f.besar)}; schools and health facilities ${koma(s.sekolah)}.`)}</p>
          <p className="mt-1">{tr(
            `Kategori: ${RISIKO.batasKritis} ke atas Kritis; ${RISIKO.batasTinggi}-${RISIKO.batasKritis - 1} Tinggi; di bawah ${RISIKO.batasTinggi} Waspada. Berbasis aturan, bukan model ML.`,
            `Categories: ${RISIKO.batasKritis} and above Critical; ${RISIKO.batasTinggi}-${RISIKO.batasKritis - 1} High; below ${RISIKO.batasTinggi} Watch. Rule-based, not an ML model.`)}</p>
        </div>
      )}

      {daftar.length === 0 ? (
        <p className="mt-2 text-sm text-ink-2">{tr('Tidak ada pemukiman sampel di dalam zona 12 jam untuk skenario ini.', 'No sample settlements fall inside the 12-hour zone in this scenario.')}</p>
      ) : (
        <ul className="m-0 mt-2 list-none p-0">
          {daftar.map((p) => {
            const on = aktif === p.nama
            return (
              <li key={p.nama} className="border-t border-line first:border-t-0">
                <button onClick={() => onPilih(p)} aria-pressed={on}
                  className={`group/r relative grid w-full grid-cols-[0.25rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg py-2.5 pl-0 pr-2 text-left transition-[background-color,padding] duration-200 ease-snap hover:bg-line/40 hover:pl-1.5 ${on ? 'bg-ember/10 pl-1.5' : ''}`}>
                  <span aria-hidden="true" className={`h-full min-h-9 rounded-full ${WARNA[p.kategori] ?? 'bg-ink-2'} transition-[scale] duration-300 ease-snap group-hover/r:scale-x-150`} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2"><span className="truncate text-sm font-bold">{p.nama}</span><Pill variant={p.kategori} /></span>
                    <span className="mt-0.5 block truncate text-xs text-ink-2">{namaTipe(p.tipe, b)} · {tr(`zona ${p.zona} jam`, `${p.zona} h zone`)}</span>
                    <span aria-hidden="true" className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line/70"><span className={`block h-full rounded-full ${WARNA[p.kategori] ?? 'bg-ink-2'} transition-[width] duration-700 ease-snap`} style={{ width: `${Math.min(100, (p.skor / RISIKO.maks) * 100)}%` }} /></span>
                  </span>
                  <span className="text-right font-mono text-2xl font-bold leading-none tabular-nums"><span className="sr-only">{tr('skor', 'score')} </span>{koma(p.skor)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-2 text-xs text-ink-2">{tr('Data pemukiman: ilustrasi.', 'Settlement data: illustrative.')}</p>
    </section>
  )
}
