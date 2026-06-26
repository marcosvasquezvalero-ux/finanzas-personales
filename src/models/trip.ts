export type TripMovementType = 'initial' | 'income' | 'expense'

export type TripMovementRecord = {
  amount: number
  category: string
  created_at: string
  description: string | null
  id: string
  movement_date: string
  type: TripMovementType
}

export type NewTripMovement = {
  amount: number
  category: string
  description: string
  movement_date: string
  type: TripMovementType
}

export type UpdateTripMovement = NewTripMovement
