import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaScissors } from 'react-icons/fa6'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import Inicio from '../pages/Inicio'
import Clientes from '../pages/Clientes'
import Servicios from '../pages/Servicios'
import Descuentos from '../pages/Descuentos'
import Configuracion from '../pages/Configuracion'

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`

const Main = styled.main`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;

  @media (max-width: 767px) {
    padding-bottom: 4rem;
  }
`

const Topbar = styled.header`
  display: none;

  @media (max-width: 767px) {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    z-index: 20;
  }
`

const TopbarTitle = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.1rem;
  letter-spacing: 0.02em;
  color: var(--color-primary);
`

const views = {
  inicio: Inicio,
  clientes: Clientes,
  servicios: Servicios,
  descuentos: Descuentos,
  configuracion: Configuracion,
}

// La navegación se refleja en el hash de la URL (#/inicio, #/clientes,
// #/clientes/<id>) para que funcionen los botones atrás/adelante del
// navegador y del sistema en la PWA instalada. Al usar hash (y no rutas)
// no hace falta configuración especial en GitHub Pages.
const toHash = (view, clientId) =>
  clientId ? `#/${view}/${encodeURIComponent(clientId)}` : `#/${view}`

const readLocation = () => {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/')
  const view = views[parts[0]] ? parts[0] : 'inicio'
  const clientId =
    view === 'clientes' && parts[1] ? decodeURIComponent(parts[1]) : null
  return { view, clientId }
}

function AdminApp() {
  const [location, setLocation] = useState(readLocation)

  useEffect(() => {
    // Siembra el historial con una entrada base (#/inicio) para que, en una
    // carga directa con hash (p. ej. al abrir la PWA en una ficha), el botón
    // atrás no saque al usuario de la app.
    if (!window.history.state?.seeded) {
      const current = readLocation()
      window.history.replaceState({ seeded: true }, '', toHash('inicio'))
      const currentHash = toHash(current.view, current.clientId)
      if (currentHash !== toHash('inicio')) {
        window.history.pushState({ seeded: true }, '', currentHash)
      }
    }

    const onPopState = () => setLocation(readLocation())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (id) => {
    if (id === location.view && !location.clientId) return
    window.history.pushState(null, '', toHash(id))
    setLocation({ view: id, clientId: null })
  }

  const openClientFicha = (clientId) => {
    window.history.pushState(null, '', toHash('clientes', clientId))
    setLocation({ view: 'clientes', clientId })
  }

  const View = views[location.view]

  return (
    <Layout>
      <Sidebar active={location.view} onNavigate={navigate} />

      <Main>
        <Topbar>
          <TopbarTitle>
            <FaScissors size={16} color="var(--color-primary)" />
            Benis
          </TopbarTitle>
        </Topbar>

        <View
          onNavigate={navigate}
          onOpenClient={openClientFicha}
          onSelectClient={openClientFicha}
          initialClientId={location.clientId}
        />
      </Main>

      <BottomNav active={location.view} onNavigate={navigate} />
    </Layout>
  )
}

export default AdminApp
