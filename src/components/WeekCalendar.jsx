import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import {
  FaAngleLeft,
  FaAngleRight,
  FaCalendarDays,
  FaPlus,
  FaTriangleExclamation,
} from 'react-icons/fa6'
import {
  APPOINTMENT_STATUS,
  watchAppointmentsByRange,
} from '../appointments'
import { STATUS_OPTIONS } from '../appointmentStatus'
import { fetchClients } from '../clients'
import { fetchDiscounts } from '../discounts'
import { fetchServices } from '../services'
import { changeAppointmentStatus } from '../points'
import { getSchedule } from '../settings'
import { apptFullNames, getAppointmentAddons, getAppointmentServices } from '../utils/appointmentServices'
import AppointmentStatusModal from './AppointmentStatusModal'
import CancelAppointmentModal from './CancelAppointmentModal'
import NewAppointmentModal from './NewAppointmentModal'
import {
  addDays,
  formatDateString,
  formatTime12h,
  formatWeekRange,
  isRestDay,
  isSameDay,
  startOfWeek,
} from '../utils/dates'
import { Alert, Spinner } from './ui'

const STATUS_META = STATUS_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option }),
  {},
)

function computeFreeBlocks(dayAppts, schedule) {
  if (!schedule) return []
  const open = schedule.openTime || '09:00'
  const close = schedule.closeTime || '19:00'
  const sorted = [...dayAppts].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  )
  const gaps = []
  let cursor = open
  for (const appt of sorted) {
    if (appt.startTime > cursor) gaps.push({ start: cursor, end: appt.startTime })
    if (appt.endTime > cursor) cursor = appt.endTime
  }
  if (close > cursor) gaps.push({ start: cursor, end: close })
  return gaps
}

function weekdayLabel(date) {
  const text = new Intl.DateTimeFormat('es-CO', { weekday: 'long' }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const Card = styled.section`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 1rem;
  }
`

const HeaderText = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;

  @media (max-width: 767px) {
    justify-content: center;
  }
`

const HeaderIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
`

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`

const HeaderSub = styled.p`
  margin: 0.125rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 767px) {
    justify-content: center;
  }
`

const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-bg);
    color: var(--color-text);
  }

  @media (max-width: 767px) {
    width: 2.75rem;
    height: 2.75rem;
  }
`

const TodayButton = styled.button`
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-bg);
  }

  @media (max-width: 767px) {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
`

const NoticeBar = styled.div`
  padding: 0.875rem 1.25rem 0;
`

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 1rem 1.25rem;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: repeat(7, 9.5rem);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 1rem;
  }
`

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
`

const DayColHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
  padding: 0.5rem 0.25rem;
  border-radius: var(--radius-md);
  background: var(--color-bg);
  border: 1px solid ${({ $today }) =>
    $today ? 'var(--color-primary)' : 'var(--color-border)'};
  text-align: center;
`

const DayName = styled.span`
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-primary);
`

const DayNumber = styled.span`
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-text);
`

const DayCount = styled.span`
  font-size: 0.7rem;
  color: var(--color-text-muted);
`

const DayColBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`

const WeekAppt = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 1px solid ${({ $color }) => $color || 'var(--color-border)'};
  border-left: 3px solid ${({ $color }) => $color || 'var(--color-primary)'};
  border-radius: var(--radius-sm);
  background: ${({ $soft }) => $soft || 'var(--color-surface)'};
  text-align: left;
  cursor: pointer;
  font: inherit;

  &:hover {
    filter: brightness(0.98);
  }
`

const ApptTimeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem;
`

const ApptTime = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--color-text);
`

const ApptName = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ApptService = styled.span`
  font-size: 0.72rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ApptDiscount = styled.span`
  align-self: flex-start;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--color-success-soft);
  color: var(--color-success);
`

const WeekFree = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  width: 100%;
  padding: 0.4rem 0.625rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-subtle);
  font: inherit;
  font-size: 0.72rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
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

function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [discounts, setDiscounts] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [statusAppt, setStatusAppt] = useState(null)
  const [cancelAppt, setCancelAppt] = useState(null)
  const [editAppt, setEditAppt] = useState(null)
  const [newAppt, setNewAppt] = useState(null)
  const [notice, setNotice] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    getSchedule()
      .then((s) => {
        if (!cancelled) setSchedule(s)
      })
      .catch(() => {
        if (!cancelled) {
          setSchedule({
            openTime: '09:00',
            closeTime: '19:00',
            slotStep: 0,
            calendarStep: 30,
            restDay: 0,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([fetchClients(), fetchServices(), fetchDiscounts()])
      .then(([clientList, serviceList, discountList]) => {
        if (!cancelled) {
          setClients(clientList)
          setServices(serviceList)
          setDiscounts(discountList)
        }
      })
      .catch((err) => console.error(err))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true)
    setLoadError(false)
    const startStr = formatDateString(weekStart)
    const endStr = formatDateString(addDays(weekStart, 6))
    return watchAppointmentsByRange(
      startStr,
      endStr,
      (appts) => {
        setAppointments(appts)
        setLoadError(false)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoadError(true)
        setLoading(false)
      },
    )
  }, [weekStart, reloadToken])

  const clientMap = useMemo(
    () => clients.reduce((map, c) => ({ ...map, [c.id]: c }), {}),
    [clients],
  )
  const serviceMap = useMemo(
    () => services.reduce((map, s) => ({ ...map, [s.id]: s }), {}),
    [services],
  )

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const goToPrevWeek = () => setWeekStart((d) => addDays(d, -7))
  const goToNextWeek = () => setWeekStart((d) => addDays(d, 7))
  const goToThisWeek = () => setWeekStart(startOfWeek(new Date()))

  const handleStatusChange = async (appt, status) => {
    const { pointsAwarded } = await changeAppointmentStatus({
      appointment: appt,
      services,
      newStatus: status,
    })
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status, pointsAwarded } : a)),
    )
  }

  const handleAppointmentCreated = () => {
    setNewAppt(null)
    setReloadToken((t) => t + 1)
    setNotice({ tone: 'success', text: 'Cita creada correctamente.' })
  }

  const handleAppointmentEdited = () => {
    setEditAppt(null)
    setReloadToken((t) => t + 1)
    setNotice({ tone: 'success', text: 'Cita actualizada correctamente.' })
  }

  const handleCancelAppointment = async (appt) => {
    const { pointsAwarded } = await changeAppointmentStatus({
      appointment: appt,
      services,
      newStatus: APPOINTMENT_STATUS.CANCELLED,
      extra: { cancelledAt: new Date().toISOString() },
    })
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id
          ? { ...a, status: APPOINTMENT_STATUS.CANCELLED, pointsAwarded }
          : a,
      ),
    )
  }

  const renderBody = () => {
    if (loading) {
      return (
        <Loading>
          <Spinner />
          Cargando semana...
        </Loading>
      )
    }

    if (loadError) {
      return (
        <ErrorWrap>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudieron cargar las citas de la semana.
          </Alert>
          <TodayButton type="button" onClick={() => setReloadToken((t) => t + 1)}>
            Reintentar
          </TodayButton>
        </ErrorWrap>
      )
    }

    return (
      <WeekGrid>
        {days.map((day) => {
          const dateKey = formatDateString(day)
          const isRest = isRestDay(day, schedule?.restDay ?? 0)
          const today = isSameDay(day, new Date())
          const dayAppts = appointments
            .filter(
              (a) =>
                a.date === dateKey &&
                a.status !== APPOINTMENT_STATUS.CANCELLED,
            )
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
          const freeBlocks = computeFreeBlocks(dayAppts, schedule)
          const count = dayAppts.length

          const entries = [
            ...dayAppts.map((appt) => ({ type: 'appt', start: appt.startTime, appt })),
            ...freeBlocks.map((block) => ({ type: 'free', start: block.start, block })),
          ].sort((a, b) => a.start.localeCompare(b.start))

          return (
            <DayColumn key={dateKey}>
              <DayColHeader $today={today}>
                <DayName>{weekdayLabel(day)}</DayName>
                <DayNumber>{day.getDate()}</DayNumber>
                <DayCount>
                  {`${count} ${count === 1 ? 'cita' : 'citas'}`}
                  {isRest ? ' · Descanso' : ''}
                </DayCount>
              </DayColHeader>

              <DayColBody>
                {entries.map((entry) => {
                    if (entry.type === 'free') {
                      return (
                        <WeekFree
                          key={`free-${entry.block.start}-${entry.block.end}`}
                          type="button"
                          onClick={() =>
                            setNewAppt({ date: dateKey, time: entry.block.start })
                          }
                        >
                          <span>
                            {formatTime12h(entry.block.start)} -{' '}
                            {formatTime12h(entry.block.end)}
                          </span>
                          <span>Disponible</span>
                        </WeekFree>
                      )
                    }

                    const appt = entry.appt
                    const meta = STATUS_META[appt.status]
                    const StatusIcon = meta?.Icon
                    const client = clientMap[appt.clientId]
                    return (
                      <WeekAppt
                        key={appt.id}
                        type="button"
                        $color={meta?.color}
                        $soft={meta?.soft}
                        onClick={() => setStatusAppt(appt)}
                      >
                        <ApptTimeRow>
                          <ApptTime>{formatTime12h(appt.startTime)}</ApptTime>
                          {StatusIcon && <StatusIcon size={10} />}
                        </ApptTimeRow>
                        <ApptName>
                          {client?.name || appt.clientName || 'Ocasional'}
                        </ApptName>
                        <ApptService>
                          {apptFullNames(appt, serviceMap)}
                        </ApptService>
                        {appt.discountTitle && appt.discountPercent != null && (
                          <ApptDiscount title={appt.discountTitle}>
                            -{appt.discountPercent}%
                          </ApptDiscount>
                        )}
                      </WeekAppt>
                    )
                  })}
              </DayColBody>
            </DayColumn>
          )
        })}
      </WeekGrid>
    )
  }

  return (
    <>
      <Card>
        <Header>
          <HeaderText>
            <HeaderIcon>
              <FaCalendarDays size={18} />
            </HeaderIcon>
            <div>
              <HeaderTitle>Semana</HeaderTitle>
              <HeaderSub>
                {formatWeekRange(weekStart, addDays(weekStart, 6))}
              </HeaderSub>
            </div>
          </HeaderText>

          <Controls>
            <TodayButton type="button" onClick={goToThisWeek}>
              Hoy
            </TodayButton>
            <NavButton type="button" onClick={goToPrevWeek} aria-label="Semana anterior">
              <FaAngleLeft size={16} />
            </NavButton>
            <NavButton type="button" onClick={goToNextWeek} aria-label="Semana siguiente">
              <FaAngleRight size={16} />
            </NavButton>
            <TodayButton
              type="button"
              onClick={() => setNewAppt({ date: formatDateString(new Date()), time: '' })}
            >
              <FaPlus size={12} /> Nueva cita
            </TodayButton>
          </Controls>
        </Header>

        {notice && (
          <NoticeBar>
            <Alert tone={notice.tone}>{notice.text}</Alert>
          </NoticeBar>
        )}

        {renderBody()}
      </Card>

      {newAppt && (
        <NewAppointmentModal
          initialDate={new Date(`${newAppt.date}T00:00:00`)}
          initialTime={newAppt.time}
          clients={clients}
          services={services}
          discounts={discounts}
          onCreated={handleAppointmentCreated}
          onClose={() => setNewAppt(null)}
        />
      )}

      {statusAppt && (
        <AppointmentStatusModal
          appointment={statusAppt}
          client={clientMap[statusAppt.clientId]}
          services={getAppointmentServices(statusAppt, serviceMap)}
          addons={getAppointmentAddons(statusAppt)}
          onSave={(status) => handleStatusChange(statusAppt, status)}
          onEdit={() => {
            setEditAppt(statusAppt)
            setStatusAppt(null)
          }}
          onCancel={() => {
            setCancelAppt(statusAppt)
            setStatusAppt(null)
          }}
          onClose={() => setStatusAppt(null)}
        />
      )}
      {editAppt && (
        <NewAppointmentModal
          appointment={editAppt}
          clients={clients}
          services={services}
          discounts={discounts}
          onEdited={handleAppointmentEdited}
          onClose={() => setEditAppt(null)}
        />
      )}
      {cancelAppt && (
        <CancelAppointmentModal
          appointment={cancelAppt}
          client={clientMap[cancelAppt.clientId]}
          services={getAppointmentServices(cancelAppt, serviceMap)}
          addons={getAppointmentAddons(cancelAppt)}
          onConfirm={() => handleCancelAppointment(cancelAppt)}
          onClose={() => setCancelAppt(null)}
        />
      )}
    </>
  )
}

export default WeekCalendar
