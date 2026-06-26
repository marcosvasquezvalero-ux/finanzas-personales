import { supabase } from '../lib/supabase'
import type { GymAttendanceInput, GymAttendanceRecord, GymPerson } from '../models/gym'

const selectColumns =
  'id, attendance_date, person_code, trained, workout_type, note, created_at'

export async function fetchGymAttendanceByMonth({
  from,
  to,
}: {
  from: string
  to: string
}): Promise<GymAttendanceRecord[]> {
  const { data, error } = await supabase
    .from('gym_attendance')
    .select(selectColumns)
    .gte('attendance_date', from)
    .lte('attendance_date', to)
    .order('attendance_date', { ascending: true })

  if (error) {
    throw new Error(`No se pudo leer Gym: ${error.message}`)
  }

  return data ?? []
}

export async function findGymAttendanceByDateAndPerson({
  attendanceDate,
  personCode,
}: {
  attendanceDate: string
  personCode: GymPerson
}): Promise<GymAttendanceRecord | null> {
  const { data, error } = await supabase
    .from('gym_attendance')
    .select(selectColumns)
    .eq('attendance_date', attendanceDate)
    .eq('person_code', personCode)
    .maybeSingle()

  if (error) {
    throw new Error(`No se pudo revisar Gym: ${error.message}`)
  }

  return data
}

export async function insertGymAttendance(
  record: GymAttendanceInput,
): Promise<GymAttendanceRecord> {
  const { data, error } = await supabase
    .from('gym_attendance')
    .insert(record)
    .select(selectColumns)
    .single()

  if (error) {
    throw new Error(`No se pudo guardar Gym: ${error.message}`)
  }

  return data
}

export async function updateGymAttendance(
  id: string,
  record: GymAttendanceInput,
): Promise<GymAttendanceRecord> {
  const { data, error } = await supabase
    .from('gym_attendance')
    .update(record)
    .eq('id', id)
    .select(selectColumns)
    .single()

  if (error) {
    throw new Error(`No se pudo actualizar Gym: ${error.message}`)
  }

  return data
}
