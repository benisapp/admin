import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { css } from 'styled-components'
import {
  FaAngleLeft,
  FaAngleRight,
  FaCalendarDay,
  FaCalendarDays,
  FaCircleCheck,
  FaPlus,
  FaTriangleExclamation,
} from 'react-icons/fa6'
import {
  LuEllipsisVertical,
  LuMail,
  LuMessageCircle,
  LuPencil,
  LuPhone,
  LuReceipt,
} from 'react-icons/lu'
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
import { fetchDiscounts } from '../discounts'
import { syncAppointmentPoints } from '../points'
import { getSchedule } from '../settings'
import { formatDuration, formatPrice } from '../utils/format'
import {
  apptTotalDuration,
  getAppointmentServices,
} from '../utils/appointmentServices'
import { generateInvoice } from '../utils/invoice'
import InvoiceModal from './InvoiceModal'
import NewAppointmentModal from './NewAppointmentModal'
import {
  addDays,
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
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.5rem 0.875rem;
  border-bottom: 1px solid var(--color-border);

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.625rem;
    padding: 1rem 1rem 0.875rem;
  }
`

const HeaderText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  @media (max-width: 767px) {
    align-items: center;
    text-align: center;
  }
`

const HeaderTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.2;
  color: var(--color-text);
`

const HeaderSub = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
`

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`

const NavGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;

  @media (max-width: 767px) {
    justify-content: center;
    order: 1;
  }
`

const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
`

const TodayButton = styled.button`
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-size: 0.85rem;
  font-weight: 700;
  min-height: 2.25rem;
  padding: 0.375rem 1rem;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: rgba(183, 110, 121, 0.2);
  }
`

const NewAppointmentButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.5rem 1.1rem;
  border: none;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--color-primary-strong);
  }

  @media (max-width: 767px) {
    order: 2;
    width: 100%;
    padding: 0.625rem 1rem;
    font-size: 0.9rem;
  }
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.75rem 1.5rem 1.25rem;

  @media (max-width: 767px) {
    padding: 0.75rem 1rem 1.25rem;
  }
`

const Entry = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0.625rem;

  ${({ $cancelled }) =>
    $cancelled &&
    `
    opacity: 0.62;
  `}
`

const TimeCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.3125rem;
  width: 4.25rem;
  flex-shrink: 0;
  padding-top: 0.25rem;
`

const TimeStart = styled.span`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ $secondary }) =>
    $secondary ? 'var(--color-text-muted)' : 'var(--color-text)'};
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
`

const TimeEnd = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ $secondary }) =>
    $secondary ? 'var(--color-text-subtle)' : 'var(--color-text-muted)'};
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
`

const Rail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 1.25rem;
  flex-shrink: 0;
`

const RailDot = styled.span`
  position: relative;
  z-index: 1;
  margin-top: 0.625rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 3px var(--color-surface);
  background: ${({ $hollow, $color }) =>
    $hollow ? 'var(--color-surface)' : $color || 'var(--color-primary)'};
  border: ${({ $hollow, $color }) =>
    $hollow
      ? '1px solid var(--color-border-strong)'
      : `1.5px solid ${$color || 'var(--color-primary)'}`};
`

const RailLine = styled.span`
  flex: 1;
  width: 2px;
  margin-top: 0.1875rem;
  background: var(--color-border);
`

const Content = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  padding: 0.125rem 0 1.25rem;

  ${({ $last }) =>
    $last &&
    `
    padding-bottom: 0;
  `}
`

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
`

const NameButton = styled.button`
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font: inherit;
  font-weight: 800;
  color: var(--color-text);
  font-size: 1.05rem;
  line-height: 1.3;
  cursor: pointer;
  text-align: left;

  &:hover {
    color: var(--color-primary);
    text-decoration: underline;
  }
`

const Name = styled.p`
  margin: 0;
  flex: 1;
  min-width: 0;
  font-weight: 800;
  color: var(--color-text);
  font-size: 1.05rem;
  line-height: 1.3;
`

const StatusBadge = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.1rem 0.625rem;
  border: none;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ $color }) => $color || 'var(--color-text-muted)'};
  background: ${({ $soft }) => $soft || 'var(--color-bg)'};
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: filter 0.15s ease;

  &:hover {
    filter: brightness(0.96);
  }
`

const ServiceList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
  min-width: 0;
`

const ServiceRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  min-width: 0;
`

const ServiceName = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ServiceDuration = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`

const TotalRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.78rem;
`

const TotalLabel = styled.span`
  color: var(--color-text-subtle);
  font-weight: 600;
`

const TotalValue = styled.span`
  color: var(--color-text-muted);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`

const DiscountTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.7rem;
  font-weight: 700;
  background: var(--color-success-soft);
  color: var(--color-success);
`

const PhoneLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-subtle);
  font-variant-numeric: tabular-nums;
`

const DropdownWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`

const DropdownButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-subtle);
  font-size: 1.05rem;
  line-height: 0;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover,
  &:focus-visible {
    background: var(--color-primary-soft);
    color: var(--color-primary);
  }
`

const Menu = styled.div`
  position: absolute;
  right: 0;
  top: calc(100% + 0.375rem);
  z-index: 30;
  min-width: 12rem;
  padding: 0.375rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
`

const MenuDivider = styled.div`
  height: 1px;
  margin: 0.375rem 0.25rem;
  background: var(--color-border);
`

const menuItemCss = css`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: ${({ $danger }) =>
    $danger ? 'var(--color-danger)' : 'var(--color-text)'};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $danger }) =>
      $danger ? 'var(--color-danger-soft)' : 'var(--color-bg)'};
  }
`

const MenuItem = styled.button`
  ${menuItemCss}
`

const MenuLink = styled.a`
  ${menuItemCss}
`

const FreeLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-subtle);
`

const FreePlus = styled.span`
  display: inline-flex;
  align-items: center;
  color: var(--color-primary);
`

const FreeSlotContent = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  padding: 0.3125rem 0 1.25rem;

  ${({ $last }) =>
    $last &&
    `
    padding-bottom: 0;
  `}
`

const FreeSlotButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2rem;
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
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

const NoticeWrap = styled.div`
  padding: 0.75rem 1.5rem 0;

  @media (max-width: 767px) {
    padding: 0.75rem 1rem 0;
  }
`

const PickerWrap = styled.div`
  position: relative;
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

function formatDateShort(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const text = new Intl.DateTimeFormat('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  })
    .format(date)
    .replace('.', '')
  return text.charAt(0).toUpperCase() + text.slice(1)
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
  const [discounts, setDiscounts] = useState([])
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
  const [openMenu, setOpenMenu] = useState(null)
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

  useEffect(() => {
    if (!openMenu) return
    const handler = () => setOpenMenu(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenu])

  const dateKey = formatDateString(selectedDate)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [clientList, serviceList, discountList] = await Promise.all([
          fetchClients(),
          fetchServices(),
          fetchDiscounts(),
        ])
        if (cancelled) return
        setClients(clientList)
        setServices(serviceList)
        setDiscounts(discountList)
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
    const pointsAwarded = await syncAppointmentPoints({
      appointment: appt,
      services,
      newStatus: status,
    })
    await updateAppointmentStatus(appt.id, status)
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status, pointsAwarded } : a)),
    )
  }

  const handleCancelAppointment = async (appt) => {
    const pointsAwarded = await syncAppointmentPoints({
      appointment: appt,
      services,
      newStatus: APPOINTMENT_STATUS.CANCELLED,
    })
    await updateAppointmentStatus(appt.id, APPOINTMENT_STATUS.CANCELLED)
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appt.id
          ? { ...a, status: APPOINTMENT_STATUS.CANCELLED, pointsAwarded }
          : a,
      ),
    )
    showNotice('success', 'Cita cancelada correctamente.')
  }

  const handleDownloadInvoice = (appt) => {
    const { blob, code, filename, data } = generateInvoice({
      client: clientMap[appt.clientId],
      items: getAppointmentServices(appt, serviceMap).map((service) => ({
        service,
        appointment: appt,
      })),
      discount:
        appt.discountPercent != null
          ? {
              title: appt.discountTitle,
              percent: appt.discountPercent,
            }
          : null,
    })
    setInvoice({
      url: URL.createObjectURL(blob),
      blob,
      code,
      filename,
      data,
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

  const renderAppointment = (appt, isLast) => {
    const client = clientMap[appt.clientId]
    const statusMeta = STATUS_META[appt.status]
    const StatusIcon = statusMeta?.Icon
    const apptServices = getAppointmentServices(appt, serviceMap)
    const totalDuration = apptTotalDuration(appt, serviceMap)
    const cancelled = appt.status === APPOINTMENT_STATUS.CANCELLED

    return (
      <Entry key={appt.id} $cancelled={cancelled}>
        <TimeCol>
          <TimeStart>{formatTime12h(appt.startTime)}</TimeStart>
          <TimeEnd>{formatTime12h(appt.endTime)}</TimeEnd>
        </TimeCol>
        <Rail>
          <RailDot $color={statusMeta?.color} />
          <RailLine />
        </Rail>
        <Content $last={isLast}>
          <TopRow>
            {client ? (
              <NameButton
                type="button"
                onClick={() => onOpenClient?.(appt.clientId)}
                title="Ver ficha del cliente"
              >
                {client.name}
              </NameButton>
            ) : (
              <Name>Cliente</Name>
            )}
            <StatusBadge
              type="button"
              $color={statusMeta?.color}
              $soft={statusMeta?.soft}
              onClick={() => setStatusAppt(appt)}
              title="Cambiar estado"
            >
              {StatusIcon ? <StatusIcon size={11} /> : null}
              {statusMeta ? statusMeta.label : 'Sin estado'}
            </StatusBadge>
            <DropdownWrap>
              <DropdownButton
                type="button"
                aria-label="Más opciones"
                title="Más opciones"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() =>
                  setOpenMenu((m) =>
                    m?.apptId === appt.id ? null : { apptId: appt.id },
                  )
                }
              >
                <LuEllipsisVertical size={18} />
              </DropdownButton>
              {openMenu?.apptId === appt.id && (
                <Menu onMouseDown={(e) => e.stopPropagation()}>
                  <MenuItem
                    type="button"
                    onClick={() => {
                      setOpenMenu(null)
                      setEditAppt(appt)
                    }}
                  >
                    <LuPencil size={15} color="var(--color-primary)" />
                    Editar
                  </MenuItem>
                  <MenuItem
                    type="button"
                    onClick={() => {
                      setOpenMenu(null)
                      handleDownloadInvoice(appt)
                    }}
                  >
                    <LuReceipt size={15} color="var(--color-gold-ink)" />
                    Ver factura
                  </MenuItem>
                  {(client?.phone || client?.email) && (
                    <>
                      <MenuDivider />
                      {client?.phone && (
                        <>
                          <MenuLink
                            href={`https://wa.me/57${client.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setOpenMenu(null)}
                          >
                            <LuMessageCircle size={15} color="var(--color-success)" />
                            WhatsApp
                          </MenuLink>
                          <MenuLink
                            href={`tel:+57${client.phone}`}
                            onClick={() => setOpenMenu(null)}
                          >
                            <LuPhone size={15} color="var(--color-primary-strong)" />
                            Teléfono
                          </MenuLink>
                        </>
                      )}
                      {client?.email && (
                        <MenuLink
                          href={`mailto:${client.email}`}
                          onClick={() => setOpenMenu(null)}
                        >
                          <LuMail size={15} color="var(--color-gold-ink)" />
                          Correo
                        </MenuLink>
                      )}
                    </>
                  )}
                </Menu>
              )}
            </DropdownWrap>
          </TopRow>

          <ServiceList>
            {apptServices.length > 0 ? (
              apptServices.map((s) => (
                <ServiceRow key={s.id}>
                  <ServiceName>{s.name}</ServiceName>
                  {s.duration ? (
                    <ServiceDuration>
                      {formatDuration(s.duration)}
                    </ServiceDuration>
                  ) : null}
                </ServiceRow>
              ))
            ) : (
              <ServiceRow>
                <ServiceName>Servicio</ServiceName>
              </ServiceRow>
            )}
            {totalDuration ? (
              <TotalRow>
                <TotalLabel>Total</TotalLabel>
                <TotalValue>{formatDuration(totalDuration)}</TotalValue>
                {appt.discountTitle && appt.discountPercent != null && (
                  <DiscountTag title={appt.discountTitle}>
                    -{appt.discountPercent}%
                  </DiscountTag>
                )}
              </TotalRow>
            ) : null}
          </ServiceList>

          {client?.phone && (
            <PhoneLine>
              <LuPhone size={11} />
              {formatPhone(client.phone)}
            </PhoneLine>
          )}
        </Content>
      </Entry>
    )
  }

  const renderFreeSlot = (entry, isLast) => {
    return (
      <Entry key={`free-${entry.startTime}-${entry.endTime}`}>
        <TimeCol>
          <TimeStart $secondary>{formatTime12h(entry.startTime)}</TimeStart>
          <TimeEnd $secondary>{formatTime12h(entry.endTime)}</TimeEnd>
        </TimeCol>
        <Rail>
          <RailDot $hollow />
          <RailLine />
        </Rail>
        <FreeSlotContent $last={isLast}>
          <FreeSlotButton
            type="button"
            onClick={() => {
              setPresetTime(entry.startTime)
              setShowNewAppt(true)
            }}
            aria-label={`Nueva cita a las ${formatTime12h(entry.startTime)}`}
          >
            <FreeLabel>Disponible</FreeLabel>
            <FreePlus>
              <FaPlus size={13} />
            </FreePlus>
          </FreeSlotButton>
        </FreeSlotContent>
      </Entry>
    )
  }

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
        {dayEntries.map((entry, index) => {
          const isLast = index === dayEntries.length - 1
          if (entry.type === 'free') {
            return renderFreeSlot(entry, isLast)
          }
          return renderAppointment(entry.appt, isLast)
        })}
      </List>
    )
  }

  return (
    <>
      <Card>
        {notice && (
          <NoticeWrap>
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
          </NoticeWrap>
        )}
        <Header>
          <HeaderText>
            <HeaderTitle>{isToday ? 'Citas de hoy' : 'Citas del día'}</HeaderTitle>
            <HeaderSub>
              {formatDateShort(dateKey)}
              {!closed &&
                ` · ${appointments.length} ${appointments.length === 1 ? 'cita' : 'citas'}`}
            </HeaderSub>
          </HeaderText>

          <HeaderControls>
            <NavGroup>
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
              <NavButton type="button" onClick={goToPrevDay} aria-label="Día anterior">
                <FaAngleLeft size={16} />
              </NavButton>
              <TodayButton type="button" onClick={goToToday}>
                Hoy
              </TodayButton>
              <NavButton type="button" onClick={goToNextDay} aria-label="Día siguiente">
                <FaAngleRight size={16} />
              </NavButton>
            </NavGroup>
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
          </HeaderControls>
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
          discounts={discounts}
          onCreated={handleAppointmentCreated}
          onClose={() => setShowNewAppt(false)}
        />
      )}
      {statusAppt && (
        <AppointmentStatusModal
          appointment={statusAppt}
          client={clientMap[statusAppt.clientId]}
          services={getAppointmentServices(statusAppt, serviceMap)}
          onSave={(status) => handleStatusChange(statusAppt, status)}
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
          initialDate={selectedDate}
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
          onConfirm={() => handleCancelAppointment(cancelAppt)}
          onClose={() => setCancelAppt(null)}
        />
      )}
    </>
  )
}

export default DayCalendar
