import type {
  GymAttendanceInput,
  GymAttendanceRecord,
  GymPerson,
  GymPersonChoice,
  WorkoutType,
} from '../models/gym'
import {
  fetchGymAttendanceByMonth,
  findGymAttendanceByDateAndPerson,
  insertGymAttendance,
  updateGymAttendance,
} from '../repositories/gymAttendanceRepository'

export type GymAttendanceFormData = {
  attendanceDate: string
  note: string
  personCode: GymPersonChoice
  trained: boolean
  workoutType: WorkoutType
}

export async function loadGymMonth(year: number, monthIndex: number) {
  return fetchGymAttendanceByMonth({
    from: formatDate(new Date(year, monthIndex, 1)),
    to: formatDate(new Date(year, monthIndex + 1, 0)),
  })
}

export async function saveGymAttendance(form: GymAttendanceFormData) {
  const people: GymPerson[] =
    form.personCode === 'both' ? ['marcos', 'nayeli'] : [form.personCode]

  await Promise.all(
    people.map(async (person) => {
      const record: GymAttendanceInput = {
        attendance_date: form.attendanceDate,
        note: form.note.trim() ? form.note.trim() : null,
        person_code: person,
        trained: form.trained,
        workout_type: form.workoutType,
      }
      const existing = await findGymAttendanceByDateAndPerson({
        attendanceDate: form.attendanceDate,
        personCode: person,
      })

      if (existing) {
        await updateGymAttendance(existing.id, record)
        return
      }

      await insertGymAttendance(record)
    }),
  )
}

export function calculateGymStats(records: GymAttendanceRecord[]) {
  const marcosTrainingDays = getTrainingDays(records, 'marcos')
  const nayeliTrainingDays = getTrainingDays(records, 'nayeli')
  const togetherDays = new Set(
    [...marcosTrainingDays].filter((date) => nayeliTrainingDays.has(date)),
  )

  return {
    marcosCount: marcosTrainingDays.size,
    nayeliCount: nayeliTrainingDays.size,
    togetherCount: togetherDays.size,
  }
}

function getTrainingDays(records: GymAttendanceRecord[], person: GymPerson) {
  return new Set(
    records
      .filter((record) => record.person_code === person && record.trained)
      .map((record) => record.attendance_date),
  )
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10)
}
