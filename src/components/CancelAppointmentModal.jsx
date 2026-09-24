import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaClock, FaTriangleExclamation, FaUser, FaXmark } from 'react-icons/fa6'
import { formatServiceNames } from '../utils/appointmentServices'
import { formatDateLong, formatTime12h } from '../utils/dates'
import { Alert, DangerButton, SecondaryButton, Spinner } from './ui'

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
  max-width: 420px;
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

  &:hover {
    background: var(--color-border);
    color: var(--color-text);
  }
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
`

const Summary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
`

const SummaryName = styled.p`
  margin: 0;
  font-weight: 800;
  color: var(--color-text);
  font-size: 1rem;
`

const SummaryLine = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
`

const Hint = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

function CancelAppointmentModal({ appointment, client, services, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  const handleConfirm = async () => {
    setSaving(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error(err)
      setError('No se pudo cancelar la cita. Intentalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>¿Cancelar esta cita?</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <Body>
          {error && (
            <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
              {error}
            </Alert>
          )}

          <Summary>
            <SummaryName>{client ? client.name : 'Cliente'}</SummaryName>
            <SummaryLine>
              <FaUser size={12} />
              {formatServiceNames(services)}
            </SummaryLine>
            <SummaryLine>
              <FaClock size={12} />
              {formatDateLong(appointment.date)}
              <span aria-hidden="true">·</span>
              {formatTime12h(appointment.startTime)}
              <span aria-hidden="true">–</span>
              {formatTime12h(appointment.endTime)}
            </SummaryLine>
          </Summary>

          <Hint>
            Al cancelar esta cita, el horario volverá a quedar disponible.
          </Hint>
        </Body>

        <Actions>
          <SecondaryButton
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1 }}
          >
            Volver
          </SecondaryButton>
          <DangerButton
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? (
              <>
                <Spinner />
                Cancelando...
              </>
            ) : (
              'Sí, cancelar cita'
            )}
          </DangerButton>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default CancelAppointmentModal
