import type { BalanceSummary } from '../types/finance'
import { AppIcon } from './AppIcon'

type StatCardProps = {
  item: BalanceSummary
}

export function StatCard({ item }: StatCardProps) {
  return (
    <article className={`stat-card ${item.tone}`}>
      <div className="stat-card__top">
        <span>
          <AppIcon name={item.icon} size={18} />
        </span>
        <small>{item.label}</small>
      </div>
      <strong>{item.amount}</strong>
      <p>{item.description}</p>
    </article>
  )
}
