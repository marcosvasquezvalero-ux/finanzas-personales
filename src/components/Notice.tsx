import { AppIcon } from './AppIcon'

type NoticeProps = {
  message: string | null
  onClose: () => void
}

export function Notice({ message, onClose }: NoticeProps) {
  if (!message) {
    return null
  }

  return (
    <div className="notice" role="status">
      <span>{message}</span>
      <button aria-label="Cerrar mensaje" type="button" onClick={onClose}>
        <AppIcon name="close" size={16} />
      </button>
    </div>
  )
}
