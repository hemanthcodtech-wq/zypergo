import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all network interfaces
    allowedHosts: 'all', // Allow any host/IP/subdomain
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'https://zypergo.com',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_URL || 'https://zypergo.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
