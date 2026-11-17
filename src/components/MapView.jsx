import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, GeoJSON, Pane, ZoomControl, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import hotspots from '../data/hotspot.json'
import pemukiman from '../data/pemukiman.json'
import basemapRaw from '../data/basemap.geojson?raw'
import { namaTipe } from '../lib/format'
import { kurangiGerak } from '../lib/gerak'
import { useBahasa, useTr } from '../i18n'

const basemap = JSON.parse(basemapRaw)
const PUSAT = [-2.25, 113.95]
const RADIUS = { kecil: 5, sedang: 7, besar: 9 }
const KAT = { kritis: ['kritis', 'critical'], tinggi: ['tinggi', 'high'], waspada: ['waspada', 'watch'] }
const SEV = { ringan: ['ringan', 'light'], sedang: ['sedang', 'moderate'], berat: ['berat', 'severe'] }

// Ikon hotspot berdenyut (animasi diatur di index.css, menghormati reduced-motion)
const ikon = (aktif) => L.divIcon({
  className: '',
  html: `<span class="hotspot-dot${aktif ? ' aktif' : ''}"></span>`,
  iconSize: [24, 24], iconAnchor: [12, 12],
})
const IKON = { normal: ikon(false), aktif: ikon(true) }

// Mode prioritas: lencana bernomor urut, warna menurut tingkat (utama / sedang / pantau)
const cacheLencana = new Map()
const ikonPrioritas = (rank, tingkat, aktif) => {
  const kunci = `${rank}-${tingkat}-${aktif}`
  if (!cacheLencana.has(kunci)) {
    cacheLencana.set(kunci, L.divIcon({
      className: '',
      html: `<span class="hotspot-dot prio prio-${tingkat}${aktif ? ' aktif' : ''}">${rank}</span>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    }))
  }
  return cacheLencana.get(kunci)
}

// GeoJSON [lon, lat] -> Leaflet [lat, lon]
const posisi = (poli) => poli.coordinates[0].map(([lo, la]) => [la, lo])

// Memusatkan peta ke zona 12 jam setiap kali simulasi dijalankan
function Fokus({ poligon, kunci, padKanan = 360 }) {
  const map = useMap()
  useEffect(() => {
    if (!poligon) return
    const lebar = window.innerWidth >= 768
    map.fitBounds(posisi(poligon), { paddingTopLeft: [40, 40], paddingBottomRight: [lebar ? padKanan : 40, lebar ? 40 : (padKanan === 360 ? 260 : 40)], maxZoom: 13 })
  }, [kunci]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

// Memusatkan peta ke pemukiman yang dipilih dari daftar risiko
// Bingkai peta ke batas tertentu (mis. sebaran titik SiPongi) setiap kali kunci berubah
function Bingkai({ batas, kunci, kiriAtas = [48, 48], kananBawah = [48, 48] }) {
  const map = useMap()
  useEffect(() => { if (kunci && batas) map.flyToBounds(batas, { paddingTopLeft: kiriAtas, paddingBottomRight: kananBawah, animate: !kurangiGerak(), duration: 0.8 }) }, [kunci, batas, map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const BULAN = { id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'], en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] }
const tglPendek = (iso, b) => { const [, m, d] = iso.split('-'); return `${Number(d)} ${BULAN[b === 'en' ? 'en' : 'id'][Number(m) - 1]}` }

function PusatTitik({ titik }) {
  const map = useMap()
  useEffect(() => {
    if (!titik) return
    const animasi = !kurangiGerak()
    map.setView([titik.lat, titik.lon], Math.max(map.getZoom(), 12), { animate: false })
    // Layar sempit: panel muncul dari bawah, jadi titik digeser ke atas agar tidak tertutup
    if (window.innerWidth < 768) map.panBy([0, map.getSize().y * 0.22], { animate: false })
    else if (animasi) map.invalidateSize({ pan: false })
  }, [titik, map])
  return null
}


// Zona 3 -> 6 -> 12 jam menyebar dari titik api (seperti animasi di halaman Tentang), lalu penanda jamnya muncul di ujung terjauh.
// Hanya diputar saat simulasi dijalankan (kunci berubah); perubahan kontrol sesudahnya langsung memperbarui bentuk tanpa mengulang.
const WARNA_JAM = { 3: 'var(--flame)', 6: 'var(--ember)', 12: 'var(--amber)' }
const TUNDA = { 3: 0, 6: 260, 12: 520 }
const DURASI = 1000
const easeOut = (t) => 1 - (1 - t) ** 3

function ujungTerjauh(poligon, asal) {
  const kos = Math.cos((asal[0] * Math.PI) / 180)
  let best = null, jarak = -1
  for (const [lo, la] of poligon.coordinates[0]) {
    const d = (la - asal[0]) ** 2 + ((lo - asal[1]) * kos) ** 2
    if (d > jarak) { jarak = d; best = [la, lo] }
  }
  return best
}

function ZonaSebar({ zona, asal, kunci, refs, aktif = true }) {
  const zonaRef = useRef(zona)
  useEffect(() => { zonaRef.current = zona })
  useEffect(() => {
    const jams = [3, 6, 12]
    const akhir = () => jams.forEach((j) => {
      const el = refs.current[j]; if (!el || !zonaRef.current) return
      el.setLatLngs(posisi(zonaRef.current[j].poligon))
      const e = el.getElement(); if (e) e.style.opacity = ''
    })
    if (kurangiGerak() || !aktif) { akhir(); return }
    let raf = 0
    const t0 = performance.now()
    const langkah = (now) => {
      let selesai = true
      for (const j of jams) {
        const el = refs.current[j], z = zonaRef.current?.[j]; if (!el || !z) continue
        const t = Math.min(1, Math.max(0, (now - t0 - TUNDA[j]) / DURASI))
        if (t < 1) selesai = false
        const k = 0.25 + 0.75 * easeOut(t)
        el.setLatLngs(posisi(z.poligon).map(([la, lo]) => [asal[0] + (la - asal[0]) * k, asal[1] + (lo - asal[1]) * k]))
        const e = el.getElement(); if (e) e.style.opacity = String(Math.min(1, t * 3))
      }
      if (!selesai) raf = requestAnimationFrame(langkah); else akhir()
    }
    raf = requestAnimationFrame(langkah)
    return () => { cancelAnimationFrame(raf); akhir() }
  }, [kunci]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

const ikonJam = (jam, teks, tunda) => L.divIcon({
  className: 'zl-ikon', iconSize: [0, 0], iconAnchor: [0, 0],
  html: `<span class="zl" style="--c:${WARNA_JAM[jam]};--d:${tunda}ms"><i class="zl-titik"></i><i class="zl-garis"></i><b class="zl-teks">${teks}</b></span>`,
})

// Titik pemukiman & laporan hanya bertooltip (tak ada aksi): keluarkan dari urutan Tab agar papan ketik tidak
// melewati belasan elemen tanpa nama. Isinya tetap terbaca lewat sorot/ketuk, dan risiko pemukiman ada di daftar hasil simulasi.
const KELUAR_TAB = { add: (e) => { const el = e.target.getElement?.(); if (el) { el.setAttribute('tabindex', '-1'); el.setAttribute('focusable', 'false') } } }

export default function MapView({ layers, selectedId, onSelect, onTileError, zona, waktu, fokusKunci, kategoriPem = {}, pemAktif, titikFokus, laporan = [], padKanan, sipongiLuar = [], prioritas, sipongi = [], bingkai }) {
  const b = useBahasa()
  const tr = useTr()
  const refs = useRef({})
  const sel = hotspots.find((h) => h.id === selectedId)
  const asalZona = sel ? [sel.lat, sel.lon] : null
  return (
    // Penanda hotspot Leaflet bisa difokus (role=button) tapi tidak bereaksi pada Enter/Spasi: aktifkan di sini.
    // Fokus dikembalikan ke penanda yang sama setelah ikonnya berganti (ikon aktif dibuat ulang oleh Leaflet).
    <div className="size-full" onKeyDown={(e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const el = e.target.closest?.('.leaflet-marker-icon[role=button]')
      const id = el?.getAttribute('title')?.match(/Hotspot (\S+)$/)?.[1]
      if (!id) return
      e.preventDefault(); onSelect(id)
      setTimeout(() => document.querySelector(`.leaflet-marker-icon[title$="Hotspot ${id}"]`)?.focus({ preventScroll: true }), 60)
    }}>
    <MapContainer center={PUSAT} zoom={10} zoomControl={false} className="size-full" minZoom={5} maxZoom={16}>
      <ZoomControl position="bottomleft" />

      {/* Basemap cadangan: tampil bila tile OSM tidak tersedia (offline total) */}
      <Pane name="basemap" style={{ zIndex: 150 }}>
        <GeoJSON data={basemap} interactive={false} style={{ className: 'basemap-cadangan', weight: 2, fillOpacity: 1 }} />
      </Pane>

      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        eventHandlers={{ tileerror: onTileError }}
      />

      {layers.pemukiman && pemukiman.map((p) => {
        const kat = kategoriPem[p.nama]
        const cls = `pem-dot${kat ? ` pem-${kat}` : ''}${p.nama === pemAktif ? ' pem-aktif' : ''}`
        // key memuat kelas agar marker dibuat ulang saat kategori berubah
        return (
          <CircleMarker key={`${p.nama}-${cls}`} center={[p.lat, p.lon]} radius={RADIUS[p.kelasPopulasi]}
            className={cls} fillOpacity={0.85} weight={2} eventHandlers={KELUAR_TAB}>
            <Tooltip>{p.nama} ({namaTipe(p.tipe, b).toLowerCase()}){kat ? ` · ${tr('risiko', 'risk')} ${tr(...KAT[kat])}` : ''} · {tr('Data ilustrasi', 'Illustrative data')}</Tooltip>
          </CircleMarker>
        )
      })}

      {layers.laporan && laporan.map((r) => (
        <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={7} className="lap-dot" weight={2} fillOpacity={0.9} eventHandlers={KELUAR_TAB}>
          <Tooltip>{tr('Laporan', 'Report')} {tr(...SEV[r.severity])}{r.note ? ` · ${r.note.slice(0, 80)}` : ''}</Tooltip>
        </CircleMarker>
      ))}

      {layers.zona && zona && [12, 6, 3].map((jam) => (
        <Polygon key={jam} ref={(el) => { refs.current[jam] = el }} positions={posisi(zona[jam].poligon)} className={`zona-${jam}`} interactive={false} />
      ))}
      {layers.zona && zona && asalZona && <ZonaSebar zona={zona} asal={asalZona} kunci={fokusKunci} refs={refs} />}
      {layers.zona && zona && asalZona && [3, 6, 12].map((jam) => (
        <Marker key={`${jam}-${fokusKunci}`} position={ujungTerjauh(zona[jam].poligon, asalZona)} interactive={false} keyboard={false} zIndexOffset={-100}
          icon={ikonJam(jam, `${jam} ${tr('jam', 'h')}`, (kurangiGerak() ? 0 : TUNDA[jam] + 650))} />
      ))}
      {layers.zona && waktu && (
        <Polygon positions={posisi(waktu.poligon)} className="zona-t" interactive={false} />
      )}
      <PusatTitik titik={titikFokus} />
      <Bingkai batas={bingkai?.batas} kunci={bingkai?.kunci} kiriAtas={bingkai?.kiriAtas} kananBawah={bingkai?.kananBawah} />

      {/* Titik panas nyata SiPongi (snapshot statis): kecil, tanpa denyut, berbingkai gelap — beda dari hotspot demo yang bisa disimulasikan */}
      {layers.sipongi && [...sipongi, ...sipongiLuar].map(([lat, lon, tgl, jam, sat, kab, kec, desa], i) => (
        <CircleMarker key={`${tgl}-${jam}-${lat}-${lon}-${i}`} center={[lat, lon]} radius={4.5} className="sipongi-dot" weight={1.5} fillOpacity={0.95} eventHandlers={KELUAR_TAB}>
          <Tooltip>
            <strong>{tr('Titik panas SiPongi', 'SiPongi hotspot')}</strong><br />
            {desa}, {kec}, {kab}<br />
            {tglPendek(tgl, b)} 2026 · {jam} WIB · {sat} · {tr('keyakinan', 'confidence')} High<br />
            <span style={{ opacity: 0.75 }}>{tr('Sumber', 'Source')}: SIPONGI KEMENHUT</span>
          </Tooltip>
        </CircleMarker>
      ))}
      {zona && <Fokus poligon={zona[12].poligon} kunci={fokusKunci} padKanan={padKanan} />}

      {layers.hotspot && hotspots.map((h) => {
        const pr = prioritas?.[h.id]
        const aktif = h.id === selectedId
        return (
          <Marker key={h.id} position={[h.lat, h.lon]}
            icon={pr ? ikonPrioritas(pr.rank, pr.tingkat, aktif) : (aktif ? IKON.aktif : IKON.normal)}
            zIndexOffset={pr ? (hotspots.length - pr.rank) * 10 + (aktif ? 500 : 0) : 0}
            title={pr ? `${tr('Prioritas', 'Priority')} ${pr.rank}: Hotspot ${h.id}` : `Hotspot ${h.id}`}
            alt={pr ? `${tr('Prioritas', 'Priority')} ${pr.rank}: Hotspot ${h.id}` : `Hotspot ${h.id}`}
            eventHandlers={{ click: () => onSelect(h.id) }} />
        )
      })}
    </MapContainer>
    </div>
  )
}
