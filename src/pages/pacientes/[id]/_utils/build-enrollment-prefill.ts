import type { PatientDetailsResponse } from "@/api/patients"
import type { EnrollmentDraft } from "@/pages/enrolamiento/_store/enrollment-store"
import type { DurationDraft } from "@/types/duration"

function durationDraft(value: PatientDetailsResponse["details"] extends infer Details
  ? Details extends { travelTimeToHospital: infer Duration }
    ? Duration
    : never
  : never): DurationDraft | undefined {
  if (!value) return undefined
  return {
    valueMin: value.valueMin,
    ...(value.valueMax !== null ? { valueMax: value.valueMax } : {}),
    unit: value.unit,
  }
}

/**
 * Builds a partial enrollment draft from an existing (unenrolled) patient,
 * so agents don't have to re-type data we already have when moving them
 * from "prospecto" to "enrolado".
 */
export function buildEnrollmentPrefill(patient: PatientDetailsResponse): Partial<EnrollmentDraft> {
  const details = patient.details
  const currentInsurance = patient.insurance.find((item) => item.isCurrent)

  const prefill: Partial<EnrollmentDraft> = {
    patientId: patient.id,
    patientData: {
      fullName: patient.fullName,
      dni: patient.dni,
      birthDate: patient.birthDate,
      gender: patient.gender,
      primaryPhone: patient.primaryPhone,
      secondaryPhone: patient.secondaryPhone,
      hasWhatsapp: patient.hasWhatsapp,
      email: patient.email,
    },
  }

  if (details) {
    prefill.details = {
      birthDepartment: details.birthDepartment,
      primaryHealthCenterId: details.primaryHealthCenterId ?? undefined,
      travelTimeToHospital: durationDraft(details.travelTimeToHospital),
      emergencyContactName: details.emergencyContactName,
      emergencyContactPhone: details.emergencyContactPhone,
      zoneType: details.zoneType,
      emergencyContactGender: details.emergencyContactGender,
      educationLevel: details.educationLevel,
      nativeLanguage: details.nativeLanguage,
      requiresTranslation: details.requiresTranslation,
      evidenceOfDomesticViolence: details.evidenceOfDomesticViolence,
      usesWoodStove: details.usesWoodStove,
      isWorking: details.isWorking,
      receivesFinancialSupport: details.receivesFinancialSupport,
      referredToSocialWorker: details.referredToSocialWorker,
      hasConadisCard: details.hasConadisCard,
      knowsAboutFissal: details.knowsAboutFissal,
      programDropoutReason: details.programDropoutReason,
      programDropoutDate: details.programDropoutDate,
    }
  }

  if (currentInsurance) {
    prefill.insurance = {
      insuranceType: currentInsurance.insuranceType,
      epsProvider: currentInsurance.epsProvider ?? undefined,
      isCurrent: true,
      startDate: currentInsurance.startDate,
    }
  }

  return prefill
}
