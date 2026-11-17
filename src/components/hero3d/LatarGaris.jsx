import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

// Latar halaman Beranda: hutan konifer dalam gaya garis (wireframe) di atas hitam pekat, dengan pantulan di lantai,
// satu garis api oranye sebagai satu-satunya aksen warna, dan kamera yang bergeser pelan mengikuti gulir.
// Sengaja minimalis agar teks di depannya tetap terbaca.

// Pohon cemara = tiga kerucut bertumpuk; semua pohon digabung jadi satu geometri agar ringan.
function buatPohon(tinggi) {
  const r = tinggi * 0.2
  const bagian = [[1, 0.5, 0.0], [0.74, 0.42, 0.26], [0.48, 0.36, 0.5]].map(([sr, sh, y]) => {
    const g = new THREE.ConeGeometry(r * sr, tinggi * sh, 7, 1)
    g.translate(0, tinggi * (y + sh / 2), 0)
    return g
  })
  const batang = new THREE.CylinderGeometry(r * 0.06, r * 0.08, tinggi * 0.12, 5)
  batang.translate(0, tinggi * 0.06, 0)
  bagian.push(batang)
  const m = mergeGeometries(bagian.map((g) => g.toNonIndexed()))
  bagian.forEach((g) => g.dispose())
  return m
}

function acak(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 } }

export default function LatarGaris({ gerakKurang, aria, terang: terangProp = false }) {
  const wadah = useRef(null)
  // Tema diterapkan di tempat (warna kabut, garis, api) tanpa membuang dan membangun ulang konteks WebGL: itu yang membuat klik gelap/terang tersendat.
  const terangRef = useRef(terangProp)
  const terapkanRef = useRef(null)

  useEffect(() => {
    const el = wadah.current
    const terang = terangRef.current
    const sempit = el.clientWidth < 700
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    const LATAR = terang ? 0xf7dcc2 : 0x000000
    renderer.setClearColor(LATAR, 1)
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%'
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(LATAR, terang ? 35 : 30, terang ? 140 : 135)
    const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 300)

    // --- hutan: pohon digabung per ukuran ---
    const rnd = acak(7)
    const geos = []
    const JUMLAH = sempit ? 70 : 130
    const tipe = [0, 1, 2].map((i) => buatPohon(10 + i * 7)) // pendek, sedang, tinggi
    const gabung = []
    for (let i = 0; i < JUMLAH; i++) {
      const t = tipe[Math.floor(rnd() * 3)].clone()
      const skala = 0.7 + rnd() * 0.9
      const z = -95 + rnd() * 100
      const x = (rnd() - 0.5) * 190
      if (Math.abs(x) < 7 && z > -20) continue // sisakan celah di tengah untuk garis api
      t.applyMatrix4(new THREE.Matrix4().makeScale(skala, skala * (0.8 + rnd() * 0.7), skala).setPosition(x, 0, z))
      gabung.push(t)
    }
    const hutan = mergeGeometries(gabung)
    gabung.forEach((g) => g.dispose()); tipe.forEach((g) => g.dispose()); geos.length = 0

    const tepi = new THREE.EdgesGeometry(hutan, 28)
    const bahanGaris = new THREE.LineBasicMaterial({ color: terang ? 0x1f5c45 : 0x8fa097, transparent: true, opacity: terang ? 0.75 : 0.46 })
    const bahanPantul = new THREE.LineBasicMaterial({ color: terang ? 0x1f5c45 : 0x8fa097, transparent: true, opacity: terang ? 0.18 : 0.14 })
    const bahanIsi = new THREE.MeshBasicMaterial({ color: terang ? 0xa9cfae : 0x000000, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })
    const grup = new THREE.Group()
    grup.add(new THREE.Mesh(hutan, bahanIsi), new THREE.LineSegments(tepi, bahanGaris))
    const pantul = new THREE.Group()
    pantul.add(new THREE.LineSegments(tepi, bahanPantul))
    pantul.scale.y = -1
    scene.add(grup, pantul)

    // --- garis api: satu-satunya aksen oranye ---
    const N = 46
    const dasar = []
    for (let i = 0; i < N; i++) dasar.push({ x: -32 + (i / (N - 1)) * 64 + (rnd() - 0.5) * 1.2, z: -14 + Math.sin(i * 0.5) * 3 + (rnd() - 0.5), f: rnd() * 6.28, t: 1.2 + rnd() * 2.8 })
    const posApi = new Float32Array(N * 6)
    const geoApi = new THREE.BufferGeometry(); geoApi.setAttribute('position', new THREE.BufferAttribute(posApi, 3))
    const MERAH = terang ? 0xd9480f : 0xff5a1f, MIX = terang ? THREE.NormalBlending : THREE.AdditiveBlending
    const bahanApi = new THREE.LineBasicMaterial({ color: MERAH, transparent: true, opacity: 1, blending: MIX, fog: false })
    scene.add(new THREE.LineSegments(geoApi, bahanApi))
    const posGaris = new Float32Array(N * 3)
    const geoGaris = new THREE.BufferGeometry(); geoGaris.setAttribute('position', new THREE.BufferAttribute(posGaris, 3))
    dasar.forEach((d, i) => posGaris.set([d.x, 0.08, d.z], i * 3))
    const bahanGarisApi = new THREE.LineBasicMaterial({ color: MERAH, transparent: true, opacity: 0.8, fog: false })
    scene.add(new THREE.Line(geoGaris, bahanGarisApi))
    const BR = sempit ? 60 : 130
    const posBara = new Float32Array(BR * 3), kecBara = new Float32Array(BR)
    const reset = (i) => { const d = dasar[Math.floor(rnd() * N)]; posBara.set([d.x + (rnd() - 0.5) * 2, 0.3, d.z + (rnd() - 0.5) * 2], i * 3); kecBara[i] = 1.2 + rnd() * 3 }
    for (let i = 0; i < BR; i++) { reset(i); posBara[i * 3 + 1] = rnd() * 14 }
    const geoBara = new THREE.BufferGeometry(); geoBara.setAttribute('position', new THREE.BufferAttribute(posBara, 3))
    const bahanBara = new THREE.PointsMaterial({ color: terang ? 0xe4551a : 0xff7a3d, size: 0.28, transparent: true, opacity: 0.85, blending: MIX, fog: false, depthWrite: false })
    scene.add(new THREE.Points(geoBara, bahanBara))

    let px = 0, py = 0, tx = 0, ty = 0, w = 1, h = 1, g = 0, gTarget = 0, waktu = 0, terakhir = 0, raf = 0, jalan = false, terlihat = true
    const ukuran = () => {
      w = el.clientWidth || 1; h = el.clientHeight || 1
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); renderer.setSize(w, h, false)
      cam.aspect = w / h; cam.fov = w < h ? 62 : 42; cam.updateProjectionMatrix()
    }
    const gambar = () => {
      // api berkedip
      for (let i = 0; i < N; i++) {
        const d = dasar[i], tinggi = d.t * (0.55 + 0.45 * Math.sin(waktu * 5 + d.f) * Math.sin(waktu * 2.3 + d.f * 2))
        posApi.set([d.x, 0.08, d.z, d.x + Math.sin(waktu * 1.7 + d.f) * 0.5, 0.08 + Math.max(tinggi, 0.2), d.z], i * 6)
      }
      geoApi.attributes.position.needsUpdate = true
      for (let i = 0; i < BR; i++) { posBara[i * 3 + 1] += kecBara[i] * 0.016; posBara[i * 3] += Math.sin(waktu + i) * 0.004; if (posBara[i * 3 + 1] > 15) reset(i) }
      geoBara.attributes.position.needsUpdate = true
      // kamera: maju dan menyamping saat menggulir
      px += (tx - px) * 0.05; py += (ty - py) * 0.05
      const x = px * 4 + Math.sin(g * 2.4) * 16 + (gerakKurang ? 0 : Math.sin(waktu * 0.12) * 2.5)
      cam.position.set(x, 5.5 - g * 1.5 - py * 1.6, 46 - g * 30)
      cam.lookAt(x * 0.35, 7.5, -24)
      renderer.render(scene, cam)
    }
    const frame = (now) => {
      const dt = Math.min((now - terakhir) / 1000, 0.05); terakhir = now; waktu += dt
      g += (gTarget - g) * (1 - Math.exp(-dt * 3.5))
      gambar()
      if (jalan) raf = requestAnimationFrame(frame)
    }
    const mulai = () => { if (gerakKurang || jalan || !terlihat || document.hidden) return; jalan = true; terakhir = performance.now(); raf = requestAnimationFrame(frame) }
    const henti = () => { jalan = false; cancelAnimationFrame(raf) }
    const gulir = () => {
      const maks = document.documentElement.scrollHeight - window.innerHeight
      gTarget = maks > 0 ? Math.min(1, Math.max(0, window.scrollY / maks)) : 0
      if (gerakKurang) { g = gTarget; gambar() }
    }
    const ptr = (e) => { tx = (e.clientX / window.innerWidth) * 2 - 1; ty = (e.clientY / window.innerHeight) * 2 - 1 }
    const vis = () => (document.hidden ? henti() : mulai())
    const ro = new ResizeObserver(() => { ukuran(); if (gerakKurang) gambar() }); ro.observe(el)
    window.addEventListener('scroll', gulir, { passive: true }); if (!gerakKurang) window.addEventListener('pointermove', ptr, { passive: true }); document.addEventListener('visibilitychange', vis)
    const terapkan = (t) => {
      const latar = t ? 0xf7dcc2 : 0x000000
      renderer.setClearColor(latar, 1)
      scene.fog.color.setHex(latar); scene.fog.near = t ? 35 : 30; scene.fog.far = t ? 140 : 135
      bahanGaris.color.setHex(t ? 0x1f5c45 : 0x8fa097); bahanGaris.opacity = t ? 0.75 : 0.46
      bahanPantul.color.setHex(t ? 0x1f5c45 : 0x8fa097); bahanPantul.opacity = t ? 0.18 : 0.14
      bahanIsi.color.setHex(t ? 0xa9cfae : 0x000000)
      const merah = t ? 0xd9480f : 0xff5a1f, campur = t ? THREE.NormalBlending : THREE.AdditiveBlending
      bahanApi.color.setHex(merah); bahanApi.blending = campur; bahanApi.needsUpdate = true
      bahanGarisApi.color.setHex(merah)
      bahanBara.color.setHex(t ? 0xe4551a : 0xff7a3d); bahanBara.blending = campur; bahanBara.needsUpdate = true
      gambar()
    }
    terapkanRef.current = terapkan
    ukuran(); gulir(); gambar(); mulai()

    return () => {
      henti(); ro.disconnect(); window.removeEventListener('scroll', gulir); window.removeEventListener('pointermove', ptr); document.removeEventListener('visibilitychange', vis)
      ;[hutan, tepi, geoApi, geoGaris, geoBara].forEach((x) => x.dispose())
      ;[bahanGaris, bahanPantul, bahanIsi, bahanApi].forEach((x) => x.dispose())
      terapkanRef.current = null
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [gerakKurang])
  useEffect(() => { terangRef.current = terangProp; terapkanRef.current?.(terangProp) }, [terangProp])

  return (
    <div className="pointer-events-none fixed inset-0" role="img" aria-label={aria}>
      <div ref={wadah} className="absolute inset-0" />
    </div>
  )
}
