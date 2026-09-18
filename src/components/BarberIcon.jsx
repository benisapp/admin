import { ICON_BY_ID } from '../utils/barberIcons'

export default function BarberIcon({ id, size = 24, ...props }) {
  const entry = ICON_BY_ID[id]
  if (!entry) return null
  const { Icon } = entry
  return <Icon size={size} {...props} />
}
