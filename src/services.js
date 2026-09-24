import {
  addDoc,
  collection,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const SERVICES_COLLECTION = 'services'

const toService = (snapshot) => ({
  id: snapshot.id,
  ...snapshot.data(),
})

export async function fetchServices() {
  const snapshot = await getDocs(collection(db, SERVICES_COLLECTION))
  return snapshot.docs.map(toService)
}

export async function createService({ name, description, duration, price, points, icon }) {
  const now = new Date().toISOString()
  await addDoc(collection(db, SERVICES_COLLECTION), {
    name,
    description,
    duration,
    price,
    points: Number(points) || 0,
    icon,
    active: true,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateService(id, { name, description, duration, price, points, icon }) {
  await updateDoc(doc(db, SERVICES_COLLECTION, id), {
    name,
    description,
    duration,
    price,
    points: Number(points) || 0,
    icon,
    updatedAt: new Date().toISOString(),
  })
}

export async function setServiceActive(id, active) {
  await updateDoc(doc(db, SERVICES_COLLECTION, id), {
    active,
    updatedAt: new Date().toISOString(),
  })
}

export async function setServiceActiveRange(id, { activeFrom, activeUntil }) {
  await updateDoc(doc(db, SERVICES_COLLECTION, id), {
    activeFrom: activeFrom || null,
    activeUntil: activeUntil || null,
    updatedAt: new Date().toISOString(),
  })
}

function toMonthDay(value) {
  if (!value || typeof value !== 'string') return null
  if (value.length === 10 && value[4] === '-') return value.slice(5)
  return value
}

export function isServiceAvailable(service, dateString) {
  if (service.active !== false) return true

  const activeFrom = toMonthDay(service.activeFrom)
  const activeUntil = toMonthDay(service.activeUntil)
  if (!activeFrom && !activeUntil) return false

  const todayMD = dateString.slice(5)

  if (activeFrom && activeUntil) {
    if (activeFrom <= activeUntil) {
      return todayMD >= activeFrom && todayMD <= activeUntil
    }
    return todayMD >= activeFrom || todayMD <= activeUntil
  }

  if (activeFrom) return todayMD >= activeFrom
  if (activeUntil) return todayMD <= activeUntil
  return false
}
