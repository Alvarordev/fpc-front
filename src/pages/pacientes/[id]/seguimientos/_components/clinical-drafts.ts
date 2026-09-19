import type {
  CreatePatientDiagnosisInput,
  CreatePatientAddressInput,
  CreatePatientInsuranceInput,
  CreatePatientHealthBackgroundAssessmentInput,
  CreatePatientSisAffiliationInput,
  CreatePatientSymptomReportInput,
  CreatePatientTreatmentInput,
  PatientDetailsInput,
  TransitionPatientDiagnosticStatusDto,
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
  remembersWaitTimeForDiagnosis?: boolean
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
  | "followUpId"
  | "symptomDuration"
  | "symptomFrequency"
  | "diagnosisSearchDuration"
  | "reportedTreatmentFrequency"
  | "hasDiscomfort"
  | "hasMedicalConsultation"
  | "isAwaitingDiagnosis"
  | "hasReferral"
  | "hasReceivedDiagnosis"
> & {
  hasDiscomfort?: boolean | null
  hasMedicalConsultation?: boolean | null
  noMedicalConsultationReason?: string | null
  firstConsultationDate?: string | null
  isAwaitingDiagnosis?: boolean | null
  hasReferral?: boolean | null
  referredHealthCenterId?: string | null
  referralNotProvidedReason?: string | null
  hasReceivedDiagnosis?: boolean | null
  reportedDiagnosis?: string | null
  nextConsultationDate?: string | null
  symptomDuration?: DurationDraft
  symptomFrequency?: DurationDraft
  diagnosisSearchDuration?: DurationDraft
  reportedTreatmentFrequency?: DurationDraft
}

export type NonOncologicalFollowUpDraft = {
  id?: string
  diagnosticStatusEventId?: string | null
  diagnosis: string
  occurredOn?: string | null
  receivesTreatment?: boolean | null
  treatmentName?: string | null
  medication?: string | null
  treatmentFrequency?: DurationDraft
  hasControls?: boolean | null
  controlSpecialty?: string | null
  controlPeriodicity?: DurationDraft
  status?: "ACTIVE" | "DISCHARGED"
  dischargedOn?: string | null
  dischargeReason?: string | null
}

export type DiagnosticStatusDraft = {
  eventId?: string
  status: Exclude<TransitionPatientDiagnosticStatusDto["status"], "SEARCHING">
  diagnosis?: string
  supportedBySepa?: boolean
  notes?: string
}

/** Contact choice kept as draft in historical mode (no immediate PATCH). */
export type ContactDraft = {
  interlocutorId: string
  kind: "PATIENT" | "COMPANION" | "NEW_CAREGIVER"
  note?: string
}

export interface ClinicalDrafts {
  details?: PatientDetailsInput
  social?: PatientDetailsInput
  diagnoses?: DiagnosisDraft[]
  treatments?: TreatmentDraft[]
  socialNotes?: SocialNoteDraft[]
  symptomReport?: SymptomReportDraft
  nonOncologicalFollowUp?: NonOncologicalFollowUpDraft
  diagnosticStatus?: DiagnosticStatusDraft
  insurance?: InsuranceDraft
  sisAffiliation?: SisAffiliationDraft
  healthBackground?: HealthBackgroundAssessmentDraft
  address?: Omit<CreatePatientAddressInput, "followUpId">
  contact?: ContactDraft
}

export function hasAnyClinicalDraft(drafts: ClinicalDrafts): boolean {
  return Boolean(
    drafts.details ||
    drafts.social ||
    drafts.diagnoses?.length ||
    drafts.treatments?.length ||
    drafts.socialNotes?.length ||
    drafts.symptomReport ||
    drafts.nonOncologicalFollowUp ||
    drafts.diagnosticStatus ||
    drafts.insurance ||
    drafts.sisAffiliation ||
    drafts.healthBackground ||
    drafts.address ||
    drafts.contact,
  )
}
