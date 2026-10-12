// Vite config placeholder
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// App Store-uppgifter. Sätts i .env när appen är publicerad
// (VITE_APP_STORE_ID=1234567890, VITE_APP_STORE_URL=https://apps.apple.com/...).
// Utan dem läggs varken Smart App Banner eller appens strukturerade data in,
// så att sidorna inte påstår att appen finns innan den gör det.
const appStoreHtml = (env: Record<string, string>) => ({
  name: 'iceiq-app-store-html',
  transformIndexHtml(html: string) {
    const id = env.VITE_APP_STORE_ID
    const url = env.VITE_APP_STORE_URL
    if (!id || !url) return html
    const banner = `    <meta name="apple-itunes-app" content="app-id=${id}">\n`
    const jsonLd = `    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: 'Ice IQ',
      operatingSystem: 'iOS',
      applicationCategory: 'SportsApplication',
      installUrl: url,
      downloadUrl: url,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'SquareVerse Group AB' },
    })}
    </script>\n`
    return html.replace('</head>', `${banner}${jsonLd}  </head>`)
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [react(), appStoreHtml(loadEnv(mode, process.cwd(), ''))],
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
}))
