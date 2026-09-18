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

export async function createService({ name, description, duration, price, icon }) {
  const now = new Date().toISOString()
  await addDoc(collection(db, SERVICES_COLLECTION), {
    name,
    description,
    duration,
    price,
    icon,
    active: true,
    createdAt: now,
    updatedAt: now,
  })
}

export async function updateService(id, { name, description, duration, price, icon }) {
  await updateDoc(doc(db, SERVICES_COLLECTION, id), {
    name,
    description,
    duration,
    price,
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
