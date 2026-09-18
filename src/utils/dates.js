function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function toTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSunday(date) {
  return date.getDay() === 0
}

export function nextWorkingDays(count) {
  const days = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  while (days.length < count) {
    if (!isSunday(cursor)) {
      days.push(new Date(cursor))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function generateSlots(
  durationMinutes,
  { open = '09:00', close = '19:00', step = 0 } = {},
) {
  const openMinutes = toMinutes(open)
  const closeMinutes = toMinutes(close)
  const stepMinutes = step > 0 ? step : durationMinutes
  const slots = []

  for (
    let start = openMinutes;
    start + durationMinutes <= closeMinutes;
    start += stepMinutes
  ) {
    slots.push({
      startTime: toTime(start),
      endTime: toTime(start + durationMinutes),
    })
  }

  return slots
}

export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

export function isSlotInPast(date, startTime) {
  const now = new Date()
  const todayStr = toDateString(now)
  if (date < todayStr) return true
  if (date > todayStr) return false

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return toMinutes(startTime) <= nowMinutes
}

export function formatDateString(date) {
  return toDateString(date)
}

export function formatDateLong(dateString) {
  const [y, m, d] = dateString.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const text = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatTime12h(time) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDayShort(date) {
  const weekday = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })
    .format(date)
    .replace('.', '')
  return {
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    day: date.getDate(),
  }
}

export function startOfWeek(date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const diff = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + diff)
  return start
}

export function addDays(date, amount) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function formatWeekRange(start, end) {
  const startText = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(start)
  const endText = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(end)
  return `${startText} – ${endText}`
}
