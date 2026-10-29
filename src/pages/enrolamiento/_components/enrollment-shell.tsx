import { useEffect, useState } from "react"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ds/button"
import { Modal } from "@/components/ds/modal"
import { Card } from "@/components/ds/card"
import { cn } from "@/lib/utils"
import {
  getEnrollmentNotes,
  STEP_LABELS,
  TOTAL_STEPS,
  useEnrollmentStore,
} from "../_store/enrollment-store"
import { resolveAsideContent } from "../_utils/aside-resolver"
import { EnrollmentNotesModal } from "./enrollment-notes-modal"
import { EnrollmentRejection } from "./enrollment-rejection"
import { EnrollmentScript } from "./enrollment-script"
import { EnrollmentStepper } from "./enrollment-stepper"
import { Step1Inicio } from "./steps/step-1-inicio"
import { Step2Consent } from "./steps/step-2-consent"
import { Step3Identificacion } from "./steps/step-3-identificacion"
import { Step4Consentimiento } from "./steps/step-4-consentimiento"
import { Step5Datos } from "./steps/step-5-datos"
import { Step6Categoria } from "./steps/step-6-categoria"
import { Step7Atencion } from "./steps/step-7-atencion"
import { Step8Cierre } from "./steps/step-8-cierre"

interface CurrentStepProps {
  step: number
  onOpenNotes: () => void
  notesCount: number
  historical?: boolean
  embedded?: boolean
}

function CurrentStep({ step, onOpenNotes, notesCount, historical = false, embedded = false }: CurrentStepProps) {
  switch (step) {
    case 1:
      return <Step1Inicio onOpenNotes={onOpenNotes} notesCount={notesCount} historical={historical} embedded={embedded} />
    case 2:
      return <Step2Consent embedded={embedded} />
    case 3:
      return <Step3Identificacion embedded={embedded} />
    case 4:
      return <Step4Consentimiento embedded={embedded} />
    case 5:
      return <Step5Datos embedded={embedded} historical={historical} />
    case 6:
      return <Step6Categoria embedded={embedded} />
    case 7:
      return <Step7Atencion embedded={embedded} historical={historical} />
    case 8:
      return <Step8Cierre historical={historical} embedded={embedded} />
    default:
      return <Step1Inicio onOpenNotes={onOpenNotes} notesCount={notesCount} historical={historical} embedded={embedded} />
  }
}

function ContinuousStep({
  step,
  historical,
  notesCount,
  onOpenNotes,
}: {
  step: number
  historical: boolean
  notesCount: number
  onOpenNotes: () => void
}) {
  const draft = useEnrollmentStore((state) => state.draft)
  const categoriaClinica = useEnrollmentStore((state) => state.categoriaClinica)
  const content = resolveAsideContent(step, draft, categoriaClinica)

  return (
    <Card title={`${step}. ${STEP_LABELS[step]}`}>
      <div className="space-y-4">
        <EnrollmentScript content={content} nested />
        <CurrentStep step={step} onOpenNotes={onOpenNotes} notesCount={notesCount} historical={historical} embedded />
      </div>
    </Card>
  )
}

interface EnrollmentShellProps {
  historical?: boolean
  continuous?: boolean
}

export function EnrollmentShell({ historical = false, continuous = false }: EnrollmentShellProps) {
  const [notesOpen, setNotesOpen] = useState(false)
  const [notesResetKey, setNotesResetKey] = useState(0)
  const [resetOpen, setResetOpen] = useState(false)
  const { currentStep, rejectionReason, resetEnrollment, prevStep, clearRejection, goToStep, draft, categoriaClinica } =
    useEnrollmentStore()
  const notesCount = getEnrollmentNotes(draft.enrollmentMetadata).length
  const asideContent = resolveAsideContent(currentStep, draft, categoriaClinica)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === "n") {
        event.preventDefault()
        setNotesOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function handleReset() {
    setNotesOpen(false)
    setNotesResetKey((key) => key + 1)
    resetEnrollment()
  }

  function handleGoTo(step: number) {
    if (step >= currentStep) return
    if (rejectionReason) clearRejection()
    goToStep(step)
  }

  function openNotes() {
    setNotesOpen(true)
  }

  const rejection = rejectionReason ? (
    <EnrollmentRejection
      reason={rejectionReason}
      onReset={handleReset}
      onBack={() => {
        clearRejection()
        prevStep()
      }}
    />
  ) : null

  return (
    <div className={cn("font-ds", !continuous && "h-full overflow-y-auto")}>
      <div className="mx-auto flex max-w-[880px] flex-col gap-5 px-4 py-6 sm:px-6">
        {continuous ? (
          <>
            <div className="flex justify-end">
              <NotesButton count={notesCount} onClick={openNotes} />
            </div>
            {rejection ??
              Array.from({ length: TOTAL_STEPS }, (_, index) => index + 1).map((step) => (
                <ContinuousStep
                  key={step}
                  step={step}
                  historical={historical}
                  notesCount={notesCount}
                  onOpenNotes={openNotes}
                />
              ))}
          </>
        ) : (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Enrolamiento</h1>
                <p className="text-[13px] text-zinc-500">
                  Paso {currentStep} de {TOTAL_STEPS} · {STEP_LABELS[currentStep]}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <NotesButton count={notesCount} onClick={openNotes} />
                <Button variant="outline" onClick={() => setResetOpen(true)}>
                  Reiniciar
                </Button>
              </div>
            </header>
            <EnrollmentStepper currentStep={currentStep} onGoTo={handleGoTo} />
            {rejection ?? (
              <>
                <EnrollmentScript content={asideContent} />
                <CurrentStep step={currentStep} onOpenNotes={openNotes} notesCount={notesCount} historical={historical} />
              </>
            )}
          </>
        )}
      </div>
      <EnrollmentNotesModal key={notesResetKey} open={notesOpen} onOpenChange={setNotesOpen} />
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        icon={RotateCcw}
        title="Descartar borrador"
        description="Se borra lo que llevas escrito en este enrolamiento. Esta acción no se puede deshacer."
        footer={
          <>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              onClick={() => {
                setResetOpen(false)
                handleReset()
              }}
            >
              Descartar
            </Button>
          </>
        }
      >
        <p className="text-sm text-zinc-600">El formulario vuelve al paso 1, sin las respuestas de esta llamada.</p>
      </Modal>
    </div>
  )
}

function NotesButton({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <Button variant="outline" onClick={onClick} title="Alt + N">
      Notas{count > 0 ? ` · ${count}` : ""}
    </Button>
  )
}
