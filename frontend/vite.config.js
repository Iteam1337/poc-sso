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
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Log the request being proxied
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // Log the response from the proxy
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy error:', err);
          });
        }
      },
      '/api': {
        target: 'http://api:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
