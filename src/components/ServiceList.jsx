import styled from 'styled-components'
import {
  FaCalendarDays,
  FaClock,
  FaPencil,
  FaPlus,
  FaPowerOff,
  FaScissors,
  FaStar,
} from 'react-icons/fa6'
import { formatDuration, formatMonthDay, formatPrice } from '../utils/format'
import BarberIcon from './BarberIcon'
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
  background: var(--color-primary-soft);
  color: var(--color-primary);
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

const Description = styled.p`
  margin: 0.125rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
`

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--color-bg);
  color: var(--color-text-muted);
`

const PriceChip = styled.span`
  display: inline-flex;
  align-items: center;
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
  font-weight: 600;
  background: var(--color-info-soft);
  color: var(--color-info);
`

const PointsChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 700;
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

function ServiceList({
  services,
  onEdit,
  onToggleActive,
  onScheduleRange,
  onCreate,
}) {
  if (services.length === 0) {
    return (
      <EmptyState
        icon={<FaScissors size={26} />}
        title="No hay servicios"
        description="Todavía no creaste ningún servicio. Empezá agregando el primero."
        action={
          <Button type="button" onClick={onCreate}>
            <FaPlus size={14} />
            Crear servicio
          </Button>
        }
      />
    )
  }

  return (
    <List>
      {services.map((service) => (
        <Item key={service.id}>
          {service.icon && (
            <Icon>
              <BarberIcon id={service.icon} size={22} />
            </Icon>
          )}

          <Info>
            <NameRow>
              <Name>{service.name}</Name>
              <Badge $active={service.active}>
                {service.active ? 'Activo' : 'Inactivo'}
              </Badge>
            </NameRow>
            {service.description && (
              <Description>{service.description}</Description>
            )}
            <Meta>
              <Chip>
                <FaClock size={12} />
                {formatDuration(service.duration)}
              </Chip>
              {typeof service.price === 'number' && (
                <PriceChip>{formatPrice(service.price)}</PriceChip>
              )}
              {Number(service.points) > 0 && (
                <PointsChip>
                  <FaStar size={11} />
                  {Number(service.points)} pt{Number(service.points) === 1 ? '' : 's'}
                </PointsChip>
              )}
              {!service.active && (service.activeFrom || service.activeUntil) && (
                <RangeChip>
                  <FaCalendarDays size={12} />
                  {formatMonthDay(service.activeFrom) || '—'} →{' '}
                  {formatMonthDay(service.activeUntil) || '—'}
                </RangeChip>
              )}
            </Meta>
          </Info>

          <Actions>
            <IconButton
              type="button"
              title="Editar"
              aria-label="Editar servicio"
              onClick={() => onEdit(service)}
            >
              <FaPencil size={15} />
            </IconButton>
            {!service.active && (
              <IconButton
                type="button"
                $variant={service.activeFrom || service.activeUntil ? 'success' : undefined}
                title="Activar por rango de fechas"
                aria-label="Activar por rango de fechas"
                onClick={() => onScheduleRange(service)}
              >
                <FaCalendarDays size={15} />
              </IconButton>
            )}
            <IconButton
              type="button"
              $variant={service.active ? 'danger' : 'success'}
              title={service.active ? 'Desactivar' : 'Activar'}
              aria-label={service.active ? 'Desactivar servicio' : 'Activar servicio'}
              onClick={() => onToggleActive(service)}
            >
              <FaPowerOff size={15} />
            </IconButton>
          </Actions>
        </Item>
      ))}
    </List>
  )
}

export default ServiceList
