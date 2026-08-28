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

export function draftDiagnosisOptionId(draftId: string) {
  return `${DRAFT_DIAGNOSIS_ID}:${draftId}`
}

export function isDraftDiagnosisOptionId(value: string) {
  return value.startsWith(`${DRAFT_DIAGNOSIS_ID}:`)
}

export function draftDiagnosisIdFromOption(value: string) {
  return value.slice(`${DRAFT_DIAGNOSIS_ID}:`.length)
}

export type DiagnosisDecisionMode = "REPLACE" | "PARALLEL"

export type DiagnosisDraft = Omit<
  CreatePatientDiagnosisInput,
  "followUpId" | "waitTimeForDiagnosis" | "mode" | "replacementDiagnosisId"
> & {
  draftId: string
  mode: DiagnosisDecisionMode
  replacementDiagnosisId?: string
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
  diagnoses?: DiagnosisDraft[]
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
    drafts.diagnoses?.length ||
    drafts.treatments?.length ||
    drafts.socialNotes?.length ||
    drafts.symptomReport ||
    drafts.insurance ||
    drafts.sisAffiliation ||
    drafts.healthBackground ||
    drafts.address,
  )
}
