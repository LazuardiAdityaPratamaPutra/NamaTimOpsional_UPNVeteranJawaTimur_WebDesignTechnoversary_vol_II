import * as THREE from 'three'
import { muatModel } from './aset'
import { tinggi, fbm, acak } from './medan'

// Hutan instansi dari model CC0. Tiap pohon berubah warna menurut zona api: hijau malam, menghangat (12 jam),
// menyala (6 jam), hangus (3 jam). Pohon tumbuh keluar dari titik api saat intro.
const JENIS = [
  { nama: 'tree_palm', bobot: 0.20, skala: 0.44 },
  { nama: 'tree_fat', bobot: 0.17, skala: 0.44 },
  { nama: 'tree_oak', bobot: 0.13, skala: 0.44 },
  { nama: 'tree_pine_tall', bobot: 0.17, skala: 0.48 },
  { nama: 'tree_pine', bobot: 0.08, skala: 0.44 },
  { nama: 'bush', bobot: 0.15, skala: 0.6 },
  { nama: 'bush_large', bobot: 0.05, skala: 0.6 },
  { nama: 'stump', bobot: 0.02, skala: 0.55 },
  { nama: 'log', bobot: 0.015, skala: 0.55 },
  { nama: 'rock_large', bobot: 0.02, skala: 0.6 },
]
/** Uniform bersama: waktu, kecepatan angin (m/s). Diisi Scene3D tiap frame; dipakai goyangan pohon dan kedip api. */
export const goyang = { uT: { value: 0 }, uW: { value: 0 } }
const langkah = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }

export async function buatHutan({ jumlah, pantang }) {
  const model = await Promise.all(JENIS.map((j) => muatModel(j.nama)))
  const rnd = acak(11)
  const total = JENIS.reduce((s, j) => s + j.bobot, 0)
  const pilih = () => { let r = rnd() * total; for (let i = 0; i < JENIS.length; i++) { r -= JENIS[i].bobot; if (r <= 0) return i } return 0 }

  const pohon = []
  for (let coba = 0; pohon.length < jumlah && coba < jumlah * 14; coba++) {
    const x = (rnd() - 0.5) * 42, z = (rnd() - 0.5) * 42
    const r = Math.hypot(x, z)
    if (r > 20 || r < 0.5 || pantang(x, z)) continue
    if (r < 4.5 && rnd() < 0.7) continue // lahan sekitar titik api lebih lapang: api tetap terlihat
    if (fbm(x * 0.11 + 9, z * 0.11 + 4) < 0.45 && rnd() > 0.1) continue // hutan berumpun, sedikit pohon tersebar
    const j = pilih()
    pohon.push({ j, x, z, y: tinggi(x, z), r, rot: rnd() * Math.PI * 2, s: JENIS[j].skala * (0.78 + rnd() * 0.55), idx: 0 })
  }
  const hitung = JENIS.map(() => 0)
  pohon.forEach((p) => { p.idx = hitung[p.j]++ })

  const grup = new THREE.Group()
  const mesh = JENIS.map((_, j) => model[j].bagian.map((b) => {
    const bahan = b.material.clone(); bahan.flatShading = true; bahan.metalness = 0; bahan.roughness = 1
    bahan.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aApi;\nvarying float vApi;\nvarying float vFase;\nuniform float uT;\nuniform float uW;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        vApi = aApi;
        float fase = instanceMatrix[3].x * 0.9 + instanceMatrix[3].z * 0.7;
        vFase = fase;
        float tinggiLokal = clamp(position.y, 0.0, 3.0);
        float hembus = sin(uT * 1.5 + fase) + 0.5 * sin(uT * 3.1 + fase * 1.7);
        float ayun = tinggiLokal * tinggiLokal * (0.012 + 0.010 * uW) * hembus * (1.0 - clamp(aApi - 2.0, 0.0, 1.0) * 0.6);
        transformed.x += ayun; transformed.z += ayun * 0.6;`)
      sh.uniforms.uT = goyang.uT; sh.uniforms.uW = goyang.uW
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vApi;\nvarying float vFase;\nuniform float uT;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          vec3 dasar = diffuseColor.rgb * vec3(0.66, 0.98, 0.66);                 // hijau malam
          vec3 hangat = dasar * vec3(1.4, 0.9, 0.55);                              // zona 12 jam
          vec3 nyala = mix(dasar, vec3(1.0, 0.36, 0.06), 0.8);                     // zona 6 jam
          vec3 arang = vec3(0.045, 0.035, 0.032) + dasar * 0.06;                   // zona 3 jam
          vec3 wp = mix(dasar, hangat, clamp(vApi, 0.0, 1.0));
          wp = mix(wp, nyala, clamp(vApi - 1.0, 0.0, 1.0));
          diffuseColor.rgb = mix(wp, arang, clamp(vApi - 2.0, 0.0, 1.0));`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += vec3(1.0, 0.34, 0.06) * smoothstep(0.7, 1.5, vApi) * (1.0 - smoothstep(1.9, 2.7, vApi)) * (0.85 + 0.35 * sin(uT * 8.0 + vFase * 3.0) * sin(uT * 5.3 + vFase));`)
    }
    const im = new THREE.InstancedMesh(b.geometry, bahan, Math.max(hitung[j], 1))
    im.count = hitung[j]; im.castShadow = true; im.frustumCulled = false
    b.geometry.setAttribute('aApi', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(hitung[j], 1)), 1))
    grup.add(im); return im
  }))

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0)
  const kerja = new THREE.Matrix4()

  /** Posisi + skala tumbuh. intro 0..1: gelombang tumbuh dari titik api ke tepi. */
  function atur(intro) {
    for (const p of pohon) {
      const tumbuh = intro >= 1 ? 1 : langkah(0, 1, intro * 1.7 - p.r / 20)
      const e = 1 - Math.pow(1 - tumbuh, 3)
      P.set(p.x, p.y, p.z); Q.setFromAxisAngle(Y, p.rot); S.setScalar(Math.max(p.s * e, 0.0001))
      M.compose(P, Q, S)
      model[p.j].bagian.forEach((b, k) => { kerja.multiplyMatrices(M, b.dasar); mesh[p.j][k].setMatrixAt(p.idx, kerja) })
    }
    mesh.forEach((arr) => arr.forEach((im) => { im.instanceMatrix.needsUpdate = true }))
  }

  /** Warna per pohon dari jarak ternormalisasi ke elips zona (d3, d6, d12). par = {a:[3,6,12], b:[..], c:[..], phi} */
  function warnai(par) {
    const sx = Math.sin(par.phi), sy = Math.cos(par.phi)
    for (const p of pohon) {
      const e = p.x, n = -p.z
      const d = [0, 1, 2].map((i) => {
        const rx = e - par.c[i] * sx, ry = n - par.c[i] * sy
        const u = rx * sx + ry * sy, v = rx * sy - ry * sx
        return Math.hypot(u / Math.max(par.a[i], 0.02), v / Math.max(par.b[i], 0.02))
      })
      const api = langkah(1.12, 0.92, d[2]) + langkah(1.06, 0.86, d[1]) + langkah(1.02, 0.80, d[0]) // 0 normal .. 3 hangus
      mesh[p.j].forEach((im) => { im.geometry.attributes.aApi.setX(p.idx, api) })
    }
    mesh.forEach((arr) => arr.forEach((im) => { im.geometry.attributes.aApi.needsUpdate = true }))
  }

  const lepas = () => { mesh.forEach((arr) => arr.forEach((im) => { im.material.dispose(); im.dispose() })) }
  return { grup, atur, warnai, lepas, jumlah: pohon.length }
}
