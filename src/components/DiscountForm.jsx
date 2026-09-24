import { useState } from 'react'
import styled from 'styled-components'
import { FaPercent } from 'react-icons/fa6'
import { formatMonthDayLong, formatPrice, monthNameLong } from '../utils/format'
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
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const RangeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const Arrow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 0.5rem;
  color: var(--color-text-muted);
  font-size: 0.9rem;
`

const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`

const Select = styled.select`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }
`

const DateHint = styled.p`
  margin: 0.375rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Note = styled.div`
  padding: 0.75rem 1rem;
  background: var(--color-info-soft);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-md);
  color: var(--color-info);
  font-size: 0.85rem;
  margin-bottom: 1.125rem;
`

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10.5rem, 1fr));
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.5rem;
`

const ServiceChip = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'var(--color-primary)' : 'var(--color-border-strong)'};
  border-radius: var(--radius-sm);
  background: ${({ $active }) =>
    $active ? 'var(--color-primary-soft)' : 'var(--color-surface)'};
  color: ${({ $active }) =>
    $active ? 'var(--color-primary)' : 'var(--color-text)'};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: var(--color-primary);
  }
`

const ServiceChipName = styled.span`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  width: 100%;
`

const ServiceChipCheck = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 1px solid
    ${({ $active }) =>
      $active ? 'var(--color-primary)' : 'var(--color-border-strong)'};
  background: ${({ $active }) =>
    $active ? 'var(--color-primary)' : 'transparent'};
  color: var(--color-on-primary);
  font-size: 0.65rem;
  font-weight: 800;
  flex-shrink: 0;
  margin-left: auto;
`

const ServiceChipMeta = styled.span`
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--color-text-muted);
`

const NoServices = styled.p`
  margin: 0;
  padding: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
`

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function parseMD(md) {
  if (!md || typeof md !== 'string') return { month: '', day: '' }
  const parts = md.split('-')
  if (parts.length !== 2) return { month: '', day: '' }
  const [month, day] = parts.map(Number)
  if (!month || !day) return { month: '', day: '' }
  return { month, day }
}

function toMD(month, day) {
  return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const emptyValues = {
  title: '',
  percent: '',
  serviceIds: [],
  fromMonth: '',
  fromDay: '',
  toMonth: '',
  toDay: '',
}

function DiscountForm({
  initialValues = emptyValues,
  services = [],
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}) {
  const isBirthday = initialValues.type === 'birthday'
  const fromParts = parseMD(initialValues.activeFrom)
  const toParts = parseMD(initialValues.activeUntil)
  const [values, setValues] = useState({
    title: initialValues.title ?? '',
    percent: initialValues.percent ?? '',
    serviceIds: Array.isArray(initialValues.serviceIds)
      ? [...initialValues.serviceIds]
      : [],
    fromMonth: fromParts.month,
    fromDay: fromParts.day,
    toMonth: toParts.month,
    toDay: toParts.day,
    birthdayDaysBefore: initialValues.birthdayDaysBefore ?? '',
    birthdayDaysAfter: initialValues.birthdayDaysAfter ?? '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const fromMD = values.fromMonth && values.fromDay ? toMD(values.fromMonth, values.fromDay) : null
  const toMDValue = values.toMonth && values.toDay ? toMD(values.toMonth, values.toDay) : null

  const toggleService = (id) => {
    setValues((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(id)
        ? prev.serviceIds.filter((sid) => sid !== id)
        : [...prev.serviceIds, id],
    }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!values.title.trim()) {
      nextErrors.title = 'El título es obligatorio.'
    }

    const percent = Number(values.percent)
    if (values.percent === '' || Number.isNaN(percent) || percent <= 0 || percent > 100) {
      nextErrors.percent = 'El porcentaje debe estar entre 1 y 100.'
    }

    if (values.serviceIds.length === 0) {
      nextErrors.serviceIds = 'Elegí al menos un servicio.'
    }

    if (isBirthday) {
      const before = Number(values.birthdayDaysBefore)
      const after = Number(values.birthdayDaysAfter)
      if (
        values.birthdayDaysBefore === '' ||
        Number.isNaN(before) ||
        before < 0 ||
        before > 365
      ) {
        nextErrors.birthdayDays = 'Los días antes deben estar entre 0 y 365.'
      } else if (
        values.birthdayDaysAfter === '' ||
        Number.isNaN(after) ||
        after < 0 ||
        after > 365
      ) {
        nextErrors.birthdayDays = 'Los días después deben estar entre 0 y 365.'
      } else if (before === 0 && after === 0) {
        nextErrors.birthdayDays = 'Indicá al menos un día antes o después.'
      }
    } else if (!fromMD && !toMDValue) {
      nextErrors.range = 'Ingresá al menos una fecha (desde o hasta).'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) return

    onSubmit({
      title: values.title.trim(),
      percent: Number(values.percent),
      serviceIds: values.serviceIds,
      ...(isBirthday
        ? {
            birthdayDaysBefore: Number(values.birthdayDaysBefore),
            birthdayDaysAfter: Number(values.birthdayDaysAfter),
            activeFrom: null,
            activeUntil: null,
          }
        : {
            activeFrom: fromMD,
            activeUntil: toMDValue,
          }),
    })
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Note>
        {isBirthday
          ? 'El descuento de cumpleaños se aplica según la fecha de nacimiento del cliente. No se puede eliminar, pero sí desactivar y editar.'
          : 'Los descuentos no son acumulables: solo se aplica uno por compra.'}
      </Note>

      <Field>
        <Label htmlFor="discount-title">Título</Label>
        <Input
          id="discount-title"
          name="title"
          value={values.title}
          onChange={handleChange}
          placeholder="Ej. Promo de verano"
          $invalid={!!errors.title}
        />
        {errors.title && <ErrorText>{errors.title}</ErrorText>}
      </Field>

      <Row>
        <Field>
          <Label htmlFor="discount-percent">Porcentaje (%)</Label>
          <Input
            id="discount-percent"
            name="percent"
            type="number"
            min="1"
            max="100"
            value={values.percent}
            onChange={handleChange}
            placeholder="Ej. 15"
            $invalid={!!errors.percent}
          />
          {errors.percent && <ErrorText>{errors.percent}</ErrorText>}
        </Field>
      </Row>

      <Field>
        <Label>Servicios que aplican</Label>
        {services.length === 0 ? (
          <NoServices>
            Todavía no hay servicios creados. Creá servicios para poder asignarlos a este
            descuento.
          </NoServices>
        ) : (
          <>
            <ServiceGrid>
              {services.map((service) => {
                const checked = values.serviceIds.includes(service.id)
                return (
                  <ServiceChip
                    key={service.id}
                    type="button"
                    $active={checked}
                    onClick={() => toggleService(service.id)}
                  >
                    <ServiceChipName>
                      {service.name}
                      <ServiceChipCheck $active={checked}>
                        {checked ? '✓' : ''}
                      </ServiceChipCheck>
                    </ServiceChipName>
                    {typeof service.price === 'number' && (
                      <ServiceChipMeta>
                        {formatPrice(service.price)}
                      </ServiceChipMeta>
                    )}
                  </ServiceChip>
                )
              })}
            </ServiceGrid>
            {errors.serviceIds && <ErrorText>{errors.serviceIds}</ErrorText>}
          </>
        )}
      </Field>

      {isBirthday && (
        <Field>
          <Label>Ventana de cumpleaños</Label>
          <Row>
            <Field>
              <Label htmlFor="discount-days-before">Días antes</Label>
              <Input
                id="discount-days-before"
                name="birthdayDaysBefore"
                type="number"
                min="0"
                max="365"
                value={values.birthdayDaysBefore}
                onChange={handleChange}
                placeholder="Ej. 3"
                $invalid={!!errors.birthdayDays}
              />
            </Field>
            <Field>
              <Label htmlFor="discount-days-after">Días después</Label>
              <Input
                id="discount-days-after"
                name="birthdayDaysAfter"
                type="number"
                min="0"
                max="365"
                value={values.birthdayDaysAfter}
                onChange={handleChange}
                placeholder="Ej. 7"
                $invalid={!!errors.birthdayDays}
              />
            </Field>
          </Row>
          {errors.birthdayDays && <ErrorText>{errors.birthdayDays}</ErrorText>}
          <DateHint>
            La promo se activa desde {Number(values.birthdayDaysBefore) || 0} día
            {(Number(values.birthdayDaysBefore) || 0) === 1 ? '' : 's'} antes hasta{' '}
            {Number(values.birthdayDaysAfter) || 0} día
            {(Number(values.birthdayDaysAfter) || 0) === 1 ? '' : 's'} después del
            cumpleaños.
          </DateHint>
        </Field>
      )}

      {!isBirthday && (
        <Field>
        <Label>Rango de fechas</Label>
        <RangeRow>
          <div>
            <Label>Desde</Label>
            <GridRow>
              <Select
                value={values.fromMonth}
                onChange={handleChange}
                name="fromMonth"
                aria-label="Mes desde"
              >
                <option value="">Mes</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {monthNameLong(m)}
                  </option>
                ))}
              </Select>
              <Select
                value={values.fromDay}
                onChange={handleChange}
                name="fromDay"
                aria-label="Día desde"
              >
                <option value="">Día</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </GridRow>
            {fromMD && <DateHint>{formatMonthDayLong(fromMD)}</DateHint>}
          </div>

          <Arrow>→</Arrow>

          <div>
            <Label>Hasta</Label>
            <GridRow>
              <Select
                value={values.toMonth}
                onChange={handleChange}
                name="toMonth"
                aria-label="Mes hasta"
              >
                <option value="">Mes</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {monthNameLong(m)}
                  </option>
                ))}
              </Select>
              <Select
                value={values.toDay}
                onChange={handleChange}
                name="toDay"
                aria-label="Día hasta"
              >
                <option value="">Día</option>
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </GridRow>
            {toMDValue && <DateHint>{formatMonthDayLong(toMDValue)}</DateHint>}
          </div>
        </RangeRow>
        {errors.range && <ErrorText>{errors.range}</ErrorText>}
        </Field>
      )}

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
            <>
              <FaPercent size={14} />
              {submitLabel}
            </>
          )}
        </Button>
      </Actions>
    </Form>
  )
}

export default DiscountForm