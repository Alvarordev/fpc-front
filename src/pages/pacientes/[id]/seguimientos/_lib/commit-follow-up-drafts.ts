import { toast } from "sonner"
import { alertsApi } from "@/api/alerts"
import { followUpsApi, type FollowUp } from "@/api/follow-ups"
import { nonOncologicalFollowUpsApi } from "@/api/non-oncological-follow-ups"
import { patientsApi, type PatientDetailsInput } from "@/api/patients"
import { psychooncologyAppointmentsApi } from "@/api/psychooncology-appointments"
import { toDurationInput } from "@/types/duration"
import { fixedWaitTime } from "@/types/wait-time-recall"
import { draftDiagnosisIdFromOption, isDraftDiagnosisOptionId } from "../_components/clinical-drafts"
import { useFollowUpDraftStore } from "../_store/follow-up-draft-store"

// Guarda, en orden, todo lo que quedó en borrador durante el seguimiento. Se
// llama al completarlo, antes de marcarlo como completado.

type CommitInput = {
  patientId: string
  followUp: FollowUp
  drafts: ReturnType<typeof useFollowUpDraftStore.getState>
  /** Agente del siguiente seguimiento: el elegido o el del usuario. */
  nextFollowUpAgentId: string | undefined
}

export async function commitFollowUpDrafts({ patientId, followUp, drafts, nextFollowUpAgentId }: CommitInput) {
  const followUpId = followUp.id
  const { clinical: clinicalDrafts, alert: alertDraft, psico: psicoDraft, nextFollowUp: nextFollowUpDraft, reminders: reminderDrafts } = drafts
  const details: PatientDetailsInput = {
    ...clinicalDrafts.details,
    ...clinicalDrafts.social,
  }
  if (Object.keys(details).length > 0) {
    await patientsApi.updateDetails(patientId, details)
  }

  const newDiagnosisIds = new Map<string, string>()
  // Corrections first: a later REPLACE in the same batch retires its target.
  const diagnosisDecisions = [...(clinicalDrafts.diagnoses ?? [])].sort(
    (a, b) => Number(b.mode === "EDIT") - Number(a.mode === "EDIT"),
  )
  for (const diagnosisDecision of diagnosisDecisions) {
    const {
      draftId,
      mode,
      replacementDiagnosisId,
      editedDiagnosisId,
      waitTimeForDiagnosisManuallyEdited,
      remembersWaitTimeForDiagnosis,
      waitTimeRecall,
      changeReason,
      ...diagnosisDraft
    } = diagnosisDecision
    const waitTimeForDiagnosis = remembersWaitTimeForDiagnosis === false
      ? fixedWaitTime(waitTimeRecall)
      : waitTimeForDiagnosisManuallyEdited
        ? toDurationInput(diagnosisDraft.waitTimeForDiagnosis)
        : diagnosisDraft.firstSymptomsDate && diagnosisDraft.diagnosisDate
          ? undefined
          : toDurationInput(diagnosisDraft.waitTimeForDiagnosis)
    if (
      remembersWaitTimeForDiagnosis !== false &&
      diagnosisDraft.waitTimeForDiagnosis?.valueMin !== undefined &&
      !waitTimeForDiagnosis
    )
      throw new Error(
        "Completa correctamente el tiempo de espera para el diagnóstico",
      )

    if (mode === "EDIT") {
      if (!editedDiagnosisId || !changeReason?.trim())
        throw new Error("Indica el motivo de la corrección del diagnóstico")
      // Empty fields are sent as null so a correction can clear them.
      await patientsApi.updateDiagnosis(patientId, editedDiagnosisId, {
        followUpId: followUpId,
        changeReason,
        cancerStage: diagnosisDraft.cancerStage ?? null,
        diagnosisDate: diagnosisDraft.diagnosisDate ?? null,
        firstSymptomsDate: diagnosisDraft.firstSymptomsDate ?? null,
        healthCenterId: diagnosisDraft.healthCenterId ?? null,
        diagnosisSpecialty: diagnosisDraft.diagnosisSpecialty ?? null,
        symptomLeadingToCheckup:
          diagnosisDraft.symptomLeadingToCheckup ?? null,
        diseaseEvolution: diagnosisDraft.diseaseEvolution ?? null,
        isSepaActiveReferral: diagnosisDraft.isSepaActiveReferral ?? null,
        hasMedicalReport: diagnosisDraft.hasMedicalReport,
        waitTimeForDiagnosis,
      })
      continue
    }

    const created = await patientsApi.createDiagnosis(patientId, {
      ...diagnosisDraft,
      mode,
      ...(mode === "REPLACE" ? { replacementDiagnosisId } : {}),
      changeReason,
      waitTimeForDiagnosis,
      followUpId: followUpId,
    })
    newDiagnosisIds.set(draftId, created.id)
  }

  for (const treatmentDraft of clinicalDrafts.treatments ?? []) {
    const diagnosisId = isDraftDiagnosisOptionId(treatmentDraft.diagnosisId)
      ? newDiagnosisIds.get(
          draftDiagnosisIdFromOption(treatmentDraft.diagnosisId),
        )
      : treatmentDraft.diagnosisId

    if (!diagnosisId) continue
    if (treatmentDraft.mode === "REPLACE" && !treatmentDraft.seriesId) {
      throw new Error("Selecciona el tratamiento que deseas actualizar")
    }

    const normalizedFrequency = toDurationInput(
      treatmentDraft.treatmentFrequency,
    )
    if (treatmentDraft.treatmentFrequency && !normalizedFrequency) {
      throw new Error("Completa correctamente la frecuencia del tratamiento")
    }

    const normalizedMedications = treatmentDraft.medications?.map(
      (medication) => ({
        ...medication,
        frequency: toDurationInput(medication.frequency),
      }),
    )

    await patientsApi.createTreatment(patientId, {
      diagnosisId,
      treatmentType: treatmentDraft.treatmentType,
      followUpId: followUpId,
      seriesId:
        treatmentDraft.mode === "REPLACE"
          ? treatmentDraft.seriesId
          : undefined,
      isReferred: treatmentDraft.isReferred,
      sourceHealthCenterId: treatmentDraft.sourceHealthCenterId,
      receivingHealthCenterId: treatmentDraft.receivingHealthCenterId,
      startDate: treatmentDraft.startDate,
      endDate: treatmentDraft.endDate,
      changeReason: treatmentDraft.changeReason,
      notReceivingReason: treatmentDraft.notReceivingReason,
      ...(treatmentDraft.treatmentType === "CIRUGIA"
        ? { operationName: treatmentDraft.operationName }
        : {}),
      ...(treatmentDraft.treatmentType === "QUIMIOTERAPIA"
        ? { chemotherapyRoute: treatmentDraft.chemotherapyRoute }
        : {}),
      careProgram: treatmentDraft.careProgram,
      receivesTeleconsultation: treatmentDraft.receivesTeleconsultation,
      teleconsultationNote:
        treatmentDraft.receivesTeleconsultation === true
          ? treatmentDraft.teleconsultationNote
          : undefined,
      teleconsultationSpecialties:
        treatmentDraft.receivesTeleconsultation === true
          ? treatmentDraft.teleconsultationSpecialties
          : undefined,
      treatmentSituation: treatmentDraft.treatmentSituation,
      treatmentAbandonmentReason:
        treatmentDraft.treatmentSituation === "ABANDONADO"
          ? treatmentDraft.treatmentAbandonmentReason
          : undefined,
      interruptionReason: treatmentDraft.interruptionReason,
      interruptionReasonOther: treatmentDraft.interruptionReasonOther,
      treatmentViaSepa: treatmentDraft.treatmentViaSepa,
      scheduledSessions: treatmentDraft.scheduledSessions,
      completedSessions: treatmentDraft.completedSessions,
      hormonalTreatmentCompleted: treatmentDraft.hormonalTreatmentCompleted,
      accessBarrierCode: treatmentDraft.accessBarrierCode,
      accessBarrierOther: treatmentDraft.accessBarrierOther,
      orientedRegardingBarriers: treatmentDraft.orientedRegardingBarriers,
      hasLatestPrescription: treatmentDraft.hasLatestPrescription,
      latestPrescriptionDate: treatmentDraft.latestPrescriptionDate,
      treatmentFrequency: normalizedFrequency,
      ...(normalizedMedications?.length
        ? { medications: normalizedMedications }
        : {}),
    })
  }

  for (const note of clinicalDrafts.socialNotes ?? []) {
    await patientsApi.createSocialNote(patientId, {
      followUpId: followUpId,
      type: note.type,
      note: note.note,
    })
  }

  if (clinicalDrafts.symptomReport) {
    const {
      symptomDuration,
      symptomFrequency,
      diagnosisSearchDuration,
      reportedTreatmentFrequency,
      ...symptomReportDraft
    } = clinicalDrafts.symptomReport
    const normalizedDuration = toDurationInput(symptomDuration)
    const normalizedFrequency = toDurationInput(symptomFrequency)
    const normalizedDiagnosisSearchDuration = toDurationInput(
      diagnosisSearchDuration,
    )
    const normalizedReportedTreatmentFrequency = toDurationInput(
      reportedTreatmentFrequency,
    )
    if (symptomDuration?.valueMin !== undefined && !normalizedDuration)
      throw new Error("Completa correctamente la duración de los síntomas")
    if (symptomFrequency?.valueMin !== undefined && !normalizedFrequency)
      throw new Error("Completa correctamente la frecuencia de los síntomas")
    if (
      diagnosisSearchDuration?.valueMin !== undefined &&
      !normalizedDiagnosisSearchDuration
    )
      throw new Error("Completa correctamente el tiempo de búsqueda")
    if (
      reportedTreatmentFrequency?.valueMin !== undefined &&
      !normalizedReportedTreatmentFrequency
    )
      throw new Error("Completa correctamente la frecuencia del tratamiento")

    await patientsApi.createSymptomReport(patientId, {
      ...symptomReportDraft,
      symptomDuration: normalizedDuration,
      symptomFrequency: normalizedFrequency,
      diagnosisSearchDuration: normalizedDiagnosisSearchDuration,
      reportedTreatmentFrequency: normalizedReportedTreatmentFrequency,
      followUpId: followUpId,
    })
  }

  let diagnosticStatusEventId =
    clinicalDrafts.nonOncologicalFollowUp?.diagnosticStatusEventId
  const diagnosticStatusDraft = clinicalDrafts.diagnosticStatus
  if (diagnosticStatusDraft) {
    if (diagnosticStatusDraft.eventId) {
      diagnosticStatusEventId = diagnosticStatusDraft.eventId
    } else {
      if (
        diagnosticStatusDraft.status === "CONFIRMED" &&
        !diagnosticStatusDraft.diagnosis?.trim()
      )
        throw new Error("Indica el diagnóstico formal")

      const event = await patientsApi.transitionDiagnosticStatus(patientId, {
        status: diagnosticStatusDraft.status,
        followUpId: followUpId,
        ...(diagnosticStatusDraft.status === "CONFIRMED"
          ? {
              diagnosis: {
                diagnosis: diagnosticStatusDraft.diagnosis!.trim(),
                mode: "PARALLEL",
              },
              healthSubcategory:
                diagnosticStatusDraft.healthSubcategory ??
                "ACTIVE_TREATMENT",
            }
          : {}),
        supportedBySepa: diagnosticStatusDraft.supportedBySepa,
        notes: diagnosticStatusDraft.notes?.trim() || undefined,
      })
      diagnosticStatusEventId = event.id
      useFollowUpDraftStore.getState().updateClinical((previous) =>
        previous.diagnosticStatus?.status === diagnosticStatusDraft.status
          ? {
              ...previous,
              diagnosticStatus: {
                ...previous.diagnosticStatus,
                eventId: event.id,
              },
            }
          : previous,
      )
    }
  }

  if (
    clinicalDrafts.nonOncologicalFollowUp &&
    (!diagnosticStatusDraft || diagnosticStatusDraft.status === "RULED_OUT")
  ) {
    const record = clinicalDrafts.nonOncologicalFollowUp
    const treatmentFrequency = toDurationInput(record.treatmentFrequency)
    const controlPeriodicity = toDurationInput(record.controlPeriodicity)
    if (
      record.treatmentFrequency?.valueMin !== undefined &&
      !treatmentFrequency
    )
      throw new Error("Completa correctamente la frecuencia del tratamiento")
    if (
      record.controlPeriodicity?.valueMin !== undefined &&
      !controlPeriodicity
    )
      throw new Error("Completa correctamente la periodicidad de controles")
    const input = {
      diagnosis: record.diagnosis.trim(),
      followUpId,
      diagnosticStatusEventId,
      occurredOn: record.occurredOn || undefined,
      receivesTreatment: record.receivesTreatment,
      treatmentName:
        record.receivesTreatment === false ? undefined : record.treatmentName,
      medication:
        record.receivesTreatment === false ? undefined : record.medication,
      treatmentFrequency,
      hasControls: record.hasControls,
      controlSpecialty:
        record.hasControls === true ? record.controlSpecialty : undefined,
      controlPeriodicity,
      status: record.status,
      dischargedOn: record.dischargedOn,
      dischargeReason: record.dischargeReason,
    }
    // La edición no admite followUpId: el registro ya pertenece a su seguimiento.
    if (record.id) {
      const { followUpId: _omit, ...changes } = input
      void _omit
      await nonOncologicalFollowUpsApi.update(patientId, record.id, changes)
    } else await nonOncologicalFollowUpsApi.create(patientId, input)
  }

  if (clinicalDrafts.insurance) {
    await patientsApi.createInsurance(patientId, {
      ...clinicalDrafts.insurance,
      followUpId: followUpId,
    })
  }
  if (clinicalDrafts.sisAffiliation) {
    await patientsApi.createSisAffiliation(patientId, {
      ...clinicalDrafts.sisAffiliation,
      followUpId: followUpId,
    })
  }
  if (clinicalDrafts.healthBackground) {
    await patientsApi.createHealthBackgroundAssessment(patientId, {
      ...clinicalDrafts.healthBackground,
      followUpId: followUpId,
    })
  }
  for (const address of [clinicalDrafts.address, clinicalDrafts.temporaryAddress]) {
    if (address) await patientsApi.createAddress(patientId, { ...address, followUpId })
  }

  if (alertDraft) {
    await alertsApi.create({
      healthCenterId: alertDraft.healthCenterId,
      followUpId: followUpId,
      subjectPatientId: followUp.subjectPatientId,
      interlocutorId: followUp.interlocutorId,
      title: alertDraft.title,
      description: alertDraft.description,
      severity: alertDraft.severity,
      category: alertDraft.category,
    })
  }

  if (psicoDraft) {
    try {
      await psychooncologyAppointmentsApi.create(psicoDraft)
    } catch (error) {
      toast.error("No se pudo agendar la cita de psicooncología", {
        description: (error as Error).message,
      })
    }
  }

  if (nextFollowUpDraft) {
    const agentId = nextFollowUpAgentId
    if (agentId) {
      await followUpsApi.scheduleNext(followUpId, {
        subjectPatientId: followUp.subjectPatientId,
        interlocutorId: followUp.interlocutorId,
        agentId,
        type: nextFollowUpDraft.type,
        purpose: nextFollowUpDraft.purpose,
        scheduledAt: `${nextFollowUpDraft.date}T${nextFollowUpDraft.time}:00`,
        notes: nextFollowUpDraft.notes || undefined,
      })
    }
  }

  for (const reminder of reminderDrafts) {
    try {
      await followUpsApi.createReminder(followUpId, {
        subjectPatientId: followUp.subjectPatientId,
        dueAt: new Date(reminder.dueAt).toISOString(),
        description: reminder.description,
        assignedAgentId: followUp.agentId,
        createdFromFollowUpId: followUpId,
        kind: reminder.kind,
        medicalAppointment:
          reminder.kind === "MEDICAL_APPOINTMENT"
            ? reminder.medicalAppointment
            : undefined,
      })
    } catch (error) {
      toast.error("No se pudo crear un recordatorio", {
        description: (error as Error).message,
      })
    }
  }
}
