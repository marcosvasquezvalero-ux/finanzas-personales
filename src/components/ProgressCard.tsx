import { AppIcon } from './AppIcon'

type ProgressCardProps = {
  actionLabel?: string
  current: string
  onAction?: () => void
  onSecondaryAction?: () => void
  progress: number
  remaining: string
  secondaryActionLabel?: string
  statusLabel?: string
  target: string
  title: string
}

export function ProgressCard({
  actionLabel,
  current,
  onAction,
  onSecondaryAction,
  progress,
  remaining,
  secondaryActionLabel,
  statusLabel,
  target,
  title,
}: ProgressCardProps) {
  return (
    <article className="progress-card">
      <div className="progress-card__header">
        <span className="progress-card__icon">
          <AppIcon name="target" size={20} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{progress}% completado</p>
        </div>
        {statusLabel ? (
          <span className="progress-card__status">{statusLabel}</span>
        ) : null}
        <div className="progress-card__actions">
          {actionLabel && onAction ? (
            <button
              className="progress-card__action"
              type="button"
              onClick={onAction}
            >
              {actionLabel}
            </button>
          ) : null}
          {secondaryActionLabel && onSecondaryAction ? (
            <button
              className="progress-card__action"
              type="button"
              onClick={onSecondaryAction}
            >
              {secondaryActionLabel}
            </button>
          ) : null}
        </div>
      </div>

      <strong>{current}</strong>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <dl className="progress-card__details">
        <div>
          <dt>Meta</dt>
          <dd>{target}</dd>
        </div>
        <div>
          <dt>Restante</dt>
          <dd>{remaining}</dd>
        </div>
      </dl>
    </article>
  )
}
