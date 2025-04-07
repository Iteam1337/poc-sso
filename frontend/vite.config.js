import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/oauth2': {
        target: 'http://oauth2-proxy:4180',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://api:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
