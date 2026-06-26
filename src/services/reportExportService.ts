import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type {
  PersonalMovementRecord,
  PersonalMovementType,
} from '../models/personalMovement'
import {
  fetchPersonalFinance,
  type PersonalFinanceCode,
} from './personalFinanceService'

export type ReportFormat = 'pdf' | 'excel'
export type ReportMovementFilter = 'all' | 'income' | 'expense'
export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom'

export type ExportReportOptions = {
  customFrom: string
  customTo: string
  format: ReportFormat
  movementFilter: ReportMovementFilter
  period: ReportPeriod
  personCode: PersonalFinanceCode
}

type ReportMovement = {
  amount: number
  date: string
  description: string
  type: string
}

type ReportData = {
  generatedAt: string
  movementFilter: ReportMovementFilter
  movements: ReportMovement[]
  periodLabel: string
  personName: string
  saldoFinal: number
  saldoInicial: number
  totalGastos: number
  totalIngresos: number
}

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  currency: 'PEN',
  minimumFractionDigits: 2,
  style: 'currency',
})

const dateFormatter = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export async function exportFinancialReport(options: ExportReportOptions) {
  const report = await buildReportData(options)

  if (options.format === 'pdf') {
    exportPdf(report)
    return
  }

  exportExcel(report)
}

async function buildReportData(options: ExportReportOptions): Promise<ReportData> {
  const finance = await fetchPersonalFinance(options.personCode)
  const { from, label, to } = resolvePeriod(options)
  const sortedMovements = [...finance.movements].sort(compareMovementsAsc)
  const filteredMovements = sortedMovements.filter((movement) => {
    return (
      movement.movement_date >= from &&
      movement.movement_date <= to &&
      matchesMovementFilter(movement, options.movementFilter)
    )
  })
  const saldoInicial = sortedMovements
    .filter((movement) => movement.movement_date < from)
    .reduce((total, movement) => total + movementSignedAmount(movement), 0)
  const totalIngresos = filteredMovements
    .filter((movement) => isIncomeType(movement.type))
    .reduce((total, movement) => total + movement.amount, 0)
  const totalGastos = filteredMovements
    .filter((movement) => movement.type === 'expense')
    .reduce((total, movement) => total + movement.amount, 0)

  return {
    generatedAt: dateTimeFormatter.format(new Date()),
    movementFilter: options.movementFilter,
    movements: filteredMovements.map((movement) => ({
      amount: movement.amount,
      date: formatDate(movement.movement_date),
      description: movement.description || movement.category,
      type: movementTypeLabel(movement.type),
    })),
    periodLabel: label,
    personName: finance.person.name,
    saldoFinal: saldoInicial + totalIngresos - totalGastos,
    saldoInicial,
    totalGastos,
    totalIngresos,
  }
}

function exportPdf(report: ReportData) {
  const doc = new jsPDF()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Reporte financiero', 14, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Persona: ${report.personName}`, 14, 28)
  doc.text(`Periodo: ${report.periodLabel}`, 14, 35)
  doc.text(`Fecha de generacion: ${report.generatedAt}`, 14, 42)

  autoTable(doc, {
    body: [
      ['Saldo inicial', formatMoney(report.saldoInicial)],
      ['Total ingresos', formatMoney(report.totalIngresos)],
      ['Total gastos', formatMoney(report.totalGastos)],
      ['Saldo final', formatMoney(report.saldoFinal)],
    ],
    startY: 50,
    styles: { fontSize: 10 },
    theme: 'grid',
  })

  const finalY = getLastAutoTableY(doc) + 10

  if (report.movements.length === 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('No se encontraron movimientos', 14, finalY)
  } else {
    autoTable(doc, {
      head: [['Fecha', 'Descripcion', 'Tipo', 'Monto']],
      body: report.movements.map((movement) => [
        movement.date,
        movement.description,
        movement.type,
        formatMoney(movement.amount),
      ]),
      startY: finalY,
      styles: { fontSize: 9 },
      theme: 'striped',
    })
  }

  doc.save(reportFileName(report, 'pdf'))
}

function exportExcel(report: ReportData) {
  const summaryRows = [
    ['Persona', report.personName],
    ['Periodo', report.periodLabel],
    ['Fecha de generacion', report.generatedAt],
    ['Saldo inicial', report.saldoInicial],
    ['Total ingresos', report.totalIngresos],
    ['Total gastos', report.totalGastos],
    ['Saldo final', report.saldoFinal],
  ]
  const movementRows =
    report.movements.length > 0
      ? report.movements.map((movement) => ({
          Descripcion: movement.description,
          Fecha: movement.date,
          Monto: movement.amount,
          Tipo: movement.type,
        }))
      : [{ Descripcion: 'No se encontraron movimientos', Fecha: '', Monto: '', Tipo: '' }]

  const workbook = XLSX.utils.book_new()
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows)
  const movementsSheet = XLSX.utils.json_to_sheet(movementRows, {
    header: ['Fecha', 'Descripcion', 'Tipo', 'Monto'],
  })

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen')
  XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Movimientos')
  XLSX.writeFile(workbook, reportFileName(report, 'xlsx'))
}

function resolvePeriod(options: ExportReportOptions) {
  const today = startOfDay(new Date())

  if (options.period === 'custom') {
    if (!options.customFrom || !options.customTo) {
      throw new Error('Selecciona las fechas Desde y Hasta.')
    }

    if (options.customFrom > options.customTo) {
      throw new Error('La fecha Desde no puede ser mayor que Hasta.')
    }

    return {
      from: options.customFrom,
      label: `${formatDate(options.customFrom)} - ${formatDate(options.customTo)}`,
      to: options.customTo,
    }
  }

  const start = new Date(today)

  if (options.period === 'today') {
    return {
      from: toDateKey(today),
      label: 'Hoy',
      to: toDateKey(today),
    }
  }

  if (options.period === 'week') {
    const day = today.getDay()
    const mondayOffset = day === 0 ? -6 : 1 - day
    start.setDate(today.getDate() + mondayOffset)

    return {
      from: toDateKey(start),
      label: 'Esta semana',
      to: toDateKey(today),
    }
  }

  if (options.period === 'month') {
    start.setDate(1)

    return {
      from: toDateKey(start),
      label: 'Este mes',
      to: toDateKey(today),
    }
  }

  start.setMonth(0, 1)

  return {
    from: toDateKey(start),
    label: 'Este ano',
    to: toDateKey(today),
  }
}

function matchesMovementFilter(
  movement: PersonalMovementRecord,
  filter: ReportMovementFilter,
) {
  if (filter === 'all') return true
  if (filter === 'income') return isIncomeType(movement.type)
  return movement.type === 'expense'
}

function movementSignedAmount(movement: PersonalMovementRecord) {
  return isIncomeType(movement.type) ? movement.amount : -movement.amount
}

function isIncomeType(type: PersonalMovementType) {
  return type === 'salary' || type === 'income'
}

function movementTypeLabel(type: PersonalMovementType) {
  if (type === 'expense') return 'Gasto'
  if (type === 'salary') return 'Sueldo'
  return 'Ingreso'
}

function compareMovementsAsc(
  first: PersonalMovementRecord,
  second: PersonalMovementRecord,
) {
  return (
    first.movement_date.localeCompare(second.movement_date) ||
    first.created_at.localeCompare(second.created_at)
  )
}

function formatMoney(value: number) {
  return moneyFormatter.format(value).replace('PEN', 'S/')
}

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T12:00:00`))
}

function reportFileName(report: ReportData, extension: 'pdf' | 'xlsx') {
  const person = report.personName.toLowerCase().replace(/\s+/g, '-')
  const date = new Date().toISOString().slice(0, 10)
  return `reporte-financiero-${person}-${date}.${extension}`
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLastAutoTableY(doc: jsPDF) {
  const tableDoc = doc as jsPDF & { lastAutoTable?: { finalY: number } }
  return tableDoc.lastAutoTable?.finalY ?? 50
}
