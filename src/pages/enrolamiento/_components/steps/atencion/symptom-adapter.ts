import { compact, fromDuration, text, toBool, toDuration, toTri } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"
import type { Values } from "@/components/ds/questions"
import type { SymptomReportRequest } from "@/types"

function yn(value: boolean | null | undefined) {
  return value === true ? "yes" : value === false ? "no" : null
}

export function symptomValues(report: SymptomReportRequest, other: boolean): Values {
  return compact({
    discomfort: report.hasDiscomfort === null ? "unknown" : yn(report.hasDiscomfort),
    signs: report.signsAndSymptoms,
    motivation: report.checkupMotivation,
    consulted: yn(report.hasMedicalConsultation),
    noConsult: report.noMedicalConsultationReason,
    center: report.healthCenterId,
    specialty: report.specialty,
    firstDate: report.firstConsultationDate,
    searchDuration: fromDuration(report.diagnosisSearchDuration),
    referral: report.hasReferral === null ? "unknown" : yn(report.hasReferral),
    referredCenter: report.referredHealthCenterId,
    referralReason: report.referralNotProvidedReason,
    hasReceived: yn(report.hasReceivedDiagnosis),
    nonOnc: other ? "yes" : report.hasReceivedDiagnosis === true ? "no" : null,
    reported: other ? null : report.reportedDiagnosis,
    reportedText: other ? report.reportedDiagnosis : null,
    nextDate: report.nextConsultationDate,
    nextSpecialty: report.nextConsultationSpecialty,
    nextNote: report.nextConsultationNote,
    receiving: yn(report.isReceivingReportedTreatment),
    reportedTreatment: report.reportedTreatment,
    reportedFrequency: fromDuration(report.reportedTreatmentFrequency),
    notReceiving: report.notReceivingTreatmentReason,
  })
}

export function applySymptom(report: SymptomReportRequest, id: string, value: string | null, historical: boolean, other: boolean): Partial<SymptomReportRequest> {
  const keep = <T extends Partial<SymptomReportRequest>>(cleared: T): T | Record<string, never> => (historical ? {} : cleared)
  switch (id) {
    case "discomfort": {
      const hasDiscomfort = value === "unknown" ? null : toBool(value)
      return {
        hasDiscomfort,
        ...keep(hasDiscomfort === true ? { checkupMotivation: null } : hasDiscomfort === false ? { signsAndSymptoms: null } : { signsAndSymptoms: null, checkupMotivation: null }),
      }
    }
    case "signs":
      return { signsAndSymptoms: value }
    case "motivation":
      return { checkupMotivation: value }
    case "consulted": {
      const hasMedicalConsultation = toBool(value) ?? null
      return {
        hasMedicalConsultation,
        ...keep(
          hasMedicalConsultation === false
            ? {
                healthCenterId: null,
                specialty: null,
                firstConsultationDate: null,
                hasReferral: null,
                referredHealthCenterId: null,
                referralNotProvidedReason: null,
                hasReceivedDiagnosis: null,
                reportedDiagnosis: null,
                nextConsultationDate: null,
                nextConsultationSpecialty: null,
                nextConsultationNote: null,
              }
            : { noMedicalConsultationReason: null },
        ),
      }
    }
    case "noConsult":
      return { noMedicalConsultationReason: value }
    case "center":
      return { healthCenterId: value }
    case "specialty":
      return { specialty: value }
    case "firstDate":
      return { firstConsultationDate: value }
    case "searchDuration":
      return { diagnosisSearchDuration: toDuration(value) }
    case "referral": {
      const hasReferral = value === "unknown" ? null : toTri(value)
      return {
        hasReferral,
        ...keep({
          referredHealthCenterId: hasReferral === true ? report.referredHealthCenterId : null,
          referralNotProvidedReason: hasReferral === false ? report.referralNotProvidedReason : null,
        }),
      }
    }
    case "referredCenter":
      return { referredHealthCenterId: value }
    case "referralReason":
      return { referralNotProvidedReason: value }
    case "hasReceived":
      return { hasReceivedDiagnosis: value === "yes", ...keep(value === "yes" ? {} : { reportedDiagnosis: null }) }
    case "nonOnc":
      return { reportedDiagnosis: value === "yes" ? (other ? report.reportedDiagnosis : null) : null }
    case "reported":
      return { reportedDiagnosis: value }
    case "reportedText":
      return { reportedDiagnosis: text(value) ?? null }
    case "nextDate":
      return { nextConsultationDate: value }
    case "nextSpecialty":
      return { nextConsultationSpecialty: value }
    case "nextNote":
      return { nextConsultationNote: value }
    case "receiving": {
      const isReceivingReportedTreatment = toBool(value)
      return {
        isReceivingReportedTreatment,
        ...keep(
          isReceivingReportedTreatment
            ? { notReceivingTreatmentReason: null }
            : { reportedTreatment: null, reportedTreatmentFrequency: undefined },
        ),
      }
    }
    case "reportedTreatment":
      return { reportedTreatment: value }
    case "reportedFrequency":
      return { reportedTreatmentFrequency: toDuration(value) }
    case "notReceiving":
      return { notReceivingTreatmentReason: value }
    default:
      return {}
  }
}
