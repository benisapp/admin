import { useState } from 'react'
import styled from 'styled-components'
import DayCalendar from '../components/DayCalendar'
import WeekCalendar from '../components/WeekCalendar'

const Wrapper = styled.div`
  flex: 1;
  padding: 2rem;
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 767px) {
    padding: 1.25rem 1rem;
  }
`

const CalendarWrap = styled.div`
  margin-top: 1rem;
`

const ViewToggle = styled.div`
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
`

const ToggleButton = styled.button`
  border: none;
  border-radius: var(--radius-sm);
  background: ${({ $active }) =>
    $active ? 'var(--color-primary)' : 'transparent'};
  color: ${({ $active }) =>
    $active ? 'var(--color-on-primary)' : 'var(--color-text-muted)'};
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.45rem 1rem;
  cursor: pointer;

  &:hover {
    color: ${({ $active }) =>
      $active ? 'var(--color-on-primary)' : 'var(--color-text)'};
  }
`

function Inicio({ onOpenClient }) {
  const [view, setView] = useState('day')

  return (
    <Wrapper>
      <ViewToggle>
        <ToggleButton
          type="button"
          $active={view === 'day'}
          onClick={() => setView('day')}
        >
          Día
        </ToggleButton>
        <ToggleButton
          type="button"
          $active={view === 'week'}
          onClick={() => setView('week')}
        >
          Semana
        </ToggleButton>
      </ViewToggle>

      <CalendarWrap>
        {view === 'day' ? (
          <DayCalendar onOpenClient={onOpenClient} />
        ) : (
          <WeekCalendar />
        )}
      </CalendarWrap>
    </Wrapper>
  )
}

export default Inicio
