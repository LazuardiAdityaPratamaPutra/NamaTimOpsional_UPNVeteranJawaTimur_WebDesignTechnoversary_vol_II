import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { tinggi, sungaiX, UKURAN_KM } from './medan'
import { VERT_MEDAN, FRAG_MEDAN, VERT_BARA, FRAG_BARA, VERT_API, FRAG_API, VERT_ASAP, FRAG_ASAP, VERT_KILAU, FRAG_KILAU, VERT_AIR, FRAG_AIR } from './shader'
import { buatHutan, goyang } from './hutan'
import { buatRumah } from './rumah'
import { muatModel } from './aset'

const LATAR = new THREE.Color(0x050a08)
const WARNA = { kritis: 0xf0484a, tinggi: 0xff6b2c, waspada: 0xffb703, aman: 0x7bd3a9 }
const RC = 40 // jarak kamera acuan (km)
const KABUT = 0.008

// Model GLB (CC0) dipasang apa adanya: matriks dasar tiap bagian dipertahankan.
const bangunModel = (m, skala) => {
  const g = new THREE.Group()
  m.bagian.forEach((b) => { const mm = new THREE.Mesh(b.geometry, b.material.clone()); mm.matrixAutoUpdate = false; mm.matrix.copy(b.dasar); g.add(mm) })
  g.scale.setScalar(skala)
  return g
}

// Adegan WebGL hero: hutan lahan gambut di malam hari. Keadaan dari luar masuk lewat `data`; React tidak ikut me-render per frame.
export default function Scene3D({ data, gerakKurang, aria, latar = false }) {
  const wadah = useRef(null)
  const lapisLabel = useRef(null)
  const api = useRef(null)

  useEffect(() => {
    const el = wadah.current
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setClearColor(LATAR, 1)
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab'
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(LATAR, KABUT)
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 500)
    const u = {
      uPhi: { value: 0 }, uTime: { value: 0 }, uU: { value: 0 }, uPx: { value: 1 }, uKabut: { value: KABUT },
      uA: { value: new THREE.Vector3(1, 1, 1) }, uB: { value: new THREE.Vector3(1, 1, 1) }, uC: { value: new THREE.Vector3() },
      uBg: { value: new THREE.Vector3(LATAR.r, LATAR.g, LATAR.b) },
    }

    // --- cahaya: bulan kebiruan, langit lembut, dan lampu api yang berkedip
    scene.add(new THREE.HemisphereLight(0x86a6b0, 0x1c3326, 1.5))
    const bulan = new THREE.DirectionalLight(0xb4caff, 2.0); bulan.position.set(-18, 28, 12); scene.add(bulan)
    const lampuApi = new THREE.PointLight(0xff5a1f, 0, 0, 2); scene.add(lampuApi)

    // --- medan
    const N = 200
    const geo = new THREE.PlaneGeometry(UKURAN_KM, UKURAN_KM, N, N); geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setY(i, tinggi(pos.getX(i), pos.getZ(i)))
    geo.computeVertexNormals()
    const medan = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT_MEDAN, fragmentShader: FRAG_MEDAN }))
    scene.add(medan)

    // --- partikel: bara, api, asap (lahir di dalam elips zona, hanyut searah angin)
    const partikel = (jumlah, vert, frag, tambah) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(jumlah * 3), 3))
      const b = new Float32Array(jumlah * 4); for (let i = 0; i < b.length; i++) b[i] = Math.random()
      g.setAttribute('aBenih', new THREE.BufferAttribute(b, 4))
      const p = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: tambah ? THREE.AdditiveBlending : THREE.NormalBlending }))
      p.frustumCulled = false; scene.add(p); return p
    }
    const lebarAwal = el.clientWidth > 900
    const pBara = partikel(lebarAwal ? 700 : 400, VERT_BARA, FRAG_BARA, true)
    const pApi = partikel(lebarAwal ? 520 : 300, VERT_API, FRAG_API, true)
    const pAsap = partikel(lebarAwal ? 260 : 150, VERT_ASAP, FRAG_ASAP, false)

    // --- kunang-kunang di hutan yang belum terbakar
    const acakBenih = (n) => { const b = new Float32Array(n * 4); for (let i = 0; i < b.length; i++) b[i] = Math.random(); return b }
    const titikKilau = (posisi, benih, uniforms) => {
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(posisi, 3)); g.setAttribute('aBenih', new THREE.BufferAttribute(benih, 4))
      const p = new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: { uTime: u.uTime, uPx: u.uPx, ...uniforms }, vertexShader: VERT_KILAU, fragmentShader: FRAG_KILAU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
      p.frustumCulled = false; scene.add(p); return p
    }
    const nKunang = lebarAwal ? 140 : 70
    const posKunang = new Float32Array(nKunang * 3)
    for (let i = 0; i < nKunang; i++) {
      const r = 3 + Math.sqrt(Math.random()) * 14, a = Math.random() * 6.2832
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      posKunang.set([x, tinggi(x, z) + 0.5 + Math.random() * 1.6, z], i * 3)
    }
    const pKunang = titikKilau(posKunang, acakBenih(nKunang), { uUkuran: { value: 0.22 }, uGerak: { value: 1 }, uLaju: { value: 1 }, uWarna: { value: new THREE.Color(0.7, 1.0, 0.4) } })
    let pLampu = null

    // --- semprotan air dari truk
    const nAir = lebarAwal ? 160 : 90
    const gAir = new THREE.BufferGeometry()
    gAir.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nAir * 3), 3)); gAir.setAttribute('aBenih', new THREE.BufferAttribute(acakBenih(nAir), 4))
    const uAir = { uTime: u.uTime, uPx: u.uPx, uAktif: { value: 0 }, uDari: { value: new THREE.Vector3() }, uKe: { value: new THREE.Vector3() } }
    const pAir = new THREE.Points(gAir, new THREE.ShaderMaterial({ uniforms: uAir, vertexShader: VERT_AIR, fragmentShader: FRAG_AIR, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    pAir.frustumCulled = false; scene.add(pAir)

    // --- keadaan animasi
    const target = { a: [1, 1, 1], b: [1, 1, 1], c: [0, 0, 0], phi: 0, U: 0 }
    const cur = { a: [1, 1, 1], b: [1, 1, 1], c: [0, 0, 0], phi: 0 }
    let waktu = 0, intro = gerakKurang ? 1 : 0
    let azSeret = 0, azTarget = 0, mulaiSeret = null
    let gTarget = 0, gSeret = 0 // kemajuan gulir halaman (0–1), dipakai saat adegan menjadi latar seluruh halaman
    let w = 1, h = 1, sedangJalan = false, raf = 0, terlihat = true, terakhir = performance.now(), batal = false
    let terbaru = null, hutan = null, truk = null, sirene = null, kotor = true, introSelesai = gerakKurang
    const rumahan = []; let label = []
    const sasaranTruk = new THREE.Vector3(); let sudahTruk = false
    const vec = new THREE.Vector3()
    const dibuang = [geo]

    // --- aset: dimuat setelah medan tampil, lalu hutan, rumah, dan posko muncul
    ;(async () => {
      try {
        const pem = terbaru?.pemukiman ?? []
        const pantang = (x, z) => Math.abs(x - sungaiX(z)) < 1.0 || pem.some((p) => Math.hypot(p.e - x, -p.n - z) < 1.5)
        const jumlah = Math.round((el.clientWidth > 900 ? 1900 : 900) * ((navigator.hardwareConcurrency ?? 8) <= 4 ? 0.6 : 1))
        const [hu, modelTruk, modelTenda] = await Promise.all([buatHutan({ jumlah, pantang }), muatModel('firetruck'), muatModel('tent')])
        if (batal) { hu.lepas(); return }
        hutan = hu; scene.add(hutan.grup); kotor = true
        // rumah panggung di tiap pemukiman, dengan cincin status di tanah
        const cincinGeo = new THREE.RingGeometry(1.0, 1.28, 48); cincinGeo.rotateX(-Math.PI / 2); dibuang.push(cincinGeo)
        pem.forEach((p, i) => {
          const y = tinggi(p.e, -p.n)
          const rumah = buatRumah({ besar: i % 3 === 0, sengBaru: i % 4 === 1 })
          rumah.position.set(p.e, y, -p.n); rumah.rotation.y = (i * 2.399) % 6.283; rumah.scale.setScalar(2.4); scene.add(rumah)
          const cm = new THREE.MeshBasicMaterial({ color: WARNA.aman, transparent: true, opacity: 0.4, depthWrite: false, fog: false })
          const cincin = new THREE.Mesh(cincinGeo, cm); cincin.position.set(p.e, y + 0.05, -p.n); cincin.scale.setScalar(1.9); scene.add(cincin)
          rumahan.push({ nama: p.nama, e: p.e, n: p.n, y, cm, cincin }); dibuang.push(cm)
        })
        // posko: truk pemadam + tenda (Kenney Car Kit & Nature Kit, CC0)
        truk = new THREE.Group()
        truk.add(bangunModel(modelTruk, 0.5))
        const tenda = bangunModel(modelTenda, 0.55); tenda.position.set(1.3, 0, -0.4); truk.add(tenda)
        sirene = new THREE.PointLight(0xff2a2a, 0, 8, 2); sirene.position.set(0, 1.3, 0); truk.add(sirene)
        scene.add(truk)
        // lampu jendela rumah: dua titik hangat per rumah, berkedip pelan
        const posLampu = new Float32Array(pem.length * 6)
        pem.forEach((p, i) => { const y = tinggi(p.e, -p.n) + 1.3; posLampu.set([p.e + 0.25, y, -p.n + 0.35, p.e - 0.3, y, -p.n - 0.2], i * 6) })
        pLampu = titikKilau(posLampu, acakBenih(pem.length * 2), { uUkuran: { value: 0.55 }, uGerak: { value: 0 }, uLaju: { value: 0.7 }, uWarna: { value: new THREE.Color(1.0, 0.72, 0.3) } })
        if (terbaru) tampil(terbaru)
        gambarSekali()
      } catch (e) { console.warn('Aset 3D gagal dimuat; adegan memakai medan saja.', e) }
    })()

    const tampil = (d) => {
      const kat = Object.fromEntries(d.pemukiman.map((p) => [p.nama, p.kategori]))
      rumahan.forEach((r) => { const k = kat[r.nama]; r.cm.color.set(WARNA[k] ?? WARNA.aman); r.cm.opacity = k ? 0.95 : 0.4; r.cincin.userData.denyut = !!k })
      const sasaran = rumahan.find((r) => r.nama === d.berlabel[0]?.nama) ?? rumahan[0]
      if (truk && sasaran) { sasaranTruk.set(sasaran.e + 2.4, 0, -sasaran.n + 1.6); if (!sudahTruk) { truk.position.copy(sasaranTruk); sudahTruk = true } }
      label.forEach((l) => l.node.remove()); label = []
      const buat = (teks, x, y, z, kelas = '') => { const node = document.createElement('div'); node.className = `label-peta ${kelas}`; node.textContent = teks; lapisLabel.current?.appendChild(node); label.push({ node, x, y, z }) }
      d.berlabel.forEach((p) => { const r = rumahan.find((q) => q.nama === p.nama); if (r) buat(p.nama, r.e, r.y + 2.2, -r.n) })
      if (truk) buat(d.poskoLabel ?? 'Posko', sasaranTruk.x, tinggi(sasaranTruk.x, sasaranTruk.z) + 2.4, sasaranTruk.z, 'label-tenang')
    }

    const ukuran = () => {
      w = el.clientWidth || 1; h = el.clientHeight || 1
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false)
      const lebar = w > 900
      cam.fov = lebar ? 30 : (2 * Math.atan(h / 2 / ((w / 30) * RC)) * 180) / Math.PI // layar sempit: ~30 km selebar layar
      const px = (h * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)))
      u.uPx.value = px
      cam.aspect = w / h
      let ox = lebar ? -w * 0.1 : 0, oy = lebar ? h * 0.05 : 0
      const ruang = el.closest('section')?.querySelector('[data-ruang-adegan]')
      if (!lebar && ruang) { const rs = ruang.getBoundingClientRect(), rt = el.getBoundingClientRect(); oy = h / 2 - (rs.top - rt.top + rs.height / 2) }
      cam.setViewOffset(w, h, ox, oy, w, h)
      cam.updateProjectionMatrix()
    }
    const posisiKamera = () => {
      const e = 1 - Math.pow(1 - intro, 3)
      const R = RC + (1 - e) * 20 - gSeret * 9, pol = 0.93 - (1 - e) * 0.15 - gSeret * 0.3
      const az = 0.5 + azSeret + gSeret * 1.5 + (gerakKurang ? 0 : Math.sin(waktu * 0.17) * 0.3)
      cam.position.set(R * Math.sin(pol) * Math.sin(az), R * Math.cos(pol), R * Math.sin(pol) * Math.cos(az))
      cam.lookAt(0, 0.4, 0)
    }
    const perbaruiLabel = () => label.forEach(({ node, x, y, z }) => {
      vec.set(x, y, z).project(cam)
      node.style.transform = `translate(${((vec.x + 1) / 2) * w}px, ${((1 - vec.y) / 2) * h}px) translate(10px, -50%)`
      node.style.opacity = vec.z < 1 ? '1' : '0'
    })

    const gambar = () => {
      const e = 1 - Math.pow(1 - intro, 3)
      const dari = (arr) => [Math.max(arr[0] * e, 0.02), Math.max(arr[1] * e, 0.02), Math.max(arr[2] * e, 0.02)]
      const A = dari(cur.a), B = dari(cur.b), C = [cur.c[0] * e, cur.c[1] * e, cur.c[2] * e]
      u.uTime.value = waktu
      u.uA.value.set(...A); u.uB.value.set(...B); u.uC.value.set(...C); u.uPhi.value = cur.phi
      lampuApi.position.set(C[0] * Math.sin(cur.phi), 1.1, -C[0] * Math.cos(cur.phi))
      lampuApi.intensity = 48 * e * (0.86 + 0.1 * Math.sin(waktu * 7.3) + 0.04 * Math.sin(waktu * 17.1))
      if (hutan) {
        if (intro < 1 || !introSelesai) { hutan.atur(intro); if (intro >= 1) introSelesai = true }
        const beda = Math.abs(cur.phi - target.phi) + cur.a.reduce((s, v, i) => s + Math.abs(v - target.a[i]) + Math.abs(cur.b[i] - target.b[i]) + Math.abs(cur.c[i] - target.c[i]), 0)
        if (kotor || intro < 1 || beda > 0.002) { hutan.warnai({ a: A, b: B, c: C, phi: cur.phi }); kotor = false }
      }
      rumahan.forEach((r) => { if (r.cincin.userData.denyut) { const k = 1.9 * (1 + 0.12 * Math.sin(waktu * 3 + r.e)); r.cincin.scale.set(k, 1.9, k) } else r.cincin.scale.setScalar(1.9) })
      if (truk) {
        truk.position.x += (sasaranTruk.x - truk.position.x) * (gerakKurang ? 1 : 0.06); truk.position.z += (sasaranTruk.z - truk.position.z) * (gerakKurang ? 1 : 0.06)
        truk.position.y = tinggi(truk.position.x, truk.position.z)
        truk.rotation.y = Math.atan2(-truk.position.x, -truk.position.z)
      }
      goyang.uT.value = waktu; goyang.uW.value = target.U
      if (sirene) { const nyala = Math.sin(waktu * 9) > 0; sirene.color.setHex(nyala ? 0xff2a2a : 0x2a6bff); sirene.intensity = 16 * e }
      if (truk) {
        const dx = -truk.position.x, dz = -truk.position.z, jarak = Math.hypot(dx, dz) || 1
        const ke = Math.min(jarak * 0.85, 7)
        const dr = truk.position
        uAir.uDari.value.set(dr.x + (dx / jarak) * 0.6, dr.y + 1.0, dr.z + (dz / jarak) * 0.6)
        uAir.uKe.value.set(dr.x + (dx / jarak) * ke, tinggi(dr.x + (dx / jarak) * ke, dr.z + (dz / jarak) * ke) + 0.2, dr.z + (dz / jarak) * ke)
        uAir.uAktif.value = jarak > 1.5 && intro >= 1 ? 1 : 0
      }
      posisiKamera()
      renderer.render(scene, cam)
      perbaruiLabel()
    }
    const frame = (now) => {
      const nyata = (now - terakhir) / 1000
      const dt = Math.min(nyata, 0.05); terakhir = now
      waktu += dt
      intro = Math.min(1, intro + Math.min(nyata, 0.5) / 2.8)
      const k = 1 - Math.exp(-Math.min(nyata, 0.25) * 9)
      for (let i = 0; i < 3; i++) { cur.a[i] += (target.a[i] - cur.a[i]) * k; cur.b[i] += (target.b[i] - cur.b[i]) * k; cur.c[i] += (target.c[i] - cur.c[i]) * k }
      const dp = ((target.phi - cur.phi + Math.PI * 3) % (Math.PI * 2)) - Math.PI
      cur.phi += dp * k
      azSeret += (azTarget - azSeret) * k
      gSeret += (gTarget - gSeret) * (1 - Math.exp(-Math.min(nyata, 0.25) * 3.5))
      gambar()
      if (sedangJalan) raf = requestAnimationFrame(frame)
    }
    const mulai = () => { if (gerakKurang || sedangJalan || !terlihat || document.hidden) return; sedangJalan = true; terakhir = performance.now(); raf = requestAnimationFrame(frame) }
    const henti = () => { sedangJalan = false; cancelAnimationFrame(raf) }
    const gambarSekali = () => { if (gerakKurang) { if (hutan) { hutan.atur(1); kotor = true } gambar() } }

    api.current = (d) => {
      terbaru = d
      target.a = d.a; target.b = d.b; target.c = d.c; target.phi = d.phi; target.U = d.U; u.uU.value = d.U
      if (gerakKurang) { cur.a = [...d.a]; cur.b = [...d.b]; cur.c = [...d.c]; cur.phi = d.phi }
      kotor = true
      if (truk || rumahan.length) tampil(d)
      gambarSekali()
    }

    const dom = renderer.domElement
    const turun = (e) => { mulaiSeret = { x: e.clientX, az: azTarget }; dom.setPointerCapture(e.pointerId); dom.style.cursor = 'grabbing' }
    const gerak = (e) => { if (!mulaiSeret) return; azTarget = Math.max(-1.1, Math.min(1.1, mulaiSeret.az + (e.clientX - mulaiSeret.x) * 0.006)); if (gerakKurang) { azSeret = azTarget; gambar() } }
    const naik = () => { mulaiSeret = null; dom.style.cursor = 'grab' }
    dom.addEventListener('pointerdown', turun); dom.addEventListener('pointermove', gerak); dom.addEventListener('pointerup', naik); dom.addEventListener('pointercancel', naik)
    const gulir = () => {
      if (!latar) return
      const maks = document.documentElement.scrollHeight - window.innerHeight
      gTarget = maks > 0 ? Math.min(1, Math.max(0, window.scrollY / maks)) : 0
      if (gerakKurang) { gSeret = gTarget; gambar() }
    }
    if (latar) { window.addEventListener('scroll', gulir, { passive: true }); gulir() }
    const ro = new ResizeObserver(() => { ukuran(); gambarSekali() }); ro.observe(el)
    const io = new IntersectionObserver(([s]) => { terlihat = s.isIntersecting; terlihat ? mulai() : henti() }); io.observe(el)
    const vis = () => (document.hidden ? henti() : mulai())
    document.addEventListener('visibilitychange', vis)
    ukuran(); gambar(); mulai()

    return () => {
      batal = true; henti(); window.removeEventListener('scroll', gulir); ro.disconnect(); io.disconnect(); document.removeEventListener('visibilitychange', vis)
      dom.removeEventListener('pointerdown', turun); dom.removeEventListener('pointermove', gerak); dom.removeEventListener('pointerup', naik); dom.removeEventListener('pointercancel', naik)
      label.forEach((l) => l.node.remove())
      hutan?.lepas(); dibuang.forEach((x) => x?.dispose?.())
      ;[medan, pBara, pApi, pAsap, pKunang, pAir, pLampu].filter(Boolean).forEach((o) => { o.geometry.dispose(); o.material.dispose() })
      renderer.dispose(); dom.remove(); api.current = null
    }
  }, [gerakKurang, latar])

  useEffect(() => { api.current?.(data) }, [data, gerakKurang])

  return (
    <div className={latar ? 'fixed inset-0' : 'absolute inset-0'} role="img" aria-label={aria}>
      <div ref={wadah} className="absolute inset-0" />
      <div ref={lapisLabel} className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" />
    </div>
  )
}
