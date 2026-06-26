export type AppSection =
  | 'summary'
  | 'marcos'
  | 'nayeli'
  | 'trip'
  | 'savings'
  | 'gym'

export type Tone = 'income' | 'expense' | 'info' | 'savings' | 'neutral'

export type MovementKind =
  | 'salary'
  | 'income'
  | 'expense'
  | 'initial'
  | 'deposit'
  | 'withdrawal'

export type NavigationItem = {
  id: AppSection
  label: string
  icon: string
  tone: Tone
}

export type BalanceSummary = {
  label: string
  amount: string
  description: string
  icon: string
  tone: Tone
}

export type Movement = {
  id: string
  title: string
  subtitle: string
  amount: string
  icon: string
  kind: MovementKind
  scope: AppSection
  tone: Tone
  date: string
}

export type CategorySummary = {
  label: string
  amount: string
  icon: string
  tone: Tone
}

export type QuickAction = {
  label: string
  icon: string
  tone: Tone
}

export type SectionDetail = {
  title: string
  kicker: string
  badge: string
  heroLabel: string
  heroAmount: string
  heroDescription: string
  icon: string
  tone: Tone
  actions: QuickAction[]
}

export type PersonalSection = {
  id: 'marcos' | 'nayeli'
  name: string
  balance: string
  income: string
  expenses: string
  monthlyBalance: string
  metrics: BalanceSummary[]
  movements: Movement[]
}

export type TripSection = {
  balance: string
  income: string
  expenses: string
  available: string
  metrics: BalanceSummary[]
  latestExpenses: Movement[]
}

export type SavingsSection = {
  penBalance: string
  usdBalance: string
  goalName: string
  goalAmount: string
  goalCurrent: string
  goalRemaining: string
  goalProgress: number
  progressLabel: string
  balances: BalanceSummary[]
  history: Movement[]
}
