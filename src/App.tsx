import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ExportReportForm } from './components/ExportReportForm'
import { LoginScreen } from './components/LoginScreen'
import { Modal } from './components/Modal'
import { MovementForm } from './components/MovementForm'
import { Notice } from './components/Notice'
import { AppLayout } from './layouts/AppLayout'
import { HomePage } from './pages/HomePage'
import { supabase } from './lib/supabase'
import {
  signInWithEmailPassword,
  signOut as signOutUser,
} from './services/authService'
import { testSupabaseConnection } from './services/supabaseConnectionService'
import type { AppSection } from './types/finance'

type EditableSection = Exclude<AppSection, 'summary' | 'gym'>

type ModalState =
  | { type: 'movement-form'; section: EditableSection }
  | { type: 'export-report'; module: EditableSection | 'general' }

function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('summary')
  const [modalState, setModalState] = useState<ModalState | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const closeModal = () => setModalState(null)

  const showVisualMessage = (message: string) => {
    setNotice(message)
    closeModal()
  }

  const testPersonsAfterAuth = () => {
    if (!import.meta.env.DEV) return

    void testSupabaseConnection()
  }

  const handleLogin = async (email: string, password: string) => {
    setIsLoginLoading(true)
    setAuthError(null)

    try {
      const nextSession = await signInWithEmailPassword(email, password)
      setSession(nextSession)
      testPersonsAfterAuth()
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesion. Revisa tus credenciales.',
      )
    } finally {
      setIsLoginLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      setSession(null)
      setActiveSection('summary')
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : 'No se pudo cerrar la sesion.',
      )
    }
  }

  useEffect(() => {
    let isMounted = true

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return

      if (error) {
        setAuthError(error.message)
      }

      setSession(data.session)
      setIsAuthLoading(false)

      if (data.session) {
        testPersonsAfterAuth()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (nextSession) {
        setAuthError(null)
        testPersonsAfterAuth()
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (isAuthLoading) {
    return (
      <main className="auth-shell" data-theme={theme}>
        <section className="auth-card auth-card--loading">
          <img
            alt="M corazon N"
            className="auth-card__logo"
            src="/photos/mn-infinity-logo.png"
          />
          <span className="auth-card__eyebrow">Verificando sesion</span>
          <h1>Preparando tus finanzas</h1>
          <p>Estamos revisando si ya tienes una sesion activa.</p>
        </section>
      </main>
    )
  }

  if (!session) {
    return (
      <LoginScreen
        error={authError}
        isLoading={isLoginLoading}
        onSubmit={handleLogin}
        theme={theme}
      />
    )
  }

  return (
    <AppLayout
      activeSection={activeSection}
      onNavigate={setActiveSection}
      onSignOut={handleSignOut}
      onToggleTheme={() =>
        setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
      }
      theme={theme}
      userEmail={session.user.email ?? null}
    >
      <HomePage
        activeSection={activeSection}
        onExport={(module) => setModalState({ type: 'export-report', module })}
        onNewMovement={(section) =>
          setModalState({ type: 'movement-form', section })
        }
        onTransferTripBalance={() =>
          setNotice('Accion visual lista. Aun no guarda datos.')
        }
      />

      <Notice message={notice} onClose={() => setNotice(null)} />

      <Modal
        isOpen={modalState !== null}
        title={
          modalState?.type === 'movement-form'
            ? 'Movimiento avanzado'
            : modalState?.type === 'export-report'
              ? 'Exportar reporte'
              : ''
        }
        onClose={closeModal}
      >
        {modalState?.type === 'movement-form' ? (
          <MovementForm
            section={modalState.section}
            onCancel={closeModal}
            onSubmitVisual={() =>
              showVisualMessage('Movimiento visual listo. Aun no se guardo.')
            }
          />
        ) : null}

        {modalState?.type === 'export-report' ? (
          <ExportReportForm
            module={modalState.module}
            onCancel={closeModal}
            onGenerate={() =>
              showVisualMessage(
                'La generacion de PDF se implementara al conectar Supabase.',
              )
            }
          />
        ) : null}
      </Modal>
    </AppLayout>
  )
}

export default App
