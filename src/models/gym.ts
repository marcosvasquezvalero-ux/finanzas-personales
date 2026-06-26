export type GymPerson = 'marcos' | 'nayeli'
export type GymPersonChoice = GymPerson | 'both'

export type WorkoutType =
  | 'Push'
  | 'Pull'
  | 'Legs'
  | 'Cardio'
  | 'Descanso'
  | 'Glúteos'
  | 'Otro'

export type GymAttendanceRecord = {
  attendance_date: string
  created_at?: string
  id: string
  note: string | null
  person_code: GymPerson
  trained: boolean
  workout_type: WorkoutType
}

export type GymAttendanceInput = {
  attendance_date: string
  note: string | null
  person_code: GymPerson
  trained: boolean
  workout_type: WorkoutType
}

export type GymDayStatus = 'both' | 'marcos' | 'nayeli' | 'none' | 'empty'
