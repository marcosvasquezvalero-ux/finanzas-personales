import type { TripMovementRecord, TripMovementType } from '../models/trip'
import {
  fetchTripMovements,
  insertTripMovement,
  updateTripMovement,
} from '../repositories/tripMovementsRepository'
import { fetchSettingsByKeys, upsertSettings } from '../repositories/settingsRepository'
import { saveSavingsMovement } from './savingsFinanceService'

export type TripFinance = {
  expenses: number
  income: number
  initialFund: number
  isFinished: boolean
  movements: TripMovementRecord[]
  name: string
  remaining: number
}

const INITIAL_CATEGORY = 'Fondo inicial'
const QUICK_CATEGORY = 'Registro rapido'
const TRANSFER_CATEGORY = 'Transferencia a ahorros'
const TRIP_NAME_KEY = 'trip_name'
const TRIP_FINISHED_KEY = 'trip_is_finished'

export async function fetchTripFinance(): Promise<TripFinance> {
  const [movements, settings] = await Promise.all([
    fetchTripMovements(),
    fetchSettingsByKeys([TRIP_NAME_KEY, TRIP_FINISHED_KEY]),
  ])
  const initialFund = movements
    .filter((movement) => movement.type === 'initial')
    .reduce((total, movement) => total + movement.amount, 0)
  const income = movements
    .filter((movement) => movement.type === 'income')
    .reduce((total, movement) => total + movement.amount, 0)
  const expenses = movements
    .filter((movement) => movement.type === 'expense')
    .reduce((total, movement) => total + movement.amount, 0)
  const name =
    settings.find((setting) => setting.key === TRIP_NAME_KEY)?.value || 'Viaje'
  const isFinished =
    settings.find((setting) => setting.key === TRIP_FINISHED_KEY)?.value === 'true'

  return {
    expenses,
    income,
    initialFund,
    isFinished,
    movements,
    name,
    remaining: initialFund + income - expenses,
  }
}

export async function saveTripInitialFund(amount: number) {
  const finance = await fetchTripFinance()
  const existingInitial = finance.movements.find(
    (movement) => movement.type === 'initial',
  )
  const movement = {
    amount,
    category: INITIAL_CATEGORY,
    description: 'Fondo inicial del viaje',
    movement_date: currentDate(),
    type: 'initial' as const,
  }

  if (existingInitial) {
    return updateTripMovement(existingInitial.id, movement)
  }

  return insertTripMovement(movement)
}

export async function saveTripMovement({
  amount,
  description,
  type,
}: {
  amount: number
  description: string
  type: Extract<TripMovementType, 'income' | 'expense'>
}) {
  return insertTripMovement({
    amount,
    category: QUICK_CATEGORY,
    description,
    movement_date: currentDate(),
    type,
  })
}

export async function finishTrip() {
  await upsertSettings([
    {
      key: TRIP_FINISHED_KEY,
      updated_at: new Date().toISOString(),
      value: 'true',
    },
  ])
}

export async function transferTripBalanceToSavings(amount: number) {
  if (amount <= 0) {
    throw new Error('No hay saldo restante para transferir.')
  }

  await saveSavingsMovement({
    amount,
    currency: 'PEN',
    description: 'Saldo restante de viaje',
    type: 'deposit',
  })

  await insertTripMovement({
    amount,
    category: TRANSFER_CATEGORY,
    description: 'Transferencia de saldo restante a ahorros',
    movement_date: currentDate(),
    type: 'expense',
  })

  await finishTrip()
}

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}
