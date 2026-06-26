import type { QuickAction } from '../types/finance'
import { AppIcon } from './AppIcon'

type BigActionButtonProps = {
  action: QuickAction
  onClick?: () => void
}

export function BigActionButton({ action, onClick }: BigActionButtonProps) {
  return (
    <button className={`big-action ${action.tone}`} type="button" onClick={onClick}>
      <span>
        <AppIcon name={action.icon} />
      </span>
      <strong>{action.label}</strong>
    </button>
  )
}
