import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Backend local: em dev o Vite redireciona /api para a API do Copa_back (porta 3000).
// Em produção (Vercel), defina VITE_API_URL com a URL pública da API, ex:
//   https://copa-back-xi.vercel.app/api
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fontes/*', 'img-vendas/*', 'img-logos-jogadores/*', 'img-avatares/*', 'img-memes/*'],
      manifest: {
        name: 'Mercado da Copa',
        short_name: 'Copa',
        description: 'Compre, venda e troque itens esportivos da Copa do Mundo.',
        theme_color: '#009b3a',
        background_color: '#0b0b0b',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pt-BR',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,jpg,jpeg,webp,avif,svg,mp4}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
  },
})
