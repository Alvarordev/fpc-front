import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ds/button"
import { STEP_LABELS, TOTAL_STEPS } from "../_store/enrollment-store"

interface Props {
  currentStep: number
  onPrev?: () => void
  onClick?: () => void
  isFirst?: boolean
  isLast?: boolean
  nextLabel?: string
  isLoading?: boolean
  /** Obligatorios vacíos. El botón sigue habilitado; el aviso va junto a él. */
  missingCount?: number
  /** Regla que no cabe en `required` (formato, fechas, un dato de otro paso). */
  alert?: string | null
  /** Se mantiene por compatibilidad con el modo continuo; la fila ya no se pega al pie. */
  sticky?: boolean
}

/** Cierre del paso: volver a la izquierda, continuar a la derecha y, junto a él, qué falta. */
export function StepNav({ currentStep, onPrev, onClick, isFirst, isLast, nextLabel, isLoading, missingCount = 0, alert }: Props) {
  const prevStepLabel = STEP_LABELS[currentStep - 1]
  const nextStepLabel = nextLabel ?? (currentStep < TOTAL_STEPS ? STEP_LABELS[currentStep + 1] : undefined)
  const continueLabel = isLoading ? "Guardando…" : isLast ? "Finalizar inscripción" : `Continuar a ${nextStepLabel}`
  const problem = alert ?? (missingCount ? (missingCount === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingCount} datos obligatorios`) : null)

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-5">
      {!isFirst && onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="size-4" />
          {prevStepLabel}
        </button>
      )}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-3">
        {problem && (
          <p role="alert" className={cn("text-[13px] text-red-700", alert && "max-w-md text-right")}>
            {problem}
          </p>
        )}
        <Button type={onClick ? "button" : "submit"} size="md" variant={isLast ? "brand" : "dark"} onClick={onClick} disabled={isLoading}>
          {continueLabel}
        </Button>
      </div>
    </div>
  )
}
