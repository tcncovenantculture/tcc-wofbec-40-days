/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const cream = '#FBF5EE'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Covenant Culture 40 Days',
        short_name: '40 Days',
        description: '40 days of daily discipleship in pods, leading into WOFBEC 2027.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: cream,
        background_color: cream,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell only: built code, styles, fonts, the logo and icons. Day content and media are not
        // precached (they come from Supabase Storage, not the build).
        globPatterns: ['**/*.{js,css,html,woff2,webp}', 'favicon.ico'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  // Own port, so it never clashes with other local projects on Vite's default 5173
  server: { port: 5271, strictPort: true },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
    environment: 'node',
    // Vitest skips CSS by default; tokens.test.ts reads index.css with ?raw
    css: { include: [/src\/index\.css/] },
  },
})
