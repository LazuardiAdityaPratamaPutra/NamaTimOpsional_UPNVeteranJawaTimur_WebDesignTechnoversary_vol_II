import * as THREE from 'three'

// Rumah panggung sederhana (bergaya sama dengan model low-poly): tiang, lantai, dinding, atap limas, jendela menyala.
const kayu = new THREE.MeshStandardMaterial({ color: 0x8a5a35, flatShading: true, roughness: 1 })
const kayuGelap = new THREE.MeshStandardMaterial({ color: 0x5a3a22, flatShading: true, roughness: 1 })
const seng = new THREE.MeshStandardMaterial({ color: 0x8fa0a6, flatShading: true, roughness: 0.8, metalness: 0.2 })
const sengMerah = new THREE.MeshStandardMaterial({ color: 0xa8402f, flatShading: true, roughness: 0.9 })
const jendela = new THREE.MeshBasicMaterial({ color: 0xffc766 })
const gKotak = new THREE.BoxGeometry(1, 1, 1)
const gAtap = new THREE.ConeGeometry(0.5, 1, 4)
gAtap.rotateY(Math.PI / 4)

const bagian = (g, m, [x, y, z], [sx, sy, sz]) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; return o }

export function buatRumah({ besar = false, sengBaru = false } = {}) {
  const h = new THREE.Group()
  const L = besar ? 0.8 : 0.58, D = besar ? 0.6 : 0.46, tiang = 0.34
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) h.add(bagian(gKotak, kayuGelap, [sx * L * 0.42, tiang / 2, sz * D * 0.4], [0.05, tiang, 0.05]))
  h.add(bagian(gKotak, kayuGelap, [0, tiang + 0.025, 0], [L + 0.06, 0.05, D + 0.06]))
  h.add(bagian(gKotak, kayu, [0, tiang + 0.05 + 0.14, 0], [L, 0.28, D]))
  h.add(bagian(gAtap, sengBaru ? sengMerah : seng, [0, tiang + 0.05 + 0.28 + 0.13, 0], [L * 1.3, 0.26, D * 1.35]))
  for (const sx of [-0.22, 0.22]) { const w = new THREE.Mesh(gKotak, jendela); w.position.set(sx * L, tiang + 0.2, D / 2 + 0.005); w.scale.set(0.1, 0.1, 0.01); h.add(w) }
  return h
}
