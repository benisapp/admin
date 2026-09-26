import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { FaPlus, FaXmark } from 'react-icons/fa6'
import IconPicker from './IconPicker'
import { Button, ErrorText, Field, Input, Label, SecondaryButton } from './ui'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
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
  max-width: 460px;
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

const Subtitle = styled.span`
  font-size: 0.8rem;
  color: var(--color-text-muted);
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const CheckRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.25rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  cursor: pointer;
`

const CheckInput = styled.input`
  margin-top: 0.1rem;
  accent-color: var(--color-primary);
  flex-shrink: 0;
`

const Actions = styled.div`
  display: flex;
  gap: 0.625rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--color-border);
`

const newId = () =>
  globalThis.crypto?.randomUUID?.() ||
  `addon-${Date.now()}-${Math.random().toString(36).slice(2)}`

function AddonModal({ addon, onSave, onClose, nested = false }) {
  const [values, setValues] = useState({
    id: addon?.id || newId(),
    name: addon?.name ?? '',
    price: addon?.price ?? '',
    duration: Number(addon?.duration) > 0 ? addon.duration : '',
    points: Number(addon?.points) > 0 ? addon.points : '',
    icon: addon?.icon ?? '',
    incremental: !!addon?.incremental,
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (nested) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, nested])

  const update = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = {}

    if (!values.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.'
    }

    if (values.price === '' || Number.isNaN(Number(values.price)) || Number(values.price) < 0) {
      nextErrors.price = 'El valor debe ser un número mayor o igual que 0.'
    }

    if (
      values.duration !== '' &&
      (Number.isNaN(Number(values.duration)) || Number(values.duration) < 0)
    ) {
      nextErrors.duration = 'La duración debe ser un número mayor o igual que 0.'
    }

    const points = Number(values.points)
    if (
      values.points !== '' &&
      (Number.isNaN(points) || points < 0 || !Number.isInteger(points))
    ) {
      nextErrors.points = 'Los puntos deben ser un entero mayor o igual que 0.'
    }

    if (!values.icon) {
      nextErrors.icon = 'El icono es obligatorio.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onSave({
      id: values.id,
      name: values.name.trim(),
      price: Number(values.price),
      duration: values.duration === '' ? 0 : Number(values.duration),
      points: values.points === '' ? 0 : Number(values.points),
      icon: values.icon,
      incremental: !!values.incremental,
    })
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <div>
            <Title>{addon ? 'Editar adicional' : 'Nuevo adicional'}</Title>
            <Subtitle>Se podrá aceptar o no al agendar una cita.</Subtitle>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label="Cerrar">
            <FaXmark size={16} />
          </CloseButton>
        </Header>

        <form onSubmit={handleSubmit}>
          <Body>
            <Field>
              <Label htmlFor="addon-name">Nombre</Label>
              <Input
                id="addon-name"
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ej. Decoración extra"
                $invalid={!!errors.name}
              />
              {errors.name && <ErrorText>{errors.name}</ErrorText>}
            </Field>

            <Field>
              <Label>Icono</Label>
              <IconPicker
                value={values.icon}
                onChange={(icon) => update('icon', icon)}
              />
              {errors.icon && <ErrorText>{errors.icon}</ErrorText>}
            </Field>

            <Grid>
              <Field style={{ marginBottom: 0 }}>
                <Label htmlFor="addon-price">Valor</Label>
                <Input
                  id="addon-price"
                  type="number"
                  min="0"
                  value={values.price}
                  onChange={(e) => update('price', e.target.value)}
                  placeholder="Ej. 10000"
                  $invalid={!!errors.price}
                />
                {errors.price && <ErrorText>{errors.price}</ErrorText>}
              </Field>

              <Field style={{ marginBottom: 0 }}>
                <Label htmlFor="addon-duration">Duración (min)</Label>
                <Input
                  id="addon-duration"
                  type="number"
                  min="0"
                  value={values.duration}
                  onChange={(e) => update('duration', e.target.value)}
                  placeholder="Ej. 0"
                  $invalid={!!errors.duration}
                />
                {errors.duration && <ErrorText>{errors.duration}</ErrorText>}
              </Field>

              <Field style={{ marginBottom: 0 }}>
                <Label htmlFor="addon-points">Puntos</Label>
                <Input
                  id="addon-points"
                  type="number"
                  min="0"
                  step="1"
                  value={values.points}
                  onChange={(e) => update('points', e.target.value)}
                  placeholder="Ej. 5"
                  $invalid={!!errors.points}
                />
                {errors.points && <ErrorText>{errors.points}</ErrorText>}
              </Field>
            </Grid>

            <CheckRow>
              <CheckInput
                type="checkbox"
                checked={!!values.incremental}
                onChange={(e) => update('incremental', e.target.checked)}
              />
              <span>Cobrar por uña</span>
            </CheckRow>
          </Body>

          <Actions>
            <SecondaryButton type="button" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </SecondaryButton>
            <Button type="submit" style={{ flex: 1 }}>
              <FaPlus size={14} />
              {addon ? 'Guardar adicional' : 'Agregar adicional'}
            </Button>
          </Actions>
        </form>
      </Dialog>
    </Overlay>
  )
}

export default AddonModal
