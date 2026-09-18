import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  FaCalendarDay,
  FaClock,
  FaMagnifyingGlass,
  FaPencil,
  FaPlus,
  FaTriangleExclamation,
  FaUser,
  FaXmark,
} from 'react-icons/fa6'
import { Alert, Button, ErrorText, Field, Input, Label, SecondaryButton, Spinner } from './ui'
import {
  APPOINTMENT_STATUS,
  createAppointment,
  getAppointmentsByDate,
  updateAppointment,
} from '../appointments'
import { createClient } from '../clients'
import { getSchedule } from '../settings'
import {
  formatDateString,
  formatTime12h,
  generateSlots,
  isSunday,
  overlaps,
} from '../utils/dates'

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
  max-width: 560px;
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
  overflow-y: auto;
  padding: 1.25rem;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
`

const Select = styled.select`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }

  ${({ $invalid }) =>
    $invalid &&
    `
    border-color: var(--color-danger);
  `}
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const SearchWrap = styled.div`
  position: relative;
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-subtle);

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }

  ${({ $invalid }) =>
    $invalid &&
    `
    border-color: var(--color-danger);
  `}
`

const SearchInput = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.55rem 0;
  font-size: 0.9rem;
  color: var(--color-text);

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: var(--color-text-subtle);
  }
`

const ResultsList = styled.div`
  margin-top: 0.375rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  overflow-y: auto;
  max-height: 12.5rem;
  background: var(--color-surface);
`

const ResultItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-soft);
  }

  & + & {
    border-top: 1px solid var(--color-border);
  }
`

const ResultName = styled.span`
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
`

const ResultPhone = styled.span`
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const ResultEmpty = styled.div`
  padding: 0.75rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
`

const NewClientButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0.75rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-soft);
  }
`

const SelectedClient = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
`

const SelectedInfo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  color: var(--color-text);
  font-size: 0.875rem;
`

const ClearClientButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: var(--color-border);
    color: var(--color-text);
  }
`

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(6.25rem, 1fr));
  gap: 0.5rem;
`

const SlotButton = styled.button`
  padding: 0.5rem 0.25rem;
  border: 1px solid
    ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-border-strong)')};
  border-radius: var(--radius-sm);
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'var(--color-surface)')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text)')};
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 600;

  &:hover {
    border-color: var(--color-primary);
  }
`

const SlotLoading = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  color: var(--color-text-muted);
  font-size: 0.85rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

function parseDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function NewAppointmentModal({
  initialDate,
  initialTime,
  initialClientId,
  clients,
  services,
  appointment,
  onCreated,
  onEdited,
  onClose,
}) {
  const isEditing = !!appointment
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const [schedule, setSchedule] = useState(null)
  const [date, setDate] = useState(() => appointment?.date || formatDateString(initialDate || new Date()))
  const [clientId, setClientId] = useState(() => appointment?.clientId || initialClientId || '')
  const [clientQuery, setClientQuery] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)
  const [clientListOpen, setClientListOpen] = useState(false)
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' })
  const [serviceId, setServiceId] = useState(() => appointment?.serviceId || '')
  const [startTime, setStartTime] = useState(() => appointment?.startTime || initialTime || '')
  const [dateAppointments, setDateAppointments] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [errors, setErrors] = useState({})
  const clientSearchRef = useRef(null)

  const activeClients = clients
    .filter((c) => c.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name))
  const activeServices = services.filter((s) => s.active !== false)

  const service = activeServices.find((s) => s.id === serviceId)

  const selectedClient = clients.find((c) => c.id === clientId) || null

  const clientQueryTrim = clientQuery.trim().toLowerCase()
  const clientQueryNormalized = normalizeText(clientQuery)
  const clientQueryDigits = clientQueryNormalized.replace(/\D/g, '')
  const shownClients = !clientQueryTrim
    ? []
    : activeClients
        .filter((c) => {
          const nameMatch = normalizeText(c.name).includes(clientQueryNormalized)
          const phoneMatch =
            clientQueryDigits && String(c.phone || '').includes(clientQueryDigits)
          return nameMatch || phoneMatch
        })
        .slice(0, 10)

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

  useEffect(() => {
    let cancelled = false
    getSchedule()
      .then((s) => {
        if (!cancelled) setSchedule(s)
      })
      .catch((err) => console.error(err))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingSlots(true)
    getAppointmentsByDate(date)
      .then((appts) => {
        if (!cancelled) setDateAppointments(appts)
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (!cancelled) setLoadingSlots(false)
      })
    return () => {
      cancelled = true
    }
  }, [date])

  useEffect(() => {
    if (!clientListOpen) return
    const handler = (e) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target)) {
        setClientListOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [clientListOpen])

  const slots = useMemo(() => {
    if (!service || !schedule) return []
    const all = generateSlots(Number(service.duration), {
      open: schedule.openTime,
      close: schedule.closeTime,
      step: schedule.slotStep || 0,
    })
    const now = new Date()
    const todayStr = formatDateString(now)
    return all.filter((slot) => {
      const taken = dateAppointments.some(
        (a) =>
          a.id !== appointment?.id &&
          a.status !== APPOINTMENT_STATUS.CANCELLED &&
          overlaps(slot.startTime, slot.endTime, a.startTime, a.endTime),
      )
      if (taken) return false
      if (date === todayStr) {
        const [h, m] = slot.startTime.split(':').map(Number)
        const slotDate = new Date(now)
        slotDate.setHours(h, m, 0, 0)
        return slotDate > now
      }
      return true
    })
  }, [service, schedule, dateAppointments, date, appointment])

  const handleDateChange = (event) => {
    setDate(event.target.value)
    setStartTime('')
  }

  const handleServiceChange = (event) => {
    setServiceId(event.target.value)
  }

  const handleClientQueryChange = (event) => {
    setClientQuery(event.target.value)
    setClientId('')
    setClientListOpen(true)
  }

  const handleSelectClient = (client) => {
    setClientId(client.id)
    setClientQuery('')
    setClientListOpen(false)
  }

  const handleClearClient = () => {
    setClientId('')
    setClientQuery('')
    setClientListOpen(false)
  }

  const openNewClient = () => {
    setCreatingNew(true)
    setClientId('')
    setClientQuery('')
    setClientListOpen(false)
    setErrors((prev) => ({ ...prev, clientId: undefined }))
  }

  const cancelNewClient = () => {
    setCreatingNew(false)
    setNewClient({ name: '', phone: '', email: '' })
  }

  const handleNewClientChange = (event) => {
    const { name, value } = event.target
    setNewClient((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (creatingNew) {
      if (!newClient.name.trim()) nextErrors.name = 'El nombre es obligatorio.'
      if (!newClient.phone.trim()) nextErrors.phone = 'El teléfono es obligatorio.'
    } else if (!clientId) {
      nextErrors.clientId = 'Elegí una cliente.'
    }

    if (!serviceId) {
      nextErrors.serviceId = 'Elegí un servicio.'
    }

    if (!date) {
      nextErrors.date = 'Elegí una fecha.'
    } else if (isSunday(parseDate(date))) {
      nextErrors.date = 'Los domingos no hay atención.'
    }

    if (!startTime) {
      nextErrors.startTime = 'Elegí un horario.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSubmitError(null)
    try {
      let resolvedClientId = clientId
      if (creatingNew) {
        const client = await createClient({
          name: newClient.name,
          phone: newClient.phone,
          email: newClient.email,
        })
        resolvedClientId = client.id
      }

      const slot = slots.find((s) => s.startTime === startTime)
      if (!slot) {
        setSubmitError('Este horario ya no está disponible.')
        setSaving(false)
        return
      }

      if (isEditing) {
        await updateAppointment(appointment.id, {
          clientId: resolvedClientId,
          serviceId,
          date,
          startTime,
          endTime: slot.endTime,
        })
        onEdited?.(date)
      } else {
        await createAppointment({
          clientId: resolvedClientId,
          serviceId,
          date,
          startTime,
          endTime: slot.endTime,
        })
        onCreated?.(date)
      }
    } catch (err) {
      console.error(err)
      setSubmitError(isEditing ? 'No se pudo actualizar la cita.' : 'No se pudo agendar la cita.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{isEditing ? 'Editar cita' : 'Nueva cita'}</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <Body>
          <Form onSubmit={handleSubmit}>
            <Field>
              <Label htmlFor="appt-client">Cliente</Label>

              {creatingNew ? (
                <>
                  <Row>
                    <Field>
                      <Label htmlFor="appt-new-name">Nombre</Label>
                      <Input
                        id="appt-new-name"
                        name="name"
                        value={newClient.name}
                        onChange={handleNewClientChange}
                        placeholder="Nombre de la cliente"
                        $invalid={!!errors.name}
                      />
                      {errors.name && <ErrorText>{errors.name}</ErrorText>}
                    </Field>

                    <Field>
                      <Label htmlFor="appt-new-phone">Teléfono</Label>
                      <Input
                        id="appt-new-phone"
                        name="phone"
                        value={newClient.phone}
                        onChange={handleNewClientChange}
                        placeholder="Ej. 300 123 4567"
                        inputMode="tel"
                        $invalid={!!errors.phone}
                      />
                      {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
                    </Field>

                    <Field>
                      <Label htmlFor="appt-new-email">Email (opcional)</Label>
                      <Input
                        id="appt-new-email"
                        name="email"
                        type="email"
                        value={newClient.email}
                        onChange={handleNewClientChange}
                        placeholder="correo@ejemplo.com"
                      />
                    </Field>
                  </Row>
                  <BackButton type="button" onClick={cancelNewClient}>
                    Buscar cliente existente
                  </BackButton>
                </>
              ) : selectedClient ? (
                <SelectedClient>
                  <SelectedInfo>
                    <FaUser size={14} />
                    <span>
                      <strong>{selectedClient.name}</strong>
                      {selectedClient.phone ? ` · ${selectedClient.phone}` : ''}
                    </span>
                  </SelectedInfo>
                  <ClearClientButton
                    type="button"
                    onClick={handleClearClient}
                    aria-label="Quitar cliente"
                  >
                    <FaXmark size={13} />
                  </ClearClientButton>
                </SelectedClient>
              ) : (
                <SearchWrap ref={clientSearchRef}>
                  <SearchBox $invalid={!!errors.clientId}>
                    <FaMagnifyingGlass size={14} />
                    <SearchInput
                      id="appt-client"
                      value={clientQuery}
                      onChange={handleClientQueryChange}
                      onFocus={() => setClientListOpen(true)}
                      placeholder="Buscar por nombre o celular"
                      autoComplete="off"
                    />
                  </SearchBox>

                  {clientListOpen && clientQuery.trim() && (
                    <ResultsList>
                      {shownClients.length > 0 ? (
                        shownClients.map((c) => (
                          <ResultItem
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectClient(c)}
                          >
                            <ResultName>{c.name}</ResultName>
                            {c.phone && <ResultPhone>{c.phone}</ResultPhone>}
                          </ResultItem>
                        ))
                      ) : (
                        <ResultEmpty>
                          Sin coincidencias. Podés crear una nueva cliente.
                        </ResultEmpty>
                      )}
                    </ResultsList>
                  )}
                  <NewClientButton type="button" onClick={openNewClient}>
                    <FaPlus size={12} />
                    Nueva cliente
                  </NewClientButton>
                </SearchWrap>
              )}

              {errors.clientId && <ErrorText>{errors.clientId}</ErrorText>}
            </Field>

            <Field>
              <Label htmlFor="appt-service">Servicio</Label>
              <Select
                id="appt-service"
                value={serviceId}
                onChange={handleServiceChange}
                $invalid={!!errors.serviceId}
              >
                <option value="">Seleccionar servicio</option>
                {activeServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
              {errors.serviceId && <ErrorText>{errors.serviceId}</ErrorText>}
              {activeServices.length === 0 && (
                <ErrorText>No hay servicios activos. Creá uno en la sección Servicios.</ErrorText>
              )}
            </Field>

            <Row>
              <Field>
                <Label htmlFor="appt-date">Fecha</Label>
                <Input
                  id="appt-date"
                  type="date"
                  value={date}
                  min={formatDateString(today)}
                  onChange={handleDateChange}
                  $invalid={!!errors.date}
                />
                {errors.date && <ErrorText>{errors.date}</ErrorText>}
              </Field>
            </Row>

            <Field>
              <Label>Horario</Label>
              {loadingSlots ? (
                <SlotLoading>
                  <Spinner />
                  Cargando horarios...
                </SlotLoading>
              ) : service && slots.length > 0 ? (
                <SlotGrid>
                  {slots.map((slot) => (
                    <SlotButton
                      key={slot.startTime}
                      type="button"
                      $active={startTime === slot.startTime}
                      onClick={() => setStartTime(slot.startTime)}
                    >
                      <FaClock size={11} /> {formatTime12h(slot.startTime)}
                    </SlotButton>
                  ))}
                </SlotGrid>
              ) : (
                <SlotLoading>
                  {service
                    ? 'No hay horarios disponibles para este día.'
                    : startTime
                      ? `Horario seleccionado: ${formatTime12h(startTime)}`
                      : 'Seleccioná un servicio para ver los horarios.'}
                </SlotLoading>
              )}
              {errors.startTime && <ErrorText>{errors.startTime}</ErrorText>}
            </Field>

            {submitError && (
              <Field>
                <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
                  {submitError}
                </Alert>
              </Field>
            )}
          </Form>
        </Body>

        <Actions>
          <SecondaryButton type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </SecondaryButton>
          <Button
            type="button"
            disabled={saving}
            style={{ flex: 1 }}
            onClick={handleSubmit}
          >
            {saving ? (
              <>
                <Spinner $light />
                {isEditing ? 'Guardando...' : 'Agendando...'}
              </>
            ) : isEditing ? (
              <>
                <FaPencil size={15} />
                Guardar cambios
              </>
            ) : (
              <>
                <FaCalendarDay size={15} />
                Agendar cita
              </>
            )}
          </Button>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default NewAppointmentModal
