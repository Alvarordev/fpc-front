import type { components } from "@/api/schema"
import type {
  PatientDetailsInput,
  PatientDetailsResponse,
} from "@/api/patients"
import {
  draftDiagnosisIdFromOption,
  isDraftDiagnosisOptionId,
  type ClinicalDrafts,
  type DiagnosisDraft,
  type TreatmentDraft,
} from "@/pages/pacientes/[id]/seguimientos/_components/clinical-drafts"
import { normalizeDuration, toDurationInput } from "@/types/duration"

/**
 * The historical create and update DTOs are identical except that the update
 * variants accept an `id` to edit an existing record instead of adding one.
 * Intersecting them lets a single payload be reused for POST and PATCH.
 */
type WithRecordId<T> = T & { id?: string }

type DiagnosisPayload = WithRecordId<
  components["schemas"]["EnrollmentDiagnosisDto"]
>
type TreatmentPayload = WithRecordId<
  components["schemas"]["HistoricalFollowUpTreatmentDto"]
>
type SymptomReportPayload = WithRecordId<
  components["schemas"]["EnrollmentSymptomReportDto"]
>
type HealthBackgroundPayload = WithRecordId<
  components["schemas"]["EnrollmentHealthBackgroundAssessmentDto"]
>
type InsurancePayload = WithRecordId<
  components["schemas"]["EnrollmentInsuranceDto"]
>
type SisAffiliationPayload = WithRecordId<
  components["schemas"]["EnrollmentSisAffiliationDto"]
>
type AddressPayload = WithRecordId<
  components["schemas"]["EnrollmentAddressDto"]
>
type SocialNotePayload = WithRecordId<
  components["schemas"]["HistoricalFollowUpSocialNoteDto"]
>

export interface HistoricalClinicalPayload {
  interlocutorId: string
  details?: PatientDetailsInput
  diagnoses?: DiagnosisPayload[]
  treatments?: TreatmentPayload[]
  symptomReport?: SymptomReportPayload
  healthBackgroundAssessment?: HealthBackgroundPayload
  insurance?: InsurancePayload
  sisAffiliation?: SisAffiliationPayload
  addresses?: AddressPayload[]
  socialNotes?: SocialNotePayload[]
}

/** Ids of the records already persisted for the follow-up being edited. */
export interface HistoricalClinicalRecordIds {
  /** Existing diagnosis id, keyed by `DiagnosisDraft.draftId`. */
  diagnoses?: Record<string, string>
  /** Existing treatment id, positional against `drafts.treatments`. */
  treatments?: (string | undefined)[]
  symptomReportId?: string
  healthBackgroundAssessmentId?: string
  insuranceId?: string
  sisAffiliationId?: string
  addressId?: string
}

function resolveWaitTimeForDiagnosis(draft: DiagnosisDraft) {
  const manuallyEdited = draft.waitTimeForDiagnosisManuallyEdited
  if (manuallyEdited) return toDurationInput(draft.waitTimeForDiagnosis)
  if (draft.firstSymptomsDate && draft.diagnosisDate) return undefined
  return toDurationInput(draft.waitTimeForDiagnosis)
}

function buildDiagnosis(
  draft: DiagnosisDraft,
  existingId?: string,
): DiagnosisPayload {
  const waitTimeForDiagnosis = resolveWaitTimeForDiagnosis(draft)
  if (
    draft.waitTimeForDiagnosis?.valueMin !== undefined &&
    !waitTimeForDiagnosis
  )
    throw new Error(
      "Completa correctamente el tiempo de espera para el diagnóstico",
    )

  return {
    mode: draft.mode,
    ...(draft.mode === "REPLACE"
      ? { replacementDiagnosisId: draft.replacementDiagnosisId }
      : {}),
    diagnosis: draft.diagnosis,
    cancerStage: draft.cancerStage,
    diagnosisDate: draft.diagnosisDate,
    firstSymptomsDate: draft.firstSymptomsDate,
    healthCenterId: draft.healthCenterId,
    diagnosisSpecialty: draft.diagnosisSpecialty,
    symptomLeadingToCheckup: draft.symptomLeadingToCheckup,
    hasMedicalReport: draft.hasMedicalReport,
    isSepaActiveReferral: draft.isSepaActiveReferral,
    ...(waitTimeForDiagnosis ? { waitTimeForDiagnosis } : {}),
    clientRef: draft.draftId,
    ...(existingId ? { id: existingId } : {}),
  }
}

function buildTreatment(
  draft: TreatmentDraft,
  existingId: string | undefined,
  newDiagnosisRefs: Set<string>,
): TreatmentPayload | null {
  const isDraftLink = isDraftDiagnosisOptionId(draft.diagnosisId)
  const diagnosisRef = isDraftLink
    ? draftDiagnosisIdFromOption(draft.diagnosisId)
    : undefined
  const diagnosisId = isDraftLink ? undefined : draft.diagnosisId

  if (diagnosisRef && !newDiagnosisRefs.has(diagnosisRef)) return null
  if (!diagnosisRef && !diagnosisId) return null

  if (draft.mode === "REPLACE" && !draft.seriesId)
    throw new Error("Selecciona el tratamiento que deseas actualizar")

  const treatmentFrequency = toDurationInput(draft.treatmentFrequency)
  if (draft.treatmentFrequency && !treatmentFrequency)
    throw new Error("Completa correctamente la frecuencia del tratamiento")

  const medications = draft.medications?.map((medication) => ({
    ...medication,
    frequency: toDurationInput(medication.frequency),
  }))

  return {
    ...(diagnosisRef ? { diagnosisRef } : {}),
    ...(diagnosisId ? { diagnosisId } : {}),
    treatmentType: draft.treatmentType,
    seriesId: draft.mode === "REPLACE" ? draft.seriesId : undefined,
    isReferred: draft.isReferred,
    sourceHealthCenterId: draft.sourceHealthCenterId,
    receivingHealthCenterId: draft.receivingHealthCenterId,
    startDate: draft.startDate,
    endDate: draft.endDate,
    changeReason: draft.changeReason,
    notReceivingReason: draft.notReceivingReason,
    operationName: draft.operationName,
    careProgram: draft.careProgram,
    receivesTeleconsultation: draft.receivesTeleconsultation,
    teleconsultationNote:
      draft.receivesTeleconsultation === true
        ? draft.teleconsultationNote
        : undefined,
    teleconsultationSpecialties:
      draft.receivesTeleconsultation === true
        ? draft.teleconsultationSpecialties
        : undefined,
    treatmentSituation: draft.treatmentSituation,
    treatmentAbandonmentReason:
      draft.treatmentSituation === "ABANDONED"
        ? draft.treatmentAbandonmentReason
        : undefined,
    interruptionReason: draft.interruptionReason,
    interruptionReasonOther: draft.interruptionReasonOther,
    treatmentViaSepa: draft.treatmentViaSepa,
    scheduledSessions: draft.scheduledSessions,
    completedSessions: draft.completedSessions,
    hormonalTreatmentCompleted: draft.hormonalTreatmentCompleted,
    accessBarrierCode: draft.accessBarrierCode,
    accessBarrierOther: draft.accessBarrierOther,
    orientedRegardingBarriers: draft.orientedRegardingBarriers,
    hasLatestPrescription: draft.hasLatestPrescription,
    latestPrescriptionDate: draft.latestPrescriptionDate,
    treatmentFrequency,
    ...(medications?.length ? { medications } : {}),
    ...(existingId ? { id: existingId } : {}),
  }
}

/**
 * Converts the clinical drafts collected by `ClinicalDataTabs` into the nested
 * clinical fields accepted by the historical follow-up endpoints. Mirrors the
 * sequential `commitDrafts` writes of the operational follow-up screen, but as
 * a single payload the backend persists atomically.
 */
export function buildHistoricalClinicalPayload({
  drafts,
  patientId,
  recordIds = {},
}: {
  drafts: ClinicalDrafts
  patientId: string
  recordIds?: HistoricalClinicalRecordIds
}): HistoricalClinicalPayload {
  const payload: HistoricalClinicalPayload = {
    interlocutorId: drafts.contact?.interlocutorId ?? patientId,
  }

  const details: PatientDetailsInput = {
    ...drafts.details,
    ...drafts.social,
  }
  if (Object.keys(details).length > 0) payload.details = details

  const diagnosisDrafts = drafts.diagnoses ?? []
  if (diagnosisDrafts.length > 0) {
    payload.diagnoses = diagnosisDrafts.map((draft) =>
      buildDiagnosis(draft, recordIds.diagnoses?.[draft.draftId]),
    )
  }

  const newDiagnosisRefs = new Set(
    diagnosisDrafts.map((diagnosis) => diagnosis.draftId),
  )
  const treatments = (drafts.treatments ?? [])
    .map((draft, index) =>
      buildTreatment(draft, recordIds.treatments?.[index], newDiagnosisRefs),
    )
    .filter((treatment): treatment is TreatmentPayload => treatment !== null)
  if (treatments.length > 0) payload.treatments = treatments

  if (drafts.socialNotes?.length) {
    payload.socialNotes = drafts.socialNotes.map((note) => ({
      type: note.type,
      note: note.note,
    }))
  }

  if (drafts.symptomReport) {
    const { symptomDuration, symptomFrequency, ...rest } = drafts.symptomReport
    const normalizedDuration = toDurationInput(symptomDuration)
    const normalizedFrequency = toDurationInput(symptomFrequency)
    if (symptomDuration?.valueMin !== undefined && !normalizedDuration)
      throw new Error("Completa correctamente la duración de los síntomas")
    if (symptomFrequency?.valueMin !== undefined && !normalizedFrequency)
      throw new Error("Completa correctamente la frecuencia de los síntomas")

    payload.symptomReport = {
      ...rest,
      ...(normalizedDuration ? { symptomDuration: normalizedDuration } : {}),
      ...(normalizedFrequency ? { symptomFrequency: normalizedFrequency } : {}),
      ...(recordIds.symptomReportId ? { id: recordIds.symptomReportId } : {}),
    }
  }

  if (drafts.healthBackground) {
    payload.healthBackgroundAssessment = {
      ...drafts.healthBackground,
      ...(recordIds.healthBackgroundAssessmentId
        ? { id: recordIds.healthBackgroundAssessmentId }
        : {}),
    }
  }

  if (drafts.insurance) {
    payload.insurance = {
      ...drafts.insurance,
      ...(recordIds.insuranceId ? { id: recordIds.insuranceId } : {}),
    }
  }

  if (drafts.sisAffiliation) {
    payload.sisAffiliation = {
      ...drafts.sisAffiliation,
      ...(recordIds.sisAffiliationId ? { id: recordIds.sisAffiliationId } : {}),
    }
  }

  if (drafts.address) {
    payload.addresses = [
      {
        ...drafts.address,
        ...(recordIds.addressId ? { id: recordIds.addressId } : {}),
      },
    ]
  }

  return payload
}

function omitNulls<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== null),
  ) as { [K in keyof T]: Exclude<T[K], null> }
}

/**
 * Rebuilds the drafts (and the ids needed to update instead of duplicate) from
 * the records the given historical follow-up already produced.
 */
export function historicalClinicalDraftsFromPatient(
  patient: PatientDetailsResponse | undefined,
  followUpId: string | undefined,
): { drafts: ClinicalDrafts; recordIds: HistoricalClinicalRecordIds } {
  if (!patient || !followUpId) return { drafts: {}, recordIds: {} }

  const drafts: ClinicalDrafts = {}
  const recordIds: HistoricalClinicalRecordIds = {}

  const diagnoses = patient.diagnoses.filter(
    (diagnosis) => diagnosis.followUpId === followUpId,
  )
  if (diagnoses.length > 0) {
    recordIds.diagnoses = {}
    drafts.diagnoses = diagnoses.map((diagnosis) => {
      recordIds.diagnoses![diagnosis.id] = diagnosis.id
      return {
        draftId: diagnosis.id,
        mode: "PARALLEL",
        diagnosis: diagnosis.diagnosis,
        ...omitNulls({
          cancerStage: diagnosis.cancerStage,
          diagnosisDate: diagnosis.diagnosisDate,
          firstSymptomsDate: diagnosis.firstSymptomsDate,
          healthCenterId: diagnosis.healthCenterId,
          diagnosisSpecialty: diagnosis.diagnosisSpecialty,
          symptomLeadingToCheckup: diagnosis.symptomLeadingToCheckup,
          isSepaActiveReferral: diagnosis.isSepaActiveReferral,
          changeReason: diagnosis.changeReason,
        }),
        hasMedicalReport: diagnosis.hasMedicalReport,
        waitTimeForDiagnosis: normalizeDuration(diagnosis.waitTimeForDiagnosis),
        waitTimeForDiagnosisManuallyEdited:
          diagnosis.waitTimeSource === "REPORTED",
      } satisfies DiagnosisDraft
    })
  }

  const treatments = patient.treatments.filter(
    (treatment) => treatment.followUpId === followUpId,
  )
  if (treatments.length > 0) {
    recordIds.treatments = treatments.map((treatment) => treatment.id)
    drafts.treatments = treatments.map((treatment) => ({
      mode: "PARALLEL",
      diagnosisId: treatment.diagnosisId,
      seriesId: treatment.seriesId,
      treatmentType: treatment.treatmentType,
      treatmentFrequency: toDurationInput(
        normalizeDuration(treatment.treatmentFrequency),
      ),
      isReferred: treatment.isReferred,
      ...omitNulls({
        sourceHealthCenterId: treatment.sourceHealthCenterId,
        receivingHealthCenterId: treatment.receivingHealthCenterId,
        startDate: treatment.startDate,
        endDate: treatment.endDate,
        changeReason: treatment.changeReason,
        notReceivingReason: treatment.notReceivingReason,
        operationName: treatment.operationName,
        careProgram: treatment.careProgram,
        receivesTeleconsultation: treatment.receivesTeleconsultation,
        teleconsultationNote: treatment.teleconsultationNote,
        teleconsultationSpecialties: treatment.teleconsultationSpecialties,
        treatmentSituation: treatment.treatmentSituation,
        treatmentAbandonmentReason: treatment.treatmentAbandonmentReason,
        interruptionReason: treatment.interruptionReason,
        interruptionReasonOther: treatment.interruptionReasonOther,
        treatmentViaSepa: treatment.treatmentViaSepa,
        scheduledSessions: treatment.scheduledSessions,
        completedSessions: treatment.completedSessions,
        hormonalTreatmentCompleted: treatment.hormonalTreatmentCompleted,
        accessBarrierCode: treatment.accessBarrierCode,
        accessBarrierOther: treatment.accessBarrierOther,
        orientedRegardingBarriers: treatment.orientedRegardingBarriers,
        hasLatestPrescription: treatment.hasLatestPrescription,
        latestPrescriptionDate: treatment.latestPrescriptionDate,
      }),
    }))
  }

  const insurance = patient.insurance.find(
    (record) => record.followUpId === followUpId,
  )
  if (insurance) {
    recordIds.insuranceId = insurance.id
    drafts.insurance = {
      insuranceType: insurance.insuranceType,
      ...omitNulls({
        epsProvider: insurance.epsProvider,
        changeReason: insurance.changeReason,
        startDate: insurance.startDate,
        endDate: insurance.endDate,
      }),
    }
  }

  const sisAffiliation = patient.sisAffiliations.find(
    (record) => record.followUpId === followUpId,
  )
  if (sisAffiliation) {
    recordIds.sisAffiliationId = sisAffiliation.id
    drafts.sisAffiliation = {
      canAffiliate: sisAffiliation.canAffiliate,
      ...omitNulls({
        affiliatedViaSepa: sisAffiliation.affiliatedViaSepa,
        expectedDate: sisAffiliation.expectedDate,
        cantAffiliateReason: sisAffiliation.cantAffiliateReason,
        affiliatedAt: sisAffiliation.affiliatedAt,
        comments: sisAffiliation.comments,
      }),
    }
  }

  const symptomReport = patient.symptomReports.find(
    (record) => record.followUpId === followUpId,
  )
  if (symptomReport) {
    recordIds.symptomReportId = symptomReport.id
    drafts.symptomReport = {
      hasSoughtMedicalConsultation: symptomReport.hasSoughtMedicalConsultation,
      symptomDuration: normalizeDuration(symptomReport.symptomDuration),
      symptomFrequency: normalizeDuration(symptomReport.symptomFrequency),
      ...omitNulls({
        discomfortSeverity: symptomReport.discomfortSeverity,
        discomfortDescription: symptomReport.discomfortDescription,
        hasDiscomfort: symptomReport.hasDiscomfort,
        checkupMotivation: symptomReport.checkupMotivation,
        signsAndSymptoms: symptomReport.signsAndSymptoms,
        indicationsReceived: symptomReport.indicationsReceived,
        isPainPresent: symptomReport.isPainPresent,
        painIntensity: symptomReport.painIntensity,
        painLocation: symptomReport.painLocation,
        painDescription: symptomReport.painDescription,
        hasRequestedMedicalConsultation:
          symptomReport.hasRequestedMedicalConsultation,
        consultationStatus: symptomReport.consultationStatus,
        consultationNotObtainedReason:
          symptomReport.consultationNotObtainedReason,
        healthCenterId: symptomReport.healthCenterId,
        specialty: symptomReport.specialty,
        hasReceivedDiagnosis: symptomReport.hasReceivedDiagnosis,
        reportedDiagnosis: symptomReport.reportedDiagnosis,
        isReceivingReportedTreatment:
          symptomReport.isReceivingReportedTreatment,
        reportedTreatment: symptomReport.reportedTreatment,
        notReceivingTreatmentReason: symptomReport.notReceivingTreatmentReason,
      }),
      ...(symptomReport.diagnosisSearchDuration
        ? {
            diagnosisSearchDuration: toDurationInput(
              normalizeDuration(symptomReport.diagnosisSearchDuration),
            ),
          }
        : {}),
      ...(symptomReport.reportedTreatmentFrequency
        ? {
            reportedTreatmentFrequency: toDurationInput(
              normalizeDuration(symptomReport.reportedTreatmentFrequency),
            ),
          }
        : {}),
    }
  }

  const healthBackground = patient.healthBackgroundAssessments.find(
    (record) => record.followUpId === followUpId,
  )
  if (healthBackground) {
    recordIds.healthBackgroundAssessmentId = healthBackground.id
    drafts.healthBackground = {
      ...omitNulls({ hasPsychiatry: healthBackground.hasPsychiatry }),
      activeComorbidities: healthBackground.activeComorbidities.map(
        (comorbidity) => ({
          conditionName: comorbidity.conditionName,
          ...omitNulls({
            treatmentDescription: comorbidity.treatmentDescription,
            followUpSpecialty: comorbidity.followUpSpecialty,
          }),
        }),
      ),
      limitations: healthBackground.limitations.map((limitation) => ({
        description: limitation.description,
        cause: limitation.cause,
      })),
      familyCancerHistory: healthBackground.familyCancerHistory.map(
        (history) => ({
          relationship: history.relationship,
          ...omitNulls({ cancerType: history.cancerType }),
        }),
      ),
    }
  }

  return { drafts, recordIds }
}
