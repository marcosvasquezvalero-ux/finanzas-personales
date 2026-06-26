import { supabase } from '../lib/supabase'
import type {
  NewSavingsMovement,
  SavingsMovementRecord,
  UpdateSavingsMovement,
} from '../models/savings'

export async function fetchSavingsMovements(): Promise<SavingsMovementRecord[]> {
  const { data, error } = await supabase
    .from('savings_movements')
    .select('id, movement_date, currency, type, description, amount, created_at')
    .order('movement_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`No se pudieron leer los ahorros: ${error.message}`)
  }

  return (data ?? []).map((movement) => ({
    ...movement,
    amount: Number(movement.amount),
  }))
}

export async function insertSavingsMovement(
  movement: NewSavingsMovement,
): Promise<SavingsMovementRecord> {
  const { data, error } = await supabase
    .from('savings_movements')
    .insert(movement)
    .select('id, movement_date, currency, type, description, amount, created_at')
    .single()

  if (error) {
    throw new Error(`No se pudo guardar el ahorro: ${error.message}`)
  }

  return {
    ...data,
    amount: Number(data.amount),
  }
}

export async function updateSavingsMovement(
  id: string,
  movement: UpdateSavingsMovement,
): Promise<SavingsMovementRecord> {
  const { data, error } = await supabase
    .from('savings_movements')
    .update(movement)
    .eq('id', id)
    .select('id, movement_date, currency, type, description, amount, created_at')
    .single()

  if (error) {
    throw new Error(`No se pudo actualizar el ahorro: ${error.message}`)
  }

  return {
    ...data,
    amount: Number(data.amount),
  }
}

export async function deleteSavingsMovement(id: string): Promise<void> {
  const { error } = await supabase.from('savings_movements').delete().eq('id', id)

  if (error) {
    throw new Error(`No se pudo eliminar el ahorro: ${error.message}`)
  }
}
