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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  })
}
