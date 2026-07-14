import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // 允许局域网访问
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9400',
        changeOrigin: true,
      },
    },
  },
})
