import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://port-0-vibe-shoppingmall-demo-mtpocu267fb89ba4.sel3.cloudtype.app/',
        changeOrigin: true,
      },
    },
  },
})
