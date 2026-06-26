import type { ReactNode } from 'react'
import { AppIcon } from './AppIcon'

type ModalProps = {
  children: ReactNode
  isOpen: boolean
  title: string
  onClose: () => void
}

export function Modal({ children, isOpen, title, onClose }: ModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        aria-labelledby="register-modal-title"
        aria-modal="true"
        className="modal-card"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <h2 id="register-modal-title">{title}</h2>
          <button aria-label="Cerrar modal" type="button" onClick={onClose}>
            <AppIcon name="close" size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}
