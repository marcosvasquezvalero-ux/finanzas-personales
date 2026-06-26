import { useState } from 'react'
import type { AppSection } from '../types/finance'

type ExportReportFormProps = {
  module: Exclude<AppSection, 'summary' | 'gym'> | 'general'
  onCancel: () => void
  onGenerate: () => void
}

const moduleLabels: Record<ExportReportFormProps['module'], string> = {
  general: 'General',
  marcos: 'Marcos',
  nayeli: 'Nayeli',
  savings: 'Ahorros',
  trip: 'Viaje',
}

const movementOptions: Record<ExportReportFormProps['module'], string[]> = {
  general: ['Todos', 'Ingresos', 'Gastos'],
  marcos: ['Todos', 'Solo ingresos', 'Solo gastos'],
  nayeli: ['Todos', 'Solo ingresos', 'Solo gastos'],
  savings: ['Todos', 'Depósitos', 'Retiros'],
  trip: ['Todos', 'Ingresos', 'Gastos'],
}

export function ExportReportForm({
  module,
  onCancel,
  onGenerate,
}: ExportReportFormProps) {
  const [period, setPeriod] = useState('Este mes')

  return (
    <form
      className="export-form"
      onSubmit={(event) => {
        event.preventDefault()
        onGenerate()
      }}
    >
      <section className="export-group">
        <h3>¿Qué deseas exportar?</h3>
        <label className="option-card">
          <input defaultChecked name="module" type="radio" />
          <span>{moduleLabels[module]}</span>
        </label>
      </section>

      <section className="export-group">
        <h3>Período</h3>
        <div className="segmented-options">
          {['Hoy', 'Esta semana', 'Este mes', 'Este año', 'Personalizado'].map(
            (option) => (
              <label key={option}>
                <input
                  checked={period === option}
                  name="period"
                  onChange={() => setPeriod(option)}
                  type="radio"
                />
                <span>{option}</span>
              </label>
            ),
          )}
        </div>
        {period === 'Personalizado' ? (
          <div className="date-range">
            <label>
              <span>Desde</span>
              <input type="date" />
            </label>
            <label>
              <span>Hasta</span>
              <input type="date" />
            </label>
          </div>
        ) : null}
      </section>

      <section className="export-group">
        <h3>Tipo de movimientos</h3>
        <div className="segmented-options">
          {movementOptions[module].map((option, index) => (
            <label key={option}>
              <input defaultChecked={index === 0} name="movementType" type="radio" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="export-group">
        <h3>Formato</h3>
        <div className="format-options">
          <label className="option-card">
            <input defaultChecked name="format" type="radio" />
            <span>PDF</span>
          </label>
          <label className="option-card is-disabled">
            <input disabled name="format" type="radio" />
            <span>Excel (Próximamente)</span>
          </label>
        </div>
      </section>

      <div className="export-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit">
          Generar PDF
        </button>
      </div>
    </form>
  )
}
