import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const CLIENTS_COLLECTION = 'clients'

export function normalizePhone(value) {
  let digits = (value || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('57')) {
    digits = digits.slice(2)
  }
  return digits
}

export async function getClientByPhone(phone) {
  const normalized = normalizePhone(phone)
  if (!normalized) return null

  const q = query(
    collection(db, CLIENTS_COLLECTION),
    where('phone', '==', normalized),
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const first = snapshot.docs[0]
  return { id: first.id, ...first.data() }
}

export async function fetchClients() {
  const snapshot = await getDocs(collection(db, CLIENTS_COLLECTION))
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export async function createClient({ name, phone, email, birthday }) {
  const normalized = normalizePhone(phone)

  const existing = await getClientByPhone(normalized)
  if (existing) {
    const error = new Error('phone-exists')
    error.code = 'phone-exists'
    error.clientName = existing.name
    throw error
  }

  const now = new Date().toISOString()
  const emailValue = email ? email.trim() : null
  const birthdayValue = birthday || null

  const ref = await addDoc(collection(db, CLIENTS_COLLECTION), {
    name: name.trim(),
    phone: normalized,
    email: emailValue,
    birthday: birthdayValue,
    points: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
  })

  return {
    id: ref.id,
    name: name.trim(),
    phone: normalized,
    email: emailValue,
    birthday: birthdayValue,
    points: 0,
    active: true,
    createdAt: now,
    updatedAt: now,
  }
}
