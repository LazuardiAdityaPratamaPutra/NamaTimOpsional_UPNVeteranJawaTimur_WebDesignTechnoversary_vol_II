// Ilustrasi SVG buatan sendiri: nyala api hangat di depan kanopi hutan. Dekoratif (aria-hidden).
const POHON = [[40, 250, 1], [95, 262, 0.8], [150, 246, 1.1], [330, 248, 1.05], [390, 262, 0.85], [440, 250, 1]]

export default function IlustrasiHero() {
  return (
    <svg viewBox="0 0 480 340" aria-hidden="true" className="h-auto w-full">
      <circle cx="240" cy="170" r="150" className="fill-ember/15" />
      <circle cx="240" cy="170" r="100" className="fill-ember/20" />
      {/* bukit di belakang */}
      <path d="M0 270 Q90 200 180 250 T360 240 T480 250 V340 H0 Z" className="fill-mint/40" />
      {/* kanopi: deretan pohon */}
      {POHON.map(([x, y, k]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${k})`}>
          <rect x="-4" y="0" width="8" height="26" className="fill-ink-2" />
          <polygon points="0,-62 -26,-18 26,-18" className="fill-canopy" />
          <polygon points="0,-42 -32,6 32,6" className="fill-canopy" />
        </g>
      ))}
      <path d="M0 300 Q120 270 240 292 T480 285 V340 H0 Z" className="fill-canopy" />
      {/* api: tiga lapis */}
      <g className="api-goyang" style={{ transformOrigin: '240px 285px' }}>
        <path d="M240 60 C268 120 318 140 308 212 C302 258 270 285 240 285 C210 285 178 258 172 212 C166 168 206 146 216 112 C226 136 238 118 240 60 Z" className="fill-flame" />
        <path d="M240 118 C260 158 290 172 284 218 C280 250 262 270 240 270 C218 270 200 250 196 218 C192 186 222 170 230 148 C236 160 240 142 240 118 Z" className="fill-ember" />
        <path d="M240 188 C252 208 266 216 262 238 C260 254 250 262 240 262 C230 262 220 254 218 238 C216 220 232 214 236 204 C238 210 240 198 240 188 Z" className="fill-amber" />
      </g>
      {/* asap */}
      <circle cx="262" cy="38" r="12" className="fill-ink-2/25" />
      <circle cx="282" cy="18" r="9" className="fill-ink-2/20" />
    </svg>
  )
}
