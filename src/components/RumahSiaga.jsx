import { useTr } from '../i18n'

// Rumah Siaga: ilustrasi datar bergaya neo-brutal (garis tebal, warna rata, bayangan keras) yang terisi setiap kali
// satu butir checklist dicentang. Butir yang belum dikerjakan tampil sebagai "bayangan" putus-putus, jadi pengguna
// melihat apa yang masih kurang. Kabut asap di langit menipis seiring kemajuan; pada 100% langit bersih.
// Semua warna dari token tema (tanpa heksadesimal), jadi ikut tema terang dan gelap.

const GARIS = { stroke: 'var(--text)', strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }
const tipis = { ...GARIS, strokeWidth: 2 }
const campur = (warna, persen, dasar = 'var(--bg)') => `color-mix(in oklab, ${warna} ${persen}%, ${dasar})`

// Titik jangkar tiap butir, untuk cincin sorot saat kartunya disentuh
export const JANGKAR = {
  k1: [214, 188], k2: [214, 228], k3: [80, 236], k4: [252, 256], k5: [330, 270], k6: [272, 124], k7: [165, 206], k8: [267, 206], k9: [404, 222],
  s1: [146, 226], s2: [56, 236], s3: [132, 262], s4: [182, 256], s5: [404, 272], s6: [304, 229], s7: [326, 276], s8: [226, 248],
}

/** Satu benda di adegan. hadir = sudah dicentang. baru = baru saja dicentang (animasi muncul diputar sekali). */
function Benda({ id, hadir, baru, onPilih, judul, children }) {
  return (
    <g data-butir={id} onClick={() => onPilih?.(id)} className={`rs-benda ${hadir ? (baru ? 'rs-hadir rs-baru' : 'rs-hadir') : 'rs-hantu'}`}>
      <title>{judul}</title>
      {children}
    </g>
  )
}

function Tumpukan({ hadir, baru, id, onPilih, judul, x }) {
  // Dua keadaan: tumpukan sampah kering berasap tipis (belum) atau tanaman kecil (sudah)
  return (
    <g data-butir={id} onClick={() => onPilih?.(id)} className="rs-benda">
      <title>{judul}</title>
      {hadir ? (
        <g key="tanam" className={baru ? 'rs-baru' : ''} style={{ transformOrigin: `${x}px 286px` }}>
          <path d={`M${x} 286 V262`} {...GARIS} fill="none" />
          <path d={`M${x} 274 C${x - 16} 272 ${x - 18} 260 ${x - 14} 256 C${x - 6} 258 ${x - 2} 266 ${x} 274Z`} {...tipis} fill="var(--canopy)" />
          <path d={`M${x} 268 C${x + 14} 266 ${x + 18} 254 ${x + 14} 250 C${x + 6} 252 ${x + 2} 260 ${x} 268Z`} {...tipis} fill="var(--canopy)" />
          <circle cx={x} cy={258} r={6} {...tipis} fill="var(--amber)" />
          <circle cx={x - 22} cy={281} r={4} {...tipis} fill="var(--ember)" />
          <circle cx={x + 20} cy={282} r={3.5} {...tipis} fill="var(--amber)" />
        </g>
      ) : (
        <g key="sampah">
          <path d={`M${x - 24} 288 L${x - 14} 270 L${x - 4} 280 L${x + 6} 264 L${x + 16} 278 L${x + 26} 288Z`} {...tipis} fill={campur('var(--amber)', 45, 'var(--ember)')} />
          <path d={`M${x - 10} 284 l6 -8 M${x + 4} 286 l5 -9 M${x + 14} 286 l-3 -7`} {...tipis} fill="none" />
          <path className="rs-asap-tipis" d={`M${x + 4} 262 c-8 -8 6 -12 -2 -22 c-6 -8 4 -12 0 -18`} stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      )}
    </g>
  )
}

function Rambu({ id, hadir, baru, onPilih, judul, x, teks }) {
  return (
    <Benda id={id} hadir={hadir} baru={baru} onPilih={onPilih} judul={judul}>
      <path d={`M${x} 288 V226`} {...GARIS} />
      <path d={`M${x - 30} 214 H${x + 30} L${x + 40} 225 L${x + 30} 236 H${x - 30}Z`} {...GARIS} fill="var(--canopy)" />
      <text x={x} y={229} textAnchor="middle" className="rs-teks" fill="var(--on-ember)">{teks}</text>
    </Benda>
  )
}

function Langit({ kabut, penuh }) {
  return (
    <>
      <rect width="480" height="340" fill="var(--band)" />
      <g className={penuh ? 'rs-matahari-penuh' : ''} style={{ transformOrigin: '404px 64px' }}>
        <circle cx="404" cy="64" r="30" fill="var(--amber)" />
      </g>
      {/* Kabut asap: makin tipis seiring kemajuan */}
      <g style={{ opacity: kabut }} className="transition-opacity duration-700 ease-out">
        <rect width="480" height="340" fill={campur('var(--ember)', 30, 'var(--band)')} opacity="0.55" />
        <ellipse className="rs-asap" cx="120" cy="70" rx="110" ry="26" fill="var(--text-2)" opacity="0.35" />
        <ellipse className="rs-asap rs-asap-2" cx="330" cy="110" rx="140" ry="30" fill="var(--text-2)" opacity="0.28" />
        <ellipse className="rs-asap" cx="230" cy="40" rx="90" ry="18" fill="var(--text-2)" opacity="0.25" />
      </g>
      <path d="M0 250 C90 214 170 238 260 226 S410 206 480 226 V340 H0Z" fill={campur('var(--canopy)', 42)} />
    </>
  )
}

function Tanah() {
  return <path d="M0 284 C120 276 260 292 480 280 V340 H0Z" fill={campur('var(--canopy)', 78)} {...GARIS} />
}

function Keluarga({ ada, baru, onPilih, nama, tr }) {
  const b = (id) => ({ id, hadir: ada(id), baru: baru === id, onPilih, judul: nama(id) })
  return (
    <>
      {/* Rumah tetangga: lampunya menyala setelah kalian bersepakat */}
      <g>
        <rect x="374" y="220" width="70" height="58" fill="var(--text)" />
        <rect x="368" y="214" width="70" height="58" {...GARIS} fill="var(--surface)" />
        <path d="M360 216 L403 184 L446 216Z" {...GARIS} fill={campur('var(--ember)', 70, 'var(--surface)')} />
        <rect x="380" y="228" width="20" height="18" {...tipis} fill={ada('k9') ? 'var(--amber)' : campur('var(--text-2)', 30)} className="transition-[fill] duration-500" />
        <rect x="408" y="228" width="20" height="18" {...tipis} fill={ada('k9') ? 'var(--amber)' : campur('var(--text-2)', 30)} className="transition-[fill] duration-500" />
        <rect x="396" y="252" width="16" height="20" {...tipis} fill="var(--band)" />
      </g>
      <Benda {...b('k9')}>
        <path d="M300 168 C330 140 360 150 384 196" fill="none" stroke="var(--amber)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" className="rs-garis-jalan" />
        <path d="M322 128 h34 a6 6 0 0 1 6 6 v14 a6 6 0 0 1 -6 6 h-20 l-8 8 v-8 h-6 a6 6 0 0 1 -6 -6 v-14 a6 6 0 0 1 6 -6Z" {...tipis} fill="var(--surface)" />
        <path d="M330 138 h22 M330 145 h14" {...tipis} />
      </Benda>

      {/* Rumah utama dengan bayangan keras */}
      <rect x="138" y="178" width="170" height="100" fill="var(--text)" />
      <rect x="130" y="170" width="170" height="100" {...GARIS} fill="var(--surface)" />
      <path d="M116 174 L215 104 L314 174Z" {...GARIS} fill="var(--ember)" />
      <rect x="196" y="212" width="36" height="58" {...GARIS} fill="var(--amber)" />
      <circle cx="225" cy="243" r="2.5" fill="var(--text)" />

      {/* Jendela kiri: kotak obat untuk anggota keluarga yang rentan (k7) */}
      <rect x="146" y="190" width="38" height="32" {...GARIS} fill={campur('var(--mint)', 22, 'var(--surface)')} />
      <Benda {...b('k7')}>
        <rect x="153" y="198" width="24" height="18" rx="3" {...tipis} fill="var(--surface)" />
        <path d="M165 201 v12 M159 207 h12" stroke="var(--flame)" strokeWidth="3.5" strokeLinecap="round" />
      </Benda>

      {/* Jendela kanan: terbuka berasap (belum) atau tertutup rapat (k8) */}
      <g data-butir="k8" onClick={() => onPilih?.('k8')} className="rs-benda">
        <title>{nama('k8')}</title>
        <rect x="248" y="190" width="38" height="32" {...GARIS} fill={campur('var(--mint)', 22, 'var(--surface)')} />
        {ada('k8') ? (
          <g key="tutup" className={baru === 'k8' ? 'rs-baru' : ''} style={{ transformOrigin: '267px 206px' }}>
            <rect x="248" y="190" width="19" height="32" {...GARIS} fill="var(--canopy)" />
            <rect x="267" y="190" width="19" height="32" {...GARIS} fill="var(--canopy)" />
            <path d="M252 206 h11 M271 206 h11" {...tipis} />
          </g>
        ) : (
          <g key="buka">
            <path d="M286 190 L300 196 V228 L286 222Z" {...tipis} fill="var(--surface)" />
            <path className="rs-asap-tipis" d="M300 202 c-10 2 -12 8 -22 6 c-6 -1 -10 4 -16 2" stroke="var(--text-2)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}
      </g>

      {/* k1: catatan 112 di dinding */}
      <Benda {...b('k1')}>
        <g transform="rotate(-5 214 188)">
          <rect x="199" y="177" width="30" height="22" {...tipis} fill="var(--surface)" />
          <text x="214" y="193" textAnchor="middle" className="rs-teks" fill="var(--flame)">112</text>
        </g>
      </Benda>
      {/* k2: masker tergantung di pintu */}
      <Benda {...b('k2')}>
        <path d="M206 222 v4 M222 222 v4" {...tipis} />
        <rect x="199" y="226" width="15" height="10" rx="4" {...tipis} fill="var(--surface)" />
        <rect x="215" y="226" width="15" height="10" rx="4" {...tipis} fill="var(--surface)" />
      </Benda>
      {/* k6: antena di atap, memancarkan sinyal */}
      <Benda {...b('k6')}>
        <path d="M272 140 V108 M262 116 h20 M265 124 h14" {...GARIS} fill="none" />
        <path className="rs-sinyal" d="M284 102 a14 14 0 0 1 0 16 M290 96 a22 22 0 0 1 0 28" stroke="var(--amber)" strokeWidth="3" strokeLinecap="round" fill="none" />
      </Benda>
      {/* k4: tas siaga di samping pintu */}
      <Benda {...b('k4')}>
        <path d="M244 252 a8 8 0 0 1 16 0" {...tipis} fill="none" />
        <rect x="238" y="250" width="28" height="30" rx="7" {...GARIS} fill="var(--ember)" />
        <rect x="244" y="262" width="16" height="10" rx="3" {...tipis} fill="var(--amber)" />
      </Benda>

      <Tanah />
      <Tumpukan {...b('k5')} x={340} />
      <Rambu {...b('k3')} x={80} teks={tr('KUMPUL', 'MEET')} />
    </>
  )
}

function Orang({ x, y, rompi = 'var(--ember)', tangan = false }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8" {...tipis} fill={campur('var(--amber)', 55, 'var(--surface)')} />
      <path d={`M${x - 10} ${y + 30} L${x - 8} ${y + 10} H${x + 8} L${x + 10} ${y + 30}Z`} {...tipis} fill={rompi} />
      {tangan && <path d={`M${x + 8} ${y + 14} L${x + 16} ${y - 6}`} {...tipis} />}
    </g>
  )
}

function Sekolah({ ada, baru, onPilih, nama, tr }) {
  const b = (id) => ({ id, hadir: ada(id), baru: baru === id, onPilih, judul: nama(id) })
  return (
    <>
      {/* Tiang bendera merah putih */}
      <path d="M352 286 V128" {...GARIS} />
      <rect x="353" y="130" width="34" height="11" fill="var(--flame)" /><rect x="353" y="141" width="34" height="11" fill="rgb(248 246 240)" />
      <rect x="353" y="130" width="34" height="22" {...tipis} fill="none" />

      <rect x="108" y="168" width="226" height="110" fill="var(--text)" />
      <rect x="100" y="160" width="226" height="110" {...GARIS} fill="var(--surface)" />
      <rect x="92" y="144" width="242" height="20" {...GARIS} fill="var(--ember)" />
      <text x="213" y="158" textAnchor="middle" className="rs-teks" fill="var(--on-ember)">{tr('SEKOLAH', 'SCHOOL')}</text>
      {[116, 166, 266].map((x) => <rect key={x} x={x} y="178" width="34" height="26" {...GARIS} fill={campur('var(--mint)', 22, 'var(--surface)')} />)}
      <rect x="198" y="214" width="34" height="56" {...GARIS} fill="var(--amber)" />

      {/* s1: poster 112 */}
      <Benda {...b('s1')}>
        <rect x="128" y="212" width="36" height="28" {...tipis} fill="var(--surface)" />
        <text x="146" y="231" textAnchor="middle" className="rs-teks" fill="var(--flame)">112</text>
      </Benda>
      {/* s6: papan kontak wali di dinding */}
      <Benda {...b('s6')}>
        <rect x="292" y="214" width="24" height="30" rx="2" {...tipis} fill="var(--surface)" />
        <rect x="298" y="210" width="12" height="7" rx="2" {...tipis} fill="var(--canopy)" />
        <path d="M297 225 h14 M297 231 h14 M297 237 h9" {...tipis} />
      </Benda>
      {/* s4: koordinator berompi dengan pengeras suara */}
      <Benda {...b('s4')}>
        <Orang x={176} y={244} />
        <path d="M186 254 l12 -6 v14Z" {...tipis} fill="var(--amber)" />
      </Benda>
      {/* s8: siswa mengangkat tangan melapor */}
      <Benda {...b('s8')}>
        <Orang x={252} y={250} rompi="var(--canopy)" tangan />
        <path d="M262 224 h16 a5 5 0 0 1 5 5 v10 a5 5 0 0 1 -5 5 h-10 l-6 5 v-5 a5 5 0 0 1 -5 -5 v-10 a5 5 0 0 1 5 -5Z" {...tipis} fill="var(--surface)" />
        <text x="272" y="240" textAnchor="middle" className="rs-teks" fill="var(--flame)">!</text>
      </Benda>
      {/* s3: kotak P3K dan masker */}
      <Benda {...b('s3')}>
        <rect x="118" y="252" width="28" height="20" rx="3" {...GARIS} fill="var(--surface)" />
        <path d="M132 256 v12 M126 262 h12" stroke="var(--flame)" strokeWidth="3.5" strokeLinecap="round" />
      </Benda>

      <Tanah />
      {/* s5: lapangan — bola dimainkan saat berasap (belum) atau kerucut "kegiatan ditunda" (sudah) */}
      <g data-butir="s5" onClick={() => onPilih?.('s5')} className="rs-benda">
        <title>{nama('s5')}</title>
        {ada('s5') ? (
          <g key="tunda" className={baru === 's5' ? 'rs-baru' : ''} style={{ transformOrigin: '404px 290px' }}>
            <path d="M392 290 L404 254 L416 290Z" {...GARIS} fill="var(--amber)" />
            <path d="M398 274 h12" stroke="var(--surface)" strokeWidth="4" />
            <rect x="384" y="290" width="40" height="6" {...tipis} fill="var(--amber)" />
          </g>
        ) : (
          <g key="main">
            <circle className="rs-bola" cx="404" cy="276" r="11" {...GARIS} fill="var(--surface)" />
            <path d="M380 270 h-10 M382 278 h-14" {...tipis} />
          </g>
        )}
      </g>
      <Tumpukan {...b('s7')} x={312} />
      <Rambu {...b('s2')} x={56} teks={tr('KUMPUL', 'MEET')} />
    </>
  )
}

/**
 * @param grup 'keluarga' | 'sekolah'
 * @param centang id butir yang sudah dicentang
 * @param baru id butir yang baru saja dicentang (diberi animasi muncul)
 * @param sorot id butir yang sedang disentuh di daftar (diberi cincin)
 * @param nama fungsi id -> teks butir (judul benda)
 * @param onPilih dipanggil saat benda di adegan diklik
 */
export default function RumahSiaga({ grup, centang, total, baru, sorot, nama, onPilih }) {
  const tr = useTr()
  const ada = (id) => centang.includes(id)
  const p = total ? centang.length / total : 0
  const penuh = p === 1
  const [sx, sy] = JANGKAR[sorot] ?? []
  const Adegan = grup === 'sekolah' ? Sekolah : Keluarga
  return (
    <svg viewBox="0 0 480 340" role="img" className="rumah-siaga block h-auto w-full select-none"
      aria-label={tr(`${grup === 'sekolah' ? 'Sekolah' : 'Rumah'} siaga: ${centang.length} dari ${total} persiapan terpasang`, `Ready ${grup === 'sekolah' ? 'school' : 'home'}: ${centang.length} of ${total} preparations in place`)}>
      <Langit kabut={(1 - p) * 0.9} penuh={penuh} />
      <Adegan ada={ada} baru={baru} onPilih={onPilih} nama={nama} tr={tr} />
      {sorot && sx != null && (
        <circle key={sorot} cx={sx} cy={sy} r="30" fill="none" stroke="var(--ember)" strokeWidth="3" strokeDasharray="6 6" className="rs-sorot" style={{ transformOrigin: `${sx}px ${sy}px` }} />
      )}
    </svg>
  )
}
