import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In dev, /api/* is forwarded to the Express server: same origin for the browser, so no CORS.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
