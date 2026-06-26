import { useState, type FormEvent } from 'react'
import { AppIcon } from './AppIcon'

type LoginScreenProps = {
  error: string | null
  isLoading: boolean
  onSubmit: (email: string, password: string) => Promise<void>
  theme: 'dark' | 'light'
}

export function LoginScreen({
  error,
  isLoading,
  onSubmit,
  theme,
}: LoginScreenProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void onSubmit(email, password)
  }

  return (
    <main className="auth-shell" data-theme={theme}>
      <section className="auth-card" aria-label="Inicio de sesion">
        <img
          alt="M corazon N"
          className="auth-card__logo"
          src="/photos/mn-infinity-logo.png"
        />

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Correo</span>
            <input
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              required
              type="email"
              value={email}
            />
          </label>

          <label>
            <span>Contrasena</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Tu contrasena"
              required
              type="password"
              value={password}
            />
          </label>

          {error ? <p className="auth-form__error">{error}</p> : null}

          <button className="primary-button" disabled={isLoading} type="submit">
            <AppIcon name="wallet" size={17} />
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}
