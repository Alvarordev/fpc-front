import { cn } from "@/lib/utils";
import { STEP_LABELS, TOTAL_STEPS } from "../_store/enrollment-store";

interface Props { currentStep: number }

export function EnrollmentStepper({ currentStep }: Props) {
  return (
    <nav className="flex items-start gap-0">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((step) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <div key={step} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative flex items-center justify-center">
                {isActive && <span className="absolute size-5 animate-ping rounded-full bg-primary/30" />}
                <div className={cn("rounded-full transition-all duration-300",
                  isDone && "size-2.5 bg-primary",
                  isActive && "size-3.5 bg-primary ring-4 ring-primary/20",
                  !isDone && !isActive && "size-2.5 bg-border")}
                />
              </div>
              <span className={cn("hidden text-[10px] font-semibold tracking-wide transition-colors md:block",
                isActive ? "text-foreground" : "text-muted-foreground/60")}>
                {STEP_LABELS[step]}
              </span>
            </div>
            {step < TOTAL_STEPS && (
              <div className={cn("mx-1 mt-1 h-px w-6 md:w-10 transition-colors duration-300",
                step < currentStep ? "bg-primary" : "bg-border/60")} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
