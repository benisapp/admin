import { doc, getDoc, increment, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import {
  APPOINTMENT_STATUS,
  applyIntervals,
  ensureDayLock,
} from './appointments'

const CLIENTS_COLLECTION = 'clients'
const APPOINTMENTS_COLLECTION = 'appointments'

const ALLOWED_STATUSES = new Set(Object.values(APPOINTMENT_STATUS))

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

// Puntos que le corresponden a una cita según el estado objetivo.
export function getTargetPoints(appointment, services, status) {
  return status === APPOINTMENT_STATUS.ATTENDED
    ? getAppointmentPoints(appointment, services)
    : 0
}

// Actualiza estado y puntos de forma ATÓMICA. Relee la cita y el cliente dentro
// de la transacción para no perder ni duplicar puntos. `extra` permite guardar
// campos adicionales (por ejemplo cancelledAt) en la misma escritura.
//
// `previousClientId` se usa al editar una cita y cambiar de cliente: revierte
// los puntos del cliente anterior y recalcula los del nuevo.
export async function changeAppointmentStatus({
  appointment,
  services,
  newStatus,
  extra = {},
  previousClientId,
}) {
  if (!appointment?.id) {
    throw new Error('Cita inválida.')
  }
  if (!ALLOWED_STATUSES.has(newStatus)) {
    throw new Error('Estado inválido.')
  }

  const apptRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id)

  // Se lee primero (fuera de la transacción) para resolver cliente y fecha
  // actuales; así no se acreditan puntos a un cliente/día desactualizado.
  const snapshot = await getDoc(apptRef)
  const current = snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : appointment
  // La cita puede ser ocasional (sin clienta registrada): en ese caso no se
  // acreditan puntos. `current` es la versión fresca de Firestore.
  const clientId = current.clientId || null
  const clientChanged =
    Boolean(previousClientId) && previousClientId !== clientId

  const clientRef = clientId ? doc(db, CLIENTS_COLLECTION, clientId) : null
  const previousClientRef = clientChanged
    ? doc(db, CLIENTS_COLLECTION, previousClientId)
    : null
  const lockRef = await ensureDayLock(current.date || appointment.date)

  return runTransaction(db, async (transaction) => {
    // Todas las lecturas primero.
    const apptSnap = await transaction.get(apptRef)
    const clientSnap = clientRef ? await transaction.get(clientRef) : null
    const previousClientSnap = previousClientRef
      ? await transaction.get(previousClientRef)
      : null
    const lockSnap = await transaction.get(lockRef)

    const fresh = apptSnap.exists()
      ? { id: apptSnap.id, ...apptSnap.data() }
      : current

    // Sin clienta no hay puntos.
    const target = clientId ? getTargetPoints(fresh, services, newStatus) : 0
    const currentPoints = Number(fresh.pointsAwarded) || 0
    // Si cambió el cliente, los puntos previos no eran de este cliente: se
    // revierten del anterior y se acredita el total al nuevo.
    const delta = clientChanged ? target : target - currentPoints
    const now = new Date().toISOString()

    transaction.update(apptRef, {
      status: newStatus,
      pointsAwarded: target,
      updatedAt: now,
      ...extra,
    })

    if (clientChanged && currentPoints !== 0 && previousClientSnap?.exists()) {
      transaction.update(previousClientRef, {
        points: increment(-currentPoints),
        updatedAt: now,
      })
    }

    if (clientRef && delta !== 0 && clientSnap?.exists()) {
      transaction.update(clientRef, {
        points: increment(delta),
        updatedAt: now,
      })
    }

    // Al cancelar, el horario vuelve a quedar libre.
    if (newStatus === APPOINTMENT_STATUS.CANCELLED) {
      const intervals = (
        lockSnap.exists() ? lockSnap.data().intervals || [] : []
      ).filter((interval) => interval.id !== appointment.id)
      applyIntervals(transaction, lockRef, intervals, now)
    }

    return { status: newStatus, pointsAwarded: target }
  })
}
