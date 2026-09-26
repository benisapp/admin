function joinNames(names) {
  if (names.length <= 1) return names[0] || ''
  if (names.length === 2) return `${names[0]} y ${names[1]}`
  return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`
}

export function getAppointmentServices(appointment, serviceMap) {
  const ids = Array.isArray(appointment?.serviceIds) ? appointment.serviceIds : []
  return ids.map((id) => serviceMap?.[id]).filter(Boolean)
}

export function getAppointmentAddons(appointment) {
  return Array.isArray(appointment?.addons)
    ? appointment.addons.filter(Boolean)
    : []
}

function addonQuantity(addon) {
  const quantity = Number(addon?.quantity)
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1
}

export function formatServiceNames(services) {
  const names = (services || []).map((s) => s?.name).filter(Boolean)
  return names.length ? joinNames(names) : 'Servicio'
}

export function formatAddonNames(addons) {
  const names = (addons || [])
    .map((addon) => {
      if (!addon?.name) return null
      const qty = addonQuantity(addon)
      return qty > 1 ? `${addon.name} ×${qty}` : addon.name
    })
    .filter(Boolean)
  return names.length ? joinNames(names) : ''
}

export function apptServiceNames(appointment, serviceMap) {
  return formatServiceNames(getAppointmentServices(appointment, serviceMap))
}

export function apptAddonNames(appointment) {
  return formatAddonNames(getAppointmentAddons(appointment))
}

export function apptFullNames(appointment, serviceMap) {
  const serviceNames = apptServiceNames(appointment, serviceMap)
  const addonNames = apptAddonNames(appointment)
  return addonNames ? `${serviceNames} + ${addonNames}` : serviceNames
}

export function apptTotalDuration(appointment, serviceMap) {
  const servicesTotal = getAppointmentServices(appointment, serviceMap).reduce(
    (sum, s) => sum + (Number(s.duration) || 0),
    0,
  )
  const addonsTotal = getAppointmentAddons(appointment).reduce(
    (sum, a) => sum + (Number(a.duration) || 0) * addonQuantity(a),
    0,
  )
  return servicesTotal + addonsTotal || null
}

export function apptTotalPrice(appointment, serviceMap) {
  const servicesTotal = getAppointmentServices(appointment, serviceMap).reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0,
  )
  const addonsTotal = getAppointmentAddons(appointment).reduce(
    (sum, a) => sum + (Number(a.price) || 0) * addonQuantity(a),
    0,
  )
  return servicesTotal + addonsTotal
}

export function apptTotalPoints(appointment, serviceMap) {
  const servicesTotal = getAppointmentServices(appointment, serviceMap).reduce(
    (sum, s) => sum + (Number(s.points) || 0),
    0,
  )
  const addonsTotal = getAppointmentAddons(appointment).reduce(
    (sum, a) => sum + (Number(a.points) || 0) * addonQuantity(a),
    0,
  )
  return servicesTotal + addonsTotal
}
