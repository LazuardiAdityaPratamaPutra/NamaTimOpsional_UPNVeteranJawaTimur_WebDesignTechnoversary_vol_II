import { useEffect } from 'react'
import { ADA_GAMBAR_SEDIH, EKSPRESI, MaskotEkspresi } from './Maskot'
import Percikan from './Percikan'

// Adegan bersama untuk tab Kuis dan permainannya: langit, matahari, tiga lapis bukit polos (tanpa pohon), TORA, dan gelembung ucapan.
// Kedalaman datang dari lapisan warna (bukan dari cahaya atau kaca). Hanya dua ilustrasi TORA yang tersedia dari tim
// (ramah dan ceria), jadi reaksinya lewat gerak (melompat, menggeleng) dan kalimat.
export const HURUF = ['bg-ember', 'bg-amber', 'bg-canopy', 'bg-flame'] // satu warna per pilihan/ubin, urutan tetap
const lapis = (persen) => ({ fill: `color-mix(in oklab, var(--canopy) ${persen}%, var(--bg))` })

function Bukit() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 300" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[62%] w-full">
      <path d="M0 110 C90 50 170 90 250 62 S430 10 600 78 V300 H0Z" style={lapis(30)} />
      <path d="M0 175 C100 125 210 165 310 135 S510 112 600 150 V300 H0Z" style={lapis(58)} />
    </svg>
  )
}
function BukitDepan() {
  return (
    <svg aria-hidden="true" viewBox="0 0 600 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[22%] w-full">
      <path d="M0 50 C120 14 240 60 360 36 S530 22 600 44 V120 H0Z" style={lapis(100)} />
    </svg>
  )
}

// Awan hujan di atas kepala TORA saat jawaban salah (ilustrasi TORA yang "sedih" belum ada; lihat Maskot.jsx). Dekoratif.
function Mendung() {
  return (
    <div aria-hidden="true" className="awan-mendung pointer-events-none absolute right-[-6%] top-[1%] z-20 w-[38%] lg:left-1/2 lg:right-auto lg:top-[-31%] lg:w-[50%] lg:-translate-x-1/2">
      <svg viewBox="0 0 140 100" className="w-full overflow-visible">
        <g className="fill-ink-2"><circle cx="42" cy="44" r="22" /><circle cx="72" cy="34" r="28" /><circle cx="102" cy="46" r="20" /><rect x="30" y="46" width="84" height="22" rx="11" /></g>
        {[48, 72, 96].map((x, k) => <path key={x} className="awan-tetes fill-ink-2" style={{ animationDelay: `${k * 0.32}s` }} d={`M${x} 74C${x - 5} 82 ${x - 5} 87 ${x} 87C${x + 5} 87 ${x + 5} 82 ${x} 74Z`} />)}
      </svg>
    </div>
  )
}

/**
 * @param bubble teks gelembung ucapan
 * @param ekspresi 'ramah' | 'merayakan' | 'sedih' (nama ekspresi di Maskot; 'sedih' menampilkan awan hujan selama belum ada ilustrasinya)
 * @param reaksi '' | 'loncat' | 'geleng' | 'lesu'; ganti `kunci` agar animasi diulang
 * @param dekoratif true bila kalimat gelembung sudah diumumkan di tempat lain (disembunyikan dari pembaca layar)
 * @param lekat di layar lebar, panggung (langit, bukit, TORA) menempel di layar selagi kolom di sebelahnya digulir, agar TORA tidak tertinggal di dasar kolom yang panjang
 */
export function Adegan({ bubble, ekspresi = 'ramah', reaksi = '', kunci = 0, dekoratif = false, lekat = false, kompak = false, dekat = false, kelas = '', onPointerEnter, onClick }) {
  // Tiga ilustrasi TORA dipakai bergantian di kuis (ramah, tertawa, sedih): dimuat lebih dulu agar tidak ada jeda kosong saat jawaban pertama masuk
  useEffect(() => { ['ramah', 'merayakan', 'sedih'].forEach((k) => { const gambar = new Image(); gambar.src = EKSPRESI[k] }) }, [])
  const gelembung = (posisi, ekor) => (
    <p key={bubble} aria-hidden={dekoratif || undefined} className={`baris-masuk absolute z-30 m-0 rounded-2xl border-2 border-line-strong bg-surface font-bold leading-snug text-ink shadow-[0_4px_0_0_var(--line-strong)] ${posisi}`}>
      {bubble}
      <span aria-hidden="true" className={`absolute -bottom-[9px] size-4 rotate-45 border-b-2 border-r-2 border-line-strong bg-surface ${ekor}`} />
    </p>
  )
  return (
    <div className={`relative overflow-hidden bg-band ${lekat ? 'lg:overflow-clip' : ''} ${kelas}`}>
      {/* Bagian bawah kolom di luar panggung yang menempel diberi warna bukit depan agar menyambung; sengaja memanjang ke belakang panggung agar tidak ada garis tipis di sambungannya */}
      {lekat && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 hidden h-[calc(50%+2rem)] bg-canopy lg:block" />}
      <div className={lekat ? 'absolute inset-0 lg:sticky lg:inset-auto lg:top-4 lg:h-[min(100%,calc(100dvh_-_7rem))] lg:bg-[linear-gradient(var(--band)_75%,var(--canopy)_75%)]' : 'contents'}>
      <span aria-hidden="true" className="absolute right-[10%] top-[9%] size-14 rounded-full bg-amber sm:size-16" />
      <Bukit />
      <div className={`absolute z-10 ${lekat ? 'bottom-[6%] lg:bottom-[12%]' : 'bottom-[6%]'} ${onClick ? 'cursor-pointer' : ''} max-lg:right-[6%] lg:inset-x-0 lg:mx-auto lg:w-[min(78%,21rem)] ${kompak ? 'w-36 sm:w-[min(56%,14rem)]' : 'w-[min(56%,14rem)]'} ${dekat ? 'group/tora' : ''}`} onPointerEnter={onPointerEnter} onClick={onClick}>
        {/* Mode dekat: gelembung menempel di atas kepala TORA, ekornya menunjuk ke bawah ke arah kepala */}
        {/* dekat = 'lg': gelembung di atas kepala hanya di layar lebar; di layar sempit panggungnya pendek, jadi gelembung tetap di pojok */}
        {dekat && gelembung(`bottom-[calc(100%+0.6rem)] right-[38%] w-max max-w-[11rem] px-3.5 py-2.5 text-sm sm:max-w-[15rem] sm:px-4 sm:py-3 sm:text-base lg:right-auto lg:left-[-6%] ${dekat === 'lg' ? 'hidden lg:block' : ''}`, 'right-6 lg:left-auto lg:right-8')}
        <div className="tora-muncul">
          <div className={dekat ? 'tora-napas' : ''}>
            <div className={dekat ? 'origin-bottom transition-transform duration-300 ease-snap group-hover/tora:-rotate-2 group-hover/tora:scale-[1.03]' : ''}>
              <div key={kunci} className={reaksi === 'loncat' ? 'tora-loncat' : reaksi === 'geleng' ? 'tora-geleng' : reaksi === 'lesu' ? 'tora-lesu' : ''}>
                <MaskotEkspresi ekspresi={ekspresi} className="w-full" />
              </div>
            </div>
          </div>
        </div>
        {ekspresi === 'sedih' && !ADA_GAMBAR_SEDIH && <Mendung key={kunci} />}
        {dekat && kunci ? <Percikan key={kunci} className="percik-tora left-[62%] -top-1 scale-[2.4]" /> : null}
      </div>
      <BukitDepan />
      {(!dekat || dekat === 'lg') && gelembung(`left-4 top-5 sm:left-6 sm:top-7 sm:max-w-[15rem] sm:px-4 sm:py-3 sm:text-base ${kompak ? 'max-w-[9.5rem] px-3 py-2 text-sm' : 'max-w-[10.5rem] px-4 py-3 text-base'} ${dekat === 'lg' ? 'lg:hidden' : ''}`, 'left-9')}
      </div>
    </div>
  )
}
