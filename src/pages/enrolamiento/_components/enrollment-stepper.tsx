import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { STEP_LABELS, TOTAL_STEPS } from "../_store/enrollment-store";

interface EnrollmentStepperProps {
  currentStep: number;
}

export function EnrollmentStepper({ currentStep }: EnrollmentStepperProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                isCompleted && "bg-primary text-primary-foreground",
                isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                !isActive && !isCompleted && "bg-muted text-muted-foreground",
              )}
            >
              {isCompleted ? <Check className="size-3.5" /> : step}
            </div>
            <span
              className={cn(
                "text-xs font-medium hidden sm:inline",
                isActive ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {STEP_LABELS[step]}
            </span>
            {step < TOTAL_STEPS && (
              <div
                className={cn(
                  "h-px w-4 sm:w-6",
                  step < currentStep ? "bg-primary/50" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
