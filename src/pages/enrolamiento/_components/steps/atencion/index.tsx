import type { FormEvent } from "react"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group } from "@/components/ds/questions"
import { StepContainer, StepNav } from "../../shared"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"
import { ConsultsSection } from "./consults"
import { DiagnosesSection } from "./diagnoses"
import { SisSection } from "./sis"
import { SupportSection } from "./support"
import { SymptomsSection } from "./symptoms"
import { TreatmentsSection } from "./treatments"

const centerGroups: Group[] = [
  {
    title: "Establecimiento",
    description: "Opcional. Selecciónalo si el paciente ya tiene un hospital principal definido.",
    questions: [{ id: "primaryCenter", label: "Establecimiento principal del paciente", type: "select", catalog: HEALTH_CENTER, wide: true }],
  },
]

export function Step7Atencion({ embedded = false, historical = false }: { embedded?: boolean; historical?: boolean }) {
  const { draft, updateDraft, nextStep, prevStep, categoriaClinica } = useEnrollmentStore()
  const esSignos = categoriaClinica === "SIGNS_AND_SYMPTOMS"
  const esDx = categoriaClinica === "CANCER_DIAGNOSIS"
  const hasInsurance = Boolean(draft.insurance.insuranceType && draft.insurance.insuranceType !== "NONE")
  const showPsycho = esDx && (draft.enrollmentMetadata.affiliationType === "PATIENT" || historical)
  const label = esSignos ? "Signos y síntomas" : esDx ? "Diagnóstico de cáncer" : "Sin categoría clínica"

  function submit(event: FormEvent) {
    event.preventDefault()
    nextStep()
  }

  return (
    <StepContainer embedded={embedded} onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-[13px] text-zinc-500">
        Rama activa: {label} · {hasInsurance ? "Con seguro" : "Sin seguro"}
      </p>
      <SectionBlock embedded={embedded} title="Establecimiento principal del paciente">
        <QuestionForm
          groups={centerGroups}
          values={{ primaryCenter: draft.details.primaryHealthCenterId ?? null }}
          onChange={(_id, value) => updateDraft({ details: { ...draft.details, primaryHealthCenterId: value || undefined } })}
        />
      </SectionBlock>
      {esSignos && <SymptomsSection embedded={embedded} historical={historical} />}
      {esDx && (
        <>
          <DiagnosesSection embedded={embedded} historical={historical} />
          <ConsultsSection embedded={embedded} />
          <TreatmentsSection embedded={embedded} />
        </>
      )}
      <SupportSection embedded={embedded} showPsycho={showPsycho} />
      {!hasInsurance && <SisSection embedded={embedded} />}
      {!embedded && <StepNav currentStep={7} onPrev={prevStep} />}
    </StepContainer>
  )
}
