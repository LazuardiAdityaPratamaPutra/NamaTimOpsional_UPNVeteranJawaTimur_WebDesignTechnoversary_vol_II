// Pemeriksa kesiapan rilis dan kepatuhan lomba. Gagal (exit 1) bila ada masalah.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, basename, resolve, extname } from 'node:path'
import { execSync } from 'node:child_process'
import { STATISTIK } from '../src/data/statistik.js'

const masalah = []
const catatan = []
const ABAIKAN = new Set(['node_modules', 'dist', '.git', '.vercel'])
const walk = (d) => readdirSync(d).flatMap((f) => {
  if (ABAIKAN.has(f)) return []
  const p = join(d, f)
  return statSync(p).isDirectory() ? walk(p) : [p]
})
const git = (perintah) => execSync(`git ${perintah}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 26 }).trim()

// 1. Placeholder konten
STATISTIK.filter((s) => s.angka == null || !s.sumber).forEach((s) => masalah.push(`Statistik "${s.id}" belum berisi angka dan sumber`))
const POLA_PLACEHOLDER = /\[(ANGKA|ISI|NAMA|SUMBER|@AKUN|LABEL|URL|EMAIL)[^\]]*\]/
;[...walk('src/pages'), ...walk('src/data'), 'README.md'].forEach((f) => {
  if (/\.(jsx?|json|md)$/.test(f) && POLA_PLACEHOLDER.test(readFileSync(f, 'utf8'))) masalah.push(`Placeholder tersisa di ${f}`)
})

// 2. Nama folder sesuai guidebook: webdesign_namaTim_technoversary_vol.II
const folder = basename(resolve('.'))
if (!/^webdesign_.+_technoversary_vol\.II$/.test(folder) || /NAMATIM/.test(folder)) {
  masalah.push(`Nama folder "${folder}" harus webdesign_namaTim_technoversary_vol.II`)
}

// 3. README memuat bagian wajib
const readme = existsSync('README.md') ? readFileSync('README.md', 'utf8') : ''
for (const bagian of ['## Instalasi', '## Menjalankan', '## Tim', '## Sumber data dan lisensi']) {
  if (!readme.includes(bagian)) masalah.push(`README belum memuat bagian "${bagian}"`)
}

// 4. Rahasia di berkas kerja (kunci Google API atau pola KEY=nilai panjang) dan berkas .env
const POLA_RAHASIA = /AIza[0-9A-Za-z_-]{35}|(?:API_KEY|SECRET|TOKEN|PASSWORD)\s*[=:]\s*['"]?[A-Za-z0-9_\-]{20,}/
const BERKAS_TEKS = new Set(['.js', '.jsx', '.mjs', '.json', '.md', '.css', '.html', '.txt', '.yml', '.yaml', '.env', ''])
for (const f of walk('.')) {
  if (basename(f) === '.env' || (/^\.env\./.test(basename(f)) && basename(f) !== '.env.example')) masalah.push(`Berkas rahasia ada di repository: ${f}`)
  if (BERKAS_TEKS.has(extname(f)) && statSync(f).size < 2e6 && POLA_RAHASIA.test(readFileSync(f, 'utf8'))) masalah.push(`Dugaan rahasia/kunci API di ${f}`)
}

// 5. Riwayat git (bila ada): rahasia pernah ter-commit, .env pernah ter-commit, tanggal commit pertama
if (existsSync('.git')) {
  try {
    if (git('log --all --oneline -G"AIza[0-9A-Za-z_-]{35}"')) masalah.push('Kunci API terdeteksi di riwayat git (hapus dari riwayat dan putar ulang kuncinya)')
    if (git('log --all --diff-filter=A --name-only --format= -- .env')) masalah.push('Berkas .env pernah di-commit (hapus dari riwayat dan putar ulang kuncinya)')
    const awal = git('log --reverse --format=%cI').split('\n')[0]
    if (awal && awal < '2026-11-05') masalah.push(`Commit pertama bertanggal ${awal.slice(0, 10)}; guidebook mensyaratkan riwayat commit mulai 5 November 2026`)
    if (!awal) catatan.push('Repository git belum punya commit.')
  } catch { catatan.push('Riwayat git tidak dapat diperiksa.') }
} else {
  catatan.push('Belum ada repository git. Jalankan `git init` pada atau setelah 5 November 2026 (riwayat commit harus dimulai pada/setelah tanggal itu).')
}

catatan.forEach((c) => console.log(`Catatan: ${c}`))
if (masalah.length) {
  console.error('Belum siap rilis:\n- ' + masalah.join('\n- '))
  process.exit(1)
}
console.log('Siap rilis: tidak ada masalah yang terdeteksi oleh pemeriksa otomatis.')
