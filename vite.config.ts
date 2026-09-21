// Vite config placeholder
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // firebase/firestore och firebase/functions medvetet uteslutna:
          // de importeras dynamiskt (se services/firestore.ts) och ska
          // hamna i sin egen chunk, inte tvingas in i den som auth behöver
          // eagerly på varje sida (inklusive den oinloggade startsidan).
          firebase: ['firebase/app', 'firebase/auth'],
          charts: ['chart.js', 'react-chartjs-2']
        }
      }
    }
  }
})