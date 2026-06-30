import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Life-os/',
  build: {
    outDir: 'dist'
  },
  server: {
    port: 5173,
    open: true
  }
})
