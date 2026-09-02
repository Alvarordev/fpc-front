import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { getEnrollmentNotes, TOTAL_STEPS, useEnrollmentStore } from "../_store/enrollment-store";
import { EnrollmentStepper } from "./enrollment-stepper";
import { EnrollmentAside } from "./enrollment-aside";
import { EnrollmentNotesSheet } from "./enrollment-notes-sheet";
import { EnrollmentRejection } from "./enrollment-rejection";
import { Step1Inicio } from "./steps/step-1-inicio";
import { Step2Consent } from "./steps/step-2-consent";
import { Step3Identificacion } from "./steps/step-3-identificacion";
import { Step4Consentimiento } from "./steps/step-4-consentimiento";
import { Step5Datos } from "./steps/step-5-datos";
import { Step6Categoria } from "./steps/step-6-categoria";
import { Step7Atencion } from "./steps/step-7-atencion";
import { Step8Cierre } from "./steps/step-8-cierre";
import { resolveAsideContent } from "../_utils/aside-resolver";

interface CurrentStepProps {
  step: number;
  onOpenNotes: () => void;
  notesCount: number;
  historical?: boolean;
  embedded?: boolean;
}

function CurrentStep({ step, onOpenNotes, notesCount, historical = false, embedded = false }: CurrentStepProps) {
  switch (step) {
    case 1: return <Step1Inicio onOpenNotes={onOpenNotes} notesCount={notesCount} historical={historical} embedded={embedded} />;
    case 2: return <Step2Consent embedded={embedded} />;
    case 3: return <Step3Identificacion embedded={embedded} />;
    case 4: return <Step4Consentimiento embedded={embedded} />;
    case 5: return <Step5Datos embedded={embedded} />;
    case 6: return <Step6Categoria embedded={embedded} />;
    case 7: return <Step7Atencion embedded={embedded} />;
    case 8: return <Step8Cierre historical={historical} embedded={embedded} />;
    default: return <Step1Inicio onOpenNotes={onOpenNotes} notesCount={notesCount} historical={historical} embedded={embedded} />;
  }
}

interface EnrollmentShellProps {
  historical?: boolean;
  continuous?: boolean;
}

export function EnrollmentShell({ historical = false, continuous = false }: EnrollmentShellProps) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesResetKey, setNotesResetKey] = useState(0);
  const { currentStep, rejectionReason, resetEnrollment, prevStep, clearRejection, draft, categoriaClinica } =
    useEnrollmentStore();
  const notesCount = getEnrollmentNotes(draft.enrollmentMetadata).length;

  function handleReset() {
    setNotesOpen(false);
    setNotesResetKey((key) => key + 1);
    resetEnrollment();
  }

  const asideContent = useMemo(
    () => resolveAsideContent(currentStep, draft, categoriaClinica),
    [currentStep, draft, categoriaClinica],
  );

  const currentStepContent = rejectionReason ? (
    <EnrollmentRejection
      reason={rejectionReason}
      onReset={handleReset}
      onBack={() => { clearRejection(); prevStep(); }}
    />
  ) : continuous ? (
    <div className="mx-auto max-w-3xl space-y-12 px-5 py-8 md:px-8 md:py-10">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((step) => (
        <section key={step} className="border-b border-border/50 pb-12 last:border-b-0 last:pb-0">
          <CurrentStep
            step={step}
            onOpenNotes={() => setNotesOpen(true)}
            notesCount={notesCount}
            historical={historical}
            embedded
          />
        </section>
      ))}
    </div>
  ) : (
    <CurrentStep
      step={currentStep}
      onOpenNotes={() => setNotesOpen(true)}
      notesCount={notesCount}
      historical={historical}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!continuous && (
        <div className="flex shrink-0 items-center justify-center border-b border-border/50 bg-background px-6 py-4">
          <EnrollmentStepper currentStep={currentStep} />
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {continuous ? currentStepContent : <div className="mx-auto max-w-2xl px-8 py-10">{currentStepContent}</div>}
        </div>
        {!continuous && (
          <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-border/50 bg-muted/30 lg:block xl:w-96">
            <div className="px-6 py-8">
              <EnrollmentAside
                content={asideContent}
                onOpenNotes={() => setNotesOpen(true)}
                notesCount={notesCount}
                onReset={handleReset}
              />
            </div>
          </div>
        )}
      </div>
      <div className="pointer-events-none fixed bottom-5 right-5 z-40 lg:hidden">
        <Button
          type="button"
          size="lg"
          className="pointer-events-auto gap-2 rounded-full px-4 shadow-xl"
          onClick={() => setNotesOpen(true)}
          aria-label="Abrir notas del enrolamiento"
        >
          <FileText className="size-4" />
          <span>Notas</span>
          {notesCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary-foreground/15 text-xs">
              {notesCount}
            </span>
          )}
        </Button>
      </div>
      <EnrollmentNotesSheet key={notesResetKey} open={notesOpen} onOpenChange={setNotesOpen} />
    </div>
  );
}
