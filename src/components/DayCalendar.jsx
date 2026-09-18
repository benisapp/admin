import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  FaAngleLeft,
  FaAngleRight,
  FaBan,
  FaCalendarDay,
  FaCalendarDays,
  FaCircleCheck,
  FaClock,
  FaFilePdf,
  FaPencil,
  FaPhone,
  FaPlus,
  FaTriangleExclamation,
  FaUser,
  FaWhatsapp,
} from 'react-icons/fa6'
import {
  APPOINTMENT_STATUS,
  getAppointmentsByDate,
  updateAppointmentStatus,
} from '../appointments'
import { STATUS_OPTIONS } from '../appointmentStatus'
import AppointmentStatusModal from './AppointmentStatusModal'
import CancelAppointmentModal from './CancelAppointmentModal'
import { fetchClients } from '../clients'
import { fetchServices } from '../services'
import { getSchedule } from '../settings'
import { formatDuration } from '../utils/format'
import { generateInvoice } from '../utils/invoice'
import InvoiceModal from './InvoiceModal'
import NewAppointmentModal from './NewAppointmentModal'
import {
  addDays,
  formatDateLong,
  formatDateString,
  formatTime12h,
  isSameDay,
  isSunday,
  overlaps,
  startOfWeek,
} from '../utils/dates'
import { Alert, EmptyState, Spinner } from './ui'

const STATUS_META = STATUS_OPTIONS.reduce(
  (map, option) => ({ ...map, [option.value]: option }),
  {},
)

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

  @media (max-width: 767px) {
    font-size: 1.15rem;
  }
`

const HeaderSub = styled.p`
  margin: 0.125rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);

  @media (max-width: 767px) {
    font-size: 0.9rem;
  }
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
`

const DayNav = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 767px) {
    order: 1;
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

const NewAppointmentButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-primary-strong);
  }

  @media (max-width: 767px) {
    width: 100%;
    justify-content: center;
    padding: 0.7rem 1rem;
    font-size: 0.9rem;
    font-weight: 700;
    order: 2;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
`

const Appointment = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: ${({ $soft }) => $soft || 'var(--color-surface)'};
  border: 1px solid ${({ $color }) => $color || 'var(--color-border)'};
  border-left: 4px solid ${({ $color }) => $color || 'var(--color-primary)'};
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-sm);

  ${({ $cancelled }) =>
    $cancelled &&
    `
    opacity: 0.75;
    border-style: dashed;
  `}
`

const ApptHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const Time = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--color-primary);
  white-space: nowrap;

  @media (max-width: 360px) {
    font-size: 1rem;
  }
`

const EndTime = styled.span`
  color: var(--color-primary-strong);
  font-weight: 600;
  font-size: 0.9rem;
`

const FreeSlot = styled.button`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
  }
`

const FreeTimeBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.125rem;
  min-width: 4.5rem;
  padding-right: 1rem;
  border-right: 1px solid var(--color-border);
  color: var(--color-text-muted);
  flex-shrink: 0;
`

const FreeTimeStart = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
`

const FreeTimeEnd = styled.span`
  font-size: 0.72rem;
  color: var(--color-text-subtle);
`

const FreeLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-muted);
`

const FreeDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  border: 2px solid var(--color-text-subtle);
  flex-shrink: 0;
`

const FreePlus = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  color: var(--color-text-subtle);
  flex-shrink: 0;
`

const Name = styled.p`
  margin: 0;
  font-weight: 800;
  color: var(--color-text);
  font-size: 1.05rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const NameButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: 800;
  color: var(--color-text);
  font-size: 1.05rem;
  cursor: pointer;
  text-align: left;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }
`

const ServiceLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
`

const Service = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Duration = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  flex-shrink: 0;
`

const PhoneLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  font-variant-numeric: tabular-nums;
`

const ContactLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  border: 1px solid var(--color-border-strong);
  background: var(--color-surface);
  color: var(--color-text-muted);
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }
`

const Divider = styled.div`
  height: 1px;
  background: var(--color-border);
`

const StatusBadge = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid ${({ $color }) => $color || 'var(--color-border-strong)'};
  color: ${({ $color }) => $color || 'var(--color-text-muted)'};
  background: ${({ $soft }) => $soft || 'var(--color-surface)'};
  white-space: nowrap;
  flex-shrink: 0;
  transition: filter 0.15s ease;

  &:hover {
    filter: brightness(0.96);
  }
`

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const Dot = styled.span`
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
`

const InvoiceButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  flex: 1 1 auto;
  white-space: nowrap;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-primary-strong);
    border-color: var(--color-primary-strong);
  }
`

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  flex: 1 1 auto;
  white-space: nowrap;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-bg);
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`

const CancelButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  flex: 1 1 auto;
  white-space: nowrap;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-danger-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-danger);
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--color-danger-soft);
    border-color: var(--color-danger);
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
  padding: 1.25rem;
`

const PickerWrap = styled.div`
  position: relative;

  @media (max-width: 767px) {
    order: 3;
  }
`

const Popover = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 30;
  width: 17.5rem;
  padding: 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);

  @media (max-width: 767px) {
    position: fixed;
    top: auto;
    bottom: 5rem;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: min(17.5rem, calc(100vw - 2rem));
  }
`

const PopHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`

const PopTitle = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
`

const PopNav = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
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
`

const WeekLabels = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 0.25rem;
`

const WeekLabel = styled.span`
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  padding: 0.25rem 0;
`

const DaysGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`

const DayCell = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    background: var(--color-primary-soft);
  }

  ${({ $outside }) =>
    $outside &&
    `
    color: var(--color-text-subtle);
  `}

  ${({ $selected }) =>
    $selected &&
    `
    background: var(--color-primary);
    color: var(--color-on-primary);
    font-weight: 700;
    &:hover { background: var(--color-primary-strong); }
  `}

  ${({ $today, $selected }) =>
    $today &&
    !$selected &&
    `
    border-color: var(--color-primary);
    color: var(--color-primary);
    font-weight: 700;
  `}

  ${({ $disabled }) =>
    $disabled &&
    `
    color: var(--color-text-subtle);
    opacity: 0.5;
    cursor: not-allowed;
    &:hover { background: transparent; }
  `}
`

const WEEKDAY_LABELS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatPhone(phone) {
  if (!phone) return ''
  const digits = String(phone)
  return digits.length === 10
    ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    : digits
}

function DayCalendar({ onOpenClient }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [clients, setClients] = useState([])
  const [services, setServices] = useState([])
  const [schedule, setSchedule] = useState(null)
  const [statusAppt, setStatusAppt] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [invoice, setInvoice] = useState(null)
  const [showNewAppt, setShowNewAppt] = useState(false)
  const [presetTime, setPresetTime] = useState('')
  const [editAppt, setEditAppt] = useState(null)
  const [cancelAppt, setCancelAppt] = useState(null)
  const [notice, setNotice] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const pickerRef = useRef(null)
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

  const dateKey = formatDateString(selectedDate)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [clientList, serviceList] = await Promise.all([
          fetchClients(),
          fetchServices(),
        ])
        if (cancelled) return
        setClients(clientList)
        setServices(serviceList)
      } catch (err) {
        console.error(err)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getSchedule()
      .then((s) => {
        if (!cancelled) setSchedule(s)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) {
          setSchedule({ openTime: '09:00', closeTime: '19:00', slotStep: 0 })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setLoadError(false)
      try {
        const appts = await getAppointmentsByDate(dateKey)
        if (cancelled) return
        setAppointments(
          appts.sort((a, b) => a.startTime.localeCompare(b.startTime)),
        )
      } catch (err) {
        console.error(err)
        if (!cancelled) setLoadError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [dateKey, reloadToken])

  const clientMap = useMemo(
    () => clients.reduce((map, c) => ({ ...map, [c.id]: c }), {}),
    [clients],
  )
  const serviceMap = useMemo(
    () => services.reduce((map, s) => ({ ...map, [s.id]: s }), {}),
    [services],
  )

  const freeBlocks = useMemo(() => {
    if (!schedule) return []
    const open = schedule.openTime || '09:00'
    const close = schedule.closeTime || '19:00'
    const step = schedule.slotStep > 0 ? schedule.slotStep : 60
    const sorted = [...appointments]
      .filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    const gaps = []
    let cursor = open
    for (const appt of sorted) {
      if (appt.startTime > cursor) {
        gaps.push({ start: cursor, end: appt.startTime })
      }
      if (appt.endTime > cursor) cursor = appt.endTime
    }
    if (close > cursor) gaps.push({ start: cursor, end: close })

    const slots = []
    for (const gap of gaps) {
      let t = timeToMinutes(gap.start)
      const endMin = timeToMinutes(gap.end)
      while (t < endMin) {
        const next = Math.min(t + step, endMin)
        slots.push({ start: minutesToTime(t), end: minutesToTime(next) })
        t = next
      }
    }
    return slots
  }, [appointments, schedule])

  const dayEntries = useMemo(() => {
    const cancelledEntries = appointments
      .filter((a) => a.status === APPOINTMENT_STATUS.CANCELLED)
      .map((appt) => ({ type: 'cancelled', start: appt.startTime, appt }))
    const busy = appointments
      .filter((a) => a.status !== APPOINTMENT_STATUS.CANCELLED)
      .map((appt) => ({
        type: 'busy',
        start: appt.startTime,
        appt,
      }))
    const free = freeBlocks
      .filter(
        (block) =>
          !cancelledEntries.some((c) =>
            overlaps(
              block.startTime,
              block.endTime,
              c.appt.startTime,
              c.appt.endTime,
            ),
          ),
      )
      .map((block) => ({
        type: 'free',
        start: block.start,
        startTime: block.start,
        endTime: block.end,
      }))
    return [...busy, ...cancelledEntries, ...free].sort((a, b) =>
      a.start.localeCompare(b.start),
    )
  }, [appointments, freeBlocks])

  const goToPrevDay = () => setSelectedDate((d) => addDays(d, -1))
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1))
  const goToToday = () => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    setSelectedDate(now)
  }

  const togglePicker = () => {
    setViewMonth(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    )
    setPickerOpen((v) => !v)
  }

  const goToPrevMonth = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  const goToNextMonth = () =>
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))

  const pickDay = (day) => {
    setSelectedDate(day)
    setPickerOpen(false)
  }

  useEffect(() => {
    if (!pickerOpen) return
    const handle = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [pickerOpen])

  const monthGrid = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const start = startOfWeek(first)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [viewMonth])

  const monthLabel = (() => {
    const text = new Intl.DateTimeFormat('es-CO', {
      month: 'long',
      year: 'numeric',
    }).format(viewMonth)
    return text.charAt(0).toUpperCase() + text.slice(1)
  })()

  const handleStatusChange = async (appt, status) => {
    await updateAppointmentStatus(appt.id, status)
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status } : a)),
    )
  }

  const handleCancelAppointment = async (appt) => {
    await updateAppointmentStatus(appt.id, APPOINTMENT_STATUS.CANCELLED)
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id ? { ...a, status: APPOINTMENT_STATUS.CANCELLED } : a,
      ),
    )
    showNotice('success', 'Cita cancelada correctamente.')
  }

  const attendedByClient = useMemo(() => {
    const groups = new Map()
    for (const appt of appointments) {
      if (appt.status !== APPOINTMENT_STATUS.ATTENDED) continue
      if (!groups.has(appt.clientId)) groups.set(appt.clientId, [])
      groups.get(appt.clientId).push(appt)
    }
    return groups
  }, [appointments])

  const handleDownloadInvoice = (appt) => {
    const group = attendedByClient.get(appt.clientId) || [appt]
    const { blob, code, filename } = generateInvoice({
      client: clientMap[appt.clientId],
      items: group.map((a) => ({
        service: serviceMap[a.serviceId],
        appointment: a,
      })),
    })
    setInvoice({
      url: URL.createObjectURL(blob),
      blob,
      code,
      filename,
    })
  }

  const closeInvoice = () => {
    if (invoice?.url) URL.revokeObjectURL(invoice.url)
    setInvoice(null)
  }

  const handleAppointmentCreated = async (createdDate) => {
    setShowNewAppt(false)
    setReloadToken((t) => t + 1)
    try {
      setClients(await fetchClients())
    } catch (err) {
      console.error(err)
    }
    if (createdDate && createdDate !== dateKey) {
      const [y, m, d] = createdDate.split('-').map(Number)
      setSelectedDate(new Date(y, m - 1, d))
    }
  }

  const handleAppointmentEdited = (editedDate) => {
    setEditAppt(null)
    setReloadToken((t) => t + 1)
    if (editedDate && editedDate !== dateKey) {
      const [y, m, d] = editedDate.split('-').map(Number)
      setSelectedDate(new Date(y, m - 1, d))
    }
    showNotice('success', 'Cita reprogramada correctamente.')
  }

  const isToday = isSameDay(selectedDate, new Date())
  const closed = isSunday(selectedDate)

  const renderBody = () => {
    if (loading) {
      return (
        <Loading>
          <Spinner />
          Cargando citas...
        </Loading>
      )
    }

    if (loadError) {
      return (
        <ErrorWrap>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudieron cargar las citas del día.
          </Alert>
        </ErrorWrap>
      )
    }

    if (closed) {
      return (
        <EmptyState
          icon={<FaCalendarDays size={26} />}
          title="Cerrado"
          description="Los domingos no hay atención."
        />
      )
    }

    if (appointments.length === 0 && schedule == null) {
      return (
        <Loading>
          <Spinner />
          Cargando horario...
        </Loading>
      )
    }

    return (
      <List>
        {dayEntries.map((entry) => {
          if (entry.type === 'free') {
            return (
              <FreeSlot
                key={`free-${entry.startTime}-${entry.endTime}`}
                type="button"
                onClick={() => {
                  setPresetTime(entry.startTime)
                  setShowNewAppt(true)
                }}
                aria-label={`Nueva cita a las ${formatTime12h(entry.startTime)}`}
              >
                <FreeTimeBlock>
                  <FreeTimeStart>{formatTime12h(entry.startTime)}</FreeTimeStart>
                  <FreeTimeEnd>{formatTime12h(entry.endTime)}</FreeTimeEnd>
                </FreeTimeBlock>
                <FreeLabel>
                  <FreeDot />
                  Disponible
                </FreeLabel>
                <FreePlus>
                  <FaPlus size={14} />
                </FreePlus>
              </FreeSlot>
            )
          }

          const appt = entry.appt
          const client = clientMap[appt.clientId]
          const service = serviceMap[appt.serviceId]
          const statusMeta = STATUS_META[appt.status]
          const StatusIcon = statusMeta?.Icon
          return (
            <Appointment
              key={appt.id}
              $color={statusMeta?.color}
              $soft={statusMeta?.soft}
              $cancelled={appt.status === APPOINTMENT_STATUS.CANCELLED}
            >
              <ApptHeader>
                <Time>
                  <FaClock size={15} />
                  <span>{formatTime12h(appt.startTime)}</span>
                  <EndTime>– {formatTime12h(appt.endTime)}</EndTime>
                </Time>
                <StatusBadge
                  type="button"
                  $color={statusMeta?.color}
                  $soft={statusMeta?.soft}
                  onClick={() => setStatusAppt(appt)}
                  title="Cambiar estado"
                >
                  {StatusIcon ? <StatusIcon size={12} /> : <Dot />}
                  {statusMeta ? statusMeta.label : 'Sin estado'}
                </StatusBadge>
              </ApptHeader>

              {client ? (
                <NameButton
                  type="button"
                  onClick={() => onOpenClient?.(appt.clientId)}
                  title="Ver ficha del cliente"
                >
                  <FaUser size={13} />
                  {client.name}
                </NameButton>
              ) : (
                <Name>Cliente</Name>
              )}

              <ServiceLine>
                <Service>{service ? service.name : 'Servicio'}</Service>
                {service?.duration ? (
                  <Duration>
                    <FaClock size={11} />
                    {formatDuration(service.duration)}
                  </Duration>
                ) : null}
              </ServiceLine>

              {client?.phone && (
                <PhoneLine>
                  <FaPhone size={11} />
                  {formatPhone(client.phone)}
                </PhoneLine>
              )}

              <Divider />

              <ActionsRow>
                {client?.phone && (
                  <>
                    <ContactLink
                      href={`https://wa.me/57${client.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      title="WhatsApp"
                      aria-label="Enviar WhatsApp"
                    >
                      <FaWhatsapp size={18} />
                    </ContactLink>
                    <ContactLink
                      href={`tel:+57${client.phone}`}
                      title="Llamar"
                      aria-label="Llamar"
                    >
                      <FaPhone size={16} />
                    </ContactLink>
                  </>
                )}
                <EditButton type="button" onClick={() => setEditAppt(appt)}>
                  <FaPencil size={13} />
                  Editar
                </EditButton>
                {appt.status === APPOINTMENT_STATUS.CONFIRMED && (
                  <CancelButton type="button" onClick={() => setCancelAppt(appt)}>
                    <FaBan size={13} />
                    Cancelar
                  </CancelButton>
                )}
                {appt.status === APPOINTMENT_STATUS.ATTENDED && (
                  <InvoiceButton type="button" onClick={() => handleDownloadInvoice(appt)}>
                    <FaFilePdf size={13} />
                    {(attendedByClient.get(appt.clientId)?.length ?? 1) > 1
                      ? `Factura (${attendedByClient.get(appt.clientId).length})`
                      : 'Factura'}
                  </InvoiceButton>
                )}
              </ActionsRow>
            </Appointment>
          )
        })}
      </List>
    )
  }

  return (
    <>
    <Card>
      {notice && (
        <div style={{ padding: '0.75rem 1.25rem 0' }}>
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
        </div>
      )}
      <Header>
        <HeaderText>
          <HeaderIcon>
            <FaCalendarDays size={18} />
          </HeaderIcon>
          <div>
            <HeaderTitle>{isToday ? 'Citas de hoy' : 'Citas del día'}</HeaderTitle>
            <HeaderSub>
              {formatDateLong(dateKey)}
              {!closed &&
                ` · ${appointments.length} ${appointments.length === 1 ? 'cita' : 'citas'}`}
            </HeaderSub>
          </div>
        </HeaderText>

        <Controls>
          <NewAppointmentButton
            type="button"
            onClick={() => {
              setPresetTime('')
              setShowNewAppt(true)
            }}
          >
            <FaPlus size={14} />
            Nueva cita
          </NewAppointmentButton>
          <PickerWrap ref={pickerRef}>
            <NavButton
              type="button"
              onClick={togglePicker}
              aria-label="Seleccionar día en el calendario"
            >
              <FaCalendarDay size={16} />
            </NavButton>
            {pickerOpen && (
              <Popover>
                <PopHeader>
                  <PopNav
                    type="button"
                    onClick={goToPrevMonth}
                    aria-label="Mes anterior"
                  >
                    <FaAngleLeft size={14} />
                  </PopNav>
                  <PopTitle>{monthLabel}</PopTitle>
                  <PopNav
                    type="button"
                    onClick={goToNextMonth}
                    aria-label="Mes siguiente"
                  >
                    <FaAngleRight size={14} />
                  </PopNav>
                </PopHeader>
                <WeekLabels>
                  {WEEKDAY_LABELS.map((label) => (
                    <WeekLabel key={label}>{label}</WeekLabel>
                  ))}
                </WeekLabels>
                <DaysGrid>
                  {monthGrid.map((day) => {
                    const inMonth = day.getMonth() === viewMonth.getMonth()
                    const selected = isSameDay(day, selectedDate)
                    const today = isSameDay(day, new Date())
                    const disabled = !inMonth || isSunday(day)
                    return (
                      <DayCell
                        key={day.getTime()}
                        type="button"
                        $outside={!inMonth}
                        $selected={selected}
                        $today={today}
                        $disabled={disabled}
                        disabled={disabled}
                        onClick={() => pickDay(day)}
                      >
                        {day.getDate()}
                      </DayCell>
                    )
                  })}
                </DaysGrid>
              </Popover>
            )}
          </PickerWrap>
          <DayNav>
            <TodayButton type="button" onClick={goToToday}>
              Hoy
            </TodayButton>
            <NavButton type="button" onClick={goToPrevDay} aria-label="Día anterior">
              <FaAngleLeft size={16} />
            </NavButton>
            <NavButton type="button" onClick={goToNextDay} aria-label="Día siguiente">
              <FaAngleRight size={16} />
            </NavButton>
          </DayNav>
        </Controls>
      </Header>

      {renderBody()}
    </Card>
    {invoice && <InvoiceModal data={invoice} onClose={closeInvoice} />}
    {showNewAppt && (
      <NewAppointmentModal
        initialDate={selectedDate}
        initialTime={presetTime}
        clients={clients}
        services={services}
        onCreated={handleAppointmentCreated}
        onClose={() => setShowNewAppt(false)}
      />
    )}
    {statusAppt && (
      <AppointmentStatusModal
        appointment={statusAppt}
        client={clientMap[statusAppt.clientId]}
        service={serviceMap[statusAppt.serviceId]}
        onSave={(status) => handleStatusChange(statusAppt, status)}
        onClose={() => setStatusAppt(null)}
      />
    )}
    {editAppt && (
      <NewAppointmentModal
        appointment={editAppt}
        initialDate={selectedDate}
        clients={clients}
        services={services}
        onEdited={handleAppointmentEdited}
        onClose={() => setEditAppt(null)}
      />
    )}
    {cancelAppt && (
      <CancelAppointmentModal
        appointment={cancelAppt}
        client={clientMap[cancelAppt.clientId]}
        service={serviceMap[cancelAppt.serviceId]}
        onConfirm={() => handleCancelAppointment(cancelAppt)}
        onClose={() => setCancelAppt(null)}
      />
    )}
    </>
  )
}

export default DayCalendar
