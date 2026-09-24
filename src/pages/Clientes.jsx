import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  FaCircleCheck,
  FaMagnifyingGlass,
  FaPlus,
  FaTriangleExclamation,
  FaUser,
  FaUsers,
} from 'react-icons/fa6'
import { fetchClients, normalizePhone } from '../clients'
import { fetchServices } from '../services'
import { fetchDiscounts } from '../discounts'
import NewAppointmentModal from '../components/NewAppointmentModal'
import NewClientModal from '../components/NewClientModal'
import ClientFicha from '../components/ClientFicha'
import {
  Alert,
  Button,
  EmptyState,
  Field,
  Input,
  Label,
  Spinner,
} from '../components/ui'

const Wrapper = styled.div`
  flex: 1;
  padding: 2rem;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 767px) {
    padding: 1.25rem 1rem;
  }
`

const PageHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: var(--color-text);
  padding-left: 0.75rem;
  border-left: 3px solid var(--color-primary);
`

const Subtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
`

const Notice = styled.div`
  margin-bottom: 1rem;
`

const ResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
`

const ResultItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--shadow-sm);
  }
`

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
`

const ResultInfo = styled.div`
  min-width: 0;
`

const ResultName = styled.span`
  display: block;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ResultPhone = styled.span`
  display: block;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
`

const ErrorWrap = styled.div`
  padding: 2rem 1rem;
`

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatPhone(phone) {
  if (!phone) return ''
  const digits = String(phone)
  return digits.length === 10
    ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    : digits
}

function Clientes({ initialClientId, onSelectClient }) {
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || null)
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [query, setQuery] = useState('')
  const [showNewAppt, setShowNewAppt] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [fichaReload, setFichaReload] = useState(0)
  const [notice, setNotice] = useState(null)

  const noticeTimer = useRef(null)

  const showNotice = (tone, text) => {
    setNotice({ tone, text })
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 4000)
  }

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [clientList, serviceList, discountList] = await Promise.all([
          fetchClients(),
          fetchServices(),
          fetchDiscounts(),
        ])
        if (cancelled) return
        setClients(clientList)
        setServices(serviceList)
        setDiscounts(discountList)
      } catch (err) {
        console.error(err)
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  // Sincroniza la ficha con la URL cuando el usuario navega con
  // los botones atrás/adelante del navegador.
  useEffect(() => {
    setSelectedClientId(initialClientId || null)
  }, [initialClientId])

  const selectedClient = clients.find((c) => c.id === selectedClientId) || null

  const queryTrim = query.trim().toLowerCase()
  const queryNormalized = normalizeText(query)
  const queryDigits = queryNormalized.replace(/\D/g, '')
  const results = !queryTrim
    ? []
    : clients
        .filter((c) => {
          const nameMatch = normalizeText(c.name).includes(queryNormalized)
          const phoneMatch =
            queryDigits && normalizePhone(c.phone).includes(queryDigits)
          return nameMatch || phoneMatch
        })
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 50)

  const handleCreated = () => {
    setShowNewAppt(false)
    setFichaReload((t) => t + 1)
    showNotice('success', 'Cita creada correctamente.')
  }

  const handleClientCreated = async (client) => {
    setShowNewClient(false)
    try {
      setClients(await fetchClients())
    } catch (err) {
      console.error(err)
    }
    showNotice('success', 'Cliente creada correctamente.')
    openFicha(client.id)
  }

  const handleBack = () => {
    window.history.back()
  }

  const openFicha = (clientId) => {
    setSelectedClientId(clientId)
    onSelectClient?.(clientId)
  }

  return (
    <Wrapper>
      <PageHeader>
        <div>
          <Title>Clientes</Title>
          <Subtitle>Consultá la ficha y el historial de tus clientes.</Subtitle>
        </div>
        {!selectedClient && (
          <Button type="button" onClick={() => setShowNewClient(true)}>
            <FaPlus size={14} />
            Nuevo cliente
          </Button>
        )}
      </PageHeader>

      {notice && (
        <Notice>
          <Alert tone={notice.tone} icon={<FaCircleCheck size={16} />}>
            {notice.text}
          </Alert>
        </Notice>
      )}

      {selectedClient ? (
        <ClientFicha
          key={selectedClient.id}
          client={selectedClient}
          services={services}
          reloadToken={fichaReload}
          backLabel="Volver"
          onBack={handleBack}
          onNewAppointment={() => setShowNewAppt(true)}
        />
      ) : loading ? (
        <Loading>
          <Spinner />
          Cargando clientes...
        </Loading>
      ) : loadError ? (
        <ErrorWrap>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudieron cargar los clientes.
          </Alert>
        </ErrorWrap>
      ) : (
        <>
          <Field>
            <Label htmlFor="clients-search">Buscar por nombre o celular</Label>
            <Input
              id="clients-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ej. María o 3001234567"
              autoFocus
            />
          </Field>

          {queryTrim ? (
            results.length > 0 ? (
              <ResultsList>
                {results.map((c) => (
                  <ResultItem
                    key={c.id}
                    type="button"
                    onClick={() => openFicha(c.id)}
                  >
                    <Avatar>
                      <FaUser size={16} />
                    </Avatar>
                    <ResultInfo>
                      <ResultName>{c.name}</ResultName>
                      {c.phone && <ResultPhone>{formatPhone(c.phone)}</ResultPhone>}
                    </ResultInfo>
                  </ResultItem>
                ))}
              </ResultsList>
            ) : (
              <EmptyState
                icon={<FaMagnifyingGlass size={26} />}
                title="Sin resultados"
                description="No encontramos clientes con ese nombre o celular."
              />
            )
          ) : (
            <EmptyState
              icon={<FaUsers size={26} />}
              title="Buscá un cliente"
              description="Escribí el nombre o el celular para ver su ficha."
            />
          )}
        </>
      )}

      {showNewAppt && selectedClient && (
        <NewAppointmentModal
          initialClientId={selectedClient.id}
          initialDate={new Date()}
          clients={clients}
          services={services}
          discounts={discounts}
          onCreated={handleCreated}
          onClose={() => setShowNewAppt(false)}
        />
      )}

      {showNewClient && (
        <NewClientModal
          onCreated={handleClientCreated}
          onClose={() => setShowNewClient(false)}
        />
      )}
    </Wrapper>
  )
}

export default Clientes
