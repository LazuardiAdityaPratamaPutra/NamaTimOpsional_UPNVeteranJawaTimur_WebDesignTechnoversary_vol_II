import { useEffect, useRef, useState } from 'react'
import { kurangiGerak } from '../lib/gerak'
import { useTr } from '../i18n'

// Angka naik dari 0 saat pertama kali terlihat (hanya tampilan; nilai akhir tetap tersedia untuk pembaca layar)
function useHitung(angka) {
  const ref = useRef(null)
  const [lihat, setLihat] = useState(false)
  const [n, setN] = useState(null)
  const bulat = typeof angka === 'string' && /^\d{1,3}(\.\d{3})*$/.test(angka) ? parseInt(angka.replace(/\./g, ''), 10) : null
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setLihat(true); io.disconnect() } }, { threshold: 0.4 })
    io.observe(el); return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (!lihat || bulat == null || kurangiGerak()) return
    let raf = 0; const t0 = performance.now()
    const f = (t) => { const k = Math.min(1, (t - t0) / 1400); setN(Math.round(bulat * (1 - Math.pow(1 - k, 4)))); if (k < 1) raf = requestAnimationFrame(f) }
    raf = requestAnimationFrame(f); return () => cancelAnimationFrame(raf)
  }, [lihat, bulat])
  const tampil = n == null || n === bulat ? angka : n.toLocaleString('id-ID')
  return { ref, lihat, tampil }
}

// Satu baris buku data: label + periode, angka besar, sumber. Bukan kartu.
// Angka hanya tampil bila ada sumber yang bisa diverifikasi; bila belum, baris menampilkan keadaan menunggu.
// `banding` ({sebelum, sesudah, labelSebelum, labelSesudah}) menggambar dua batang sepanjang nilainya.
export default function StatCard({ label, angka, satuan, periode, sumber, url, banding }) {
  const tr = useTr()
  const terisi = angka != null && sumber
  const { ref, lihat, tampil } = useHitung(terisi ? angka : null)
  const maks = banding ? Math.max(banding.sebelum, banding.sesudah) : 0
  return (
    <div ref={ref} className="grid gap-x-10 gap-y-3 border-t border-line py-7 last:border-b md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div>
        <p className="m-0 text-base font-semibold">{label}</p>
        {periode && <p className="m-0 mt-1 text-sm leading-relaxed text-ink-2">{periode}</p>}
      </div>
      <div>
        {terisi ? (
          <p className="m-0 font-display text-6xl font-extrabold leading-none tabular-nums [font-stretch:76%] sm:text-7xl">
            {tampil}{satuan && <span className="ml-2 text-xl font-semibold text-ink-2">{satuan}</span>}
          </p>
        ) : (
          <p className="m-0 flex items-center gap-2 text-sm text-ink-2"><span className="size-2 rounded-full bg-amber" aria-hidden="true" />{tr('Menunggu data terverifikasi', 'Awaiting verified data')}</p>
        )}
        {terisi && banding && (
          <div className="mt-5 space-y-2" aria-hidden="true">
            {[[banding.labelSebelum, banding.sebelum, 'bg-line'], [banding.labelSesudah, banding.sesudah, 'bg-flame']].map(([l, v, w]) => (
              <div key={l} className="flex items-center gap-3 text-xs tabular-nums text-ink-2">
                <span className="w-9 shrink-0">{l}</span>
                <span className={`h-3 ${w} transition-[width] duration-1000 ease-snap`} style={{ width: lihat ? `${(v / maks) * 100}%` : '0%' }} />
                <span className="shrink-0">{v.toLocaleString(tr('id-ID', 'en-US'))}</span>
              </div>
            ))}
          </div>
        )}
        <p className="m-0 mt-4 text-xs text-ink-2">
          {tr('Sumber', 'Source')}:{' '}
          {terisi
            ? (url ? <a href={url} className="underline decoration-line underline-offset-4 transition-colors duration-150 hover:text-ink hover:decoration-ember-ink" target="_blank" rel="noreferrer">{sumber}</a> : sumber)
            : tr('belum dicantumkan', 'not yet listed')}
        </p>
      </div>
    </div>
  )
}
