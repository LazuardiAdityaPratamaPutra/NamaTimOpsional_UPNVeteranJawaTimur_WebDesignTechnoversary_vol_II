// Analisis isi bundel: `npm run analisis` -> ukuran gzip per paket untuk tiap potongan JS.
import { build } from 'vite'
import { readFileSync, rmSync } from 'node:fs'
import { visualizer } from 'rollup-plugin-visualizer'
import konfigurasi from '../vite.config.js'

const berkas = 'node_modules/.cache/stats.json'
const dasar = konfigurasi({ mode: 'production' })
await build({
  ...dasar, configFile: false, logLevel: 'error',
  build: { outDir: 'node_modules/.cache/dist-analisis', emptyOutDir: true },
  plugins: [...dasar.plugins, visualizer({ template: 'raw-data', filename: berkas, gzipSize: true })],
})
const { nodeParts, nodeMetas } = JSON.parse(readFileSync(berkas, 'utf8'))
const perChunk = {}
for (const meta of Object.values(nodeMetas)) {
  const modul = meta.id.includes('node_modules/') ? meta.id.split('node_modules/').pop().split('/').slice(0, meta.id.split('node_modules/').pop().startsWith('@') ? 2 : 1).join('/') : 'kode sendiri (src)'
  for (const [chunk, uid] of Object.entries(meta.moduleParts)) {
    const g = nodeParts[uid]?.gzipLength ?? 0
    perChunk[chunk] ??= {}
    perChunk[chunk][modul] = (perChunk[chunk][modul] ?? 0) + g
  }
}
for (const [chunk, paket] of Object.entries(perChunk).sort()) {
  if (!chunk.endsWith('.js')) continue
  const total = Object.values(paket).reduce((a, b) => a + b, 0)
  console.log(`\n${chunk}  (modul ~${(total / 1024).toFixed(1)} KB gzip)`)
  Object.entries(paket).sort((a, b) => b[1] - a[1]).slice(0, 7).forEach(([m, g]) => console.log(`   ${(g / 1024).toFixed(1).padStart(6)} KB  ${m}`))
}
rmSync('node_modules/.cache/dist-analisis', { recursive: true, force: true })
