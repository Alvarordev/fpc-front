import type {
  CreatePatientDiagnosisInput,
  CreatePatientInsuranceInput,
  CreatePatientSisAffiliationInput,
  CreatePatientTreatmentInput,
  PatientDetailsInput,
} from "@/api/patients"

/** Sentinel diagnosisId meaning "link to the diagnosis draft in this same batch". */
export const DRAFT_DIAGNOSIS_ID = "__DRAFT_DIAGNOSIS__"

export type DiagnosisDraft = Omit<CreatePatientDiagnosisInput, "followUpId">
export type TreatmentDraft = Omit<CreatePatientTreatmentInput, "followUpId">
export type InsuranceDraft = Omit<CreatePatientInsuranceInput, "followUpId">
export type SisAffiliationDraft = Omit<CreatePatientSisAffiliationInput, "followUpId">

export interface ClinicalDrafts {
  details?: PatientDetailsInput
  social?: PatientDetailsInput
  diagnosis?: DiagnosisDraft
  treatment?: TreatmentDraft
  insurance?: InsuranceDraft
  sisAffiliation?: SisAffiliationDraft
}

export function hasAnyClinicalDraft(drafts: ClinicalDrafts): boolean {
  return Boolean(
    drafts.details || drafts.social || drafts.diagnosis || drafts.treatment || drafts.insurance || drafts.sisAffiliation,
  )
}
