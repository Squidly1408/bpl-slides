import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'BPL Slides',
        short_name: 'BPL Slides',
        description:
          'Build and present a Big Picture Learning exhibition slideshow, entirely in your browser — designed for Big Picture Learning, not currently an official BPLA product.',
        theme_color: '#2c4870',
        background_color: '#f5f6f9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Default globs miss .mjs — that's the PDF.js worker chunk, needed
        // for offline PDF auto-fill. It's also ~2.2MB, above workbox's 2MB
        // default cap, hence the raised maximumFileSizeToCacheInBytes.
        globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        // Without this, Rollup's automatic chunking merged the (dynamically
        // imported, ~2000-icon) Font Awesome set into the same chunk as
        // three.js — meaning adding a single icon to a slide silently
        // dragged in the whole 3D-mesh-viewer bundle too, and vice versa.
        // Forcing them into their own named chunks keeps each one lazy on
        // its own terms.
        manualChunks: (id) => {
          if (id.includes('@fortawesome')) return 'fontawesome'
          if (id.includes('node_modules/three')) return 'three'
        },
      },
    },
  },
})
