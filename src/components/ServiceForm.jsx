import { useState } from 'react'
import styled from 'styled-components'
import IconPicker from './IconPicker'
import {
  Button,
  ErrorText,
  Field,
  Input,
  Label,
  SecondaryButton,
  Spinner,
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
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`

const emptyValues = {
  name: '',
  duration: '',
  price: '',
  points: '',
  icon: '',
}

function ServiceForm({
  initialValues = emptyValues,
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}) {
  const [values, setValues] = useState({
    name: initialValues.name ?? '',
    duration: initialValues.duration ?? '',
    price: initialValues.price ?? '',
    points: initialValues.points ?? '',
    icon: initialValues.icon ?? '',
  })
  const [errors, setErrors] = useState({})

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
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      name: values.name.trim(),
      duration: Number(values.duration),
      price: Number(values.price),
      points: values.points === '' ? 0 : Number(values.points),
      icon: values.icon,
    })
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label>Icono</Label>
        <IconPicker value={values.icon} onChange={handleIconSelect} />
        {errors.icon && <ErrorText>{errors.icon}</ErrorText>}
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

        <Field>
          <Label htmlFor="service-points">Puntos</Label>
          <Input
            id="service-points"
            name="points"
            type="number"
            min="0"
            step="1"
            value={values.points}
            onChange={handleChange}
            placeholder="Ej. 10"
            $invalid={!!errors.points}
          />
          {errors.points && <ErrorText>{errors.points}</ErrorText>}
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
