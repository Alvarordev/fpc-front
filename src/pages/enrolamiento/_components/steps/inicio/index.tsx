import { Button } from "@/components/ds/button"
import { QuestionForm } from "@/components/ds/question-form"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { useStepGate } from "../use-step-gate"
import { applyInicio, inicioValues } from "./adapter"
import { inicioGroups, validateInicio } from "./config"

interface Props {
  onOpenNotes: () => void
  notesCount: number
  historical?: boolean
  embedded?: boolean
}

export function Step1Inicio({ onOpenNotes, notesCount, historical = false, embedded = false }: Props) {
  const { draft, updateDraft, nextStep } = useEnrollmentStore()
  const groups = inicioGroups(historical)
  const values = inicioValues(draft, historical)
  const gate = useStepGate(groups, values, (current) => validateInicio(current, historical))

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(event) => {
        if (gate.blocked(event)) return
        if (!historical && !draft.enrollmentMetadata.startTime && values.startTime) {
          updateDraft({ enrollmentMetadata: { ...draft.enrollmentMetadata, startTime: values.startTime } })
        }
        nextStep()
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-zinc-500">
          {notesCount > 0 ? `${notesCount} ${notesCount === 1 ? "nota" : "notas"} en el borrador` : "Sin notas en el borrador"}
        </p>
        <Button variant="outline" onClick={onOpenNotes}>
          Abrir notas
        </Button>
      </div>
      <QuestionForm groups={groups} values={values} onChange={(id, value) => updateDraft(applyInicio(draft, id, value))} showMissing={gate.showMissing} />
      {!embedded && <StepNav currentStep={1} isFirst missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
