import { QuestionForm } from "@/components/ds/question-form"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { useStepGate } from "../use-step-gate"
import { applyInicio, inicioValues } from "./adapter"
import { inicioGroups, validateInicio } from "./config"

interface Props {
  historical?: boolean
  embedded?: boolean
}

export function Step1Inicio({ historical = false, embedded = false }: Props) {
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
      <QuestionForm cards={!embedded} groups={groups} values={values} onChange={(id, value) => updateDraft(applyInicio(draft, id, value))} showMissing={gate.showMissing} />
      {!embedded && <StepNav currentStep={1} isFirst missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
