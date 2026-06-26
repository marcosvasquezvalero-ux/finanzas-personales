import { createClient } from '@supabase/supabase-js'

type RequiredEnvKey = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY'

function getRequiredEnvValue(key: RequiredEnvKey) {
  const value = import.meta.env[key]

  if (!value) {
    throw new Error(
      `Falta configurar ${key} en el archivo .env del proyecto Finanzas Personales.`,
    )
  }

  return value
}

function normalizeSupabaseUrl(value: string) {
  const url = new URL(value)

  if (url.pathname.startsWith('/rest/v1')) {
    return url.origin
  }

  return value
}

const supabaseUrl = normalizeSupabaseUrl(getRequiredEnvValue('VITE_SUPABASE_URL'))
const supabaseAnonKey = getRequiredEnvValue('VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
