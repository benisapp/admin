import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { FaCircleCheck, FaPlus, FaTag, FaTriangleExclamation } from 'react-icons/fa6'
import ConfirmModal from '../components/ConfirmModal'
import DiscountForm from '../components/DiscountForm'
import DiscountList from '../components/DiscountList'
import Tabs from '../components/Tabs'
import { Alert, Button, Spinner } from '../components/ui'
import {
  createDiscount,
  ensureBirthdayDiscount,
  fetchDiscounts,
  setDiscountActive,
  updateDiscount,
} from '../discounts'
import { fetchServices } from '../services'

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
  margin-top: 0.5rem;
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

function Descuentos() {
  const [discounts, setDiscounts] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deactivating, setDeactivating] = useState(null)
  const [deactivatingLoading, setDeactivatingLoading] = useState(false)
  const [tab, setTab] = useState('active')

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

  const loadDiscounts = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      // El descuento de cumpleaños es del sistema: se asegura que exista.
      await ensureBirthdayDiscount()
      const [discountsData, servicesData] = await Promise.all([
        fetchDiscounts(),
        fetchServices(),
      ])
      setDiscounts(discountsData)
      setServices(servicesData)
    } catch (err) {
      console.error(err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    loadDiscounts()
  }, [])

  const handleCreate = async (data) => {
    setSaving(true)
    try {
      await createDiscount(data)
      setShowForm(false)
      await loadDiscounts()
      showNotice('success', 'Descuento creado correctamente.')
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo crear el descuento.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data) => {
    setSaving(true)
    try {
      await updateDiscount(editing.id, data)
      setEditing(null)
      setShowForm(false)
      await loadDiscounts()
      showNotice('success', 'Descuento actualizado correctamente.')
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo editar el descuento.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (discount) => {
    if (discount.active) {
      setDeactivating(discount)
      return
    }

    try {
      await setDiscountActive(discount.id, true)
      await loadDiscounts()
      showNotice('success', 'Descuento activado.')
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo actualizar el descuento.')
    }
  }

  const handleConfirmDeactivate = async () => {
    const discount = deactivating
    setDeactivatingLoading(true)
    try {
      await setDiscountActive(discount.id, false)
      await loadDiscounts()
      setDeactivating(null)
      setDeactivatingLoading(false)
      showNotice('success', 'Descuento desactivado.')
    } catch (err) {
      console.error(err)
      setDeactivatingLoading(false)
      showNotice('error', 'No se pudo actualizar el descuento.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setShowForm(true)
  }

  const openEdit = (discount) => {
    setEditing(discount)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
  }

  const activeDiscounts = discounts.filter((discount) => discount.active !== false)
  const inactiveDiscounts = discounts.filter((discount) => discount.active === false)
  const visibleDiscounts = tab === 'active' ? activeDiscounts : inactiveDiscounts

  return (
    <Wrapper>
      <PageHeader>
        <div>
          <Title>Descuentos</Title>
          <Subtitle>Administrá los descuentos porcentuales de tu barbería.</Subtitle>
        </div>
        {!showForm && (
          <Button type="button" onClick={openCreate}>
            <FaPlus size={14} />
            Nuevo descuento
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
        <DiscountForm
          initialValues={editing ?? {}}
          services={services}
          submitLabel={editing ? 'Guardar cambios' : 'Crear descuento'}
          submitting={saving}
          onSubmit={editing ? handleEdit : handleCreate}
          onCancel={closeForm}
        />
      )}

      {loading ? (
        <Loading>
          <Spinner />
          Cargando descuentos...
        </Loading>
      ) : loadError ? (
        <ErrorWrap>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudieron cargar los descuentos.
          </Alert>
          <Button type="button" onClick={loadDiscounts}>
            Reintentar
          </Button>
        </ErrorWrap>
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { key: 'active', label: 'Activos', count: activeDiscounts.length },
              { key: 'inactive', label: 'Inactivos', count: inactiveDiscounts.length },
            ]}
          />
          <DiscountList
            discounts={visibleDiscounts}
            tab={tab}
            services={services}
            onEdit={openEdit}
            onToggleActive={handleToggleActive}
            onCreate={openCreate}
          />
        </>
      )}

      {deactivating && (
        <ConfirmModal
          title="Desactivar descuento"
          message={`¿Desactivar el descuento "${deactivating.title}"?`}
          confirmLabel="Desactivar"
          loading={deactivatingLoading}
          onConfirm={handleConfirmDeactivate}
          onClose={() => setDeactivating(null)}
        />
      )}
    </Wrapper>
  )
}

export default Descuentos