import { defineConfig } from 'vite'

export default defineConfig({
  base: '/life-os/',
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    open: true
  }
})
