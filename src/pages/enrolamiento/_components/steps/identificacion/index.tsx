import { InlineAlert } from "@/components/ds/inline-alert"
import { QuestionForm } from "@/components/ds/question-form"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { useStepGate } from "../use-step-gate"
import { applyIdentificacion, identificacionValues } from "./adapter"
import { identificacionGroups, validateIdentificacion } from "./config"

export function Step3Identificacion({ embedded = false }: { embedded?: boolean }) {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const values = identificacionValues(draft)
  const gate = useStepGate(identificacionGroups, values, validateIdentificacion)
  const known = values.affiliation === "PATIENT" || values.affiliation === "FAMILY"

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(event) => {
        if (gate.blocked(event)) return
        nextStep()
      }}
      className="flex flex-col gap-6"
    >
      {known ? (
        <QuestionForm
          groups={identificacionGroups}
          values={values}
          showMissing={gate.showMissing}
          onChange={(id, value) => updateDraft(applyIdentificacion(draft, id, value))}
        />
      ) : (
        <InlineAlert tone="warning">Tipo de afiliación no definido. Vuelve al paso anterior.</InlineAlert>
      )}
      {!embedded && <StepNav currentStep={3} onPrev={prevStep} missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
