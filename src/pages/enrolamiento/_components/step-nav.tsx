import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { STEP_LABELS, TOTAL_STEPS } from "../_store/enrollment-store";

interface Props {
  currentStep: number;
  onPrev?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  nextLabel?: string;
  isLoading?: boolean;
}

export function StepNav({ currentStep, onPrev, isFirst, isLast, nextLabel, isLoading }: Props) {
  const prevStepLabel = STEP_LABELS[currentStep - 1];
  const nextStepLabel = nextLabel ?? (currentStep < TOTAL_STEPS ? STEP_LABELS[currentStep + 1] : undefined);

  return (
    <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
      {!isFirst && onPrev ? (
        <Button type="button" variant="ghost" onClick={onPrev} className="text-sm text-muted-foreground hover:text-foreground">
          Volver a {prevStepLabel}
        </Button>
      ) : <div />}
      <Button type="submit" size="lg" className="min-w-40 px-8" disabled={isLoading}>
        {isLoading ? (<><Loader2 className="mr-2 size-4 animate-spin" />Guardando...</>) :
         isLast ? "Finalizar inscripción" : `Continuar a ${nextStepLabel}`}
      </Button>
    </div>
  );
}
