import styled, { keyframes } from 'styled-components'

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.6rem 1.1rem;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
  cursor: pointer;
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: 0 1px 2px rgba(31, 24, 10, 0.12);
  transition: background 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;

  &:hover {
    background: var(--color-primary-strong);
    box-shadow: 0 4px 14px rgba(183, 110, 121, 0.3);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: none;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }
`

export const SecondaryButton = styled(Button)`
  background: var(--color-surface);
  color: var(--color-gold-ink);
  border-color: var(--color-border-strong);
  box-shadow: none;
  font-weight: 700;

  &:hover {
    background: var(--color-primary-soft);
    border-color: var(--color-primary);
    box-shadow: none;
  }
`

export const DangerButton = styled(Button)`
  background: var(--color-surface);
  color: var(--color-danger);
  border-color: var(--color-danger-border);
  box-shadow: none;
  font-weight: 700;

  &:hover {
    background: var(--color-danger-soft);
    box-shadow: none;
  }
`

export const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: ${({ $variant }) => {
    if ($variant === 'danger') return 'var(--color-danger)'
    if ($variant === 'success') return 'var(--color-success)'
    return 'var(--color-text-muted)'
  }};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: ${({ $variant }) => {
      if ($variant === 'danger') return 'var(--color-danger-soft)'
      if ($variant === 'success') return 'var(--color-success-soft)'
      return 'var(--color-bg)'
    }};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const Input = styled.input`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: var(--color-text-subtle);
  }

  &:hover {
    border-color: var(--color-text-subtle);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }

  ${({ $invalid }) =>
    $invalid &&
    `
    border-color: var(--color-danger);
    &:focus {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 3px var(--color-danger-soft);
    }
  `}
`

export const Textarea = styled.textarea`
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface);
  resize: vertical;
  min-height: 84px;
  font-family: inherit;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: var(--color-text-subtle);
  }

  &:hover {
    border-color: var(--color-text-subtle);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-soft);
  }

  ${({ $invalid }) =>
    $invalid &&
    `
    border-color: var(--color-danger);
    &:focus {
      border-color: var(--color-danger);
      box-shadow: 0 0 0 3px var(--color-danger-soft);
    }
  `}
`

export const Label = styled.label`
  display: block;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-gold-ink);
  margin-bottom: 0.375rem;
`

export const Field = styled.div`
  margin-bottom: 1.125rem;
`

export const ErrorText = styled.p`
  margin: 0.375rem 0 0;
  font-size: 0.8rem;
  color: var(--color-danger);
`

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.2rem 0.625rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  background: ${({ $active }) =>
    $active ? 'var(--color-success-soft)' : 'var(--color-bg)'};
  color: ${({ $active }) =>
    $active ? 'var(--color-success)' : 'var(--color-text-muted)'};

  &::before {
    content: '';
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
`

export const Card = styled.div`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
`

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`

export const Spinner = styled.span`
  display: inline-block;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  border: 2px solid ${({ $light }) => ($light ? 'rgba(255, 255, 255, 0.4)' : 'var(--color-border)')};
  border-top-color: ${({ $light }) => ($light ? 'var(--color-on-primary)' : 'var(--color-primary)')};
  animation: ${spin} 0.6s linear infinite;
  flex-shrink: 0;
`

const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
`

const EmptyIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border: 1px solid var(--color-border-strong);
  margin-bottom: 1rem;
`

const EmptyTitle = styled.p`
  margin: 0;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text);
`

const EmptyText = styled.p`
  margin: 0.375rem 0 1rem;
  font-size: 0.875rem;
  max-width: 22rem;
`

export function EmptyState({ icon, title, description, action }) {
  return (
    <EmptyWrap>
      {icon && <EmptyIcon>{icon}</EmptyIcon>}
      {title && <EmptyTitle>{title}</EmptyTitle>}
      {description && <EmptyText>{description}</EmptyText>}
      {action}
    </EmptyWrap>
  )
}

const alertTone = {
  success: {
    bg: 'var(--color-success-soft)',
    color: 'var(--color-success)',
    border: 'var(--color-success)',
  },
  error: {
    bg: 'var(--color-danger-soft)',
    color: 'var(--color-danger)',
    border: 'var(--color-danger)',
  },
  info: {
    bg: 'var(--color-info-soft)',
    color: 'var(--color-info)',
    border: 'var(--color-info)',
  },
}

const AlertBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid ${({ $tone }) => alertTone[$tone].border};
  background: ${({ $tone }) => alertTone[$tone].bg};
  color: ${({ $tone }) => alertTone[$tone].color};
`

export function Alert({ tone = 'info', icon, children }) {
  return (
    <AlertBox $tone={tone}>
      {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
      <span>{children}</span>
    </AlertBox>
  )
}

export const BottomBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
  padding: 0.75rem 1.25rem calc(0.75rem + env(safe-area-inset-bottom, 0px));
`

export const BottomBarInner = styled.div`
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  gap: 0.625rem;
`

export const BottomPrimary = styled(Button)`
  flex: 1;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.95rem;
`

export const BarSpacer = styled.div`
  height: 6rem;
`
