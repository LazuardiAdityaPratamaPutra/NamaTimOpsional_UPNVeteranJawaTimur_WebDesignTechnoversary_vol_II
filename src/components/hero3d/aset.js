import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

// Pemuat model GLB (CC0, lihat public/models/LISENSI.md). Hasil di-cache per nama.
// Geometri TIDAK diubah: matriks tiap mesh disimpan agar tetap benar untuk atribut ber-kuantisasi (meshopt).
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
const cache = new Map()

/** @returns {Promise<{ bagian: {geometry, material, dasar: THREE.Matrix4}[], tinggi: number }>} dasar = matriks mesh + penempatan kaki model di y=0 */
export function muatModel(nama) {
  if (!cache.has(nama)) {
    cache.set(nama, loader.loadAsync(`${import.meta.env.BASE_URL}models/${nama}.glb`).then((g) => {
      g.scene.updateMatrixWorld(true)
      const kotak = new THREE.Box3().setFromObject(g.scene)
      const geser = new THREE.Matrix4().makeTranslation(-(kotak.min.x + kotak.max.x) / 2, -kotak.min.y, -(kotak.min.z + kotak.max.z) / 2)
      const bagian = []
      g.scene.traverse((m) => {
        if (m.isMesh) bagian.push({ geometry: m.geometry, material: m.material, dasar: new THREE.Matrix4().multiplyMatrices(geser, m.matrixWorld) })
      })
      return { bagian, tinggi: kotak.max.y - kotak.min.y }
    }))
  }
  return cache.get(nama)
}
