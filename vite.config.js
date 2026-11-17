import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { tanganiSinkron } from './src/lib/syncServer.js'
import { tanganiBriefing, tanganiChat } from './src/lib/gemini.js'

// Middleware /api/* untuk `npm run dev` dan `npm run preview` (di Vercel dipakai berkas di folder api/).
// Kunci Gemini dibaca dari .env di sisi server saja.
const apiLokal = (env) => {
  const ctx = (req) => ({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, ip: req.socket?.remoteAddress })
  const rute = {
    '/api/sync': (body) => tanganiSinkron(body),
    '/api/briefing': (body, req) => tanganiBriefing(body, ctx(req)),
    '/api/chat': (body, req) => tanganiChat(body, ctx(req)),
  }
  const bikin = (fn) => (req, res) => {
    if (req.method !== 'POST') { res.statusCode = 405; res.end('{"ok":false}'); return }
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', async () => {
      let body = null
      try { body = JSON.parse(data) } catch { /* body tidak valid */ }
      const { status, json } = await fn(body, req)
      res.statusCode = status
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(json))
    })
  }
  const pasang = (s) => { for (const [path, fn] of Object.entries(rute)) s.middlewares.use(path, bikin(fn)) }
  return {
    name: 'api-lokal',
    // Jangan mengembalikan nilai: Vite menganggap fungsi yang dikembalikan sebagai post-hook
    configureServer(s) { pasang(s) },
    configurePreviewServer(s) { pasang(s) },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(), tailwindcss(), apiLokal(loadEnv(mode, process.cwd(), '')),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'PyraOps', short_name: 'PyraOps', lang: 'id',
        description: 'Edukasi dan simulasi karhutla. Bukan hanya melihat api, tapi tahu ke mana api akan pergi.',
        start_url: '/', scope: '/', display: 'standalone',
        theme_color: '#0B1118', background_color: '#0B1118',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell dan seluruh aset build di-precache; SPA jatuh ke index.html saat offline
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webp,json,webmanifest,glb}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          { // Tile OSM: hanya yang pernah dilihat (tanpa prefetch massal), sesuai kebijakan tile OSM
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 300, maxAgeSeconds: 7 * 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } },
          },
          { // Font Google agar tipografi tetap tampil offline
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 20 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
}))
