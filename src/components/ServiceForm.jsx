import { useState } from 'react'
import styled from 'styled-components'
import { BARBER_ICONS } from '../utils/barberIcons'
import BarberIcon from './BarberIcon'
import {
  Button,
  ErrorText,
  Field,
  Input,
  Label,
  SecondaryButton,
  Spinner,
  Textarea,
} from './ui'

const Form = styled.form`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--shadow-sm);
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.25rem;
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`

const IconPreview = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  flex-shrink: 0;
`

const IconEmpty = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  color: var(--color-text-subtle);
  flex-shrink: 0;
`

const IconGridWrap = styled.div`
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem;
  margin-top: 0.5rem;
`

const IconGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(3.5rem, 1fr));
  gap: 0.5rem;
`

const IconOption = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.25rem;
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--color-primary)' : 'var(--color-border)')};
  border-radius: var(--radius-sm);
  background: ${({ $selected }) => ($selected ? 'var(--color-primary-soft)' : 'var(--color-surface-alt)')};
  color: ${({ $selected }) => ($selected ? 'var(--color-primary)' : 'var(--color-text)')};
  cursor: pointer;
  font-size: 0.7rem;

  &:hover {
    border-color: var(--color-primary);
  }
`

const emptyValues = { name: '', description: '', duration: '', price: '', icon: '' }

function ServiceForm({
  initialValues = emptyValues,
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}) {
  const [values, setValues] = useState({
    name: initialValues.name ?? '',
    description: initialValues.description ?? '',
    duration: initialValues.duration ?? '',
    price: initialValues.price ?? '',
    icon: initialValues.icon ?? '',
  })
  const [errors, setErrors] = useState({})
  const [showIcons, setShowIcons] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleIconSelect = (iconId) => {
    setValues((prev) => ({ ...prev, icon: iconId }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!values.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.'
    }

    const duration = Number(values.duration)
    if (values.duration === '' || Number.isNaN(duration) || duration <= 0) {
      nextErrors.duration = 'La duración debe ser un número mayor que 0.'
    }

    const price = Number(values.price)
    if (values.price === '' || Number.isNaN(price) || price < 0) {
      nextErrors.price = 'El valor debe ser un número mayor o igual que 0.'
    }

    if (!values.icon) {
      nextErrors.icon = 'El icono es obligatorio.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      name: values.name.trim(),
      description: values.description.trim(),
      duration: Number(values.duration),
      price: Number(values.price),
      icon: values.icon,
    })
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label>Icono</Label>
        <IconRow>
          {values.icon ? (
            <IconPreview>
              <BarberIcon id={values.icon} size={22} />
            </IconPreview>
          ) : (
            <IconEmpty>?</IconEmpty>
          )}
          <SecondaryButton type="button" onClick={() => setShowIcons((v) => !v)}>
            {showIcons ? 'Cerrar' : 'Elegir icono'}
          </SecondaryButton>
          {values.icon && (
            <SecondaryButton type="button" onClick={() => handleIconSelect('')}>
              Quitar
            </SecondaryButton>
          )}
        </IconRow>
        {errors.icon && <ErrorText>{errors.icon}</ErrorText>}
        {showIcons && (
          <IconGridWrap>
            <IconGrid>
              {BARBER_ICONS.map(({ id, label }) => (
                <IconOption
                  key={id}
                  type="button"
                  title={label}
                  $selected={values.icon === id}
                  onClick={() => handleIconSelect(id)}
                >
                  <BarberIcon id={id} size={24} />
                  {label}
                </IconOption>
              ))}
            </IconGrid>
          </IconGridWrap>
        )}
      </Field>

      <Field>
        <Label htmlFor="service-name">Nombre</Label>
        <Input
          id="service-name"
          name="name"
          value={values.name}
          onChange={handleChange}
          placeholder="Ej. Corte de cabello"
          $invalid={!!errors.name}
        />
        {errors.name && <ErrorText>{errors.name}</ErrorText>}
      </Field>

      <Field>
        <Label htmlFor="service-description">Descripción</Label>
        <Textarea
          id="service-description"
          name="description"
          value={values.description}
          onChange={handleChange}
          placeholder="Descripción opcional"
        />
      </Field>

      <Row>
        <Field>
          <Label htmlFor="service-duration">Duración (minutos)</Label>
          <Input
            id="service-duration"
            name="duration"
            type="number"
            min="1"
            value={values.duration}
            onChange={handleChange}
            placeholder="Ej. 45"
            $invalid={!!errors.duration}
          />
          {errors.duration && <ErrorText>{errors.duration}</ErrorText>}
        </Field>

        <Field>
          <Label htmlFor="service-price">Valor</Label>
          <Input
            id="service-price"
            name="price"
            type="number"
            min="0"
            value={values.price}
            onChange={handleChange}
            placeholder="Ej. 50000"
            $invalid={!!errors.price}
          />
          {errors.price && <ErrorText>{errors.price}</ErrorText>}
        </Field>
      </Row>

      <Actions>
        {onCancel && (
          <SecondaryButton
            type="button"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancelar
          </SecondaryButton>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Spinner $light />
              Guardando...
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </Actions>
    </Form>
  )
}

export default ServiceForm
