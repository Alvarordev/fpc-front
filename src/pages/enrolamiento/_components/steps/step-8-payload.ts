import type { CreateEnrollmentInput } from "@/api/enrollments"
import {
  getEnrollmentComments,
  type CategoriaClinica,
  type EnrollmentDraft,
} from "../../_store/enrollment-store"
import { toDurationInput } from "@/types/duration"

interface BuildEnrollmentPayloadOptions {
  draft: EnrollmentDraft
  agentId: string
  categoriaClinica: CategoriaClinica
  today?: string
}

function value(value: string | null | undefined) {
  return value?.trim() || undefined
}

function localDateTime(date: string, time: string | undefined) {
  return time ? new Date(`${date}T${time}:00`).toISOString() : undefined
}

function duration(value: Parameters<typeof toDurationInput>[0], field: string) {
  if (!value || Object.keys(value).length === 0 || value.valueMin === undefined)
    return undefined
  const result = toDurationInput(value)
  if (!result) throw new Error(`Completa correctamente: ${field}`)
  return result
}

export function buildEnrollmentPayload({
  draft,
  agentId,
  categoriaClinica,
  today = new Date().toISOString().slice(0, 10),
}: BuildEnrollmentPayloadOptions): CreateEnrollmentInput {
  const meta = draft.enrollmentMetadata
  const comments = getEnrollmentComments(meta)
  const healthPhase = categoriaClinica
  if (!healthPhase) {
    throw new Error("Selecciona una categoría clínica")
  }
  const isFamily = meta.affiliationType === "FAMILY"
  const includeCompanion = isFamily || meta.hasCaregiver === true
  const hasDiagnosis = Boolean(value(draft.diagnosis.diagnosis))
  const treatmentType = value(draft.treatment.treatmentType)
  const hasTreatment =
    Boolean(treatmentType) &&
    !(
      healthPhase === "SIGNS_AND_SYMPTOMS" &&
      draft.enrollmentMetadata.currentlyReceivingTreatment === false
    )
  const isOperation =
    draft.treatment.isOperation ?? Boolean(draft.treatment.operationName)
  const treatmentStartDate = value(draft.treatment.startDate)
  const treatmentEndDate = value(draft.treatment.endDate)
  const isReferred = draft.treatment.isReferred ?? false
  const receivesTeleconsultation =
    draft.treatment.receivesTeleconsultation ?? undefined
  const teleconsultationSpecialties = (
    draft.treatment.teleconsultationSpecialties ?? []
  )
    .map((specialty) => value(specialty))
    .filter((specialty): specialty is string => Boolean(specialty))
  if (
    hasTreatment &&
    draft.treatment.treatmentSituation === "ABANDONED" &&
    !value(draft.treatment.treatmentAbandonmentReason)
  ) {
    throw new Error("Indica el motivo de abandono del tratamiento")
  }
  if (hasTreatment && isOperation && !value(draft.treatment.operationName)) {
    throw new Error("Ingresa el nombre de la operación")
  }
  if (
    treatmentStartDate &&
    treatmentEndDate &&
    treatmentEndDate < treatmentStartDate
  )
    throw new Error(
      "La fecha de fin del tratamiento debe ser posterior o igual a la fecha de inicio",
    )

  if (hasDiagnosis && hasTreatment) {
    if (
      isReferred &&
      (!draft.treatment.sourceHealthCenterId ||
        !draft.treatment.receivingHealthCenterId)
    )
      throw new Error(
        "Completa el hospital de origen y el hospital receptor del tratamiento derivado",
      )
    if (
      isReferred &&
      draft.treatment.sourceHealthCenterId ===
        draft.treatment.receivingHealthCenterId
    )
      throw new Error(
        "El hospital de origen y el receptor deben ser diferentes",
      )
    if (!isReferred && draft.treatment.sourceHealthCenterId)
      throw new Error(
        "El hospital de origen solo aplica a tratamientos derivados",
      )
  }
  const appointment = draft.medicalAppointments.find(
    (item) => value(item.specialty) || value(item.difficulties),
  )
  if (
    appointment &&
    value(appointment.difficulties) &&
    !value(appointment.specialty)
  ) {
    throw new Error(
      "Indica la especialidad de la consulta para guardar sus limitaciones",
    )
  }
  const addresses = draft.addresses
    .filter(
      (address) =>
        address.address ||
        address.district ||
        address.province ||
        address.department ||
        address.reference ||
        address.dniMatchesAddress !== undefined,
    )
    .map((address) => ({
      type: address.type,
      isPrimary: address.isPrimary ?? true,
      address: value(address.address),
      district: value(address.district),
      province: value(address.province),
      department: address.department,
      reference: value(address.reference),
      dniMatchesAddress: address.dniMatchesAddress,
      validFrom: value(address.validFrom),
      validTo: value(address.validTo),
    }))
  const medications = (draft.treatment.medications ?? []).map(
    (medication, index) => {
      const name = value(medication.name)
      if (!name)
        throw new Error(`Completa el nombre del medicamento ${index + 1}`)
      return {
        name,
        doseAmount: medication.doseAmount,
        doseUnit: medication.doseUnit,
        doseDescription: value(medication.doseDescription),
        route: medication.route,
        frequency: duration(
          medication.frequency,
          `frecuencia del medicamento ${index + 1}`,
        ),
        startDate: value(medication.startDate),
        endDate: value(medication.endDate),
        isActive: medication.isActive,
        notes: value(medication.notes),
      }
    },
  )
  const talks = draft.familyPreventionTalkInterests
    .filter((item) => value(item.talkName) && value(item.familyMemberName))
    .map((item) => ({
      talkName: item.talkName.trim(),
      familyMemberName: item.familyMemberName.trim(),
      familyMemberPhone: value(item.familyMemberPhone),
      familyMemberEmail: value(item.familyMemberEmail),
    }))
  const healthBackground = draft.healthBackgroundAssessment
  const activeComorbidities = (healthBackground.activeComorbidities ?? [])
    .filter((item) => value(item.conditionName))
    .map((item) => ({
      conditionName: item.conditionName.trim(),
      treatmentDescription: value(item.treatmentDescription),
      followUpSpecialty: value(item.followUpSpecialty),
    }))
  const limitations = (healthBackground.limitations ?? [])
    .filter((item) => value(item.description))
    .map((item) => ({
      description: item.description.trim(),
      cause: item.cause,
    }))
  const familyCancerHistory = (healthBackground.familyCancerHistory ?? [])
    .filter((item) => value(item.relationship))
    .map((item) => ({
      relationship: item.relationship.trim(),
      cancerType: value(item.cancerType),
    }))
  const hasHealthBackground =
    healthBackground.hasPsychiatry !== undefined &&
    healthBackground.hasPsychiatry !== null
      ? true
      : activeComorbidities.length > 0 ||
        limitations.length > 0 ||
        familyCancerHistory.length > 0

  return {
    ...(draft.patientId
      ? { patientId: draft.patientId }
      : {
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
      notes: comments,
      completedAt: localDateTime(today, meta.endTime),
    },
    affiliationType: isFamily ? "FAMILY_FRIEND" : "SELF",
    healthPhase,
    ...(includeCompanion
      ? {
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
            isPrimaryInformant: isFamily,
            isPrimaryContact: isFamily,
            isCaregiver: true,
          },
        }
      : {}),
    details: {
      birthDepartment: value(draft.details.birthDepartment),
      primaryHealthCenterId: value(draft.details.primaryHealthCenterId),
      travelTimeToHospital: duration(
        draft.details.travelTimeToHospital,
        "tiempo de viaje al hospital",
      ),
      emergencyContactName: value(draft.details.emergencyContactName),
      emergencyContactPhone: value(draft.details.emergencyContactPhone),
      zoneType: value(draft.details.zoneType),
      emergencyContactGender: value(draft.details.emergencyContactGender),
      educationLevel: draft.details.educationLevel ?? undefined,
      nativeLanguage: value(draft.details.nativeLanguage),
      requiresTranslation: draft.details.requiresTranslation ?? undefined,
      referredToSocialWorker: draft.details.referredToSocialWorker ?? undefined,
    },
    ...(draft.insurance.insuranceType &&
    draft.insurance.insuranceType !== "NONE"
      ? {
          insurance: {
            insuranceType: draft.insurance.insuranceType,
            epsProvider: draft.insurance.epsProvider ?? undefined,
          },
        }
      : {}),
    ...(draft.insurance.insuranceType === "NONE" &&
    draft.sisAffiliation.canAffiliate !== undefined
      ? {
          sisAffiliation: {
            canAffiliate: draft.sisAffiliation.canAffiliate,
            expectedDate: value(draft.sisAffiliation.expectedDate),
            cantAffiliateReason: value(
              draft.sisAffiliation.cantAffiliateReason,
            ),
          },
        }
      : {}),
    ...(hasDiagnosis
      ? {
          diagnosis: {
            diagnosis: draft.diagnosis.diagnosis.trim(),
            cancerStage: draft.diagnosis.cancerStage ?? undefined,
            diagnosisDate: value(draft.diagnosis.diagnosisDate),
            firstSymptomsDate: value(draft.diagnosis.firstSymptomsDate),
            healthCenterId: value(draft.diagnosis.healthCenterId),
            diagnosisSpecialty: value(draft.diagnosis.diagnosisSpecialty),
            symptomLeadingToCheckup: value(
              draft.diagnosis.symptomLeadingToCheckup,
            ),
            waitTimeForDiagnosis: draft.diagnosis
              .waitTimeForDiagnosisManuallyEdited
              ? duration(
                  draft.diagnosis.waitTimeForDiagnosis,
                  "tiempo de espera para el diagnóstico",
                )
              : draft.diagnosis.firstSymptomsDate &&
                  draft.diagnosis.diagnosisDate
                ? undefined
                : duration(
                    draft.diagnosis.waitTimeForDiagnosis,
                    "tiempo de espera para el diagnóstico",
            ),
            hasMedicalReport: draft.diagnosis.hasMedicalReport ?? undefined,
          },
        }
      : {}),
    ...(hasDiagnosis && hasTreatment
      ? {
          treatments: [
            {
              treatmentType: treatmentType!,
              treatmentFrequency: duration(
                draft.treatment.treatmentFrequency,
                "frecuencia del tratamiento",
              ),
              isReferred,
              sourceHealthCenterId: draft.treatment.sourceHealthCenterId,
              receivingHealthCenterId: draft.treatment.receivingHealthCenterId,
              startDate: treatmentStartDate,
              endDate: treatmentEndDate,
              notReceivingReason: value(draft.treatment.notReceivingReason),
              operationName:
                draft.treatment.isOperation === true ||
                Boolean(draft.treatment.operationName)
                  ? value(draft.treatment.operationName)
                  : undefined,
              careProgram: draft.treatment.careProgram ?? undefined,
              receivesTeleconsultation,
              ...(receivesTeleconsultation
                ? {
                    teleconsultationNote: value(
                      draft.treatment.teleconsultationNote,
                    ),
                    ...(teleconsultationSpecialties.length
                      ? { teleconsultationSpecialties }
                      : {}),
                  }
                : {}),
              treatmentSituation:
                draft.treatment.treatmentSituation ?? undefined,
              ...(draft.treatment.treatmentSituation === "ABANDONED"
                ? {
                    treatmentAbandonmentReason: value(
                      draft.treatment.treatmentAbandonmentReason,
                    ),
                  }
                : {}),
              hasLatestPrescription: draft.treatment.hasLatestPrescription,
              latestPrescriptionDate: value(
                draft.treatment.latestPrescriptionDate,
              ),
              ...(medications.length ? { medications } : {}),
            },
          ],
        }
      : {}),
    ...(addresses.length ? { addresses } : {}),
    ...(appointment
      ? {
          medicalAppointments: [
            {
              specialty: appointment.specialty!.trim(),
              healthCenterId: value(appointment.healthCenterId),
              appointmentDate: value(appointment.appointmentDate),
              nextAppointmentDate: value(appointment.nextAppointmentDate),
              hasReferralSheet: appointment.hasReferralSheet ?? undefined,
              referredTo: value(appointment.referredTo),
              difficulties: value(appointment.difficulties),
              isFirstConsultation: appointment.isFirstConsultation ?? undefined,
            },
          ],
        }
      : {}),
    ...(draft.symptomReport.hasDiscomfort !== undefined
      ? {
          symptomReport: {
            hasDiscomfort: draft.symptomReport.hasDiscomfort,
            signsAndSymptoms: value(draft.symptomReport.signsAndSymptoms),
            indicationsReceived: value(draft.symptomReport.indicationsReceived),
            symptomDuration: duration(
              draft.symptomReport.symptomDuration,
              "duración de los síntomas",
            ),
            symptomFrequency: duration(
              draft.symptomReport.symptomFrequency,
              "frecuencia de los síntomas",
            ),
            hasSoughtMedicalConsultation:
              draft.symptomReport.hasSoughtMedicalConsultation ?? undefined,
            specialty: value(draft.symptomReport.specialty),
          },
        }
      : {}),
    ...(typeof meta.currentlyAttendingConsultations === "boolean"
      ? {
          currentlyAttendingConsultations: meta.currentlyAttendingConsultations,
        }
      : {}),
    ...(categoriaClinica === "SIGNS_AND_SYMPTOMS" &&
    typeof meta.currentlyReceivingTreatment === "boolean"
      ? { currentlyReceivingTreatment: meta.currentlyReceivingTreatment }
      : {}),
    entrySource: value(meta.programEntryPoint),
    consentToContact: meta.informedConsentAccepted ?? undefined,
    consentToShareData: meta.dataPolicyAccepted ?? undefined,
    isOncologicalPatient: meta.isOncologicalPatient ?? undefined,
    surveyAccepted: meta.surveyAccepted ?? undefined,
    caseComments: comments,
    callStartedAt: localDateTime(today, meta.startTime),
    callEndedAt: localDateTime(today, meta.endTime),
    ...(hasHealthBackground
      ? {
          healthBackgroundAssessment: {
            hasPsychiatry: healthBackground.hasPsychiatry ?? undefined,
            ...(activeComorbidities.length ? { activeComorbidities } : {}),
            ...(limitations.length ? { limitations } : {}),
            ...(familyCancerHistory.length ? { familyCancerHistory } : {}),
          },
        }
      : {}),
    ...(talks.length ? { familyPreventionTalkInterests: talks } : {}),
  }
}
