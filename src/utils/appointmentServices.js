function joinNames(names) {
  if (names.length <= 1) return names[0] || ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function getAppointmentServices(appointment, serviceMap) {
  const ids = Array.isArray(appointment?.serviceIds) ? appointment.serviceIds : []
  return ids.map((id) => serviceMap?.[id]).filter(Boolean)
}

export function formatServiceNames(services) {
  const names = (services || []).map((s) => s?.name).filter(Boolean)
  return names.length ? joinNames(names) : 'Servicio'
}

export function apptServiceNames(appointment, serviceMap) {
  return formatServiceNames(getAppointmentServices(appointment, serviceMap))
}

export function apptTotalDuration(appointment, serviceMap) {
  const total = getAppointmentServices(appointment, serviceMap).reduce(
    (sum, s) => sum + (Number(s.duration) || 0),
    0,
  )
  return total || null
}

export function apptTotalPrice(appointment, serviceMap) {
  return getAppointmentServices(appointment, serviceMap).reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0,
  )
}