import type { PatientSymptomReport } from "@/api/patients"
import { normalizeDuration } from "@/types/duration"
import type { SymptomReportDraft } from "./clinical-drafts"

export function enrollmentSymptomDraft(
  report: PatientSymptomReport,
): SymptomReportDraft {
  return {
    hasDiscomfort: report.hasDiscomfort,
    checkupMotivation: report.checkupMotivation ?? undefined,
    signsAndSymptoms: report.signsAndSymptoms ?? undefined,
    hasMedicalConsultation: report.hasMedicalConsultation,
    noMedicalConsultationReason:
      report.noMedicalConsultationReason ?? undefined,
    firstConsultationDate: report.firstConsultationDate ?? undefined,
    isAwaitingDiagnosis: report.isAwaitingDiagnosis,
    diagnosisSearchDuration: normalizeDuration(report.diagnosisSearchDuration),
    hasReferral: report.hasReferral,
    referredHealthCenterId: report.referredHealthCenterId ?? undefined,
    referralNotProvidedReason: report.referralNotProvidedReason ?? undefined,
    hasReceivedDiagnosis: report.hasReceivedDiagnosis,
    reportedDiagnosis: report.reportedDiagnosis ?? undefined,
    nextConsultationDate: report.nextConsultationDate ?? undefined,
    healthCenterId: report.healthCenterId ?? undefined,
    specialty: report.specialty ?? undefined,
    isReceivingReportedTreatment: report.isReceivingReportedTreatment,
    reportedTreatment: report.reportedTreatment ?? undefined,
    reportedTreatmentFrequency: normalizeDuration(
      report.reportedTreatmentFrequency,
    ),
    notReceivingTreatmentReason:
      report.notReceivingTreatmentReason ?? undefined,
  }
}
