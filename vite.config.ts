import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? '/PINGPONG/' : '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: true,
  },
}))
