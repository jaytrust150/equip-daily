import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',  // Changed from autoUpdate to prompt user
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
            urlPattern: /^https:\/\/api\.bible\/.*/,  // Only cache API.Bible calls
            handler: 'NetworkFirst',
            options: { 
              cacheName: 'bible-api-cache', 
              expiration: { maxEntries: 50, maxAgeSeconds: 3600 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseio\.com\/.*/,  // Cache Firebase
            handler: 'NetworkFirst',
            options: { 
              cacheName: 'firebase-cache', 
              expiration: { maxEntries: 20, maxAgeSeconds: 300 }
            }
          }
        ],
        // Exclude development and hot reload files from cache
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
  ]
})