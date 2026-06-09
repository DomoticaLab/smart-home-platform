import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base path para que funcione detrás de un proxy o Docker
  base: './',
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  server: {
    // En desarrollo, proxy hacia el backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
