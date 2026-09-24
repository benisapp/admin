import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaBan, FaCheck, FaClock, FaUser, FaXmark } from 'react-icons/fa6'
import { APPOINTMENT_STATUS } from '../appointments'
import { STATUS_OPTIONS } from '../appointmentStatus'
import { formatServiceNames } from '../utils/appointmentServices'
import { formatTime12h } from '../utils/dates'
import { Button, SecondaryButton } from './ui'

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

const Options = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

const Option = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid
    ${({ $selected, $color }) => ($selected ? $color : 'var(--color-border-strong)')};
  background: ${({ $selected, $soft }) =>
    $selected ? $soft : 'var(--color-surface)'};
  color: ${({ $selected, $color }) =>
    $selected ? $color : 'var(--color-text)'};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: ${({ $selected, $soft }) =>
      $selected ? $soft : 'var(--color-bg)'};
    border-color: ${({ $color }) => $color};
  }
`

const OptionLabel = styled.span`
  flex: 1;
`

const Check = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
  flex-shrink: 0;
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
`

const CancelAction = styled.button`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-danger);
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-danger-soft);
    border-color: var(--color-danger);
  }
`

function AppointmentStatusModal({
  appointment,
  client,
  services,
  onSave,
  onCancel,
  onClose,
}) {
  const [selected, setSelected] = useState(appointment.status)
  const [saving, setSaving] = useState(false)

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

  const handleSave = async () => {
    if (selected === appointment.status) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await onSave(selected)
      onClose()
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <div>
            <Title>Cambiar estado</Title>
            <Subtitle>{client?.name || 'Cliente'}</Subtitle>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <Body>
          <Summary>
            <SummaryName>{client ? client.name : 'Cliente'}</SummaryName>
            <SummaryLine>
              <FaUser size={12} />
              {formatServiceNames(services)}
            </SummaryLine>
            <SummaryLine>
              <FaClock size={12} />
              {formatTime12h(appointment.startTime)}
              <span aria-hidden="true">–</span>
              {formatTime12h(appointment.endTime)}
            </SummaryLine>
          </Summary>

          <Options>
            {STATUS_OPTIONS.filter(
              (option) =>
                option.value === APPOINTMENT_STATUS.ATTENDED ||
                option.value === APPOINTMENT_STATUS.MISSED,
            ).map((option) => {
              const isSelected = selected === option.value
              const OptionIcon = option.Icon
              return (
                <Option
                  key={option.value}
                  type="button"
                  $selected={isSelected}
                  $color={option.color}
                  $soft={option.soft}
                  onClick={() => setSelected(option.value)}
                >
                  {OptionIcon && <OptionIcon size={14} color={option.color} />}
                  <OptionLabel>{option.label}</OptionLabel>
                  {isSelected && (
                    <Check>
                      <FaCheck size={14} />
                    </Check>
                  )}
                </Option>
              )
            })}
          </Options>

          {appointment.status !== APPOINTMENT_STATUS.CANCELLED && onCancel && (
            <>
              <Divider />
              <CancelAction type="button" onClick={onCancel}>
                <FaBan size={14} />
                Cancelar cita
              </CancelAction>
            </>
          )}
        </Body>

        <Actions>
          <SecondaryButton type="button" onClick={onClose} style={{ flex: 1 }}>
            Cancelar
          </SecondaryButton>
          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ flex: 1 }}
          >
            Guardar
          </Button>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default AppointmentStatusModal
