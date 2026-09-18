import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { FaCircleCheck, FaClock, FaTriangleExclamation } from 'react-icons/fa6'
import { Alert, Button, ErrorText, Field, Input, Label, Spinner } from '../components/ui'
import { getSchedule, saveSchedule } from '../settings'

const Wrapper = styled.div`
  flex: 1;
  padding: 2rem;
  max-width: 960px;
  width: 100%;
  margin: 0 auto;

  @media (max-width: 767px) {
    padding: 1.25rem 1rem;
  }
`

const PageHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`

const Title = styled.h1`
  font-size: 1.5rem;
  margin: 0;
  color: var(--color-text);
  padding-left: 0.75rem;
  border-left: 3px solid var(--color-primary);
`

const Subtitle = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
`

const Notice = styled.div`
  margin-bottom: 1rem;
`

const Form = styled.form`
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const Hint = styled.p`
  margin: 0.375rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
`

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  padding-top: 0.25rem;
`

const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
`

const ErrorWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
`

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function toMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function Horarios() {
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [errors, setErrors] = useState({})
  const [values, setValues] = useState({
    openTime: '09:00',
    closeTime: '19:00',
    slotStep: '',
    daysAhead: '3',
  })

  const noticeTimer = useRef(null)

  const showNotice = (tone, text) => {
    setNotice({ tone, text })
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 4000)
  }

  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current)
    }
  }, [])

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const schedule = await getSchedule()
      setValues({
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
        slotStep: schedule.slotStep ? String(schedule.slotStep) : '',
        daysAhead: String(schedule.daysAhead ?? 3),
      })
    } catch (err) {
      console.error(err)
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    load()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!TIME_RE.test(values.openTime)) {
      nextErrors.openTime = 'Ingresá una hora de apertura válida (HH:MM).'
    }

    if (!TIME_RE.test(values.closeTime)) {
      nextErrors.closeTime = 'Ingresá una hora de cierre válida (HH:MM).'
    }

    if (
      !nextErrors.openTime &&
      !nextErrors.closeTime &&
      toMinutes(values.closeTime) <= toMinutes(values.openTime)
    ) {
      nextErrors.closeTime = 'El cierre debe ser después de la apertura.'
    }

    if (values.slotStep !== '') {
      const step = Number(values.slotStep)
      if (Number.isNaN(step) || !Number.isInteger(step) || step < 0) {
        nextErrors.slotStep = 'Ingresá 0 o un número entero de minutos.'
      }
    }

    const days = Number(values.daysAhead)
    if (
      values.daysAhead === '' ||
      Number.isNaN(days) ||
      !Number.isInteger(days) ||
      days < 1 ||
      days > 6
    ) {
      nextErrors.daysAhead = 'Ingresá un número entre 1 y 6.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    setSaving(true)
    try {
      await saveSchedule({
        openTime: values.openTime,
        closeTime: values.closeTime,
        slotStep: values.slotStep === '' ? 0 : Number(values.slotStep),
        daysAhead: Number(values.daysAhead),
      })
      showNotice('success', 'Horario guardado correctamente.')
    } catch (err) {
      console.error(err)
      showNotice('error', 'No se pudo guardar el horario.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Wrapper>
      <PageHeader>
        <div>
          <Title>Horarios</Title>
          <Subtitle>Configurá el horario de atención de tu negocio.</Subtitle>
        </div>
      </PageHeader>

      {notice && (
        <Notice>
          <Alert
            tone={notice.tone}
            icon={
              notice.tone === 'success' ? (
                <FaCircleCheck size={16} />
              ) : (
                <FaTriangleExclamation size={16} />
              )
            }
          >
            {notice.text}
          </Alert>
        </Notice>
      )}

      {loading ? (
        <Loading>
          <Spinner />
          Cargando horario...
        </Loading>
      ) : loadError ? (
        <ErrorWrap>
          <Alert tone="error" icon={<FaTriangleExclamation size={16} />}>
            No se pudo cargar el horario.
          </Alert>
          <Button type="button" onClick={load}>
            Reintentar
          </Button>
        </ErrorWrap>
      ) : (
        <Form onSubmit={handleSubmit}>
          <Row>
            <Field>
              <Label htmlFor="schedule-open">Apertura</Label>
              <Input
                id="schedule-open"
                name="openTime"
                type="time"
                value={values.openTime}
                onChange={handleChange}
                $invalid={!!errors.openTime}
              />
              {errors.openTime && <ErrorText>{errors.openTime}</ErrorText>}
            </Field>

            <Field>
              <Label htmlFor="schedule-close">Cierre</Label>
              <Input
                id="schedule-close"
                name="closeTime"
                type="time"
                value={values.closeTime}
                onChange={handleChange}
                $invalid={!!errors.closeTime}
              />
              {errors.closeTime && <ErrorText>{errors.closeTime}</ErrorText>}
            </Field>
          </Row>

          <Row>
            <Field>
              <Label htmlFor="schedule-step">Intervalo entre turnos (minutos)</Label>
              <Input
                id="schedule-step"
                name="slotStep"
                type="number"
                min="0"
                value={values.slotStep}
                onChange={handleChange}
                placeholder="Automático (duración del servicio)"
                $invalid={!!errors.slotStep}
              />
              {errors.slotStep ? (
                <ErrorText>{errors.slotStep}</ErrorText>
              ) : (
                <Hint>
                  Dejá el campo vacío (o en 0) para que cada turno se ajuste a la
                  duración del servicio.
                </Hint>
              )}
            </Field>

            <Field>
              <Label htmlFor="schedule-days">Días a futuro</Label>
              <Input
                id="schedule-days"
                name="daysAhead"
                type="number"
                min="1"
                max="6"
                value={values.daysAhead}
                onChange={handleChange}
                $invalid={!!errors.daysAhead}
              />
              {errors.daysAhead ? (
                <ErrorText>{errors.daysAhead}</ErrorText>
              ) : (
                <Hint>
                  Días habilitados para agendar (mín. 1, máx. 6). Incluye el día
                  de hoy.
                </Hint>
              )}
            </Field>
          </Row>

          <Actions>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner $light />
                  Guardando...
                </>
              ) : (
                <>
                  <FaClock size={14} />
                  Guardar horario
                </>
              )}
            </Button>
          </Actions>
        </Form>
      )}
    </Wrapper>
  )
}

export default Horarios
