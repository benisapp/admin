import styled from 'styled-components'
import { FaScissors } from 'react-icons/fa6'
import { navItems } from '../navItems'

const Nav = styled.aside`
  width: var(--sidebar-width);
  min-height: 100vh;
  height: 100vh;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem 0.75rem;
  background: var(--color-surface);
  color: var(--color-text-muted);
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;

  @media (min-width: 768px) and (max-width: 1023px) {
    width: var(--sidebar-width-compact);
    padding: 1.25rem 0.5rem;
  }

  @media (max-width: 767px) {
    display: none;
  }
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  margin-bottom: 1.25rem;
  color: var(--color-primary);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: 0.02em;

  @media (min-width: 768px) and (max-width: 1023px) {
    justify-content: center;
    padding: 0.5rem 0;
  }
`

const BrandMark = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary);
  color: var(--color-on-primary);
  flex-shrink: 0;
`

const BrandLabel = styled.span`
  @media (min-width: 768px) and (max-width: 1023px) {
    display: none;
  }
`

const BrandRule = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.25rem 0.75rem 1.25rem;
  color: var(--color-primary);

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--color-border-strong));
  }

  &::after {
    background: linear-gradient(90deg, var(--color-border-strong), transparent);
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    margin: 0.25rem 0.5rem 1.25rem;
  }
`

const BrandDiamond = styled.span`
  width: 6px;
  height: 6px;
  background: var(--color-primary);
  transform: rotate(45deg);
  flex-shrink: 0;
`

const NavItem = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: none;
  border-radius: var(--radius-sm);
  background: ${({ $active }) => ($active ? 'var(--color-primary-soft)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--color-gold-ink)' : 'var(--color-text-muted)')};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, color 0.15s ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%) scaleY(${({ $active }) => ($active ? 1 : 0)});
    width: 3px;
    height: 62%;
    border-radius: 2px;
    background: var(--color-primary);
    transition: transform 0.15s ease;
  }

  &:hover {
    background: ${({ $active }) =>
      $active ? 'rgba(183, 110, 121, 0.2)' : 'rgba(0, 0, 0, 0.04)'};
    color: ${({ $active }) => ($active ? 'var(--color-gold-ink)' : 'var(--color-text)')};
  }

  @media (min-width: 768px) and (max-width: 1023px) {
    justify-content: center;
    padding: 0.65rem 0;
  }
`

const NavLabel = styled.span`
  @media (min-width: 768px) and (max-width: 1023px) {
    display: none;
  }
`

function Sidebar({ active, onNavigate }) {
  return (
    <Nav>
      <Brand>
        <BrandMark>
          <FaScissors size={15} />
        </BrandMark>
        <BrandLabel>Benis</BrandLabel>
      </Brand>

      <BrandRule>
        <BrandDiamond />
      </BrandRule>

      {navItems.map(({ id, label, Icon }) => (
        <NavItem
          key={id}
          type="button"
          $active={active === id}
          onClick={() => onNavigate(id)}
        >
          <Icon size={18} />
          <NavLabel>{label}</NavLabel>
        </NavItem>
      ))}
    </Nav>
  )
}

export default Sidebar
