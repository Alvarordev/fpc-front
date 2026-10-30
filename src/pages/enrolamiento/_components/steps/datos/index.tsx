import { QuestionForm } from "@/components/ds/question-form"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { useStepGate } from "../use-step-gate"
import { applyDatos, datosValues } from "./adapter"
import { datosGroups } from "./config"

export function Step2Consent({ embedded = false }: { embedded?: boolean }) {
  const { draft, updateDraft, nextStep, prevStep, setRejection } = useEnrollmentStore()
  const values = datosValues(draft)
  const gate = useStepGate(datosGroups, values)

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(event) => {
        if (gate.blocked(event)) return
        nextStep()
      }}
      className="flex flex-col gap-6"
    >
      <QuestionForm
        cards={!embedded}
        groups={datosGroups}
        values={values}
        showMissing={gate.showMissing}
        onChange={(id, value) => {
          updateDraft(applyDatos(draft, id, value))
          if (id === "dataPolicy" && value === "no") setRejection("q3_no")
        }}
      />
      {!embedded && <StepNav currentStep={2} onPrev={prevStep} missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
