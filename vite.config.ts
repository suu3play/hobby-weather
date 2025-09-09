import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/bundle-analysis.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
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
