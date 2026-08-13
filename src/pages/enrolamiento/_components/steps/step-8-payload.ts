import type { CreateEnrollmentInput } from "@/api/enrollments"
import type { EnrollmentDraft } from "../../_store/enrollment-store"

interface BuildEnrollmentPayloadOptions {
  draft: EnrollmentDraft
  agentId: string
  today?: string
}

function value(value: string | null | undefined) {
  return value?.trim() || undefined
}

function localDateTime(date: string, time: string | undefined) {
  return time ? new Date(`${date}T${time}:00`).toISOString() : undefined
}

export function buildEnrollmentPayload({ draft, agentId, today = new Date().toISOString().slice(0, 10) }: BuildEnrollmentPayloadOptions): CreateEnrollmentInput {
  const meta = draft.enrollmentMetadata
  const isFamily = meta.affiliationType === "FAMILY"
  const hasDiagnosis = Boolean(value(draft.diagnosis.diagnosis))
  const treatmentType = value(draft.treatment.treatmentType)
  const appointment = draft.medicalAppointments.find((item) => value(item.specialty))
  const talks = draft.familyPreventionTalkInterests
    .filter((item) => value(item.talkName) && value(item.familyMemberName))
    .map((item) => ({
      talkName: item.talkName.trim(),
      familyMemberName: item.familyMemberName.trim(),
      familyMemberPhone: value(item.familyMemberPhone),
      familyMemberEmail: value(item.familyMemberEmail),
    }))

  return {
    ...(draft.patientId ? { patientId: draft.patientId } : {
      patient: {
        fullName: draft.patientData.fullName.trim(),
        primaryPhone: draft.patientData.primaryPhone.trim(),
        secondaryPhone: value(draft.patientData.secondaryPhone),
        dni: value(draft.patientData.dni),
        birthDate: value(draft.patientData.birthDate),
        gender: value(draft.patientData.gender),
        hasWhatsapp: draft.patientData.hasWhatsapp,
        email: value(draft.patientData.email),
      },
    }),
    followUp: {
      type: "CALL",
      agentId,
      notes: value(meta.comments),
      completedAt: localDateTime(today, meta.endTime),
    },
    affiliationType: isFamily ? "FAMILY_FRIEND" : "SELF",
    ...(isFamily ? {
      companion: {
        fullName: draft.companion.fullName.trim(),
        primaryPhone: draft.companion.primaryPhone.trim(),
        secondaryPhone: value(draft.companion.secondaryPhone),
        dni: value(draft.companion.dni),
        birthDate: value(draft.companion.birthDate),
        gender: value(draft.companion.gender),
        hasWhatsapp: draft.companion.hasWhatsapp,
        email: value(draft.companion.email),
        relationship: value(draft.companion.relationship),
        isPrimaryInformant: true,
      },
    } : {}),
    details: {
      birthDepartment: value(draft.details.birthDepartment),
      currentAddress: value(draft.details.currentAddress),
      currentDistrict: value(draft.details.currentDistrict),
      currentDepartment: value(draft.details.currentDepartment),
      dniMatchesAddress: draft.details.dniMatchesAddress ?? undefined,
      travelTimeToHospital: value(draft.details.travelTimeToHospital),
      emergencyContactName: value(draft.details.emergencyContactName),
      emergencyContactPhone: value(draft.details.emergencyContactPhone),
      zoneType: value(draft.details.zoneType),
      emergencyContactGender: value(draft.details.emergencyContactGender),
      educationLevel: draft.details.educationLevel ?? undefined,
      nativeLanguage: value(draft.details.nativeLanguage),
      requiresTranslation: draft.details.requiresTranslation ?? undefined,
      referredToSocialWorker: draft.details.referredToSocialWorker ?? undefined,
    },
    ...(draft.insurance.insuranceType && draft.insurance.insuranceType !== "NONE" ? {
      insurance: {
        insuranceType: draft.insurance.insuranceType,
        epsProvider: draft.insurance.epsProvider ?? undefined,
      },
    } : {}),
    ...(draft.insurance.insuranceType === "NONE" && draft.sisAffiliation.canAffiliate !== undefined ? {
      sisAffiliation: {
        canAffiliate: draft.sisAffiliation.canAffiliate,
        expectedDate: value(draft.sisAffiliation.expectedDate),
        cantAffiliateReason: value(draft.sisAffiliation.cantAffiliateReason),
      },
    } : {}),
    ...(hasDiagnosis ? {
      diagnosis: {
        diagnosis: draft.diagnosis.diagnosis.trim(),
        cancerStage: draft.diagnosis.cancerStage ?? undefined,
        diagnosisDate: value(draft.diagnosis.diagnosisDate),
        healthCenterId: value(draft.diagnosis.healthCenterId),
        diagnosisSpecialty: value(draft.diagnosis.diagnosisSpecialty),
        symptomLeadingToCheckup: value(draft.diagnosis.symptomLeadingToCheckup),
        waitTimeForDiagnosis: value(draft.diagnosis.waitTimeForDiagnosis),
        hasMedicalReport: draft.diagnosis.hasMedicalReport ?? undefined,
      },
    } : {}),
    ...(hasDiagnosis && (treatmentType || meta.currentlyReceivingTreatment === false) ? {
      treatment: {
        treatmentType: treatmentType ?? "No recibe tratamiento",
        treatmentFrequency: value(draft.treatment.treatmentFrequency),
        healthCenterId: value(draft.treatment.healthCenterId),
        notReceivingReason: value(draft.treatment.notReceivingReason),
        treatmentSituation: value(draft.treatment.treatmentSituation),
      },
    } : {}),
    ...(appointment ? {
      medicalAppointments: [{
        specialty: appointment.specialty!.trim(),
        healthCenterId: value(appointment.healthCenterId),
        appointmentDate: value(appointment.appointmentDate),
        nextAppointmentDate: value(appointment.nextAppointmentDate),
        hasReferralSheet: appointment.hasReferralSheet ?? undefined,
        referredTo: value(appointment.referredTo),
        difficulties: value(appointment.difficulties),
        isFirstConsultation: appointment.isFirstConsultation ?? undefined,
      }],
    } : {}),
    ...(draft.symptomReport.hasDiscomfort !== undefined ? {
      symptomReport: {
        hasDiscomfort: draft.symptomReport.hasDiscomfort,
        signsAndSymptoms: value(draft.symptomReport.signsAndSymptoms),
        indicationsReceived: value(draft.symptomReport.indicationsReceived),
        hasSoughtMedicalConsultation: draft.symptomReport.hasSoughtMedicalConsultation ?? undefined,
        specialty: value(draft.symptomReport.specialty),
      },
    } : {}),
    currentlyAttendingConsultations: meta.currentlyAttendingConsultations ?? undefined,
    currentlyReceivingTreatment: meta.currentlyReceivingTreatment ?? undefined,
    entrySource: value(meta.programEntryPoint),
    consentToContact: meta.informedConsentAccepted ?? undefined,
    consentToShareData: meta.dataPolicyAccepted ?? undefined,
    isOncologicalPatient: meta.isOncologicalPatient ?? undefined,
    surveyAccepted: meta.surveyAccepted ?? undefined,
    caseComments: value(meta.comments),
    callStartedAt: localDateTime(today, meta.startTime),
    callEndedAt: localDateTime(today, meta.endTime),
    ...(talks.length ? { familyPreventionTalkInterests: talks } : {}),
  }
}
