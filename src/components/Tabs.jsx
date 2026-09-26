import styled from 'styled-components'

const Wrap = styled.div`
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  margin-bottom: 1rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
`

const TabButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: var(--radius-full);
  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'transparent')};
  color: ${({ $active }) =>
    $active ? 'var(--color-on-primary)' : 'var(--color-text-muted)'};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: ${({ $active }) =>
      $active ? 'var(--color-on-primary)' : 'var(--color-text)'};
  }
`

const Count = styled.span`
  padding: 0.05rem 0.4rem;
  border-radius: var(--radius-full);
  background: ${({ $active }) =>
    $active ? 'rgba(255, 255, 255, 0.28)' : 'var(--color-surface)'};
  font-size: 0.72rem;
  font-weight: 800;
`

function Tabs({ items, value, onChange }) {
  return (
    <Wrap>
      {items.map((item) => {
        const active = item.key === value
        return (
          <TabButton
            key={item.key}
            type="button"
            $active={active}
            aria-pressed={active}
            onClick={() => onChange(item.key)}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <Count $active={active}>{item.count}</Count>
            )}
          </TabButton>
        )
      })}
    </Wrap>
  )
}

export default Tabs
