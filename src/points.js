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
  return ids.reduce((sum, id) => {
    const service = list.find((s) => s.id === id)
    return sum + getServicePoints(service)
  }, 0)
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
