import { supabase } from '../lib/supabase'
import type { SettingRecord, UpsertSettingRecord } from '../models/savings'

export async function fetchSettingsByKeys(
  keys: string[],
): Promise<SettingRecord[]> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', keys)

  if (error) {
    throw new Error(`No se pudieron leer los ajustes: ${error.message}`)
  }

  return data ?? []
}

export async function upsertSettings(
  settings: UpsertSettingRecord[],
): Promise<void> {
  const { error } = await supabase.from('settings').upsert(settings, {
    onConflict: 'key',
  })

  if (error) {
    throw new Error(`No se pudieron guardar los ajustes: ${error.message}`)
  }
}
