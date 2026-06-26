import type { CategorySummary } from '../types/finance'
import { AppIcon } from './AppIcon'

type CategoryPillProps = {
  category: CategorySummary
}

export function CategoryPill({ category }: CategoryPillProps) {
  return (
    <article className="category-card">
      <span className={`category-card__icon ${category.tone}`}>
        <AppIcon name={category.icon} size={18} />
      </span>
      <div>
        <strong>{category.label}</strong>
        <span>{category.amount}</span>
      </div>
    </article>
  )
}
