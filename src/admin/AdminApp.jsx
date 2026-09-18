import { useState } from 'react'
import styled from 'styled-components'
import { FaScissors } from 'react-icons/fa6'
import Sidebar from '../components/Sidebar'
import BottomNav from '../components/BottomNav'
import Inicio from '../pages/Inicio'
import Clientes from '../pages/Clientes'
import Servicios from '../pages/Servicios'
import Horarios from '../pages/Horarios'

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
  horarios: Horarios,
}

function AdminApp() {
  const [active, setActive] = useState('inicio')
  const [fichaClientId, setFichaClientId] = useState(null)

  const navigate = (id) => {
    setActive(id)
    if (id === 'clientes') setFichaClientId(null)
  }

  const openClientFicha = (clientId) => {
    setFichaClientId(clientId)
    setActive('clientes')
  }

  const View = views[active]

  return (
    <Layout>
      <Sidebar active={active} onNavigate={navigate} />

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
          initialClientId={fichaClientId}
        />
      </Main>

      <BottomNav active={active} onNavigate={navigate} />
    </Layout>
  )
}

export default AdminApp
