import styled from 'styled-components'
import {
  FaCakeCandles,
  FaCalendarDays,
  FaPencil,
  FaPlus,
  FaPowerOff,
  FaTag,
} from 'react-icons/fa6'
import { formatMonthDay } from '../utils/format'
import { isBirthdayDiscount } from '../discounts'
import { Badge, Button, EmptyState, IconButton } from './ui'

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Item = styled.li`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1rem 1.125rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.15s ease, border-color 0.15s ease;

  &:hover {
    box-shadow: var(--shadow-md);
    border-color: var(--color-border-strong);
  }

  @media (max-width: 767px) {
    flex-wrap: wrap;
    align-items: flex-start;
  }
`

const Icon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: var(--radius-md);
  background: ${({ $birthday }) =>
    $birthday ? 'var(--color-warning-soft, var(--color-primary-soft))' : 'var(--color-primary-soft)'};
  color: ${({ $birthday }) =>
    $birthday ? 'var(--color-warning, var(--color-primary))' : 'var(--color-primary)'};
  flex-shrink: 0;
`

const Info = styled.div`
  flex: 1;
  min-width: 0;
`

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
`

const Name = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text);
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
`

const PercentChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-primary-soft);
  color: var(--color-primary);
`

const RangeChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-info-soft);
  color: var(--color-info);
`

const SystemChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-warning-soft, var(--color-info-soft));
  color: var(--color-warning, var(--color-info));
`

const Actions = styled.div`
  display: flex;
  gap: 0.375rem;
  flex-shrink: 0;

  @media (max-width: 767px) {
    width: 100%;
    justify-content: flex-end;
  }
`

const ServicesChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-bg);
  color: var(--color-text-muted);
`

function DiscountList({ discounts, services, onEdit, onToggleActive, onCreate }) {
  const serviceById = Object.fromEntries(
    (services || []).map((service) => [service.id, service]),
  )

  const serviceNames = (discount) => {
    const ids = Array.isArray(discount.serviceIds) ? discount.serviceIds : []
    return ids.map((id) => serviceById[id]?.name).filter(Boolean)
  }

  if (discounts.length === 0) {
    return (
      <EmptyState
        icon={<FaTag size={26} />}
        title="No hay descuentos"
        description="Todavía no creaste ningún descuento. Empezá agregando el primero."
        action={
          <Button type="button" onClick={onCreate}>
            <FaPlus size={14} />
            Crear descuento
          </Button>
        }
      />
    )
  }

  return (
    <List>
      {discounts.map((discount) => {
        const birthday = isBirthdayDiscount(discount)
        const daysBefore = Math.max(0, Number(discount.birthdayDaysBefore) || 0)
        const daysAfter = Math.max(0, Number(discount.birthdayDaysAfter) || 0)

        return (
          <Item key={discount.id}>
            <Icon $birthday={birthday}>
              {birthday ? <FaCakeCandles size={20} /> : <FaTag size={20} />}
            </Icon>

            <Info>
              <NameRow>
                <Name>{discount.title}</Name>
                {birthday && <SystemChip>Cumpleaños</SystemChip>}
                <Badge $active={discount.active}>
                  {discount.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </NameRow>
              <Meta>
                {typeof discount.percent === 'number' && (
                  <PercentChip>{discount.percent}%</PercentChip>
                )}
                {birthday ? (
                  <RangeChip>
                    <FaCalendarDays size={12} />
                    {daysBefore} día{daysBefore === 1 ? '' : 's'} antes · {daysAfter} día
                    {daysAfter === 1 ? '' : 's'} después
                  </RangeChip>
                ) : (
                  (discount.activeFrom || discount.activeUntil) && (
                    <RangeChip>
                      <FaCalendarDays size={12} />
                      {formatMonthDay(discount.activeFrom) || '—'} →{' '}
                      {formatMonthDay(discount.activeUntil) || '—'}
                    </RangeChip>
                  )
                )}
                <RangeChip>No acumulable</RangeChip>
                {serviceNames(discount).length > 0 && (
                  <ServicesChip title={serviceNames(discount).join(', ')}>
                    {serviceNames(discount).length} servicio
                    {serviceNames(discount).length === 1 ? '' : 's'}
                  </ServicesChip>
                )}
              </Meta>
            </Info>

            <Actions>
              <IconButton
                type="button"
                title="Editar"
                aria-label="Editar descuento"
                onClick={() => onEdit(discount)}
              >
                <FaPencil size={15} />
              </IconButton>
              <IconButton
                type="button"
                $variant={discount.active ? 'danger' : 'success'}
                title={discount.active ? 'Desactivar' : 'Activar'}
                aria-label={discount.active ? 'Desactivar descuento' : 'Activar descuento'}
                onClick={() => onToggleActive(discount)}
              >
                <FaPowerOff size={15} />
              </IconButton>
            </Actions>
          </Item>
        )
      })}
    </List>
  )
}

export default DiscountList