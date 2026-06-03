import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 你的後端位置
        changeOrigin: true,
        //rewrite: (path) => path.replace(/^\/api/, '') // 關鍵：這會將 /api/login 變成 /login
      }
    }
  }
})