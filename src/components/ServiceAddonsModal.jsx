import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaPencil, FaPlus, FaTrash, FaXmark } from 'react-icons/fa6'
import { formatPrice } from '../utils/format'
import AddonModal from './AddonModal'
import BarberIcon from './BarberIcon'
import { Alert, Button, IconButton, SecondaryButton, Spinner } from './ui'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
`

const Dialog = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 460px;
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`

const Subtitle = styled.span`
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-border);
    color: var(--color-text);
  }
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  padding: 1.25rem;
`

const AddonList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const AddonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`

const AddonItemIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.875rem;
  height: 1.875rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
`

const AddonItemInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const AddonItemName = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text);
`

const AddonItemMeta = styled.p`
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: var(--color-text-muted);
`

const AddonItemActions = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
`

const AddonUnitTag = styled.span`
  padding: 0.05rem 0.35rem;
  border-radius: var(--radius-full);
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
`

const Empty = styled.p`
  margin: 0;
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text-muted);
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const normalize = (addons) =>
  Array.isArray(addons)
    ? addons.map((addon) => ({
        id: addon.id || globalThis.crypto?.randomUUID?.() || `addon-${Date.now()}`,
        name: addon.name ?? '',
        price: Number(addon.price) || 0,
        duration: Number(addon.duration) || 0,
        points: Number(addon.points) || 0,
        icon: addon.icon ?? '',
        incremental: !!addon.incremental,
      }))
    : []

function ServiceAddonsModal({ service, onSave, onClose }) {
  const [addons, setAddons] = useState(() => normalize(service?.addons))
  const [addonModal, setAddonModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (addonModal) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, addonModal])

  const handleSaveAddon = (addon) => {
    setAddons((prev) => [...prev.filter((item) => item.id !== addon.id), addon])
    setAddonModal(null)
  }

  const removeAddon = (id) => {
    setAddons((prev) => prev.filter((addon) => addon.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(addons)
      onClose()
    } catch (err) {
      console.error(err)
      setError('No se pudieron guardar los adicionales.')
      setSaving(false)
    }
  }

  return (
    <>
      <Overlay onClick={onClose}>
        <Dialog onClick={(e) => e.stopPropagation()}>
          <Header>
            <div>
              <Title>Adicionales</Title>
              <Subtitle>{service?.name}</Subtitle>
            </div>
            <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
              <FaXmark size={16} />
            </CloseButton>
          </Header>

          <Body>
            {error && <Alert tone="error">{error}</Alert>}

            {addons.length === 0 ? (
              <Empty>Este servicio todavía no tiene adicionales.</Empty>
            ) : (
              <AddonList>
                {addons.map((addon) => (
                  <AddonItem key={addon.id}>
                    <AddonItemIcon>
                      {addon.icon ? <BarberIcon id={addon.icon} size={18} /> : '?'}
                    </AddonItemIcon>
                    <AddonItemInfo>
                      <AddonItemName>
                        {addon.name}
                        {addon.incremental && <AddonUnitTag>por uña</AddonUnitTag>}
                      </AddonItemName>
                      <AddonItemMeta>
                        {[
                          addon.price ? formatPrice(addon.price) : '',
                          addon.duration ? `${addon.duration} min` : '',
                          addon.points ? `${addon.points} pts` : '',
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </AddonItemMeta>
                    </AddonItemInfo>
                    <AddonItemActions>
                      <IconButton
                        type="button"
                        title="Editar adicional"
                        aria-label="Editar adicional"
                        onClick={() => setAddonModal({ addon })}
                      >
                        <FaPencil size={13} />
                      </IconButton>
                      <IconButton
                        type="button"
                        $variant="danger"
                        title="Quitar adicional"
                        aria-label="Quitar adicional"
                        onClick={() => removeAddon(addon.id)}
                      >
                        <FaTrash size={13} />
                      </IconButton>
                    </AddonItemActions>
                  </AddonItem>
                ))}
              </AddonList>
            )}

            <SecondaryButton
              type="button"
              onClick={() => setAddonModal({ addon: null })}
            >
              <FaPlus size={12} />
              Agregar adicional
            </SecondaryButton>
          </Body>

          <Actions>
            <SecondaryButton
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{ flex: 1 }}
            >
              Cancelar
            </SecondaryButton>
            <Button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1 }}
            >
              {saving ? (
                <>
                  <Spinner $light />
                  Guardando...
                </>
              ) : (
                'Guardar cambios'
              )}
            </Button>
          </Actions>
        </Dialog>
      </Overlay>

      {addonModal && (
        <AddonModal
          addon={addonModal.addon}
          nested
          onSave={handleSaveAddon}
          onClose={() => setAddonModal(null)}
        />
      )}
    </>
  )
}

export default ServiceAddonsModal
