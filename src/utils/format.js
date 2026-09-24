export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

const priceFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatPrice(value) {
  return priceFormatter.format(value)
}

const MONTHS_SHORT = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

const MONTHS_LONG = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

function mdToParts(md) {
  if (!md || typeof md !== 'string') return null
  const [month, day] = md.split('-').map(Number)
  if (!month || !day || month < 1 || month > 12) return null
  return { month, day }
}

export function formatMonthDay(md) {
  const parts = mdToParts(md)
  if (!parts) return '—'
  return `${parts.day} ${MONTHS_SHORT[parts.month - 1]}`
}

export function formatMonthDayLong(md) {
  const parts = mdToParts(md)
  if (!parts) return '—'
  return `${parts.day} de ${MONTHS_LONG[parts.month - 1]}`
}

export function monthNameShort(index) {
  return MONTHS_SHORT[index - 1] || ''
}

export function monthNameLong(index) {
  return MONTHS_LONG[index - 1] || ''
}
