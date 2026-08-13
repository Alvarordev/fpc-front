import type {
  CreatePatientDiagnosisInput,
  CreatePatientAddressInput,
  CreatePatientInsuranceInput,
  CreatePatientSisAffiliationInput,
  CreatePatientSymptomReportInput,
  CreatePatientTreatmentInput,
  PatientDetailsInput,
} from "@/api/patients"
import type { DurationDraft } from "@/types/duration"

/** Sentinel diagnosisId meaning "link to the diagnosis draft in this same batch". */
export const DRAFT_DIAGNOSIS_ID = "__DRAFT_DIAGNOSIS__"

export type DiagnosisDraft = Omit<CreatePatientDiagnosisInput, "followUpId" | "waitTimeForDiagnosis"> & {
  waitTimeForDiagnosis?: DurationDraft
  waitTimeForDiagnosisManuallyEdited?: boolean
}
export type TreatmentDraft = Omit<CreatePatientTreatmentInput, "followUpId">
export type InsuranceDraft = Omit<CreatePatientInsuranceInput, "followUpId">
export type SisAffiliationDraft = Omit<CreatePatientSisAffiliationInput, "followUpId">
export type SymptomReportDraft = Omit<CreatePatientSymptomReportInput, "followUpId" | "symptomDuration" | "symptomFrequency"> & {
  symptomDuration?: DurationDraft
  symptomFrequency?: DurationDraft
}

export interface ClinicalDrafts {
  details?: PatientDetailsInput
  social?: PatientDetailsInput
  diagnosis?: DiagnosisDraft
  treatment?: TreatmentDraft
  symptomReport?: SymptomReportDraft
  insurance?: InsuranceDraft
  sisAffiliation?: SisAffiliationDraft
  address?: Omit<CreatePatientAddressInput, "followUpId">
}

export function hasAnyClinicalDraft(drafts: ClinicalDrafts): boolean {
  return Boolean(
    drafts.details || drafts.social || drafts.diagnosis || drafts.treatment || drafts.symptomReport || drafts.insurance || drafts.sisAffiliation || drafts.address,
  )
}
