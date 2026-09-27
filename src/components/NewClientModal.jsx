import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaTriangleExclamation, FaUserPlus, FaXmark } from 'react-icons/fa6'
import {
  adjustClientPoints,
  createClient,
  normalizePhone,
  updateClient,
} from '../clients'
import { formatDateString } from '../utils/dates'
import {
  Alert,
  Button,
  ErrorText,
  Field,
  Input,
  Label,
  SecondaryButton,
  Spinner,
} from './ui'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
`

const Dialog = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
`

const Title = styled.h2`
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text);
`

const CloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: var(--color-border);
    color: var(--color-text);
  }
`

const Body = styled.div`
  overflow-y: auto;
  padding: 1.25rem;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const Notice = styled.div`
  margin-bottom: 1rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const Hint = styled.p`
  margin: 0.375rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const emptyValues = { name: '', phone: '', email: '', birthday: '' }

function NewClientModal({ client = null, onCreated, onUpdated, onClose }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isEditing = Boolean(client)

  const [values, setValues] = useState(() =>
    client
      ? {
          name: client.name ?? '',
          phone: client.phone ?? '',
          email: client.email ?? '',
          birthday: client.birthday ?? '',
        }
      : emptyValues,
  )
  const [points, setPoints] = useState(() =>
    client ? String(Number(client.points) || 0) : '0',
  )
  // Valor de puntos al abrir el modal: el delta se calcula contra este y no
  // contra un `client.points` que puede cambiar en tiempo real.
  const [initialPoints] = useState(() =>
    client ? Number(client.points) || 0 : 0,
  )
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    const previousOverflow = document.body.style.overflow
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!values.name.trim()) nextErrors.name = 'El nombre es obligatorio.'

    const normalizedPhone = normalizePhone(values.phone)
    if (!normalizedPhone) {
      nextErrors.phone = 'El teléfono es obligatorio.'
    } else if (normalizedPhone.length !== 10) {
      nextErrors.phone = 'Ingresá un celular de 10 dígitos.'
    }

    const email = values.email.trim()
    if (email && !EMAIL_RE.test(email)) {
      nextErrors.email = 'Ingresá un correo electrónico válido.'
    }

    if (values.birthday) {
      const [y, m, d] = values.birthday.split('-').map(Number)
      const birth = new Date(y, m - 1, d)
      if (Number.isNaN(birth.getTime())) {
        nextErrors.birthday = 'Ingresá una fecha válida.'
      } else if (birth > today) {
        nextErrors.birthday = 'La fecha de cumpleaños no puede ser futura.'
      }
    }

    if (isEditing) {
      const parsedPoints = Number(points)
      if (
        points === '' ||
        Number.isNaN(parsedPoints) ||
        parsedPoints < 0 ||
        !Number.isInteger(parsedPoints)
      ) {
        nextErrors.points = 'Ingresá un número entero mayor o igual a 0.'
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    setSubmitError(null)
    try {
      if (isEditing) {
        await updateClient(client.id, {
          name: values.name,
          phone: values.phone,
          email: values.email,
          birthday: values.birthday || null,
        })
        const delta = (Number(points) || 0) - initialPoints
        await adjustClientPoints(client.id, delta)
        onUpdated?.()
      } else {
        const created = await createClient({
          name: values.name,
          phone: values.phone,
          email: values.email,
          birthday: values.birthday || null,
        })
        onCreated(created)
      }
    } catch (err) {
      console.error(err)
      if (err?.code === 'phone-exists') {
        setSubmitError(
          `Ya existe un cliente con ese número${
            err.clientName ? `: ${err.clientName}` : ''
          }. Buscalo por nombre o celular para agendarle la cita.`,
        )
      } else if (err?.code === 'invalid-phone') {
        setSubmitError('Ingresá un celular de 10 dígitos.')
      } else {
        setSubmitError(
          isEditing ? 'No se pudo actualizar la cliente.' : 'No se pudo crear la cliente.',
        )
      }
      setSaving(false)
    }
  }

  return (
    <Overlay
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
    >
      <Dialog role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <Header>
          <Title>{isEditing ? 'Editar cliente' : 'Nueva cliente'}</Title>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <Body>
          <Form onSubmit={handleSubmit}>
            {submitError && (
              <Notice>
                <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
                  {submitError}
                </Alert>
              </Notice>
            )}

            <Row>
              <Field>
                <Label htmlFor="new-client-name">Nombre</Label>
                <Input
                  id="new-client-name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  placeholder="Nombre de la cliente"
                  $invalid={!!errors.name}
                />
                {errors.name && <ErrorText>{errors.name}</ErrorText>}
              </Field>

              <Field>
                <Label htmlFor="new-client-phone">Teléfono</Label>
                <Input
                  id="new-client-phone"
                  name="phone"
                  value={values.phone}
                  onChange={handleChange}
                  placeholder="Ej. 300 123 4567"
                  inputMode="tel"
                  $invalid={!!errors.phone}
                />
                {errors.phone && <ErrorText>{errors.phone}</ErrorText>}
              </Field>
            </Row>

            <Field>
              <Label htmlFor="new-client-email">Email (opcional)</Label>
              <Input
                id="new-client-email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                $invalid={!!errors.email}
              />
              {errors.email && <ErrorText>{errors.email}</ErrorText>}
            </Field>

            <Field>
              <Label htmlFor="new-client-birthday">
                Fecha de cumpleaños (opcional)
              </Label>
              <Input
                id="new-client-birthday"
                name="birthday"
                type="date"
                max={formatDateString(today)}
                value={values.birthday}
                onChange={handleChange}
                $invalid={!!errors.birthday}
              />
              {errors.birthday && <ErrorText>{errors.birthday}</ErrorText>}
              <Hint>Se usa para aplicar el descuento de cumpleaños.</Hint>
            </Field>

            {isEditing && (
              <Field>
                <Label htmlFor="edit-client-points">Puntos</Label>
                <Input
                  id="edit-client-points"
                  name="points"
                  type="number"
                  min="0"
                  step="1"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  $invalid={!!errors.points}
                />
                {errors.points && <ErrorText>{errors.points}</ErrorText>}
              </Field>
            )}
          </Form>
        </Body>

        <Actions>
          <SecondaryButton
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ flex: 1 }}
          >
            Cancelar
          </SecondaryButton>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 1 }}
          >
            {saving ? (
              <>
                <Spinner $light />
                {isEditing ? 'Guardando...' : 'Creando...'}
              </>
            ) : (
              <>
                <FaUserPlus size={15} />
                {isEditing ? 'Guardar cambios' : 'Crear cliente'}
              </>
            )}
          </Button>
        </Actions>
      </Dialog>
    </Overlay>
  )
}

export default NewClientModal
