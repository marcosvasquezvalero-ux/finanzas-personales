import type {
  PersonalMovementRecord,
  PersonalMovementType,
  PersonRecord,
} from '../models/personalMovement'
import {
  fetchPersonalMovementsByPersonId,
  insertPersonalMovement,
} from '../repositories/personalMovementsRepository'
import { findPersonByCode } from '../repositories/personsRepository'

export type PersonalFinanceCode = 'marcos' | 'nayeli'

export type PersonalFinance = {
  current: number
  expenses: number
  income: number
  initial: number
  movements: PersonalMovementRecord[]
  person: PersonRecord
}

const INITIAL_BALANCE_CATEGORY = 'Saldo inicial'
const QUICK_CATEGORY = 'Registro rapido'

export async function fetchPersonalFinance(
  code: PersonalFinanceCode,
): Promise<PersonalFinance> {
  const person = await findPersonByCode(code)
  const movements = await fetchPersonalMovementsByPersonId(person.id)

  return buildPersonalFinance(person, movements)
}

export async function savePersonalQuickMovement({
  amount,
  description,
  kind,
  personId,
}: {
  amount: number
  description: string
  kind: 'income' | 'expense'
  personId: string
}) {
  return insertPersonalMovement({
    amount,
    category: QUICK_CATEGORY,
    description,
    movement_date: currentDate(),
    person_id: personId,
    type: kind,
  })
}

export async function savePersonalInitialBalance({
  amount,
  personId,
  personName,
}: {
  amount: number
  personId: string
  personName: string
}) {
  return insertPersonalMovement({
    amount,
    category: INITIAL_BALANCE_CATEGORY,
    description: `Saldo inicial ${personName}`,
    movement_date: currentDate(),
    person_id: personId,
    type: 'income',
  })
}

function buildPersonalFinance(
  person: PersonRecord,
  movements: PersonalMovementRecord[],
): PersonalFinance {
  const initial = movements
    .filter((movement) => movement.category === INITIAL_BALANCE_CATEGORY)
    .reduce((total, movement) => total + movement.amount, 0)

  const income = movements
    .filter(
      (movement) =>
        isIncomeType(movement.type) &&
        movement.category !== INITIAL_BALANCE_CATEGORY,
    )
    .reduce((total, movement) => total + movement.amount, 0)

  const expenses = movements
    .filter((movement) => movement.type === 'expense')
    .reduce((total, movement) => total + movement.amount, 0)

  return {
    current: initial + income - expenses,
    expenses,
    income,
    initial,
    movements,
    person,
  }
}

function currentDate() {
  return new Date().toISOString().slice(0, 10)
}

function isIncomeType(type: PersonalMovementType) {
  return type === 'salary' || type === 'income'
}
