import type { AppSection } from '../types/finance'

type MovementFormProps = {
  section: Exclude<AppSection, 'summary' | 'gym'>
  onCancel: () => void
  onSubmitVisual: () => void
}

const sectionLabels: Record<Exclude<AppSection, 'summary' | 'gym'>, string> = {
  marcos: 'Marcos',
  nayeli: 'Nayeli',
  trip: 'Viaje',
  savings: 'Ahorros',
}

export function MovementForm({
  section,
  onCancel,
  onSubmitVisual,
}: MovementFormProps) {
  const isTrip = section === 'trip'
  const isSavings = section === 'savings'

  return (
    <form
      className="visual-form"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmitVisual()
      }}
    >
      <label>
        <span>Destino</span>
        <input readOnly value={sectionLabels[section]} />
      </label>

      <label>
        <span>Fecha</span>
        <input defaultValue="2026-06-25" type="date" />
      </label>

      <label>
        <span>Tipo</span>
        <select defaultValue={isSavings ? 'deposit' : isTrip ? 'income' : 'expense'}>
          {section === 'marcos' || section === 'nayeli' ? (
            <>
              <option value="salary">Sueldo</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </>
          ) : null}
          {isTrip ? (
            <>
              <option value="initial">Fondo inicial</option>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </>
          ) : null}
          {isSavings ? (
            <>
              <option value="deposit">Depósito</option>
              <option value="withdrawal">Retiro</option>
            </>
          ) : null}
        </select>
      </label>

      {isSavings ? (
        <label>
          <span>Moneda</span>
          <select defaultValue="PEN">
            <option value="PEN">Soles</option>
            <option value="USD">Dólares</option>
          </select>
        </label>
      ) : null}

      <label>
        <span>Categoría</span>
        <input
          defaultValue={
            isSavings ? 'Meta de ahorro' : isTrip ? 'Viaje' : 'Personal'
          }
          type="text"
        />
      </label>

      <label>
        <span>Descripción</span>
        <input placeholder="Detalle del movimiento" type="text" />
      </label>

      <label>
        <span>Monto</span>
        <input defaultValue="0.00" inputMode="decimal" type="text" />
      </label>

      <div className="visual-form__actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary-button" type="submit">
          Guardar visualmente
        </button>
      </div>
    </form>
  )
}
