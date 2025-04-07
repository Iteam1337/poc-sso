import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/oauth2': {
        target: 'http://oauth2-proxy:4180',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://api:3001',
        changeOrigin: true,
      }
    }
  }
})
