import { supabase } from '../lib/supabase'
import type {
  NewPersonalMovement,
  PersonalMovementRecord,
} from '../models/personalMovement'

export async function fetchPersonalMovementsByPersonId(
  personId: string,
): Promise<PersonalMovementRecord[]> {
  const { data, error } = await supabase
    .from('personal_movements')
    .select(
      'id, person_id, movement_date, type, category, description, amount, created_at',
    )
    .eq('person_id', personId)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`No se pudieron leer los movimientos: ${error.message}`)
  }

  return (data ?? []).map((movement) => ({
    ...movement,
    amount: Number(movement.amount),
  }))
}

export async function insertPersonalMovement(
  movement: NewPersonalMovement,
): Promise<PersonalMovementRecord> {
  const { data, error } = await supabase
    .from('personal_movements')
    .insert(movement)
    .select(
      'id, person_id, movement_date, type, category, description, amount, created_at',
    )
    .single()

  if (error) {
    throw new Error(`No se pudo guardar el movimiento: ${error.message}`)
  }

  return {
    ...data,
    amount: Number(data.amount),
  }
}
