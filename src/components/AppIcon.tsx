import {
  ArrowRightLeft,
  BadgeDollarSign,
  Banknote,
  BriefcaseBusiness,
  Camera,
  CalendarDays,
  Car,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Coins,
  DollarSign,
  Dumbbell,
  Equal,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Minus,
  Moon,
  PiggyBank,
  Plane,
  Plus,
  ReceiptText,
  ShoppingCart,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  UserRound,
  Utensils,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  banknote: Banknote,
  briefcase: BriefcaseBusiness,
  camera: Camera,
  calendar: CalendarDays,
  car: Car,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  coins: Coins,
  dashboard: LayoutDashboard,
  dollar: DollarSign,
  dumbbell: Dumbbell,
  equal: Equal,
  expense: TrendingDown,
  health: HeartPulse,
  income: TrendingUp,
  landmark: Landmark,
  minus: Minus,
  piggy: PiggyBank,
  plane: Plane,
  plus: Plus,
  receipt: ReceiptText,
  savings: PiggyBank,
  shopping: ShoppingCart,
  sparkles: Sparkles,
  target: Target,
  transfer: ArrowRightLeft,
  user: UserRound,
  wallet: Wallet,
  usd: CircleDollarSign,
  utensils: Utensils,
  sun: Sun,
  moon: Moon,
  close: X,
  badgeDollar: BadgeDollarSign,
}

type AppIconProps = {
  name: string
  size?: number
  strokeWidth?: number
}

export function AppIcon({ name, size = 20, strokeWidth = 2.25 }: AppIconProps) {
  const Icon = icons[name] ?? Sparkles

  return <Icon aria-hidden="true" size={size} strokeWidth={strokeWidth} />
}
