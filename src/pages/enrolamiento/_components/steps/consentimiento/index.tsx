import { Panel } from "@/components/ds/card"
import { QuestionForm } from "@/components/ds/question-form"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { useStepGate } from "../use-step-gate"
import { applyConsentimiento, consentimientoValues } from "./adapter"
import { CONSENT_TEXT, consentimientoGroups } from "./config"

export function Step4Consentimiento({ embedded = false }: { embedded?: boolean }) {
  const { draft, updateDraft, nextStep, prevStep, setRejection } = useEnrollmentStore()
  const values = consentimientoValues(draft)
  const gate = useStepGate(consentimientoGroups, values)

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(event) => {
        if (gate.blocked(event)) return
        nextStep()
      }}
      className="flex flex-col gap-6"
    >
      {embedded ? (
        <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700">{CONSENT_TEXT}</p>
      ) : (
        <Panel title="Consentimiento para leer">
          <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700">{CONSENT_TEXT}</p>
        </Panel>
      )}
      <QuestionForm
        cards={!embedded}
        groups={consentimientoGroups}
        values={values}
        showMissing={gate.showMissing}
        onChange={(id, value) => {
          updateDraft(applyConsentimiento(draft, id, value))
          if (id === "informedConsent" && value === "no") setRejection("q8_no")
        }}
      />
      {!embedded && <StepNav currentStep={4} onPrev={prevStep} missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
