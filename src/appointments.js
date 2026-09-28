import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { overlaps } from './utils/dates'

export const APPOINTMENT_STATUS = {
  CONFIRMED: 'confirmed',
  ATTENDED: 'attended',
  MISSED: 'missed',
  CANCELLED: 'cancelled',
}

// Código de error que lanzamos cuando el horario ya está ocupado dentro de la
// transacción, para que la UI pueda mostrar un mensaje específico.
export const SLOT_TAKEN = 'slot-taken'

const APPOINTMENTS_COLLECTION = 'appointments'
const APPOINTMENT_LOCKS_COLLECTION = 'appointmentLocks'

const toAppointment = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

const toAddons = (addons) => (Array.isArray(addons) ? addons : [])

const isActive = (appointment) =>
  appointment.status !== APPOINTMENT_STATUS.CANCELLED

// El SDK web de Firestore no permite leer queries dentro de una transacción
// (transaction.get solo acepta DocumentReference). Para reservar el horario de
// forma atómica guardamos, por cada día, un documento con los intervalos
// ocupados que la transacción sí puede leer y actualizar.
const dayLockRef = (date) => doc(db, APPOINTMENT_LOCKS_COLLECTION, date)

const toIntervals = (appointments) =>
  appointments.filter(isActive).map((a) => ({
    id: a.id,
    startTime: a.startTime,
    endTime: a.endTime || a.startTime,
  }))

function slotTakenError() {
  const error = new Error('El horario ya no está disponible.')
  error.code = SLOT_TAKEN
  return error
}

function findConflict(intervals, startTime, endTime, ignoreId) {
  return intervals.find(
    (interval) =>
      interval.id !== ignoreId &&
      overlaps(startTime, endTime, interval.startTime, interval.endTime),
  )
}

// Guarda los intervalos del día en el documento de bloqueo.
export function applyIntervals(transaction, lockRef, intervals, now) {
  transaction.set(lockRef, { intervals, updatedAt: now }, { merge: true })
}

// Se asegura de que exista el documento de bloqueo del día, sembrado con las
// citas que ya había. La creación se hace dentro de una transacción para que
// dos sembrados concurrentes no se pisen entre sí.
async function ensureDayLock(date) {
  const ref = dayLockRef(date)
  const snapshot = await getDoc(ref)
  if (snapshot.exists()) return ref

  const existing = await getAppointmentsByDate(date)
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(ref)
    if (current.exists()) return
    transaction.set(ref, {
      intervals: toIntervals(existing),
      updatedAt: new Date().toISOString(),
    })
  })
  return ref
}

export async function getAppointmentsByDate(date) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('date', '==', date),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toAppointment)
}

export async function getAppointmentsByRange(startDate, endDate) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toAppointment)
}

// Suscripción en tiempo real a las citas de un día. Devuelve la función para
// desuscribirse.
export function watchAppointmentsByDate(date, onData, onError) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('date', '==', date),
  )
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(toAppointment)),
    onError,
  )
}

// Suscripción en tiempo real a las citas de un rango de fechas.
export function watchAppointmentsByRange(startDate, endDate, onData, onError) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
  )
  return onSnapshot(
    q,
    (snapshot) => onData(snapshot.docs.map(toAppointment)),
    onError,
  )
}

export async function getAppointmentsByClient(clientId) {
  const q = query(
    collection(db, APPOINTMENTS_COLLECTION),
    where('clientId', '==', clientId),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(toAppointment)
}

export async function updateAppointmentStatus(id, status) {
  await updateDoc(doc(db, APPOINTMENTS_COLLECTION, id), {
    status,
    updatedAt: new Date().toISOString(),
  })
}

// Revalida contra las citas reales del día justo antes de la transacción. Es la
// red de seguridad por si el documento de bloqueo quedó desactualizado.
async function assertNoConflict({ date, startTime, endTime, ignoreId }) {
  const appointments = await getAppointmentsByDate(date)
  if (findConflict(toIntervals(appointments), startTime, endTime, ignoreId)) {
    throw slotTakenError()
  }
}

export { ensureDayLock }

export async function updateAppointment(
  id,
  {
    clientId,
    clientName,
    clientPhone,
    serviceIds,
    addons,
    date,
    startTime,
    endTime,
    discountId,
    discountTitle,
    discountPercent,
  },
) {
  const now = new Date().toISOString()
  const apptRef = doc(db, APPOINTMENTS_COLLECTION, id)
  const existing = await getDoc(apptRef)
  const oldDate = existing.exists() ? existing.data().date : date

  await assertNoConflict({ date, startTime, endTime, ignoreId: id })
  const lockRef = await ensureDayLock(date)
  const oldLockRef = oldDate !== date ? await ensureDayLock(oldDate) : lockRef

  await runTransaction(db, async (transaction) => {
    // Lecturas primero.
    const newLockSnap = await transaction.get(lockRef)
    const oldLockSnap =
      oldLockRef === lockRef ? newLockSnap : await transaction.get(oldLockRef)

    const newIntervals = (
      newLockSnap.exists() ? newLockSnap.data().intervals || [] : []
    ).filter((interval) => interval.id !== id)
    if (findConflict(newIntervals, startTime, endTime)) throw slotTakenError()
    newIntervals.push({ id, startTime, endTime })

    transaction.update(apptRef, {
      clientId: clientId || null,
      clientName: clientName?.trim() || null,
      clientPhone: clientPhone || null,
      serviceIds,
      addons: toAddons(addons),
      date,
      startTime,
      endTime,
      discountId: discountId || null,
      discountTitle: discountTitle || null,
      discountPercent: discountPercent ?? null,
      updatedAt: now,
    })
    applyIntervals(transaction, lockRef, newIntervals, now)

    if (oldLockRef !== lockRef) {
      const oldIntervals = (
        oldLockSnap.exists() ? oldLockSnap.data().intervals || [] : []
      ).filter((interval) => interval.id !== id)
      applyIntervals(transaction, oldLockRef, oldIntervals, now)
    }
  })
}

export async function createAppointment({
  clientId,
  clientName,
  clientPhone,
  serviceIds,
  addons,
  date,
  startTime,
  endTime,
  discountId,
  discountTitle,
  discountPercent,
}) {
  const now = new Date().toISOString()
  const addonList = toAddons(addons)

  const ref = doc(collection(db, APPOINTMENTS_COLLECTION))
  const data = {
    clientId: clientId || null,
    clientName: clientName?.trim() || null,
    clientPhone: clientPhone || null,
    serviceIds,
    addons: addonList,
    date,
    startTime,
    endTime,
    discountId: discountId || null,
    discountTitle: discountTitle || null,
    discountPercent: discountPercent ?? null,
    status: APPOINTMENT_STATUS.CONFIRMED,
    createdAt: now,
    updatedAt: now,
  }

  await assertNoConflict({ date, startTime, endTime })
  const lockRef = await ensureDayLock(date)
  await runTransaction(db, async (transaction) => {
    const lockSnap = await transaction.get(lockRef)
    const intervals = lockSnap.exists() ? lockSnap.data().intervals || [] : []
    if (findConflict(intervals, startTime, endTime)) throw slotTakenError()

    transaction.set(ref, data)
    transaction.set(
      lockRef,
      {
        intervals: [...intervals, { id: ref.id, startTime, endTime }],
        updatedAt: now,
      },
      { merge: true },
    )
  })

  return { id: ref.id, ...data }
}
