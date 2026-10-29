import { cn } from "@/lib/utils"
import { Button } from "@/components/ds/button"
import { InlineAlert } from "@/components/ds/inline-alert"
import { STEP_LABELS, TOTAL_STEPS } from "../_store/enrollment-store"

interface Props {
  currentStep: number
  onPrev?: () => void
  onClick?: () => void
  isFirst?: boolean
  isLast?: boolean
  nextLabel?: string
  isLoading?: boolean
  /** Obligatorios vacíos. El botón sigue habilitado; el aviso va sobre la barra. */
  missingCount?: number
  /** En el modo continuo el cierre queda en el flujo, sin pegarse al pie. */
  sticky?: boolean
}

export function StepNav({
  currentStep,
  onPrev,
  onClick,
  isFirst,
  isLast,
  nextLabel,
  isLoading,
  missingCount = 0,
  sticky = true,
}: Props) {
  const prevStepLabel = STEP_LABELS[currentStep - 1]
  const nextStepLabel = nextLabel ?? (currentStep < TOTAL_STEPS ? STEP_LABELS[currentStep + 1] : undefined)
  const continueLabel = isLoading ? "Guardando…" : isLast ? "Finalizar inscripción" : `Continuar a ${nextStepLabel}`

  return (
    <div className={cn(sticky && "sticky bottom-4 z-20", "mt-6")}>
      {missingCount > 0 && (
        <div className="mb-2">
          <InlineAlert>
            {missingCount === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingCount} datos obligatorios`}
          </InlineAlert>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 rounded-[20px] bg-white p-3 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.3)] ring-1 ring-zinc-200">
        {!isFirst && onPrev ? (
          <Button type="button" variant="outline" onClick={onPrev}>
            Volver a {prevStepLabel}
          </Button>
        ) : (
          <span />
        )}
        <Button type={onClick ? "button" : "submit"} variant={isLast ? "brand" : "dark"} onClick={onClick} disabled={isLoading}>
          {continueLabel}
        </Button>
      </div>
    </div>
  )
}
