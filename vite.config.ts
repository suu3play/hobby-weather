import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '趣味予報',
        short_name: '趣味予報',
        description: '天気に基づく趣味おすすめアプリ',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
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
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        globPatterns: ['**/*.{js,css,html,ico,png}'], // SVGを除外
        globIgnores: ['**/hobbyWeather.svg'], // 大きなSVGファイルを明示的に除外
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'weather-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              plugins: [
                {
                  cacheKeyWillBeUsed: async ({ request }: { request: Request }) => {
                    return `${request.url}?timestamp=${Math.floor(Date.now() / (1000 * 60 * 60))}`; // キャッシュを1時間ごとに更新
                  }
                }
              ]
            }
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // node_modules の依存関係を分類
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('dexie')) {
              return 'vendor-storage';
            }
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            return 'vendor';
          }
          
          // 各タブのコンポーネントを別チャンクに分割
          if (id.includes('/components/recommendation/')) {
            return 'chunk-recommendations';
          }
          if (id.includes('/components/weather/')) {
            return 'chunk-weather';
          }
          if (id.includes('/components/hobby/')) {
            return 'chunk-hobbies';
          }
          if (id.includes('/components/settings/')) {
            return 'chunk-settings';
          }
          
          // サービス層を別チャンクに
          if (id.includes('/services/')) {
            return 'chunk-services';
          }
        }
      }
    }
  }
})
