import { FaBan, FaCheck, FaUserCheck, FaUserXmark } from 'react-icons/fa6'
import { APPOINTMENT_STATUS } from './appointments'

export const STATUS_OPTIONS = [
  {
    value: APPOINTMENT_STATUS.CONFIRMED,
    label: 'Confirmada',
    color: 'var(--color-success)',
    soft: 'var(--color-success-soft)',
    Icon: FaCheck,
  },
  {
    value: APPOINTMENT_STATUS.ATTENDED,
    label: 'Asistida',
    color: 'var(--color-info)',
    soft: 'var(--color-info-soft)',
    Icon: FaUserCheck,
  },
  {
    value: APPOINTMENT_STATUS.MISSED,
    label: 'Inasistida',
    color: 'var(--color-danger)',
    soft: 'var(--color-danger-soft)',
    Icon: FaUserXmark,
  },
  {
    value: APPOINTMENT_STATUS.CANCELLED,
    label: 'Cancelada',
    color: 'var(--color-cancelled)',
    soft: 'var(--color-cancelled-soft)',
    Icon: FaBan,
  },
]
