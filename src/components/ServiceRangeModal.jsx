import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaCalendarDays, FaXmark } from 'react-icons/fa6'
import { formatMonthDayLong, monthNameLong } from '../utils/format'
import { Button, ErrorText, Field, Label, SecondaryButton, Spinner } from './ui'

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
  padding: 0.875rem 1rem;
  background: var(--color-info-soft);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
  color: var(--color-info);
  font-size: 0.85rem;
`

const RangeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const Arrow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
`

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`

const Select = styled.select`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }
`

const DateHint = styled.p`
  margin: 0.375rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function parseMD(md) {
  if (!md || typeof md !== 'string') return { month: '', day: '' }
  const parts = md.split('-')
  if (parts.length !== 2) return { month: '', day: '' }
  const [month, day] = parts.map(Number)
  if (!month || !day) return { month: '', day: '' }
  return { month, day }
}

function toMD(month, day) {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function ServiceRangeModal({ service, onSave, onClose }) {
  const fromParts = parseMD(service?.activeFrom)
  const toParts = parseMD(service?.activeUntil)
  const [fromMonth, setFromMonth] = useState(fromParts.month)
  const [fromDay, setFromDay] = useState(fromParts.day)
  const [toMonth, setToMonth] = useState(toParts.month)
  const [toDay, setToDay] = useState(toParts.day)
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

  const fromMD = fromMonth && fromDay ? toMD(fromMonth, fromDay) : null
  const toMDValue = toMonth && toDay ? toMD(toMonth, toDay) : null

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!fromMD && !toMDValue) {
      setError('Ingresá al menos una fecha (desde o hasta).')
      return
    }

    setSaving(true)
    try {
      await onSave({ activeFrom: fromMD, activeUntil: toMDValue })
      onClose()
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar el rango de fechas.')
      setSaving(false)
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <div>
            <Title>Activar por rango</Title>
            <Subtitle>{service?.name}</Subtitle>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <form onSubmit={handleSubmit}>
          <Body>
            <Summary>
              El servicio estará disponible para agendar solo dentro de las fechas
              indicadas. El rango se repite todos los años (no se elige año).
            </Summary>

            <RangeRow>
              <Field>
                <Label>Desde</Label>
                <GridRow>
                  <Select
                    value={fromMonth}
                    onChange={(e) => setFromMonth(Number(e.target.value))}
                    aria-label="Mes desde"
                  >
                    <option value="">Mes</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {monthNameLong(m)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={fromDay}
                    onChange={(e) => setFromDay(Number(e.target.value))}
                    aria-label="Día desde"
                  >
                    <option value="">Día</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </GridRow>
                {fromMD && <DateHint>{formatMonthDayLong(fromMD)}</DateHint>}
              </Field>

              <Arrow>→</Arrow>

              <Field>
                <Label>Hasta</Label>
                <GridRow>
                  <Select
                    value={toMonth}
                    onChange={(e) => setToMonth(Number(e.target.value))}
                    aria-label="Mes hasta"
                  >
                    <option value="">Mes</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {monthNameLong(m)}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={toDay}
                    onChange={(e) => setToDay(Number(e.target.value))}
                    aria-label="Día hasta"
                  >
                    <option value="">Día</option>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </GridRow>
                {toMDValue && <DateHint>{formatMonthDayLong(toMDValue)}</DateHint>}
              </Field>
            </RangeRow>

            {error && <ErrorText>{error}</ErrorText>}
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
            <Button type="submit" disabled={saving} style={{ flex: 1 }}>
              {saving ? (
                <>
                  <Spinner $light />
                  Guardando...
                </>
              ) : (
                <>
                  <FaCalendarDays size={14} />
                  Guardar rango
                </>
              )}
            </Button>
          </Actions>
        </form>
      </Dialog>
    </Overlay>
  )
}

export default ServiceRangeModal