import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  appType: 'spa',
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  preview: {
    host: true,
    allowedHosts: ['student-alumni-portal-2.onrender.com']
  }
})