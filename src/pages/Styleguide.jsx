import { useId, useState } from 'react'
import { Button, Card, Field, Pill, Slider, SectionHeading, Modal, Tabs, Accordion, useToast } from '../components/ui'
import BadgeDemo from '../components/BadgeDemo'
import { useJudul } from '../lib/useJudul'

const WARNA = [
  ['bg', 'bg-bg'], ['surface', 'bg-surface'], ['line', 'bg-line'], ['ink', 'bg-ink'], ['ink-2', 'bg-ink-2'],
  ['ember', 'bg-ember'], ['flame', 'bg-flame'], ['amber', 'bg-amber'], ['canopy', 'bg-canopy'], ['mint', 'bg-mint'],
]

function Galeri() {
  const u = useId() // id unik: galeri ini dirender dua kali (terang dan gelap)
  const [modal, setModal] = useState(false)
  const [tab, setTab] = useState('a')
  const [nilai, setNilai] = useState(6)
  const toast = useToast()

  return (
    <div className="space-y-8">
      <div aria-labelledby={`${u}-warna`}>
        <h3 id={`${u}-warna`} className="mb-2 font-bold">Token warna</h3>
        <ul className="grid grid-cols-5 gap-2">
          {WARNA.map(([n, c]) => (
            <li key={n} className="text-xs"><div className={`h-10 rounded-md border border-line ${c}`} />{n}</li>
          ))}
        </ul>
      </div>

      <div aria-labelledby={`${u}-tipe`}>
        <h3 id={`${u}-tipe`} className="mb-2 font-bold">Tipografi</h3>
        <p className="font-display text-3xl font-bold">Archivo Condensed, judul</p>
        <p>Inter untuk isi teks yang nyaman dibaca.</p>
        <p className="font-mono text-sm text-ink-2">-2.185, 113.842 (JetBrains Mono)</p>
      </div>

      <div aria-labelledby={`${u}-tombol`} className="space-y-2">
        <h3 id={`${u}-tombol`} className="font-bold">Tombol</h3>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="ghost">Ghost</Button>
          <Button size="sm">Kecil</Button><Button disabled>Nonaktif</Button>
        </div>
      </div>

      <div aria-labelledby={`${u}-pill`} className="space-y-2">
        <h3 id={`${u}-pill`} className="font-bold">Pill status dan lencana</h3>
        <div className="flex flex-wrap gap-2">
          {['online', 'offline', 'kritis', 'tinggi', 'waspada'].map((v) => <Pill key={v} variant={v} />)}
          <BadgeDemo />
        </div>
      </div>

      <div aria-labelledby={`${u}-kartu`} className="space-y-2">
        <h3 id={`${u}-kartu`} className="font-bold">Kartu, judul bagian, slider</h3>
        <Card>
          <SectionHeading eyebrow="Prediksi" title="Ke mana api akan pergi?">Contoh judul bagian dengan deskripsi.</SectionHeading>
          <Field className="mt-4" label="Email" defaultValue="nama@" error="Alamat email belum lengkap. Contoh: nama@contoh.com" />
          <Slider className="mt-4" label="Waktu" display={`jam ke-${nilai}`} min={0} max={12} value={nilai} onChange={(e) => setNilai(Number(e.target.value))} />
        </Card>
      </div>

      <div aria-labelledby={`${u}-tab`} className="space-y-2">
        <h3 id={`${u}-tab`} className="font-bold">Tab</h3>
        <Tabs label="Contoh tab" value={tab} onChange={setTab} tabs={[
          { id: 'a', label: 'Artikel', panel: <p className="text-sm text-ink-2">Isi tab Artikel.</p> },
          { id: 'b', label: 'Kuis', panel: <p className="text-sm text-ink-2">Isi tab Kuis.</p> },
        ]} />
      </div>

      <div aria-labelledby={`${u}-akor`} className="space-y-2">
        <h3 id={`${u}-akor`} className="font-bold">Akordeon</h3>
        <Accordion items={[
          { judul: 'Apa itu hotspot?', isi: 'Titik panas yang terdeteksi satelit; belum tentu kebakaran.' },
          { judul: 'Mengapa gambut sulit dipadamkan?', isi: 'Api dapat menjalar di bawah permukaan.' },
        ]} />
      </div>

      <div aria-labelledby={`${u}-over`} className="space-y-2">
        <h3 id={`${u}-over`} className="font-bold">Toast dan modal</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => toast.show('Laporan tersimpan di perangkat.', 'sukses')}>Toast sukses</Button>
          <Button variant="secondary" onClick={() => toast.show('Sinkronisasi gagal, akan dicoba lagi.', 'galat')}>Toast galat</Button>
          <Button variant="secondary" onClick={() => setModal(true)}>Buka modal</Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Contoh modal">
          <p className="text-sm text-ink-2">Fokus terkunci di dalam dialog. Tekan Esc untuk menutup.</p>
          <Button className="mt-4" onClick={() => setModal(false)}>Mengerti</Button>
        </Modal>
      </div>
    </div>
  )
}

export default function Styleguide() {
  useJudul('Styleguide')
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Styleguide Ember &amp; Canopy</h1>
      <p className="mt-2 text-ink-2">Semua komponen di kedua tema. Halaman ini tidak ditautkan di navbar.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {[['light', 'Tema terang'], ['dark', 'Tema gelap']].map(([tema, judul]) => (
          <section key={tema} data-theme={tema} aria-label={judul} className="rounded-2xl border border-line bg-bg p-5 text-ink">
            <h2 className="mb-4 text-xl font-bold">{judul}</h2>
            <Galeri />
          </section>
        ))}
      </div>
    </div>
  )
}
