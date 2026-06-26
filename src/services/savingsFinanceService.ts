import type {
  SavingsCurrency,
  SavingsMovementRecord,
  SavingsMovementType,
} from '../models/savings'
import {
  deleteSavingsMovement,
  fetchSavingsMovements,
  insertSavingsMovement,
  updateSavingsMovement,
} from '../repositories/savingsMovementsRepository'
import { fetchSettingsByKeys, upsertSettings } from '../repositories/settingsRepository'

export type SavingsFinance = {
  goalAmountPen: number
  goalName: string
  movements: SavingsMovementRecord[]
  pen: number
  usd: number
}

const GOAL_NAME_KEY = 'savings_goal_name'
const GOAL_AMOUNT_KEY = 'savings_goal_amount_pen'

export async function fetchSavingsFinance(): Promise<SavingsFinance> {
  const [movements, settings] = await Promise.all([
    fetchSavingsMovements(),
    fetchSettingsByKeys([GOAL_NAME_KEY, GOAL_AMOUNT_KEY]),
  ])

  const goalName =
    settings.find((setting) => setting.key === GOAL_NAME_KEY)?.value ||
    'Objetivo de ahorro'
  const goalAmountPen = parseSettingAmount(
    settings.find((setting) => setting.key === GOAL_AMOUNT_KEY)?.value,
  )

  return {
    goalAmountPen,
    goalName,
    movements,
    pen: calculateBalance(movements, 'PEN'),
    usd: calculateBalance(movements, 'USD'),
  }
}

export async function saveSavingsMovement({
  amount,
  currency,
  description,
  type,
}: {
  amount: number
  currency: SavingsCurrency
  description?: string
  type: SavingsMovementType
}) {
  return insertSavingsMovement({
    amount,
    currency,
    description:
      description ?? (type === 'deposit' ? 'Ahorro agregado' : 'Retiro de ahorro'),
    movement_date: currentDate(),
    type,
  })
}

export async function saveSavingsGoal({
  amountPen,
  name,
}: {
  amountPen: number
  name: string
}) {
  const updatedAt = new Date().toISOString()

  await upsertSettings([
    {
      key: GOAL_NAME_KEY,
      updated_at: updatedAt,
      value: name,
    },
    {
      key: GOAL_AMOUNT_KEY,
      updated_at: updatedAt,
      value: String(amountPen),
    },
  ])
}

export async function editSavingsMovement({
  amount,
  currency,
  description,
  id,
  movementDate,
  type,
}: {
  amount: number
  currency: SavingsCurrency
  description: string
  id: string
  movementDate: string
  type: SavingsMovementType
}) {
  return updateSavingsMovement(id, {
    amount,
    currency,
    description,
    movement_date: movementDate,
    type,
  })
}

export async function removeSavingsMovement(id: string) {
  await deleteSavingsMovement(id)
}

function calculateBalance(
  movements: SavingsMovementRecord[],
  currency: SavingsCurrency,
) {
  return movements
    .filter((movement) => movement.currency === currency)
    .reduce((total, movement) => {
      return movement.type === 'deposit'
        ? total + movement.amount
        : total - movement.amount
    }, 0)
}

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}

function parseSettingAmount(value: string | null | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}
