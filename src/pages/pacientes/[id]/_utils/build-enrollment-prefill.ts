import type { PatientDetailsResponse } from "@/api/patients"
import type { EnrollmentDraft } from "@/pages/enrolamiento/_store/enrollment-store"

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
      currentAddress: details.currentAddress,
      currentDistrict: details.currentDistrict,
      currentDepartment: details.currentDepartment,
      dniMatchesAddress: details.dniMatchesAddress,
      travelTimeToHospital: details.travelTimeToHospital,
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
