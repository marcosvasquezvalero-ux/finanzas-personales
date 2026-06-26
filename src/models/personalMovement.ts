export type PersonalMovementType = 'salary' | 'income' | 'expense'

export type PersonRecord = {
  code: string
  id: string
  name: string
}

export type PersonalMovementRecord = {
  amount: number
  category: string
  created_at: string
  description: string | null
  id: string
  movement_date: string
  person_id: string
  type: PersonalMovementType
}

export type NewPersonalMovement = {
  amount: number
  category: string
  description: string
  movement_date: string
  person_id: string
  type: PersonalMovementType
}
