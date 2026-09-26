import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaClock,
  FaEnvelope,
  FaPhone,
  FaPlus,
  FaStar,
  FaTriangleExclamation,
  FaUser,
} from 'react-icons/fa6'
import { APPOINTMENT_STATUS, getAppointmentsByClient } from '../appointments'
import { STATUS_OPTIONS } from '../appointmentStatus'
import { apptFullNames } from '../utils/appointmentServices'
import { formatDateLong, formatTime12h, isSlotInPast } from '../utils/dates'
import { Alert, Button, EmptyState, Spinner } from './ui'

const STATUS_META = STATUS_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option }),
  {},
)

function formatPhone(phone) {
  if (!phone) return ''
  const digits = String(phone)
  return digits.length === 10
    ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    : digits
}

const BackLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1rem;

  &:hover {
    color: var(--color-text);
  }
`

const ClientHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
`

const Avatar = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 50%;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
`

const ClientName = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  color: var(--color-text);
  overflow-wrap: anywhere;
`

const ContactLine = styled.p`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`

const PointsBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.5rem;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  background: var(--color-warning-soft, var(--color-info-soft));
  color: var(--color-warning, var(--color-info));
`

const ActionsBar = styled.div`
  margin-bottom: 1.5rem;
`

const SectionTitle = styled.h2`
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: var(--color-text);
  padding-left: 0.625rem;
  border-left: 3px solid var(--color-primary);
`

const LoadingBlock = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
`

const ErrorBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem;
`

const NextCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.125rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.5rem;
`

const NextDate = styled.p`
  margin: 0;
  font-weight: 800;
  color: var(--color-primary);
  font-size: 1rem;
  text-transform: capitalize;
`

const NextLine = styled.p`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
`

const NextService = styled.p`
  margin: 0;
  font-weight: 600;
  color: var(--color-text);
`

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`

const HistoryItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  box-shadow: var(--shadow-sm);
`

const HistoryDate = styled.span`
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--color-text);
  text-transform: capitalize;
  min-width: 9rem;
`

const HistoryInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-width: 0;
`

const HistoryService = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const HistoryTime = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
`

const StatusPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid ${({ $color }) => $color || 'var(--color-border-strong)'};
  color: ${({ $color }) => $color || 'var(--color-text-muted)'};
  background: ${({ $soft }) => $soft || 'var(--color-surface)'};
  white-space: nowrap;
  flex-shrink: 0;
`

function StatusLabel({ status }) {
  const meta = STATUS_META[status]
  const StatusIcon = meta?.Icon
  return (
    <StatusPill $color={meta?.color} $soft={meta?.soft}>
      {StatusIcon ? <StatusIcon size={11} /> : null}
      {meta ? meta.label : 'Sin estado'}
    </StatusPill>
  )
}

function ClientFicha({
  client,
  services,
  reloadToken,
  backLabel,
  onBack,
  onNewAppointment,
}) {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    getAppointmentsByClient(client.id)
      .then((appts) => {
        if (!cancelled) setAppointments(appts)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [client.id, reloadToken, retryToken])

  const serviceMap = useMemo(
    () => services.reduce((map, s) => ({ ...map, [s.id]: s }), {}),
    [services],
  )

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.status !== APPOINTMENT_STATUS.CANCELLED &&
            !isSlotInPast(a.date, a.startTime),
        )
        .sort((a, b) =>
          `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`),
        ),
    [appointments],
  )

  const history = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            a.status === APPOINTMENT_STATUS.CANCELLED ||
            isSlotInPast(a.date, a.startTime),
        )
        .sort((a, b) =>
          `${b.date}${b.startTime}`.localeCompare(`${a.date}${a.startTime}`),
        ),
    [appointments],
  )

  const nextAppt = upcoming[0]

  const renderBody = () => {
    if (loading) {
      return (
        <LoadingBlock>
          <Spinner />
          Cargando citas...
        </LoadingBlock>
      )
    }

    if (loadError) {
      return (
        <ErrorBlock>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudieron cargar las citas del cliente.
          </Alert>
          <Button type="button" onClick={() => setRetryToken((t) => t + 1)}>
            Reintentar
          </Button>
        </ErrorBlock>
      )
    }

    return (
      <>
        <SectionTitle>Próxima cita</SectionTitle>
        {nextAppt ? (
          <NextCard>
            <NextDate>{formatDateLong(nextAppt.date)}</NextDate>
            <NextLine>
              <FaClock size={13} />
              {formatTime12h(nextAppt.startTime)} -{' '}
              {formatTime12h(nextAppt.endTime)}
            </NextLine>
            <NextService>
              {apptFullNames(nextAppt, serviceMap)}
            </NextService>
            <StatusLabel status={nextAppt.status} />
          </NextCard>
        ) : (
          <EmptyState
            icon={<FaCalendarCheck size={26} />}
            title="No hay próximas citas"
            description="Este cliente no tiene citas futuras agendadas."
          />
        )}

        <SectionTitle>Historial</SectionTitle>
        {history.length === 0 ? (
          <EmptyState
            icon={<FaClock size={26} />}
            title="Sin historial"
            description="Todavía no hay citas anteriores para este cliente."
          />
        ) : (
          <HistoryList>
            {history.map((appt) => (
              <HistoryItem key={appt.id}>
                <HistoryDate>{formatDateLong(appt.date)}</HistoryDate>
                <HistoryInfo>
                  <HistoryService>
                    {apptFullNames(appt, serviceMap)}
                  </HistoryService>
                  <HistoryTime>
                    <FaClock size={11} />
                    {formatTime12h(appt.startTime)} -{' '}
                    {formatTime12h(appt.endTime)}
                  </HistoryTime>
                </HistoryInfo>
                <StatusLabel status={appt.status} />
              </HistoryItem>
            ))}
          </HistoryList>
        )}
      </>
    )
  }

  return (
    <div>
      <BackLink type="button" onClick={onBack}>
        <FaArrowLeft size={13} />
        {backLabel}
      </BackLink>

      <ClientHeader>
        <Avatar>
          <FaUser size={22} />
        </Avatar>
        <div>
          <ClientName>{client.name}</ClientName>
          {client.phone && (
            <ContactLine>
              <FaPhone size={12} />
              {formatPhone(client.phone)}
            </ContactLine>
          )}
          {client.email && (
            <ContactLine>
              <FaEnvelope size={12} />
              {client.email}
            </ContactLine>
          )}
          <PointsBadge>
            <FaStar size={12} />
            {Number(client.points) || 0} punto
            {(Number(client.points) || 0) === 1 ? '' : 's'}
          </PointsBadge>
        </div>
      </ClientHeader>

      <ActionsBar>
        <Button type="button" onClick={onNewAppointment}>
          <FaPlus size={14} />
          Nueva cita
        </Button>
      </ActionsBar>

      {renderBody()}
    </div>
  )
}

export default ClientFicha
