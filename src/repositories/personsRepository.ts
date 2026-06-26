import { supabase } from '../lib/supabase'
import type { PersonRecord } from '../models/personalMovement'

export async function findPersonByCode(code: string): Promise<PersonRecord> {
  const { data, error } = await supabase
    .from('persons')
    .select('id, name, code')
    .eq('code', code)
    .single()

  if (error) {
    throw new Error(`No se pudo leer la persona ${code}: ${error.message}`)
  }

  return data
}
