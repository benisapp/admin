import { useState } from 'react'
import styled from 'styled-components'
import { BARBER_ICONS } from '../utils/barberIcons'
import BarberIcon from './BarberIcon'
import { SecondaryButton } from './ui'

const Wrap = styled.div``

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

function IconPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)

  return (
    <Wrap>
      <IconRow>
        {value ? (
          <IconPreview>
            <BarberIcon id={value} size={22} />
          </IconPreview>
        ) : (
          <IconEmpty>?</IconEmpty>
        )}
        <SecondaryButton type="button" onClick={() => setOpen((v) => !v)}>
          {open ? 'Cerrar' : 'Elegir icono'}
        </SecondaryButton>
        {value && (
          <SecondaryButton type="button" onClick={() => onChange('')}>
            Quitar
          </SecondaryButton>
        )}
      </IconRow>

      {open && (
        <IconGridWrap>
          <IconGrid>
            {BARBER_ICONS.map(({ id, label }) => (
              <IconOption
                key={id}
                type="button"
                title={label}
                $selected={value === id}
                onClick={() => onChange(id)}
              >
                <BarberIcon id={id} size={24} />
                {label}
              </IconOption>
            ))}
          </IconGrid>
        </IconGridWrap>
      )}
    </Wrap>
  )
}

export default IconPicker
