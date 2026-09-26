import styled from 'styled-components'
import {
  FaCalendarDays,
  FaClock,
  FaListCheck,
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

const AddonsRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
`

const AddonChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  border: 1px dashed var(--color-border-strong);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
`

const AddonChipPrice = styled.span`
  font-weight: 700;
  color: var(--color-primary);
`

const AddonChipUnit = styled.span`
  padding: 0.05rem 0.35rem;
  border-radius: var(--radius-full);
  background: var(--color-info-soft);
  color: var(--color-info);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
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
  tab = 'active',
  onEdit,
  onToggleActive,
  onScheduleRange,
  onManageAddons,
  onCreate,
}) {
  if (services.length === 0) {
    if (tab === 'inactive') {
      return (
        <EmptyState
          icon={<FaScissors size={26} />}
          title="Sin servicios inactivos"
          description="Acá van a aparecer los servicios que desactives."
        />
      )
    }

    if (tab === 'scheduled') {
      return (
        <EmptyState
          icon={<FaCalendarDays size={26} />}
          title="Sin servicios programados"
          description="Acá van a aparecer los servicios activados por rango de fechas."
        />
      )
    }

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
            {Array.isArray(service.addons) && service.addons.length > 0 && (
              <AddonsRow>
                {service.addons.map((addon) => (
                  <AddonChip key={addon.id}>
                    {addon.icon && <BarberIcon id={addon.icon} size={12} />}
                    {addon.name}
                    {typeof addon.price === 'number' && addon.price > 0 && (
                      <AddonChipPrice>+{formatPrice(addon.price)}</AddonChipPrice>
                    )}
                    {addon.incremental && <AddonChipUnit>por uña</AddonChipUnit>}
                  </AddonChip>
                ))}
              </AddonsRow>
            )}
          </Info>

          <Actions>
            <IconButton
              type="button"
              title="Adicionales"
              aria-label="Gestionar adicionales"
              onClick={() => onManageAddons(service)}
            >
              <FaListCheck size={15} />
            </IconButton>
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
