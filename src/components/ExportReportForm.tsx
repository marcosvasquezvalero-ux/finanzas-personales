import { useState } from 'react'
import type {
  ExportReportOptions,
  ReportFormat,
  ReportMovementFilter,
  ReportPeriod,
} from '../services/reportExportService'
import type { AppSection } from '../types/finance'

type ExportReportFormProps = {
  module: Exclude<AppSection, 'summary' | 'gym'> | 'general'
  onCancel: () => void
  onGenerate: (options: ExportReportOptions) => Promise<void>
}

const periodOptions: Array<{ label: string; value: ReportPeriod }> = [
  { label: 'Hoy', value: 'today' },
  { label: 'Esta semana', value: 'week' },
  { label: 'Este mes', value: 'month' },
  { label: 'Este año', value: 'year' },
  { label: 'Personalizado', value: 'custom' },
]

const movementOptions: Array<{ label: string; value: ReportMovementFilter }> = [
  { label: 'Todos', value: 'all' },
  { label: 'Solo ingresos', value: 'income' },
  { label: 'Solo gastos', value: 'expense' },
]

export function ExportReportForm({
  module,
  onCancel,
  onGenerate,
}: ExportReportFormProps) {
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [format, setFormat] = useState<ReportFormat>('pdf')
  const [formError, setFormError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [movementFilter, setMovementFilter] =
    useState<ReportMovementFilter>('all')
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [personCode, setPersonCode] = useState<'marcos' | 'nayeli'>(
    module === 'nayeli' ? 'nayeli' : 'marcos',
  )

  return (
    <form
      className="export-form"
      onSubmit={(event) => {
        event.preventDefault()
        setFormError(null)
        setIsGenerating(true)

        void onGenerate({
          customFrom,
          customTo,
          format,
          movementFilter,
          period,
          personCode,
        })
          .catch((error) => {
            setFormError(
              error instanceof Error
                ? error.message
                : 'No se pudo generar el reporte.',
            )
          })
          .finally(() => setIsGenerating(false))
      }}
    >
      <section className="export-group">
        <h3>Persona</h3>
        <div className="format-options">
          {[
            { label: 'Marcos', value: 'marcos' },
            { label: 'Nayeli', value: 'nayeli' },
          ].map((option) => (
            <label className="option-card" key={option.value}>
              <input
                checked={personCode === option.value}
                name="person"
                type="radio"
                onChange={() => setPersonCode(option.value as 'marcos' | 'nayeli')}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="export-group">
        <h3>Periodo</h3>
        <div className="segmented-options">
          {periodOptions.map((option) => (
            <label key={option.value}>
              <input
                checked={period === option.value}
                name="period"
                type="radio"
                onChange={() => setPeriod(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {period === 'custom' ? (
          <div className="date-range">
            <label>
              <span>Desde</span>
              <input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
              />
            </label>
            <label>
              <span>Hasta</span>
              <input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="export-group">
        <h3>Tipo de movimientos</h3>
        <div className="segmented-options">
          {movementOptions.map((option) => (
            <label key={option.value}>
              <input
                checked={movementFilter === option.value}
                name="movementType"
                type="radio"
                onChange={() => setMovementFilter(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="export-group">
        <h3>Formato</h3>
        <div className="format-options">
          {[
            { label: 'PDF', value: 'pdf' },
            { label: 'Excel', value: 'excel' },
          ].map((option) => (
            <label className="option-card" key={option.value}>
              <input
                checked={format === option.value}
                name="format"
                type="radio"
                onChange={() => setFormat(option.value as ReportFormat)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </section>

      {formError ? <p className="export-form__error">{formError}</p> : null}

      <div className="export-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" disabled={isGenerating} type="submit">
          {isGenerating
            ? 'Generando...'
            : format === 'pdf'
              ? 'Generar PDF'
              : 'Generar Excel'}
        </button>
      </div>
    </form>
  )
}
