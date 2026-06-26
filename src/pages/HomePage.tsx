import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { AppIcon } from '../components/AppIcon'
import { BigActionButton } from '../components/BigActionButton'
import { Modal } from '../components/Modal'
import { ProgressCard } from '../components/ProgressCard'
import { StatCard } from '../components/StatCard'
import type {
  GymAttendanceRecord,
  GymDayStatus,
  GymPersonChoice,
  WorkoutType,
} from '../models/gym'
import {
  fetchPersonalFinance,
  savePersonalInitialBalance,
  savePersonalQuickMovement,
  type PersonalFinance,
} from '../services/personalFinanceService'
import {
  calculateGymStats,
  loadGymMonth,
  saveGymAttendance,
} from '../services/gymAttendanceService'
import {
  loadGymDailyPhoto,
  saveGymDailyPhoto,
} from '../services/gymPhotoService'
import {
  fetchSavingsFinance,
  saveSavingsGoal,
  saveSavingsMovement,
} from '../services/savingsFinanceService'
import {
  fetchTripFinance,
  finishTrip,
  saveTripInitialFund,
  saveTripMovement,
  transferTripBalanceToSavings,
  type TripFinance,
} from '../services/tripFinanceService'
import type { AppSection, BalanceSummary } from '../types/finance'
import type { SavingsCurrency, SavingsMovementType } from '../models/savings'

type EditableSection = Exclude<AppSection, 'summary' | 'gym'>
type PersonId = 'marcos' | 'nayeli'

type HomePageProps = {
  activeSection: AppSection
  onExport: (module: EditableSection | 'general') => void
  onNewMovement: (section: EditableSection) => void
}

type QuickMovement = {
  amount: string
  description: string
}

type SavingsState = {
  currency: SavingsCurrency
  formAmount: string
  goalAmountPen: number
  goalName: string
  pen: number
  usd: number
}

type SavingsModalState =
  | { type: 'goal' }
  | { type: 'new-goal' }
  | null

type GoalForm = {
  amount: string
  mode: 'keep' | 'reset'
  name: string
}

type GymForm = {
  note: string
  personCode: GymPersonChoice
  trained: boolean
  workoutType: WorkoutType
}

const photos = {
  couple: '/photos/marcos-nayeli-rot-left.png',
  marcos: '/photos/marcos-buggy.jpeg',
  nayeli: '/photos/nayeli-desierto.jpeg',
  tripMain: '/photos/viaje.png',
  tripBeach: '/photos/viaje-playa-noche.jpeg',
  tripBeachTall: '/photos/viaje-playa-noche-vertical.jpeg',
  tripBuggy: '/photos/marcos-buggy.jpeg',
  tripDinosaur: '/photos/viaje-dinosaurio.jpeg',
  tripDesert: '/photos/nayeli-desierto.jpeg',
  savings: '/photos/ahorros-nayeli.jpeg',
}

const summarySlides = [
  {
    alt: 'Marcos y Nayeli en la playa de noche',
    position: '50% 54%',
    src: photos.couple,
  },
  {
    alt: 'Marcos y Nayeli junto al buggy en el desierto',
    position: '42% 48%',
    src: photos.tripBuggy,
  },
  {
    alt: 'Nayeli en las dunas del desierto',
    position: '58% 50%',
    src: photos.tripDesert,
  },
  {
    alt: 'Nayeli en la playa de noche',
    position: '50% 52%',
    src: photos.tripBeach,
  },
  {
    alt: 'Nayeli junto a una atraccion del viaje',
    position: 'center',
    src: photos.tripDinosaur,
  },
]

const tripHeroPhoto = {
  alt: 'Marcos y Nayeli en el viaje por el desierto',
  position: 'center',
  src: photos.tripMain,
}

const currency = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  minimumFractionDigits: 2,
  style: 'currency',
})

const usdCurrency = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  minimumFractionDigits: 2,
  style: 'currency',
})

const initialPeople = {
  marcos: {
    current: 500,
    expenses: 0,
    income: 0,
    initial: 500,
    initialAdjustment: 0,
    name: 'Marcos',
  },
  nayeli: {
    current: 500,
    expenses: 0,
    income: 0,
    initial: 500,
    initialAdjustment: 0,
    name: 'Nayeli',
  },
}

const emptyStatus = {
  error: null as string | null,
  isLoading: false,
  isSaving: false,
}

function money(value: number) {
  return currency.format(value).replace('PEN', 'S/')
}

function dollars(value: number) {
  return usdCurrency.format(value)
}

function parseAmount(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function getSavingsBalance(state: SavingsState, currency: SavingsCurrency) {
  return currency === 'PEN' ? state.pen : state.usd
}

function formatDateLocal(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getMonthDays(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingDays = (firstDay.getDay() + 6) % 7
  const days: Array<{ date: string | null; day: number | null }> = []

  for (let index = 0; index < leadingDays; index += 1) {
    days.push({ date: null, day: null })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ date: formatDateLocal(new Date(year, month, day)), day })
  }

  return days
}

function getRecordsForDate(records: GymAttendanceRecord[], date: string) {
  return records.filter((record) => record.attendance_date === date)
}

function getGymDayStatus(records: GymAttendanceRecord[], date: string): GymDayStatus {
  const dayRecords = getRecordsForDate(records, date)
  const marcos = dayRecords.find((record) => record.person_code === 'marcos')
  const nayeli = dayRecords.find((record) => record.person_code === 'nayeli')

  if (marcos?.trained && nayeli?.trained) return 'both'
  if (marcos?.trained) return 'marcos'
  if (nayeli?.trained) return 'nayeli'
  if (marcos?.trained === false && nayeli?.trained === false) return 'none'

  return 'empty'
}

export function HomePage({
  activeSection,
  onExport,
  onNewMovement,
}: HomePageProps) {
  const [people, setPeople] = useState(initialPeople)
  const [personIds, setPersonIds] = useState<Record<PersonId, string | null>>({
    marcos: null,
    nayeli: null,
  })
  const [initialAmounts, setInitialAmounts] = useState<Record<PersonId, string>>({
    marcos: '',
    nayeli: '',
  })
  const [personStatuses, setPersonStatuses] = useState<Record<PersonId, typeof emptyStatus>>({
    marcos: emptyStatus,
    nayeli: emptyStatus,
  })
  const [personForms, setPersonForms] = useState<Record<PersonId, QuickMovement>>({
    marcos: { amount: '', description: '' },
    nayeli: { amount: '', description: '' },
  })
  const [tripState, setTripState] = useState({
    day: '2026-07-18',
    expenses: 0,
    form: { amount: '', description: '' },
    income: 0,
    initialFund: 0,
    initialFundInput: '',
    isFinished: false,
    name: 'Viaje',
  })
  const [tripStatus, setTripStatus] = useState(emptyStatus)
  const [savingsState, setSavingsState] = useState<SavingsState>({
    currency: 'PEN',
    formAmount: '',
    goalAmountPen: 12000,
    goalName: 'Objetivo de ahorro',
    pen: 8200,
    usd: 1240,
  })
  const [savingsStatus, setSavingsStatus] = useState(emptyStatus)
  const [savingsModal, setSavingsModal] = useState<SavingsModalState>(null)
  const [goalForm, setGoalForm] = useState<GoalForm>({
    amount: '12000',
    mode: 'keep',
    name: 'Objetivo de ahorro',
  })
  const [gymMonthDate, setGymMonthDate] = useState(() => new Date())
  const [gymRecords, setGymRecords] = useState<GymAttendanceRecord[]>([])
  const [gymStatus, setGymStatus] = useState(emptyStatus)
  const [selectedGymDate, setSelectedGymDate] = useState<string | null>(null)
  const [gymPhotoDate, setGymPhotoDate] = useState(() => formatDateLocal(new Date()))
  const [gymForm, setGymForm] = useState<GymForm>({
    note: '',
    personCode: 'both',
    trained: true,
    workoutType: 'Push',
  })

  const tripRemaining = tripState.initialFund + tripState.income - tripState.expenses
  const goalProgress =
    savingsState.goalAmountPen > 0
      ? Math.min(Math.round((savingsState.pen / savingsState.goalAmountPen) * 100), 100)
      : 0
  const goalRemaining =
    savingsState.goalAmountPen > 0
      ? Math.max(savingsState.goalAmountPen - savingsState.pen, 0)
      : 0

  const applyPersonalFinance = useCallback((personId: PersonId, finance: PersonalFinance) => {
    setPersonIds((current) => ({ ...current, [personId]: finance.person.id }))
    setPeople((current) => ({
      ...current,
      [personId]: {
        ...current[personId],
        current: finance.current,
        expenses: finance.expenses,
        income: finance.income,
        initial: finance.initial,
        initialAdjustment: 0,
        name: finance.person.name,
      },
    }))
  }, [])

  const applyTripFinance = useCallback((finance: TripFinance) => {
    setTripState((current) => ({
      ...current,
      expenses: finance.expenses,
      income: finance.income,
      initialFund: finance.initialFund,
      initialFundInput: '',
      isFinished: finance.isFinished,
      name: finance.name,
    }))
  }, [])

  const loadPersonalFinance = useCallback(async (personId: PersonId) => {
    setPersonStatuses((current) => ({
      ...current,
      [personId]: { ...current[personId], error: null, isLoading: true },
    }))

    try {
      const finance = await fetchPersonalFinance(personId)
      applyPersonalFinance(personId, finance)
    } catch (error) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error:
            error instanceof Error
              ? error.message
              : `No se pudieron cargar los datos reales de ${personId === 'marcos' ? 'Marcos' : 'Nayeli'}.`,
        },
      }))
    } finally {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: { ...current[personId], isLoading: false },
      }))
    }
  }, [applyPersonalFinance])

  useEffect(() => {
    void loadPersonalFinance('marcos')
    void loadPersonalFinance('nayeli')
  }, [loadPersonalFinance])

  const loadTripFinance = useCallback(async () => {
    setTripStatus((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const finance = await fetchTripFinance()
      applyTripFinance(finance)
    } catch (error) {
      setTripStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos reales de Viaje.',
      }))
    } finally {
      setTripStatus((current) => ({ ...current, isLoading: false }))
    }
  }, [applyTripFinance])

  useEffect(() => {
    void loadTripFinance()
  }, [loadTripFinance])

  const loadSavingsFinance = useCallback(async () => {
    setSavingsStatus((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const finance = await fetchSavingsFinance()
      setSavingsState((current) => ({
        ...current,
        goalAmountPen: finance.goalAmountPen,
        goalName: finance.goalName,
        pen: finance.pen,
        usd: finance.usd,
      }))
      setGoalForm({
        amount: String(finance.goalAmountPen),
        mode: 'keep',
        name: finance.goalName,
      })
    } catch (error) {
      setSavingsStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudieron cargar los datos reales de Ahorros.',
      }))
    } finally {
      setSavingsStatus((current) => ({ ...current, isLoading: false }))
    }
  }, [])

  useEffect(() => {
    void loadSavingsFinance()
  }, [loadSavingsFinance])

  const loadGymAttendance = useCallback(async () => {
    setGymStatus((current) => ({ ...current, error: null, isLoading: true }))

    try {
      const records = await loadGymMonth(
        gymMonthDate.getFullYear(),
        gymMonthDate.getMonth(),
      )
      setGymRecords(records)
    } catch (error) {
      setGymStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo cargar el calendario de Gym.',
      }))
    } finally {
      setGymStatus((current) => ({ ...current, isLoading: false }))
    }
  }, [gymMonthDate])

  useEffect(() => {
    void loadGymAttendance()
  }, [loadGymAttendance])

  useEffect(() => {
    const [selectedYear, selectedMonth] = gymPhotoDate.split('-').map(Number)
    const currentYear = gymMonthDate.getFullYear()
    const currentMonth = gymMonthDate.getMonth() + 1

    if (selectedYear !== currentYear || selectedMonth !== currentMonth) {
      setGymPhotoDate(formatDateLocal(new Date(currentYear, gymMonthDate.getMonth(), 1)))
    }
  }, [gymMonthDate, gymPhotoDate])

  const summaryCards: BalanceSummary[] = useMemo(
    () => [
      {
        amount: money(people.marcos.current),
        description: 'Saldo personal actual',
        icon: 'user',
        label: 'Saldo Marcos',
        tone: 'income',
      },
      {
        amount: money(people.nayeli.current),
        description: 'Saldo personal actual',
        icon: 'user',
        label: 'Saldo Nayeli',
        tone: 'expense',
      },
      {
        amount: money(savingsState.pen),
        description: 'Ahorro acumulado',
        icon: 'piggy',
        label: 'Ahorro en Soles',
        tone: 'savings',
      },
      {
        amount: dollars(savingsState.usd),
        description: 'Reserva en dolares',
        icon: 'usd',
        label: 'Ahorro en Dolares',
        tone: 'info',
      },
    ],
    [people, savingsState.pen, savingsState.usd],
  )

  const updatePersonForm = (
    personId: PersonId,
    field: keyof QuickMovement,
    value: string,
  ) => {
    setPersonForms((current) => ({
      ...current,
      [personId]: { ...current[personId], [field]: value },
    }))
  }

  const registerPersonMovement = async (
    personId: PersonId,
    kind: 'income' | 'expense',
  ) => {
    const amount = parseAmount(personForms[personId].amount)
    const description = personForms[personId].description.trim()
    const personName = people[personId].name

    if (!description) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error: 'Escribe una descripcion para registrar el movimiento.',
        },
      }))
      return
    }

    if (!amount) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error: 'Ingresa un monto mayor a cero.',
        },
      }))
      return
    }

    if (!personIds[personId]) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error: `Todavia no se encontro la persona ${personName} en Supabase.`,
        },
      }))
      return
    }

    setPersonStatuses((current) => ({
      ...current,
      [personId]: { ...current[personId], error: null, isSaving: true },
    }))

    try {
      await savePersonalQuickMovement({
        amount,
        description,
        kind,
        personId: personIds[personId],
      })
      setPersonForms((current) => ({
        ...current,
        [personId]: { amount: '', description: '' },
      }))
      await loadPersonalFinance(personId)
    } catch (error) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error:
            error instanceof Error
              ? error.message
              : `No se pudo guardar el movimiento de ${personName}.`,
        },
      }))
    } finally {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: { ...current[personId], isSaving: false },
      }))
    }
  }

  const savePersonalInitial = async (personId: PersonId) => {
    const amount = parseAmount(initialAmounts[personId])
    const personName = people[personId].name

    if (!amount) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error: 'Ingresa un saldo inicial mayor a cero.',
        },
      }))
      return
    }

    if (!personIds[personId]) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error: `Todavia no se encontro la persona ${personName} en Supabase.`,
        },
      }))
      return
    }

    setPersonStatuses((current) => ({
      ...current,
      [personId]: { ...current[personId], error: null, isSaving: true },
    }))

    try {
      await savePersonalInitialBalance({
        amount,
        personId: personIds[personId],
        personName,
      })
      setInitialAmounts((current) => ({ ...current, [personId]: '' }))
      await loadPersonalFinance(personId)
    } catch (error) {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: {
          ...current[personId],
          error:
            error instanceof Error
              ? error.message
              : `No se pudo guardar el saldo inicial de ${personName}.`,
        },
      }))
    } finally {
      setPersonStatuses((current) => ({
        ...current,
        [personId]: { ...current[personId], isSaving: false },
      }))
    }
  }

  const registerTripMovement = async (type: 'income' | 'expense') => {
    const amount = parseAmount(tripState.form.amount)

    if (!amount) {
      setTripStatus((current) => ({
        ...current,
        error: 'Ingresa un monto de viaje mayor a cero.',
      }))
      return
    }

    if (!tripState.form.description.trim()) {
      setTripStatus((current) => ({
        ...current,
        error: 'Escribe una descripcion para el movimiento del viaje.',
      }))
      return
    }

    setTripStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      await saveTripMovement({
        amount,
        description: tripState.form.description.trim(),
        type,
      })
      setTripState((current) => ({
        ...current,
        form: { amount: '', description: '' },
      }))
      await loadTripFinance()
    } catch (error) {
      setTripStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el movimiento del viaje.',
      }))
    } finally {
      setTripStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  const saveTripInitial = async () => {
    const amount = parseAmount(tripState.initialFundInput)

    if (!amount) {
      setTripStatus((current) => ({
        ...current,
        error: 'Ingresa un fondo inicial mayor a cero.',
      }))
      return
    }

    setTripStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      await saveTripInitialFund(amount)
      await loadTripFinance()
    } catch (error) {
      setTripStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el fondo inicial del viaje.',
      }))
    } finally {
      setTripStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  const finalizeTrip = async () => {
    setTripStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      await finishTrip()
      await loadTripFinance()
    } catch (error) {
      setTripStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo finalizar el viaje.',
      }))
    } finally {
      setTripStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  const transferTripBalance = async () => {
    setTripStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      await transferTripBalanceToSavings(tripRemaining)
      await Promise.all([loadTripFinance(), loadSavingsFinance()])
    } catch (error) {
      setTripStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo transferir el saldo del viaje a ahorros.',
      }))
    } finally {
      setTripStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  const saveSavings = async (type: SavingsMovementType) => {
    const amount = parseAmount(savingsState.formAmount)

    if (!amount) {
      setSavingsStatus((current) => ({
        ...current,
        error: 'Ingresa un monto de ahorro mayor a cero.',
      }))
      return
    }

    if (savingsState.currency !== 'PEN' && savingsState.currency !== 'USD') {
      setSavingsStatus((current) => ({
        ...current,
        error: 'Selecciona una moneda valida.',
      }))
      return
    }

    if (
      type === 'withdrawal' &&
      amount > getSavingsBalance(savingsState, savingsState.currency)
    ) {
      setSavingsStatus((current) => ({
        ...current,
        error: 'No hay saldo suficiente para retirar esa cantidad.',
      }))
      return
    }

    setSavingsStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      await saveSavingsMovement({
        amount,
        currency: savingsState.currency,
        type,
      })
      setSavingsState((current) => ({ ...current, formAmount: '' }))
      await loadSavingsFinance()
    } catch (error) {
      setSavingsStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar el movimiento de ahorro.',
      }))
    } finally {
      setSavingsStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  const openGoalModal = () => {
    setGoalForm({
      amount: String(savingsState.goalAmountPen),
      mode: 'keep',
      name: savingsState.goalName,
    })
    setSavingsStatus((current) => ({ ...current, error: null }))
    setSavingsModal({ type: 'goal' })
  }

  const openNewGoalModal = () => {
    setGoalForm({
      amount: '',
      mode: 'keep',
      name: '',
    })
    setSavingsStatus((current) => ({ ...current, error: null }))
    setSavingsModal({ type: 'new-goal' })
  }

  const closeSavingsModal = () => {
    setSavingsModal(null)
    setSavingsStatus((current) => ({ ...current, error: null }))
  }

  const saveGoal = async () => {
    const amount = parseAmount(goalForm.amount)
    const name = goalForm.name.trim()
    const isNewGoal = savingsModal?.type === 'new-goal'

    if (!name) {
      setSavingsStatus((current) => ({
        ...current,
        error: 'Escribe un nombre para la meta.',
      }))
      return
    }

    if (!amount) {
      setSavingsStatus((current) => ({
        ...current,
        error: 'Ingresa una meta en soles mayor a cero.',
      }))
      return
    }

    if (isNewGoal && goalForm.mode === 'reset' && savingsState.pen <= 0) {
      setSavingsStatus((current) => ({
        ...current,
        error: 'No hay ahorro en soles para reiniciar desde S/ 0.00.',
      }))
      return
    }

    setSavingsStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      if (isNewGoal && goalForm.mode === 'reset') {
        await saveSavingsMovement({
          amount: savingsState.pen,
          currency: 'PEN',
          description: 'Reinicio de ahorro por nuevo objetivo',
          type: 'withdrawal',
        })
      }

      await saveSavingsGoal({ amountPen: amount, name })
      setSavingsModal(null)
      await loadSavingsFinance()
    } catch (error) {
      setSavingsStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la meta de ahorro.',
      }))
    } finally {
      setSavingsStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  const openGymDate = (date: string) => {
    const records = getRecordsForDate(gymRecords, date)
    const marcos = records.find((record) => record.person_code === 'marcos')
    const nayeli = records.find((record) => record.person_code === 'nayeli')
    const firstRecord = marcos ?? nayeli

    setGymPhotoDate(date)
    setSelectedGymDate(date)
    setGymStatus((current) => ({ ...current, error: null }))
    setGymForm({
      note: firstRecord?.note ?? '',
      personCode: marcos && nayeli ? 'both' : firstRecord?.person_code ?? 'both',
      trained: firstRecord?.trained ?? true,
      workoutType: firstRecord?.workout_type ?? 'Push',
    })
  }

  const closeGymModal = () => {
    setSelectedGymDate(null)
    setGymStatus((current) => ({ ...current, error: null }))
  }

  const saveGymForm = async () => {
    if (!selectedGymDate) return

    setGymStatus((current) => ({ ...current, error: null, isSaving: true }))

    try {
      await saveGymAttendance({
        attendanceDate: selectedGymDate,
        note: gymForm.note,
        personCode: gymForm.personCode,
        trained: gymForm.trained,
        workoutType: gymForm.workoutType,
      })
      setSelectedGymDate(null)
      await loadGymAttendance()
    } catch (error) {
      setGymStatus((current) => ({
        ...current,
        error:
          error instanceof Error
            ? error.message
            : 'No se pudo guardar la asistencia de Gym.',
      }))
    } finally {
      setGymStatus((current) => ({ ...current, isSaving: false }))
    }
  }

  return (
    <section className="dashboard-view compact-view" aria-label="Contenido financiero">
      {activeSection === 'summary' ? (
        <SummaryScreen
          cards={summaryCards}
          current={money(savingsState.pen)}
          goalTitle={savingsState.goalName}
          progress={goalProgress}
          remaining={money(goalRemaining)}
          target={money(savingsState.goalAmountPen)}
          total={money(people.marcos.current + people.nayeli.current + savingsState.pen)}
          usd={dollars(savingsState.usd)}
        />
      ) : null}

      {activeSection === 'marcos' || activeSection === 'nayeli' ? (
        <PersonalScreen
          form={personForms[activeSection]}
          initialAmount={initialAmounts[activeSection]}
          isLoading={personStatuses[activeSection].isLoading}
          isSaving={personStatuses[activeSection].isSaving}
          onAdvanced={() => onNewMovement(activeSection)}
          onChangeInitialAmount={(value) =>
            setInitialAmounts((current) => ({
              ...current,
              [activeSection]: value,
            }))
          }
          onChangeForm={(field, value) => updatePersonForm(activeSection, field, value)}
          onExport={() => onExport(activeSection)}
          onRegister={(kind) => registerPersonMovement(activeSection, kind)}
          onSaveInitial={() => savePersonalInitial(activeSection)}
          person={people[activeSection]}
          sectionId={activeSection}
          statusMessage={personStatuses[activeSection].error}
        />
      ) : null}

      {activeSection === 'trip' ? (
        <TripScreen
          onAdvanced={() => onNewMovement('trip')}
          onChangeForm={(field, value) =>
            setTripState((current) => ({
              ...current,
              form: { ...current.form, [field]: value },
            }))
          }
          onChangeInitialFund={(value) =>
            setTripState((current) => ({ ...current, initialFundInput: value }))
          }
          onFinalize={finalizeTrip}
          onExport={() => onExport('trip')}
          onRegisterMovement={registerTripMovement}
          onSaveInitial={saveTripInitial}
          onTransferTripBalance={transferTripBalance}
          remaining={tripRemaining}
          statusMessage={tripStatus.error}
          trip={tripState}
        />
      ) : null}

      {activeSection === 'savings' ? (
        <SavingsScreen
          goalAmountPen={savingsState.goalAmountPen}
          goalName={savingsState.goalName}
          goalProgress={goalProgress}
          goalRemaining={goalRemaining}
          isLoading={savingsStatus.isLoading}
          isSaving={savingsStatus.isSaving}
          onAddSavings={() => saveSavings('deposit')}
          onEditGoal={openGoalModal}
          onExport={() => onExport('savings')}
          onNewGoal={openNewGoalModal}
          onWithdrawSavings={() => saveSavings('withdrawal')}
          savings={savingsState}
          setSavings={setSavingsState}
          statusMessage={savingsStatus.error}
        />
      ) : null}

      {activeSection === 'gym' ? (
        <GymScreen
          monthDate={gymMonthDate}
          records={gymRecords}
          selectedDate={gymPhotoDate}
          statusMessage={gymStatus.error}
          onChangeMonth={(offset) =>
            setGymMonthDate(
              (current) =>
                new Date(current.getFullYear(), current.getMonth() + offset, 1),
            )
          }
          onSelectDate={openGymDate}
        />
      ) : null}

      <Modal
        isOpen={savingsModal !== null}
        title={
          savingsModal?.type === 'goal'
            ? 'Editar meta'
            : savingsModal?.type === 'new-goal'
              ? 'Nuevo objetivo'
            : ''
        }
        onClose={closeSavingsModal}
      >
        {savingsModal?.type === 'goal' || savingsModal?.type === 'new-goal' ? (
          <SavingsGoalForm
            form={goalForm}
            isSaving={savingsStatus.isSaving}
            isNewGoal={savingsModal.type === 'new-goal'}
            onCancel={closeSavingsModal}
            onChange={setGoalForm}
            onSave={saveGoal}
            statusMessage={savingsStatus.error}
          />
        ) : null}

      </Modal>

      <Modal
        isOpen={selectedGymDate !== null}
        title="Registro Gym"
        onClose={closeGymModal}
      >
        {selectedGymDate ? (
          <GymAttendanceForm
            date={selectedGymDate}
            form={gymForm}
            isSaving={gymStatus.isSaving}
            statusMessage={gymStatus.error}
            onCancel={closeGymModal}
            onChange={setGymForm}
            onSave={saveGymForm}
          />
        ) : null}
      </Modal>
    </section>
  )
}

function SummaryScreen({
  cards,
  current,
  goalTitle,
  progress,
  remaining,
  target,
  total,
  usd,
}: {
  cards: BalanceSummary[]
  current: string
  goalTitle: string
  progress: number
  remaining: string
  target: string
  total: string
  usd: string
}) {
  return (
    <div className="app-split summary-layout">
      <PhotoCarousel
        className="summary-carousel summary-hero"
        label="Fotos de Marcos y Nayeli"
        slides={summarySlides}
      />

      <div className="finance-panel app-split__content">
        <article className="total-card">
          <span>Patrimonio visible</span>
          <strong>{total}</strong>
          <p>{usd} en reserva USD</p>
        </article>
        <div className="balance-grid summary-grid">
          {cards.map((balance) => (
            <StatCard item={balance} key={balance.label} />
          ))}
        </div>
        <ProgressCard
          current={current}
          progress={progress}
          remaining={remaining}
          target={target}
          title={goalTitle}
        />
      </div>
    </div>
  )
}

type PersonalScreenProps = {
  form: QuickMovement
  initialAmount: string
  isLoading: boolean
  isSaving: boolean
  onAdvanced: () => void
  onChangeInitialAmount?: (value: string) => void
  onChangeForm: (field: keyof QuickMovement, value: string) => void
  onExport: () => void
  onRegister: (kind: 'income' | 'expense') => void
  onSaveInitial?: () => void
  person: typeof initialPeople.marcos
  sectionId: PersonId
  statusMessage: string | null
}

function PersonalScreen({
  form,
  initialAmount,
  isLoading,
  isSaving,
  onAdvanced,
  onChangeInitialAmount,
  onChangeForm,
  onExport,
  onRegister,
  onSaveInitial,
  person,
  sectionId,
  statusMessage,
}: PersonalScreenProps) {
  const metrics: BalanceSummary[] = [
    {
      amount: money(person.current),
      description: `${money(person.initial)} + ${money(person.income)} - ${money(person.expenses)}`,
      icon: 'wallet',
      label: 'Saldo actual',
      tone: sectionId === 'marcos' ? 'income' : 'info',
    },
    {
      amount: money(person.initial + person.initialAdjustment),
      description: 'Saldo inicial / ajuste',
      icon: 'equal',
      label: 'Saldo inicial',
      tone: 'savings',
    },
  ]

  return (
    <div className="app-split personal-layout">
      <section className={`photo-hero person-hero app-split__visual ${sectionId}`}>
        <img
          alt={`Foto de ${person.name}`}
          src={sectionId === 'marcos' ? photos.marcos : photos.nayeli}
        />
        <div className="photo-hero__shade" />
        <div className="person-hero__balance">
          <span>Saldo actual</span>
          <strong>{money(person.current)}</strong>
        </div>
      </section>

      <div className="finance-panel app-split__content">
        <div className="balance-grid compact two-card-grid">
          {metrics.map((metric) => (
            <StatCard item={metric} key={metric.label} />
          ))}
        </div>
        {onChangeInitialAmount && onSaveInitial ? (
          <InitialBalanceCard
            amount={initialAmount}
            isSaving={isSaving}
            onAmountChange={onChangeInitialAmount}
            onSave={onSaveInitial}
            personName={person.name}
          />
        ) : null}
        <QuickEntryCard
          amount={form.amount}
          description={form.description}
          id={`quick-entry-${sectionId}`}
          isSaving={isSaving}
          onAmountChange={(value) => onChangeForm('amount', value)}
          onDescriptionChange={(value) => onChangeForm('description', value)}
          onExpense={() => onRegister('expense')}
          onIncome={() => onRegister('income')}
          statusMessage={statusMessage}
          title={`Registro rapido de ${person.name}`}
        />
        <div className="screen-toolbar compact-toolbar finance-actions">
          <button className="secondary-button" type="button" onClick={onAdvanced}>
            Movimiento avanzado
          </button>
          <ExportButton onClick={onExport} />
        </div>
        {isLoading ? <p className="finance-status">Cargando datos reales...</p> : null}
      </div>
    </div>
  )
}

function InitialBalanceCard({
  amount,
  isSaving,
  onAmountChange,
  onSave,
  personName,
}: {
  amount: string
  isSaving: boolean
  onAmountChange: (value: string) => void
  onSave: () => void
  personName: string
}) {
  return (
    <section className="initial-balance-card">
      <div>
        <strong>Saldo inicial / ajuste</strong>
        <span>Se guarda como movimiento real de {personName}.</span>
      </div>
      <label>
        <span>Monto</span>
        <input
          inputMode="decimal"
          onChange={(event) => onAmountChange(event.target.value)}
          placeholder="0.00"
          type="text"
          value={amount}
        />
      </label>
      <button
        className="secondary-button"
        disabled={isSaving}
        type="button"
        onClick={onSave}
      >
        Guardar saldo
      </button>
    </section>
  )
}

type TripScreenProps = {
  onAdvanced: () => void
  onChangeForm: (field: keyof QuickMovement, value: string) => void
  onChangeInitialFund: (value: string) => void
  onFinalize: () => void
  onExport: () => void
  onRegisterMovement: (type: 'income' | 'expense') => void
  onSaveInitial: () => void
  onTransferTripBalance: () => void
  remaining: number
  statusMessage: string | null
  trip: {
    day: string
    expenses: number
    form: QuickMovement
    income: number
    initialFund: number
    initialFundInput: string
    isFinished: boolean
    name: string
  }
}

function TripScreen({
  onAdvanced,
  onChangeForm,
  onChangeInitialFund,
  onFinalize,
  onExport,
  onRegisterMovement,
  onSaveInitial,
  onTransferTripBalance,
  remaining,
  statusMessage,
  trip,
}: TripScreenProps) {
  const metrics: BalanceSummary[] = [
    {
      amount: money(trip.initialFund),
      description: 'Fondo independiente',
      icon: 'landmark',
      label: 'Fondo inicial',
      tone: 'savings',
    },
    {
      amount: money(trip.income),
      description: 'Total ingresos',
      icon: 'income',
      label: 'Ingresos',
      tone: 'income',
    },
    {
      amount: money(trip.expenses),
      description: 'Total gastos',
      icon: 'expense',
      label: 'Gastos',
      tone: 'expense',
    },
    {
      amount: money(remaining),
      description: 'Saldo restante',
      icon: 'wallet',
      label: 'Restante',
      tone: 'savings',
    },
  ]

  return (
    <div className="app-split">
      <section className="photo-hero trip-static-hero app-split__visual">
        <img
          alt={tripHeroPhoto.alt}
          src={tripHeroPhoto.src}
          style={{ objectPosition: tripHeroPhoto.position }}
        />
        <div className="photo-hero__shade trip-carousel__shade" />
        <div className="trip-hero__amount">
          <span>Saldo restante</span>
          <strong>{money(remaining)}</strong>
        </div>
      </section>

      <div className="finance-panel app-split__content">
        <div className="balance-grid compact trip-grid">
          {metrics.map((metric) => (
            <StatCard item={metric} key={metric.label} />
          ))}
        </div>
        <section className="quick-card" id="quick-entry-trip">
          <div className="quick-card__header">
            <span className="quick-card__icon savings">
              <AppIcon name="landmark" size={18} />
            </span>
            <div>
              <h3>Fondo inicial</h3>
              <p>Actualiza el fondo independiente del viaje.</p>
            </div>
          </div>
          <div className="quick-fields">
            <label>
              <span>Monto</span>
              <input
                inputMode="decimal"
                onChange={(event) => onChangeInitialFund(event.target.value)}
                placeholder={money(trip.initialFund)}
                type="text"
                value={trip.initialFundInput}
              />
            </label>
          </div>
          <div className="quick-actions single">
            <button className="primary-button" type="button" onClick={onSaveInitial}>
              Guardar fondo
            </button>
          </div>
        </section>
        <section className="quick-card" id="quick-entry-trip-movement">
          <div className="quick-card__header">
            <span className="quick-card__icon expense">
              <AppIcon name="receipt" size={18} />
            </span>
            <div>
              <h3>Registro rapido</h3>
              <p>Guarda ingresos o gastos del viaje.</p>
            </div>
          </div>
          <div className="quick-fields">
            <label>
              <span>Descripcion</span>
              <input
                onChange={(event) => onChangeForm('description', event.target.value)}
                placeholder="Comida, taxi, entrada..."
                type="text"
                value={trip.form.description}
              />
            </label>
            <label>
              <span>Monto</span>
              <input
                inputMode="decimal"
                onChange={(event) => onChangeForm('amount', event.target.value)}
                placeholder="0.00"
                type="text"
                value={trip.form.amount}
              />
            </label>
          </div>
          <div className="quick-actions">
            <button
              className="danger-button"
              type="button"
              onClick={() => onRegisterMovement('expense')}
            >
              Registrar gasto
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={() => onRegisterMovement('income')}
            >
              Registrar ingreso
            </button>
          </div>
        </section>
        {statusMessage ? <p className="quick-card__message">{statusMessage}</p> : null}
        <div className="detail-actions compact-actions trip-actions">
          <BigActionButton
            action={{
              label: trip.isFinished ? 'Viaje finalizado' : 'Finalizar viaje',
              icon: 'target',
              tone: 'info',
            }}
            onClick={onFinalize}
          />
          <BigActionButton
            action={{ label: 'Transferir a ahorros', icon: 'transfer', tone: 'savings' }}
            onClick={onTransferTripBalance}
          />
        </div>
        <div className="screen-toolbar compact-toolbar finance-actions">
          <button className="secondary-button" type="button" onClick={onAdvanced}>
            Movimiento avanzado
          </button>
          <ExportButton onClick={onExport} />
        </div>
      </div>
    </div>
  )
}

function PhotoCarousel({
  className,
  label,
  slides,
}: {
  className: string
  label: string
  slides: typeof summarySlides
}) {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 5500)

    return () => window.clearInterval(timer)
  }, [slides.length])

  const goToSlide = (index: number) => {
    setActiveSlide((index + slides.length) % slides.length)
  }

  return (
    <section className={`photo-carousel app-split__visual ${className}`} aria-label={label}>
      {slides.map((slide, index) => (
        <img
          alt={slide.alt}
          aria-hidden={activeSlide !== index}
          className={`photo-carousel__image ${
            activeSlide === index ? 'is-active' : ''
          }`}
          key={slide.src}
          src={slide.src}
          style={{ objectPosition: slide.position }}
        />
      ))}
      <div className="photo-hero__shade photo-carousel__shade" />
      <div className="photo-carousel__controls" aria-label="Cambiar foto">
        <button
          aria-label="Foto anterior"
          type="button"
          onClick={() => goToSlide(activeSlide - 1)}
        >
          <AppIcon name="chevronLeft" size={18} />
        </button>
        <button
          aria-label="Foto siguiente"
          type="button"
          onClick={() => goToSlide(activeSlide + 1)}
        >
          <AppIcon name="chevronRight" size={18} />
        </button>
      </div>
      <div className="photo-carousel__dots" aria-label="Indicadores del carrusel">
        {slides.map((slide, index) => (
          <button
            aria-label={`Ver foto ${index + 1}`}
            className={activeSlide === index ? 'is-active' : ''}
            key={slide.src}
            type="button"
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </section>
  )
}

function GymScreen({
  monthDate,
  records,
  selectedDate,
  statusMessage,
  onChangeMonth,
  onSelectDate,
}: {
  monthDate: Date
  records: GymAttendanceRecord[]
  selectedDate: string
  statusMessage: string | null
  onChangeMonth: (offset: number) => void
  onSelectDate: (date: string) => void
}) {
  const stats = calculateGymStats(records)
  const days = getMonthDays(monthDate)
  const weekDays = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']

  return (
    <div className="gym-layout">
      <GymPhotoCard selectedDate={selectedDate} stats={stats} />

      <div className="gym-main-panel">
        <section className="gym-calendar-card">
          <div className="gym-calendar-header">
            <button aria-label="Mes anterior" type="button" onClick={() => onChangeMonth(-1)}>
              <AppIcon name="chevronLeft" size={18} />
            </button>
            <div>
              <h2>{formatMonthLabel(monthDate)}</h2>
              <p>Selecciona un dia para registrar asistencia.</p>
            </div>
            <button aria-label="Mes siguiente" type="button" onClick={() => onChangeMonth(1)}>
              <AppIcon name="chevronRight" size={18} />
            </button>
          </div>

          <div className="gym-weekdays">
            {weekDays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="gym-calendar-grid">
            {days.map((day, index) => {
              if (!day.date || !day.day) {
                return <span className="gym-day is-empty" key={`empty-${index}`} />
              }

              const date = day.date
              const status = getGymDayStatus(records, date)
              const dayRecords = getRecordsForDate(records, date)

              return (
                <button
                  className={`gym-day ${status}`}
                  key={date}
                  type="button"
                  onClick={() => onSelectDate(date)}
                >
                  <span>{day.day}</span>
                  <small>{summarizeGymDay(dayRecords)}</small>
                </button>
              )
            })}
          </div>

          <div className="gym-legend">
            <span><i className="both" /> Ambos</span>
            <span><i className="marcos" /> Marcos</span>
            <span><i className="nayeli" /> Nayeli</span>
            <span><i className="none" /> No</span>
            <span><i className="empty" /> Sin registro</span>
          </div>
          {statusMessage ? <p className="quick-card__message">{statusMessage}</p> : null}
        </section>
      </div>
    </div>
  )
}

function GymPhotoCard({
  selectedDate,
  stats,
}: {
  selectedDate: string
  stats: ReturnType<typeof calculateGymStats>
}) {
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [isPhotoLoading, setIsPhotoLoading] = useState(false)
  const [isPhotoSaving, setIsPhotoSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadPhoto() {
      setPhotoError(null)
      setIsPhotoLoading(true)

      try {
        const photo = await loadGymDailyPhoto(selectedDate)

        if (!ignore) {
          setPhotoUrl(photo?.image_url ?? null)
        }
      } catch (error) {
        if (!ignore) {
          setPhotoUrl(null)
          setPhotoError(
            error instanceof Error
              ? error.message
              : 'No se pudo cargar la foto de Gym.',
          )
        }
      } finally {
        if (!ignore) {
          setIsPhotoLoading(false)
        }
      }
    }

    void loadPhoto()

    return () => {
      ignore = true
    }
  }, [selectedDate])

  const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    setPhotoError(null)
    setIsPhotoSaving(true)

    try {
      const photo = await saveGymDailyPhoto({ file, photoDate: selectedDate })
      setPhotoUrl(photo.image_url)
    } catch (error) {
      setPhotoError(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la foto de Gym.',
      )
    } finally {
      setIsPhotoSaving(false)
      event.target.value = ''
    }
  }

  return (
    <section className={`gym-photo-card ${photoUrl ? 'has-photo' : ''}`}>
      <div className="gym-photo-card__top">
        <time dateTime={selectedDate}>{formatGymDisplayDate(selectedDate)}</time>
        <button
          aria-label={photoUrl ? 'Cambiar foto del dia' : 'Agregar foto del dia'}
          className="gym-photo-card__button"
          disabled={isPhotoSaving}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {isPhotoSaving ? '...' : '+'}
        </button>
      </div>

      <div className="gym-photo-card__media">
        {photoUrl ? (
          <img alt={`Foto de gym del ${selectedDate}`} src={photoUrl} />
        ) : (
          <span className="gym-photo-card__placeholder">
            <span className="gym-photo-card__icon">
              <AppIcon name="camera" size={24} />
            </span>
            <strong>{isPhotoLoading ? 'Cargando...' : 'Sin foto'}</strong>
          </span>
        )}

        <div className="gym-photo-stats" aria-label="Resumen mensual de Gym">
          <div className="gym-photo-stats__grid">
            <div>
              <strong>{stats.marcosCount}</strong>
              <span>Marcos</span>
            </div>
            <div>
              <strong>{stats.nayeliCount}</strong>
              <span>Nayeli</span>
            </div>
            <div>
              <strong>{stats.togetherCount}</strong>
              <span>Juntos</span>
            </div>
          </div>
        </div>

        {photoError ? <p className="gym-photo-card__error">{photoError}</p> : null}
      </div>

      <input
        accept="image/*"
        capture="environment"
        ref={inputRef}
        type="file"
        onChange={handlePhotoChange}
      />
    </section>
  )
}

function GymAttendanceForm({
  date,
  form,
  isSaving,
  statusMessage,
  onCancel,
  onChange,
  onSave,
}: {
  date: string
  form: GymForm
  isSaving: boolean
  statusMessage: string | null
  onCancel: () => void
  onChange: Dispatch<SetStateAction<GymForm>>
  onSave: () => void
}) {
  const workoutTypes: WorkoutType[] = [
    'Push',
    'Pull',
    'Legs',
    'Cardio',
    'Descanso',
    'Glúteos',
    'Otro',
  ]

  return (
    <div className="modal-form compact-modal-form gym-form">
      <p className="gym-form-date">{formatGymDisplayDate(date)}</p>
      <label>
        <span>Persona</span>
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              personCode: event.target.value as GymPersonChoice,
            }))
          }
          value={form.personCode}
        >
          <option value="marcos">Marcos</option>
          <option value="nayeli">Nayeli</option>
          <option value="both">Ambos</option>
        </select>
      </label>
      <label>
        <span>Entreno?</span>
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              trained: event.target.value === 'yes',
            }))
          }
          value={form.trained ? 'yes' : 'no'}
        >
          <option value="yes">Si</option>
          <option value="no">No</option>
        </select>
      </label>
      <label>
        <span>Tipo de entrenamiento</span>
        <select
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              workoutType: event.target.value as WorkoutType,
            }))
          }
          value={form.workoutType}
        >
          {workoutTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <label>
        <span>Nota opcional</span>
        <textarea
          onChange={(event) =>
            onChange((current) => ({ ...current, note: event.target.value }))
          }
          placeholder="Ej. buen entrenamiento, descanso, molestia..."
          value={form.note}
        />
      </label>
      {statusMessage ? <p className="quick-card__message">{statusMessage}</p> : null}
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="primary-button"
          disabled={isSaving}
          type="button"
          onClick={onSave}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function summarizeGymDay(records: GymAttendanceRecord[]) {
  const trained = records.filter((record) => record.trained)

  if (trained.length === 2) return 'Ambos'
  if (trained.some((record) => record.person_code === 'marcos')) return 'Marcos'
  if (trained.some((record) => record.person_code === 'nayeli')) return 'Nayeli'
  if (records.length >= 2 && records.every((record) => !record.trained)) return 'No'

  return 'Libre'
}

function formatGymDisplayDate(date: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  }).format(new Date(`${date}T12:00:00`))
}

type SavingsScreenProps = {
  goalAmountPen: number
  goalName: string
  goalProgress: number
  goalRemaining: number
  isLoading: boolean
  isSaving: boolean
  onAddSavings: () => void
  onEditGoal: () => void
  onExport: () => void
  onNewGoal: () => void
  onWithdrawSavings: () => void
  savings: SavingsState
  setSavings: Dispatch<SetStateAction<SavingsState>>
  statusMessage: string | null
}

function SavingsScreen({
  goalAmountPen,
  goalName,
  goalProgress,
  goalRemaining,
  isLoading,
  isSaving,
  onAddSavings,
  onEditGoal,
  onExport,
  onNewGoal,
  onWithdrawSavings,
  savings,
  setSavings,
  statusMessage,
}: SavingsScreenProps) {
  const cards: BalanceSummary[] = [
    {
      amount: money(savings.pen),
      description: 'Ahorro principal',
      icon: 'piggy',
      label: 'Ahorro Soles',
      tone: 'savings',
    },
    {
      amount: dollars(savings.usd),
      description: 'Reserva en moneda extranjera',
      icon: 'usd',
      label: 'Ahorro Dolares',
      tone: 'info',
    },
  ]
  const isGoalReached = savings.pen >= goalAmountPen && goalAmountPen > 0

  return (
    <div className="app-split">
      <section className="photo-hero savings-hero app-split__visual">
        <img alt="Nayeli con flores" src={photos.savings} />
        <div className="photo-hero__shade savings-hero__shade" />
        <div className="savings-hero__amount">
          <span>{goalProgress}% completado</span>
          <strong>{money(savings.pen)}</strong>
        </div>
      </section>

      <div className="finance-panel app-split__content">
        <div className="balance-grid savings-grid">
          {cards.map((balance) => (
            <StatCard item={balance} key={balance.label} />
          ))}
        </div>
        <ProgressCard
          actionLabel="Editar meta"
          current={money(savings.pen)}
          onAction={onEditGoal}
          progress={goalProgress}
          remaining={money(goalRemaining)}
          secondaryActionLabel={isGoalReached ? 'Nuevo objetivo' : undefined}
          statusLabel={isGoalReached ? 'Objetivo alcanzado' : undefined}
          target={money(goalAmountPen)}
          title={goalName}
          onSecondaryAction={isGoalReached ? onNewGoal : undefined}
        />
        <section className="quick-card savings-quick" id="quick-entry-savings">
          <div className="quick-card__header">
            <span className="quick-card__icon savings">
              <AppIcon name="piggy" size={18} />
            </span>
            <div>
              <h3>Agregar ahorro</h3>
              <p>Suma a soles o dolares sin pasos extra.</p>
            </div>
          </div>
          <div className="quick-fields savings-fields">
            <label>
              <span>Monto</span>
              <input
                inputMode="decimal"
                onChange={(event) =>
                  setSavings((current) => ({ ...current, formAmount: event.target.value }))
                }
                placeholder="0.00"
                type="text"
                value={savings.formAmount}
              />
            </label>
            <label>
              <span>Moneda</span>
              <select
                onChange={(event) =>
                  setSavings((current) => ({
                    ...current,
                    currency: event.target.value as SavingsCurrency,
                  }))
                }
                value={savings.currency}
              >
                <option value="PEN">Soles</option>
                <option value="USD">Dolares</option>
              </select>
            </label>
          </div>
          {statusMessage ? (
            <p className="quick-card__message">{statusMessage}</p>
          ) : null}
          <div className="quick-actions secondary-line">
            <button
              className="primary-button savings-action"
              disabled={isSaving}
              type="button"
              onClick={onAddSavings}
            >
              {isSaving ? 'Guardando...' : 'Agregar ahorro'}
            </button>
            <button
              className="secondary-button"
              disabled={isSaving}
              type="button"
              onClick={onWithdrawSavings}
            >
              {isSaving ? 'Guardando...' : 'Retiro'}
            </button>
          </div>
        </section>
        {isLoading ? <p className="finance-status">Cargando ahorros reales...</p> : null}
        <div className="screen-toolbar compact-toolbar finance-actions">
          <ExportButton onClick={onExport} />
        </div>
      </div>
    </div>
  )
}

function SavingsGoalForm({
  form,
  isNewGoal,
  isSaving,
  onCancel,
  onChange,
  onSave,
  statusMessage,
}: {
  form: GoalForm
  isNewGoal: boolean
  isSaving: boolean
  onCancel: () => void
  onChange: Dispatch<SetStateAction<GoalForm>>
  onSave: () => void
  statusMessage: string | null
}) {
  return (
    <div className="modal-form compact-modal-form">
      {isNewGoal ? (
        <div className="goal-mode-options">
          <label className="goal-mode-option">
            <input
              checked={form.mode === 'keep'}
              name="goalMode"
              type="radio"
              onChange={() =>
                onChange((current) => ({ ...current, mode: 'keep' }))
              }
            />
            <span>
              Crear nueva meta conservando el ahorro actual.
            </span>
          </label>
          <label className="goal-mode-option">
            <input
              checked={form.mode === 'reset'}
              name="goalMode"
              type="radio"
              onChange={() =>
                onChange((current) => ({ ...current, mode: 'reset' }))
              }
            />
            <span>
              Crear nueva meta empezando desde S/ 0.00.
            </span>
          </label>
        </div>
      ) : null}
      <label>
        <span>Nombre del objetivo</span>
        <input
          onChange={(event) =>
            onChange((current) => ({ ...current, name: event.target.value }))
          }
          placeholder="Objetivo de ahorro"
          type="text"
          value={form.name}
        />
      </label>
      <label>
        <span>Monto meta en soles</span>
        <input
          inputMode="decimal"
          onChange={(event) =>
            onChange((current) => ({ ...current, amount: event.target.value }))
          }
          placeholder="0.00"
          type="text"
          value={form.amount}
        />
      </label>
      {statusMessage ? (
        <p className="quick-card__message">{statusMessage}</p>
      ) : null}
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button
          className="primary-button"
          disabled={isSaving}
          type="button"
          onClick={onSave}
        >
          {isSaving ? 'Guardando...' : isNewGoal ? 'Crear objetivo' : 'Guardar meta'}
        </button>
      </div>
    </div>
  )
}

function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="export-button" type="button" onClick={onClick}>
      <AppIcon name="receipt" size={15} />
      Exportar
    </button>
  )
}

function QuickEntryCard({
  amount,
  description,
  id,
  isSaving = false,
  onAmountChange,
  onDescriptionChange,
  onExpense,
  onIncome,
  statusMessage,
  title,
}: {
  amount: string
  description: string
  id: string
  isSaving?: boolean
  onAmountChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onExpense: () => void
  onIncome: () => void
  statusMessage?: string | null
  title: string
}) {
  return (
    <section className="quick-card" id={id}>
      <div className="quick-card__header">
        <span className="quick-card__icon income">
          <AppIcon name="plus" size={18} />
        </span>
        <div>
          <h3>{title}</h3>
          <p>Actualiza el saldo visual al instante.</p>
        </div>
      </div>
      <div className="quick-fields">
        <label>
          <span>Descripcion</span>
          <input
            onChange={(event) => onDescriptionChange(event.target.value)}
            placeholder="Ej. almuerzo, pago, extra"
            type="text"
            value={description}
          />
        </label>
        <label>
          <span>Monto</span>
          <input
            inputMode="decimal"
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="0.00"
            type="text"
            value={amount}
          />
        </label>
      </div>
      {statusMessage ? (
        <p className="quick-card__message">{statusMessage}</p>
      ) : null}
      <div className="quick-actions">
        <button
          className="danger-button"
          disabled={isSaving}
          type="button"
          onClick={onExpense}
        >
          {isSaving ? 'Guardando...' : 'Gasto'}
        </button>
        <button
          className="primary-button"
          disabled={isSaving}
          type="button"
          onClick={onIncome}
        >
          {isSaving ? 'Guardando...' : 'Ingreso'}
        </button>
      </div>
    </section>
  )
}
