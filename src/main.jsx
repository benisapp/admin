import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AdminApp from './admin/AdminApp'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)

// Registra el service worker solo en producción (en desarrollo estorba la caché).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Si ya había un SW controlando, al activarse uno nuevo recargamos una vez
  // para aplicar la versión fresca (evita ver la app vieja tras un deploy).
  const hadController = Boolean(navigator.serviceWorker.controller)
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || refreshing) return
    refreshing = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch(() => {})
  })
}
