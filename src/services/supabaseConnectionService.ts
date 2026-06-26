import { supabase } from '../lib/supabase'

export type PersonRecord = {
  code: string
  id: string
  name: string
}

export async function fetchPersons() {
  const { data, error } = await supabase
    .from('persons')
    .select('id, name, code')
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(`No se pudo leer la tabla persons: ${error.message}`)
  }

  return (data ?? []) as PersonRecord[]
}

export async function testSupabaseConnection() {
  try {
    const persons = await fetchPersons()
    const expectedCodes = new Set(['marcos', 'nayeli'])
    const foundExpectedPersons = persons.filter((person) =>
      expectedCodes.has(person.code),
    )

    if (foundExpectedPersons.length === expectedCodes.size) {
      console.info(
        '[Supabase] Conexion correcta. Persons:',
        foundExpectedPersons.map((person) => person.name).join(', '),
      )
      return
    }

    console.warn(
      '[Supabase] Conexion realizada, pero no se encontraron Marcos y Nayeli en persons.',
      persons,
    )
  } catch (error) {
    console.error(
      '[Supabase] Prueba de conexion fallida.',
      error instanceof Error ? error.message : error,
    )
  }
}
