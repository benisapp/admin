import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// La base se puede sobrescribir con la variable BASE_PATH (en .env o en el entorno).
// En desarrollo se sirve en la raíz; en producción se usan rutas relativas ('./')
// para que la app funcione en cualquier subruta de GitHub Pages.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    base: env.BASE_PATH || (mode === 'production' ? './' : '/'),
  }
})
