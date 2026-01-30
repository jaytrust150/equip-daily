import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.bible\/.*/,
            handler: 'NetworkFirst',
            options: { 
              cacheName: 'bible-api-cache', 
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/,
            handler: 'NetworkFirst',
            options: { 
              cacheName: 'firebase-cache', 
              expiration: { maxEntries: 20, maxAgeSeconds: 300 }
            }
          }
        ],
        navigateFallbackDenylist: [/^\/api/, /^\/__/]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Equip Daily',
        short_name: 'Equip Daily',
        description: 'For the equipping of the saints.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('@sentry')) {
              return 'sentry-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 500
  }
})
