import type { FormEvent } from "react"
import { useEnrollmentDniLookup } from "../../use-enrollment-dni-lookup"
import { StepContainer, StepNav } from "../../shared"
import { isMinor } from "../../../_utils/patient-age"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import type { IdentityDocumentType } from "@/types/identity-document"
import { useStepGate } from "../use-step-gate"
import { applyPaciente, pacienteValues } from "./adapter"
import { CompanionsSection } from "./companions"
import { contactGroups, companionGroups, identityGroups, profileGroups, residenceGroups } from "./config"
import { ContactsSection } from "./contacts"
import { IdentitySection } from "./identity"
import { ProfileSection } from "./profile"
import { ResidenceSection } from "./residence"
import { validatePaciente } from "./validate"

export function Step5Datos({ embedded = false, historical = false }: { embedded?: boolean; historical?: boolean }) {
  const { draft, updateDraft, nextStep, prevStep } = useEnrollmentStore()
  const lookup = useEnrollmentDniLookup(draft.patientData.documentType, draft.patientData.dni)
  const caller = draft.companion
  const callerReady = Boolean(caller.fullName.trim() && caller.primaryPhone.trim() && caller.relationship?.trim())
  const minor = isMinor(draft.patientData.birthDate)
  const values = pacienteValues(draft, { historical, minor, callerReady })
  const phoneRequired = values.primarySource === "PATIENT" || !historical
  const phones = contactGroups(phoneRequired)
  const companions = companionGroups(callerReady)
  const groups = [...identityGroups, ...phones, ...residenceGroups, ...profileGroups, ...companions]
  const gate = useStepGate(groups, values, () => validatePaciente(draft, historical, { state: lookup.state, matchId: lookup.match?.id }, callerReady, minor))

  function onChange(id: string, value: string | null) {
    updateDraft(applyPaciente(draft, id, value, callerReady))
  }

  function onDocument(type: IdentityDocumentType, number: string) {
    const same = type === (draft.patientData.documentType ?? "DNI") && number === (draft.patientData.dni ?? "")
    updateDraft({
      ...(same ? {} : { patientId: null }),
      patientData: { ...draft.patientData, documentType: type, dni: number || null },
    })
  }

  function submit(event: FormEvent) {
    if (gate.blocked(event)) return
    nextStep()
  }

  return (
    <StepContainer embedded={embedded} onSubmit={submit} className="flex flex-col gap-4">
      <IdentitySection
        embedded={embedded}
        draft={draft}
        minor={minor}
        values={values}
        showMissing={gate.showMissing}
        onChange={onChange}
        onDocument={onDocument}
        onReenroll={(patientId) => updateDraft({ patientId })}
      />
      <ContactsSection embedded={embedded} groups={phones} values={values} showMissing={gate.showMissing} onChange={onChange} />
      <CompanionsSection
        embedded={embedded}
        draft={draft}
        callerReady={callerReady}
        groups={companions}
        values={values}
        showMissing={gate.showMissing}
        onChange={onChange}
        onPeople={(partial) => updateDraft(partial)}
      />
      <ResidenceSection embedded={embedded} values={values} showMissing={gate.showMissing} onChange={onChange} />
      <ProfileSection embedded={embedded} draft={draft} values={values} showMissing={gate.showMissing} onChange={onChange} />
      {!embedded && <StepNav currentStep={5} onPrev={prevStep} missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
