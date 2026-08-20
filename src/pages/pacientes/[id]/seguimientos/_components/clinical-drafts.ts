import type {
  CreatePatientDiagnosisInput,
  CreatePatientAddressInput,
  CreatePatientInsuranceInput,
  CreatePatientHealthBackgroundAssessmentInput,
  CreatePatientSisAffiliationInput,
  CreatePatientSymptomReportInput,
  CreatePatientTreatmentInput,
  PatientDetailsInput,
} from "@/api/patients"
import type { DurationDraft } from "@/types/duration"

/** Sentinel diagnosisId meaning "link to the diagnosis draft in this same batch". */
export const DRAFT_DIAGNOSIS_ID = "__DRAFT_DIAGNOSIS__"

export type DiagnosisDraft = Omit<
  CreatePatientDiagnosisInput,
  "followUpId" | "waitTimeForDiagnosis"
> & {
  waitTimeForDiagnosis?: DurationDraft
  waitTimeForDiagnosisManuallyEdited?: boolean
}
export type TreatmentDecisionMode = "REPLACE" | "PARALLEL"
export type TreatmentDraft = Omit<
  CreatePatientTreatmentInput,
  "followUpId" | "seriesId"
> & {
  mode: TreatmentDecisionMode
  seriesId?: string
}
export type SocialNoteType = "SOCIAL_WORKER" | "CONADIS" | "FISSAL"
export type SocialNoteDraft = {
  type: SocialNoteType
  note: string
}
export type InsuranceDraft = Omit<CreatePatientInsuranceInput, "followUpId">
export type SisAffiliationDraft = Omit<
  CreatePatientSisAffiliationInput,
  "followUpId"
>
export type HealthBackgroundAssessmentDraft = Omit<
  CreatePatientHealthBackgroundAssessmentInput,
  "followUpId"
>
export type SymptomReportDraft = Omit<
  CreatePatientSymptomReportInput,
  "followUpId" | "symptomDuration" | "symptomFrequency"
> & {
  symptomDuration?: DurationDraft
  symptomFrequency?: DurationDraft
}

export interface ClinicalDrafts {
  details?: PatientDetailsInput
  social?: PatientDetailsInput
  diagnosis?: DiagnosisDraft
  treatments?: TreatmentDraft[]
  socialNotes?: SocialNoteDraft[]
  symptomReport?: SymptomReportDraft
  insurance?: InsuranceDraft
  sisAffiliation?: SisAffiliationDraft
  healthBackground?: HealthBackgroundAssessmentDraft
  address?: Omit<CreatePatientAddressInput, "followUpId">
}

export function hasAnyClinicalDraft(drafts: ClinicalDrafts): boolean {
  return Boolean(
    drafts.details ||
    drafts.social ||
    drafts.diagnosis ||
    drafts.treatments?.length ||
    drafts.socialNotes?.length ||
    drafts.symptomReport ||
    drafts.insurance ||
    drafts.sisAffiliation ||
    drafts.healthBackground ||
    drafts.address,
  )
}
