import { useEffect, useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import {
  FaCalendarDays,
  FaClock,
  FaEye,
  FaEyeSlash,
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

const hideFlash = keyframes`
  0% { opacity: 1; transform: scale(1); }
  40% { opacity: 0.5; transform: scale(0.985); }
  100% { opacity: 1; transform: scale(1); }
`

const chipPop = keyframes`
  0% { opacity: 0; transform: scale(0.5); }
  60% { transform: scale(1.12); }
  100% { opacity: 1; transform: scale(1); }
`

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const SectionTitle = styled.h3`
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ $adminOnly }) =>
    $adminOnly ? 'var(--color-warning, var(--color-info))' : 'var(--color-text)'};
`

const SectionCount = styled.span`
  padding: 0.05rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 800;
  background: var(--color-bg);
  color: var(--color-text-muted);
`

const SectionEmpty = styled.p`
  margin: 0;
  padding: 0.25rem 0.125rem;
  font-size: 0.85rem;
  color: var(--color-text-muted);
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

  ${({ $flash }) =>
    $flash &&
    css`
      animation: ${hideFlash} 0.5s ease;
    `}

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

const AdminOnlyChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--color-warning-soft, var(--color-info-soft));
  color: var(--color-warning, var(--color-info));
  animation: ${chipPop} 0.32s cubic-bezier(0.34, 1.56, 0.64, 1);
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

const AddonsChip = styled.span`
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
  onToggleAdminOnly,
  onScheduleRange,
  onManageAddons,
  onCreate,
}) {
  const [pulseId, setPulseId] = useState(null)
  const pulseTimer = useRef(null)

  useEffect(
    () => () => {
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
    },
    [],
  )

  const handleToggleAdminOnly = (service) => {
    // Se anima solo al ocultar (cuando pasa a ser "solo admin").
    if (!service.adminOnly) {
      setPulseId(service.id)
      if (pulseTimer.current) clearTimeout(pulseTimer.current)
      pulseTimer.current = setTimeout(() => setPulseId(null), 520)
    }
    onToggleAdminOnly(service)
  }

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

  const adminServices = services.filter((service) => service.adminOnly)
  const clientServices = services.filter((service) => !service.adminOnly)

  const renderService = (service) => (
    <Item key={service.id} $flash={pulseId === service.id}>
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
              {service.adminOnly && (
                <AdminOnlyChip>
                  <FaEyeSlash size={11} />
                  Solo admin
                </AdminOnlyChip>
              )}
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
              {Array.isArray(service.addons) && service.addons.length > 0 && (
                <AddonsChip title="Tiene adicionales (gestioná desde el botón Adicionales)">
                  <FaListCheck size={12} />
                  {service.addons.length} adicional
                  {service.addons.length === 1 ? '' : 'es'}
                </AddonsChip>
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
            <IconButton
              type="button"
              title={
                service.adminOnly ? 'Mostrar a clientas' : 'Ocultar a clientas'
              }
              aria-label={
                service.adminOnly ? 'Mostrar a clientas' : 'Ocultar a clientas'
              }
              onClick={() => handleToggleAdminOnly(service)}
            >
              {service.adminOnly ? <FaEye size={15} /> : <FaEyeSlash size={15} />}
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
  )

  return (
    <Sections>
      <Section>
        <SectionTitle $adminOnly>
          <FaEyeSlash size={13} />
          Solo admin
          <SectionCount>{adminServices.length}</SectionCount>
        </SectionTitle>
        {adminServices.length > 0 ? (
          <List>{adminServices.map(renderService)}</List>
        ) : (
          <SectionEmpty>
            No hay servicios de solo admin en esta pestaña.
          </SectionEmpty>
        )}
      </Section>

      <Section>
        <SectionTitle>
          Para clientas
          <SectionCount>{clientServices.length}</SectionCount>
        </SectionTitle>
        {clientServices.length > 0 ? (
          <List>{clientServices.map(renderService)}</List>
        ) : (
          <SectionEmpty>
            No hay servicios para clientas en esta pestaña.
          </SectionEmpty>
        )}
      </Section>
    </Sections>
  )
}

export default ServiceList
