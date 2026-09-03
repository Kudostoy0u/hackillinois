import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/adonix': {
        target: 'https://adonix.hackillinois.org',
        changeOrigin: true,
        rewrite: () => '/event/',
      },
    },
  },
  preview: {
    proxy: {
      '/api/adonix': {
        target: 'https://adonix.hackillinois.org',
        changeOrigin: true,
        rewrite: () => '/event/',
      },
    },
  },
})
