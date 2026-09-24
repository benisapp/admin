import { useEffect } from 'react'
import styled from 'styled-components'
import { FaXmark } from 'react-icons/fa6'
import { DangerButton, SecondaryButton, Spinner } from './ui'

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
  max-width: 400px;
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
  padding: 1.25rem;
`

const Message = styled.p`
  margin: 0;
  font-size: 0.925rem;
  line-height: 1.5;
  color: var(--color-text);
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  loading = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{title}</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <Body>
          <Message>{message}</Message>
        </Body>

        <Actions>
          <SecondaryButton
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1 }}
          >
            Cancelar
          </SecondaryButton>
          <DangerButton type="button" onClick={onConfirm} disabled={loading} style={{ flex: 1 }}>
            {loading ? (
              <>
                <Spinner />
                Desactivando...
              </>
            ) : (
              confirmLabel
            )}
          </DangerButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default ConfirmModal
