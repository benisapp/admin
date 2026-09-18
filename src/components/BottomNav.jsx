import styled from 'styled-components'
import { navItems } from '../navItems'

const Nav = styled.nav`
  display: none;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.08);

  @media (max-width: 767px) {
    display: flex;
  }
`

const Item = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0.25rem;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  border: none;
  background: transparent;
  color: ${({ $active }) =>
    $active ? 'var(--color-primary)' : 'var(--color-text-muted)'};
  cursor: pointer;
`

const Label = styled.span`
  font-size: 0.7rem;
  font-weight: 500;
`

function BottomNav({ active, onNavigate }) {
  return (
    <Nav>
      {navItems.map(({ id, label, Icon }) => (
        <Item
          key={id}
          type="button"
          $active={active === id}
          onClick={() => onNavigate(id)}
        >
          <Icon size={20} />
          <Label>{label}</Label>
        </Item>
      ))}
    </Nav>
  )
}

export default BottomNav
