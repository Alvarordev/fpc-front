import { cn } from "@/lib/utils"
import { SegmentedProgress } from "@/components/ds/progress"
import { STEP_LABELS, TOTAL_STEPS } from "../_store/enrollment-store"

interface Props {
  currentStep: number
  onGoTo: (step: number) => void
}

export function EnrollmentStepper({ currentStep, onGoTo }: Props) {
  return (
    <div className="space-y-3">
      <SegmentedProgress done={currentStep} total={TOTAL_STEPS} showCount={false} />
      <ol className="flex flex-wrap gap-x-3 gap-y-1">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((step) => {
          const active = step === currentStep
          const done = step < currentStep
          const className = cn("text-[13px]", active ? "font-medium text-black" : "text-zinc-400")
          return (
            <li key={step}>
              {done ? (
                <button type="button" onClick={() => onGoTo(step)} className={cn(className, "cursor-pointer hover:text-zinc-700")}>
                  {STEP_LABELS[step]}
                </button>
              ) : (
                <span className={className}>{STEP_LABELS[step]}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
