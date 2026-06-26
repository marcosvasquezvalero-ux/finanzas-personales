import type { ReactNode } from 'react'
import { AppIcon } from '../components/AppIcon'
import type { AppSection } from '../types/finance'
import { navigationItems } from '../utils/mockData'

type AppLayoutProps = {
  children: ReactNode
  activeSection: AppSection
  onNavigate: (section: AppSection) => void
  onSignOut: () => void
  onToggleTheme: () => void
  theme: 'dark' | 'light'
  userEmail?: string | null
}

export function AppLayout({
  children,
  activeSection,
  onNavigate,
  onSignOut,
  onToggleTheme,
  theme,
  userEmail,
}: AppLayoutProps) {
  const today = new Intl.DateTimeFormat('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date())

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="top-navigation" aria-label="Navegacion principal">
        <div className="top-navigation__brand">
          <img
            alt="M corazon N"
            className="top-navigation__logo"
            src="/photos/mn-infinity-logo.png"
          />
        </div>

        <nav className="top-navigation__menu" aria-label="Secciones">
          {navigationItems.map((item) => (
            <button
              className={`top-navigation__link ${
                activeSection === item.id ? 'is-active' : ''
              }`}
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
            >
              <AppIcon name={item.icon} size={15} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="top-navigation__meta">
          <time dateTime={new Date().toISOString()}>
            <AppIcon name="calendar" size={15} />
            <span>{today}</span>
          </time>
          <button
            aria-label="Cambiar tema"
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
          >
            <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
            <span>{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>
          <button
            aria-label="Cerrar sesion"
            className="sign-out-button"
            title={userEmail ?? undefined}
            type="button"
            onClick={onSignOut}
          >
            <AppIcon name="close" size={15} />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </header>

      <div className="app-main">
        <main className="app-content">{children}</main>
      </div>
    </div>
  )
}
