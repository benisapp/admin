import { doc, increment, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import { APPOINTMENT_STATUS } from './appointments'

const CLIENTS_COLLECTION = 'clients'
const APPOINTMENTS_COLLECTION = 'appointments'

export function getServicePoints(service) {
  const value = Number(service?.points)
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function getAppointmentPoints(appointment, services) {
  const ids = Array.isArray(appointment?.serviceIds) ? appointment.serviceIds : []
  const list = Array.isArray(services) ? services : []
  const servicesTotal = ids.reduce((sum, id) => {
    const service = list.find((s) => s.id === id)
    return sum + getServicePoints(service)
  }, 0)
  const addons = Array.isArray(appointment?.addons) ? appointment.addons : []
  const addonsTotal = addons.reduce((sum, addon) => {
    const value = Number(addon?.points)
    const quantity = Number(addon?.quantity)
    const qty = Number.isFinite(quantity) && quantity > 0 ? quantity : 1
    return sum + (Number.isFinite(value) && value > 0 ? value * qty : 0)
  }, 0)
  return servicesTotal + addonsTotal
}

// Acredita (o revierte) los puntos del cliente según el estado de la cita.
// Se apoya en `pointsAwarded` para no contar dos veces la misma cita.
export async function syncAppointmentPoints({ appointment, services, newStatus }) {
  const current = Number(appointment?.pointsAwarded) || 0
  if (!appointment?.id || !appointment?.clientId) return current

  const target =
    newStatus === APPOINTMENT_STATUS.ATTENDED
      ? getAppointmentPoints(appointment, services)
      : 0

  const delta = target - current
  if (delta === 0) return current

  const now = new Date().toISOString()
  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, appointment.id), {
    pointsAwarded: target,
    updatedAt: now,
  })
  await updateDoc(doc(db, CLIENTS_COLLECTION, appointment.clientId), {
    points: increment(delta),
    updatedAt: now,
  })

  return target
}
