import type { Movement } from '../types/finance'
import { AppIcon } from './AppIcon'

type MovementCardProps = {
  movement: Movement
}

export function MovementCard({ movement }: MovementCardProps) {
  const sign = movement.kind === 'expense' || movement.kind === 'withdrawal'
    ? '-'
    : '+'
  const today = new Date().toISOString().slice(0, 10)
  const dateLabel =
    movement.date === today
      ? 'Hoy'
      : new Intl.DateTimeFormat('es-PE', {
          day: '2-digit',
          month: 'short',
        }).format(new Date(`${movement.date}T12:00:00`))

  return (
    <article className="movement-card">
      <span className={`movement-card__icon ${movement.tone}`}>
        <AppIcon name={movement.icon} size={18} />
      </span>
      <div className="movement-card__body">
        <strong>{movement.title}</strong>
        <span>{movement.subtitle}</span>
        <small>{dateLabel} · Hora pendiente</small>
      </div>
      <span className={`movement-card__amount ${movement.tone}`}>
        {sign}{movement.amount}
      </span>
    </article>
  )
}
