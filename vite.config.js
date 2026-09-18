import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// La base se puede sobrescribir con la variable BASE_PATH (en .env o en el entorno).
// Por defecto se sirve en la raíz.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: env.BASE_PATH || '/',
  }
})
