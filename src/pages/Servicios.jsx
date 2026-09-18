import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { FaCircleCheck, FaPlus, FaTriangleExclamation } from 'react-icons/fa6'
import ServiceForm from '../components/ServiceForm'
import ServiceList from '../components/ServiceList'
import { Alert, Button, Spinner } from '../components/ui'
import {
  createService,
  fetchServices,
  setServiceActive,
  updateService,
} from '../services'

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

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
`

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
`

function Servicios() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)

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

  const loadServices = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      setServices(await fetchServices())
    } catch (err) {
      console.error(err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    loadServices()
  }, [])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await createService(data)
      setShowForm(false)
      await loadServices()
      showNotice('success', 'Servicio creado correctamente.')
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo crear el servicio.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data) => {
    setSaving(true)
    try {
      await updateService(editing.id, data)
      setEditing(null)
      setShowForm(false)
      await loadServices()
      showNotice('success', 'Servicio actualizado correctamente.')
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo editar el servicio.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (service) => {
    if (service.active) {
      const ok = window.confirm(
        `¿Desactivar el servicio "${service.name}"?`,
      )
      if (!ok) return
    }

    try {
      await setServiceActive(service.id, !service.active)
      await loadServices()
      showNotice(
        'success',
        service.active ? 'Servicio desactivado.' : 'Servicio activado.',
      )
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo actualizar el servicio.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (service) => {
    setEditing(service)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  return (
    <Wrapper>
      <PageHeader>
        <div>
          <Title>Servicios</Title>
          <Subtitle>Administrá los servicios de tu barbería y salón.</Subtitle>
        </div>
        {!showForm && (
          <Button type="button" onClick={openCreate}>
            <FaPlus size={14} />
            Nuevo servicio
          </Button>
        )}
      </PageHeader>

      {notice && (
        <Notice>
          <Alert
            tone={notice.tone}
            icon={
              notice.tone === 'success' ? (
                <FaCircleCheck size={16} />
              ) : (
                <FaTriangleExclamation size={16} />
              )
            }
          >
            {notice.text}
          </Alert>
        </Notice>
      )}

      {showForm && (
        <ServiceForm
          initialValues={editing ?? {}}
          submitLabel={editing ? 'Guardar cambios' : 'Crear servicio'}
          submitting={saving}
          onSubmit={editing ? handleEdit : handleCreate}
          onCancel={closeForm}
        />
      )}

      {loading ? (
        <Loading>
          <Spinner />
          Cargando servicios...
        </Loading>
      ) : loadError ? (
        <ErrorWrap>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudieron cargar los servicios.
          </Alert>
          <Button type="button" onClick={loadServices}>
            Reintentar
          </Button>
        </ErrorWrap>
      ) : (
        <ServiceList
          services={services}
          onEdit={openEdit}
          onToggleActive={handleToggleActive}
          onCreate={openCreate}
        />
      )}
    </Wrapper>
  )
}

export default Servicios
