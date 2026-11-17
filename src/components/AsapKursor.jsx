import { useEffect, useRef } from 'react'
import { kurangiGerak } from '../lib/gerak'

// Jejak asap yang mengikuti kursor: gumpalan tak beraturan yang lahir rapat di sepanjang jalur kursor,
// berputar pelan, naik, melebar, lalu menipis. Hanya di perangkat dengan mouse; mati bila gerak dikurangi;
// berhenti menggambar (tanpa rAF) saat tidak ada asap tersisa.
const acak = (a, b) => a + Math.random() * (b - a)

// Satu gumpalan awan: beberapa lingkaran lembut bertumpuk di posisi acak, lalu tepinya dipudarkan.
function buatSprite(r, g, b) {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N
  const x = c.getContext('2d')
  for (let i = 0; i < 9; i++) {
    const cx = N / 2 + acak(-0.2, 0.2) * N, cy = N / 2 + acak(-0.2, 0.2) * N, rad = acak(0.2, 0.36) * N
    const gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad)
    gr.addColorStop(0, `rgba(${r},${g},${b},0.32)`); gr.addColorStop(0.6, `rgba(${r},${g},${b},0.12)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
    x.fillStyle = gr; x.fillRect(0, 0, N, N)
  }
  x.globalCompositeOperation = 'destination-in'
  const m = x.createRadialGradient(N / 2, N / 2, N * 0.1, N / 2, N / 2, N / 2)
  m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = m; x.fillRect(0, 0, N, N)
  return c
}

export default function AsapKursor() {
  const ref = useRef(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv || typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches
      || kurangiGerak()) return
    const ctx = cv.getContext('2d')
    const set = (r, g, b) => Array.from({ length: 5 }, () => buatSprite(r, g, b))
    const sprite = { gelap: set(214, 222, 217), terang: set(88, 78, 70), api: set(255, 128, 66) }
    let dpr = 1, raf = 0, lx = -1, ly = -1, vx = 0, vy = 0, sisa = 0, t0 = 0
    const P = []
    const ukuran = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr }
    const lahir = (x, y) => {
      const terang = document.documentElement.dataset.theme === 'light'
      const api = Math.random() < 0.05
      const grup = api ? sprite.api : terang ? sprite.terang : sprite.gelap
      P.push({ x: x + acak(-5, 5), y: y + acak(-5, 5), vx: vx * 0.12 + acak(-0.25, 0.25), vy: vy * 0.12 - acak(0.25, 0.7),
        r: api ? 10 : acak(14, 24), tumbuh: api ? 8 : acak(36, 62), rot: acak(0, 6.28), putar: acak(-0.5, 0.5),
        a: api ? 0.55 : terang ? 0.3 : 0.26, umur: 0, maks: api ? 0.7 : acak(1.5, 2.3), s: grup[(Math.random() * grup.length) | 0], f: acak(0, 6.28) })
      if (P.length > 360) P.shift()
    }
    const gambar = (t) => {
      raf = 0
      const dt = Math.min((t - t0) / 1000 || 0.016, 0.05); t0 = t
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight)
      vx *= 0.9; vy *= 0.9
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.umur += dt
        const k = p.umur / p.maks
        if (k >= 1) { P.splice(i, 1); continue }
        // gesekan + pusaran halus + daya apung naik
        p.vx *= 0.985; p.vy = p.vy * 0.985 - 0.012
        p.x += (p.vx + Math.sin(p.umur * 2.2 + p.f) * 0.35) * dt * 60; p.y += p.vy * dt * 60
        p.rot += p.putar * dt
        const r = p.r + p.tumbuh * (1 - (1 - k) ** 2)
        ctx.globalAlpha = p.a * Math.min(1, k * 7) * (1 - k) ** 1.6
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(p.s, -r, -r, r * 2, r * 2); ctx.restore()
      }
      ctx.globalAlpha = 1
      if (P.length) raf = requestAnimationFrame(gambar)
    }
    const mulai = () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(gambar) } }
    const gerak = (e) => {
      const x = e.clientX, y = e.clientY
      if (lx >= 0) {
        const dx = x - lx, dy = y - ly, d = Math.hypot(dx, dy)
        vx = vx * 0.6 + dx * 0.4; vy = vy * 0.6 + dy * 0.4
        // lahirkan gumpalan rapat di sepanjang ruas jalur (bukan hanya di titik kejadian) agar jejaknya mulus
        let s = sisa
        while (s < d) { const u = s / (d || 1); lahir(lx + dx * u, ly + dy * u); s += 6 }
        sisa = s - d
      }
      lx = x; ly = y
      if (P.length) mulai()
    }
    const keluar = () => { lx = -1; sisa = 0 }
    ukuran(); addEventListener('resize', ukuran); document.addEventListener('pointermove', gerak, { passive: true }); document.addEventListener('pointerleave', keluar)
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', ukuran); document.removeEventListener('pointermove', gerak); document.removeEventListener('pointerleave', keluar) }
  }, [])
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] size-full" />
}
