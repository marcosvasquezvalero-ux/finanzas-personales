export type SavingsCurrency = 'PEN' | 'USD'
export type SavingsMovementType = 'deposit' | 'withdrawal'

export type SavingsMovementRecord = {
  amount: number
  created_at: string
  currency: SavingsCurrency
  description: string | null
  id: string
  movement_date: string
  type: SavingsMovementType
}

export type NewSavingsMovement = {
  amount: number
  currency: SavingsCurrency
  description: string
  movement_date: string
  type: SavingsMovementType
}

export type UpdateSavingsMovement = NewSavingsMovement

export type SettingRecord = {
  key: string
  value: string | null
}

export type UpsertSettingRecord = SettingRecord & {
  updated_at: string
}
