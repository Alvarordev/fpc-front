import type { CreateEnrollmentInput } from "@/api/enrollments"
import {
  getEnrollmentComments,
  type CompanionDraft,
  type CategoriaClinica,
  type EnrollmentDraft,
} from "../../_store/enrollment-store"
import { getAge } from "../../_utils/patient-age"
import { toDurationInput } from "@/types/duration"
import type {
  EnrollmentContactSource,
  MedicalConsultationStatus,
} from "@/types"

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

function contactPerson(person: CompanionDraft) {
  const fullName = value(person.fullName)
  const primaryPhone = value(person.primaryPhone)
  const relationship = value(person.relationship)
  if (!fullName || !primaryPhone || !relationship)
    throw new Error("Completa nombre, parentesco y teléfono del contacto")
  return {
    fullName,
    primaryPhone,
    secondaryPhone: value(person.secondaryPhone),
    dni: value(person.dni),
    birthDate: value(person.birthDate),
    gender: value(person.gender),
    hasWhatsapp: person.hasWhatsapp,
    relationship,
  }
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
  const patientAge = getAge(
    draft.patientData.birthDate,
    new Date(`${today}T12:00:00`),
  )
  const isMinorPatient = patientAge !== null && patientAge < 18
  const callerIsComplete = Boolean(
    value(draft.companion.fullName) &&
    value(draft.companion.primaryPhone) &&
    value(draft.companion.relationship),
  )
  const primaryContactSource =
    draft.primaryContactSource ??
    (isMinorPatient
      ? callerIsComplete
        ? "CALLER"
        : undefined
      : isFamily && callerIsComplete
        ? "CALLER"
        : "PATIENT")
  if (!primaryContactSource) {
    throw new Error("Selecciona un contacto principal")
  }
  if (isMinorPatient && primaryContactSource === "PATIENT") {
    throw new Error(
      "Un paciente menor debe tener un acompañante como contacto principal",
    )
  }
  if (primaryContactSource === "CALLER" && !callerIsComplete) {
    throw new Error("Completa los datos de quien llama")
  }
  const hasDiagnosis =
    healthPhase === "CANCER_DIAGNOSIS" &&
    Boolean(value(draft.diagnosis.diagnosis))
  const treatmentType = value(draft.treatment.treatmentType)
  const hasTreatment =
    healthPhase === "CANCER_DIAGNOSIS" &&
    Boolean(treatmentType) &&
    Boolean(value(draft.diagnosis.diagnosis))
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
    hasTreatment &&
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
  const consultationStatus: MedicalConsultationStatus | undefined =
    draft.symptomReport.consultationStatus ?? undefined
  const symptom = draft.symptomReport
  const signsUsesAppointment =
    healthPhase !== "SIGNS_AND_SYMPTOMS" ||
    (symptom.hasRequestedMedicalConsultation === true &&
      (consultationStatus === "SCHEDULED" || consultationStatus === "ATTENDED"))
  const appointment = signsUsesAppointment
    ? draft.medicalAppointments.find(
        (item) =>
          value(item.specialty) ||
          value(item.difficulties) ||
          value(item.appointmentDate) ||
          value(item.nextAppointmentDate) ||
          value(item.nextAppointmentSpecialty) ||
          value(item.healthCenterId) ||
          item.hasReferralSheet !== undefined,
      )
    : undefined
  const needsSignsAppointment =
    healthPhase === "SIGNS_AND_SYMPTOMS" &&
    (consultationStatus === "SCHEDULED" || consultationStatus === "ATTENDED")
  if (needsSignsAppointment && !appointment) {
    throw new Error("Completa los datos de la consulta médica")
  }
  if (appointment && !value(appointment.specialty))
    throw new Error("Indica la especialidad de la consulta")
  if (healthPhase === "SIGNS_AND_SYMPTOMS") {
    if (typeof symptom.hasDiscomfort !== "boolean")
      throw new Error("Indica si presenta algún malestar o dolor")
    if (typeof symptom.hasRequestedMedicalConsultation !== "boolean")
      throw new Error("Indica si solicitó una consulta médica")
    if (typeof symptom.hasReceivedDiagnosis !== "boolean")
      throw new Error("Indica si le informaron algún diagnóstico")
    if (typeof symptom.isReceivingReportedTreatment !== "boolean")
      throw new Error("Indica si recibe el tratamiento informado")
    if (symptom.hasDiscomfort === false && !value(symptom.checkupMotivation))
      throw new Error("Indica qué motivó el examen médico")
    if (symptom.hasRequestedMedicalConsultation === true) {
      if (!consultationStatus)
        throw new Error("Indica el estado de la consulta médica")
      if (
        consultationStatus === "NOT_OBTAINED" &&
        !value(symptom.consultationNotObtainedReason)
      )
        throw new Error("Indica por qué no obtuvo la consulta médica")
      if (
        (consultationStatus === "SCHEDULED" ||
          consultationStatus === "ATTENDED") &&
        (!value(symptom.healthCenterId) || !value(symptom.specialty))
      )
        throw new Error("Indica establecimiento y especialidad de la consulta")
      if (
        (consultationStatus === "SCHEDULED" ||
          consultationStatus === "ATTENDED") &&
        !appointment?.appointmentDate
      )
        throw new Error("Indica la fecha de la consulta médica")
      if (consultationStatus === "ATTENDED") {
        if (appointment?.hasReferralSheet === undefined)
          throw new Error("Indica si recibió una hoja de referencia")
        if (appointment.hasReferralSheet && !value(appointment.referredTo))
          throw new Error("Indica a dónde fue referido")
        if (
          appointment.hasReferralSheet === false &&
          !value(appointment.referralNotProvidedReason)
        )
          throw new Error("Indica por qué no recibió la hoja de referencia")
      }
    }
    if (
      symptom.hasReceivedDiagnosis === true &&
      !value(symptom.reportedDiagnosis)
    )
      throw new Error("Indica el diagnóstico que le informaron")
    if (symptom.isReceivingReportedTreatment === true) {
      if (
        !value(symptom.reportedTreatment) ||
        !duration(
          symptom.reportedTreatmentFrequency,
          "frecuencia del tratamiento reportado",
        )
      )
        throw new Error("Completa el tratamiento reportado y su frecuencia")
    } else if (
      symptom.isReceivingReportedTreatment === false &&
      !value(symptom.notReceivingTreatmentReason)
    ) {
      throw new Error("Indica por qué no recibe tratamiento")
    }
  }
  const appointmentToSend =
    healthPhase === "SIGNS_AND_SYMPTOMS" &&
    (symptom.hasRequestedMedicalConsultation === false ||
      consultationStatus === "NOT_OBTAINED")
      ? undefined
      : appointment
  const addresses = draft.addresses
    .filter(
      (address) =>
        address.address ||
        address.district ||
        address.province ||
        address.department ||
        address.locationUrl ||
        address.dniMatchesAddress !== undefined,
    )
    .map((address) => ({
      type: address.type,
      isPrimary: address.isPrimary ?? true,
      address: value(address.address),
      district: value(address.district),
      province: value(address.province),
      department: address.department,
      locationUrl: value(address.locationUrl),
      dniMatchesAddress: address.dniMatchesAddress,
      validFrom: value(address.validFrom),
      validTo: value(address.validTo),
    }))
  const medications = hasTreatment
    ? (draft.treatment.medications ?? []).map((medication, index) => {
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
      })
    : []
  const talks = draft.familyPreventionTalkInterests
    .filter((item) => value(item.talkName) && value(item.familyMemberName))
    .map((item) => ({
      talkName: item.talkName.trim(),
      familyMemberName: item.familyMemberName.trim(),
      familyMemberPhone: value(item.familyMemberPhone),
      familyMemberEmail: value(item.familyMemberEmail),
    }))
  const secondaryContactSource = draft.secondaryContactEnabled
    ? (draft.secondaryContactSource ??
      (callerIsComplete && primaryContactSource !== "CALLER"
        ? "CALLER"
        : "NEW"))
    : undefined
  if (secondaryContactSource === "CALLER" && !callerIsComplete)
    throw new Error("Completa los datos de quien llama")
  const contacts = [
    {
      role: "PRIMARY" as const,
      source: primaryContactSource as EnrollmentContactSource,
      ...(primaryContactSource === "NEW"
        ? { person: contactPerson(draft.primaryContact) }
        : {}),
    },
    ...(draft.secondaryContactEnabled
      ? [
          {
            role: "SECONDARY" as const,
            source: secondaryContactSource as EnrollmentContactSource,
            ...(secondaryContactSource === "NEW"
              ? { person: contactPerson(draft.secondaryContact) }
              : {}),
          },
        ]
      : []),
  ]
  const hasCaller =
    isFamily ||
    primaryContactSource === "CALLER" ||
    secondaryContactSource === "CALLER"
  if (hasCaller && !callerIsComplete)
    throw new Error("Completa los datos de quien llama")

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
    ...(hasCaller
      ? {
          companion: {
            fullName: draft.companion.fullName.trim(),
            primaryPhone: draft.companion.primaryPhone.trim(),
            secondaryPhone: value(draft.companion.secondaryPhone),
            dni: value(draft.companion.dni),
            birthDate: value(draft.companion.birthDate),
            gender: value(draft.companion.gender),
            hasWhatsapp: draft.companion.hasWhatsapp,
            relationship: value(draft.companion.relationship),
            isPrimaryInformant: isFamily,
            isPrimaryContact: false,
            isCaregiver: false,
          },
        }
      : {}),
    contacts,
    details: {
      birthDepartment: value(draft.details.birthDepartment),
      primaryHealthCenterId: value(draft.details.primaryHealthCenterId),
      travelTimeToHospital: duration(
        draft.details.travelTimeToHospital,
        "tiempo de viaje al hospital",
      ),
      zoneType: value(draft.details.zoneType),
      educationLevel: draft.details.educationLevel ?? undefined,
      nativeLanguage: value(draft.details.nativeLanguage),
      requiresTranslation: draft.details.requiresTranslation ?? undefined,
      isWorking: draft.details.isWorking ?? undefined,
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
            mode: "PARALLEL",
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
    ...(appointmentToSend
      ? {
          medicalAppointments: [
            {
              specialty: value(appointmentToSend.specialty)!,
              healthCenterId: value(appointmentToSend.healthCenterId),
              appointmentDate: value(appointmentToSend.appointmentDate),
              nextAppointmentDate: value(appointmentToSend.nextAppointmentDate),
              nextAppointmentSpecialty: value(
                appointmentToSend.nextAppointmentSpecialty,
              ),
              ...(consultationStatus === "ATTENDED"
                ? {
                    hasReferralSheet:
                      appointmentToSend.hasReferralSheet ?? undefined,
                    referredTo: value(appointmentToSend.referredTo),
                    referralNotProvidedReason: value(
                      appointmentToSend.referralNotProvidedReason,
                    ),
                  }
                : {}),
              difficulties: value(appointmentToSend.difficulties),
              isFirstConsultation:
                consultationStatus === "ATTENDED"
                  ? true
                  : consultationStatus === "SCHEDULED"
                    ? false
                    : (appointmentToSend.isFirstConsultation ?? undefined),
            },
          ],
        }
      : {}),
    ...(healthPhase === "SIGNS_AND_SYMPTOMS" &&
    typeof draft.symptomReport.hasDiscomfort === "boolean"
      ? {
          symptomReport: {
            hasDiscomfort: draft.symptomReport.hasDiscomfort,
            ...(draft.symptomReport.hasDiscomfort === false
              ? {
                  checkupMotivation: value(
                    draft.symptomReport.checkupMotivation,
                  ),
                }
              : {}),
            signsAndSymptoms: value(draft.symptomReport.signsAndSymptoms),
            ...(draft.symptomReport.consultationStatus === "SCHEDULED" ||
            draft.symptomReport.consultationStatus === "ATTENDED"
              ? {
                  indicationsReceived: value(
                    draft.symptomReport.indicationsReceived,
                  ),
                }
              : {}),
            symptomDuration: duration(
              draft.symptomReport.symptomDuration,
              "duración de los síntomas",
            ),
            symptomFrequency: duration(
              draft.symptomReport.symptomFrequency,
              "frecuencia de los síntomas",
            ),
            hasRequestedMedicalConsultation:
              draft.symptomReport.hasRequestedMedicalConsultation ?? undefined,
            consultationStatus:
              draft.symptomReport.consultationStatus ?? undefined,
            ...(draft.symptomReport.consultationStatus === "NOT_OBTAINED"
              ? {
                  consultationNotObtainedReason: value(
                    draft.symptomReport.consultationNotObtainedReason,
                  ),
                }
              : {}),
            ...(draft.symptomReport.consultationStatus === "SCHEDULED" ||
            draft.symptomReport.consultationStatus === "ATTENDED"
              ? {
                  healthCenterId: value(draft.symptomReport.healthCenterId),
                  specialty: value(draft.symptomReport.specialty),
                }
              : {}),
            diagnosisSearchDuration: duration(
              draft.symptomReport.diagnosisSearchDuration,
              "tiempo buscando diagnóstico",
            ),
            hasReceivedDiagnosis:
              draft.symptomReport.hasReceivedDiagnosis ?? undefined,
            ...(draft.symptomReport.hasReceivedDiagnosis === true
              ? {
                  reportedDiagnosis: value(
                    draft.symptomReport.reportedDiagnosis,
                  ),
                }
              : {}),
            isReceivingReportedTreatment:
              draft.symptomReport.isReceivingReportedTreatment ?? undefined,
            ...(draft.symptomReport.isReceivingReportedTreatment === true
              ? {
                  reportedTreatment: value(
                    draft.symptomReport.reportedTreatment,
                  ),
                  reportedTreatmentFrequency: duration(
                    draft.symptomReport.reportedTreatmentFrequency,
                    "frecuencia del tratamiento reportado",
                  ),
                }
              : draft.symptomReport.isReceivingReportedTreatment === false
                ? {
                    notReceivingTreatmentReason: value(
                      draft.symptomReport.notReceivingTreatmentReason,
                    ),
                  }
                : {}),
          },
        }
      : {}),
    ...(typeof meta.currentlyAttendingConsultations === "boolean"
      ? {
          currentlyAttendingConsultations: meta.currentlyAttendingConsultations,
        }
      : {}),
    entrySource: value(meta.programEntryPoint),
    consentToContact: meta.informedConsentAccepted ?? undefined,
    consentToShareData: meta.dataPolicyAccepted ?? undefined,
    isOncologicalPatient: meta.isOncologicalPatient ?? undefined,
    surveyAccepted: meta.surveyAccepted ?? undefined,
    caseComments: comments,
    callStartedAt: localDateTime(today, meta.startTime),
    callEndedAt: localDateTime(today, meta.endTime),
    ...(talks.length ? { familyPreventionTalkInterests: talks } : {}),
  }
}
