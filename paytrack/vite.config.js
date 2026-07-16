import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-192.png', 'logo-512.png', 'logo-512-maskable.png', 'screenshot-home.png', 'screenshot-bookings.png'],
      manifest: {
        name: 'Flowora',
        short_name: 'Flowora',
        description: 'The business operating system for service businesses',
        theme_color: '#185FA5',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        id: '/',
        // This is where your updated icons array goes:
       icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/screenshot-home.png',
            sizes: '1366x728',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Flowora Desktop Dashboard'
          },
          {
            src: '/screenshot-bookings.png',
            sizes: '1366x728',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Flowora Bookings Overview'
          }
        ]
      },
    }),
  ],
})