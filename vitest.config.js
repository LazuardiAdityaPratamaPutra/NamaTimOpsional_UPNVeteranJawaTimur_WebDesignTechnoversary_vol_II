// Konfigurasi uji terpisah agar plugin PWA tidak ikut dimuat saat menjalankan Vitest
import { defineConfig } from 'vitest/config'

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: { environment: 'node', include: ['tests/**/*.test.{js,jsx}'] },
})
