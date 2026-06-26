import { supabase } from '../lib/supabase'
import type {
  NewTripMovement,
  TripMovementRecord,
  UpdateTripMovement,
} from '../models/trip'

const selectColumns =
  'id, movement_date, type, category, description, amount, created_at'

export async function fetchTripMovements(): Promise<TripMovementRecord[]> {
  const { data, error } = await supabase
    .from('trip_movements')
    .select(selectColumns)
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`No se pudieron leer los movimientos del viaje: ${error.message}`)
  }

  return (data ?? []).map((movement) => ({
    ...movement,
    amount: Number(movement.amount),
  }))
}

export async function insertTripMovement(
  movement: NewTripMovement,
): Promise<TripMovementRecord> {
  const { data, error } = await supabase
    .from('trip_movements')
    .insert(movement)
    .select(selectColumns)
    .single()

  if (error) {
    throw new Error(`No se pudo guardar el movimiento del viaje: ${error.message}`)
  }

  return {
    ...data,
    amount: Number(data.amount),
  }
}

export async function updateTripMovement(
  id: string,
  movement: UpdateTripMovement,
): Promise<TripMovementRecord> {
  const { data, error } = await supabase
    .from('trip_movements')
    .update(movement)
    .eq('id', id)
    .select(selectColumns)
    .single()

  if (error) {
    throw new Error(`No se pudo actualizar el fondo del viaje: ${error.message}`)
  }

  return {
    ...data,
    amount: Number(data.amount),
  }
}
