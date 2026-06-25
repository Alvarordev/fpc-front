import type { Agent, FullEnrollmentRequest, User } from "@/types";
import type { EnrollmentDraft } from "../../_store/enrollment-store";

interface BuildEnrollmentPayloadOptions {
  draft: EnrollmentDraft;
  agentId?: string;
  today?: string;
}

export function resolveEnrollmentAgentId(user: User | null, agents: Agent[]): string | undefined {
  if (user?.role === "AGENT") {
    return agents.find((agent) => agent.userId === user.id)?.id;
  }

  if (user?.role === "ADMIN") {
    return agents[0]?.id;
  }

  return undefined;
}

export function buildEnrollmentPayload({
  draft,
  agentId,
  today = new Date().toISOString().slice(0, 10),
}: BuildEnrollmentPayloadOptions): FullEnrollmentRequest {
  const meta = draft.enrollmentMetadata;

  const shouldSendTreatment =
    !!draft.treatment.treatmentType ||
    !!draft.treatment.treatmentFrequency ||
    !!draft.treatment.healthCenterId ||
    !!draft.treatment.treatmentSituation ||
    !!draft.treatment.notReceivingReason ||
    meta.currentlyReceivingTreatment === false;

  const treatment = shouldSendTreatment
    ? {
        ...draft.treatment,
        treatmentType:
          draft.treatment.treatmentType ||
          (meta.currentlyReceivingTreatment === false ? "No recibe tratamiento" : draft.treatment.treatmentType),
      }
    : undefined;

  const medicalAppointments = (draft.medicalAppointments ?? []).filter(
    (appointment) =>
      !!appointment.healthCenterId ||
      !!appointment.specialty ||
      !!appointment.appointmentDate ||
      !!appointment.nextAppointmentDate ||
      !!appointment.difficulties ||
      !!appointment.referredTo,
  );

  const familyPreventionTalkInterests = (draft.familyPreventionTalkInterests ?? []).filter(
    (interest) =>
      !!interest.talkName ||
      !!interest.familyMemberName ||
      !!interest.familyMemberPhone ||
      !!interest.familyMemberEmail,
  );

  return {
    patientId: draft.patientId,
    patientData: draft.patientData.fullName ? draft.patientData : undefined,
    details: { ...draft.details },
    insurance:
      draft.insurance.insuranceType && draft.insurance.insuranceType !== "NONE"
        ? { ...draft.insurance }
        : undefined,
    symptomReport: draft.symptomReport.hasDiscomfort !== undefined ? { ...draft.symptomReport } : null,
    diagnosis: draft.diagnosis.diagnosis ? { ...draft.diagnosis } : undefined,
    treatment,
    sisAffiliation: draft.insurance.insuranceType === "NONE" ? { ...draft.sisAffiliation } : null,
    medicalAppointments: medicalAppointments.length > 0 ? medicalAppointments : null,
    familyPreventionTalkInterests:
      familyPreventionTalkInterests.length > 0 ? familyPreventionTalkInterests : null,
    companions: null,
    enrollmentMetadata: {
      caseComments: meta.comments || null,
      startTime: meta.startTime ? `${today}T${meta.startTime}:00Z` : null,
      endTime: meta.endTime ? `${today}T${meta.endTime}:00Z` : null,
      dataPolicyAccepted: meta.dataPolicyAccepted,
      informedConsentAccepted: meta.informedConsentAccepted,
      isOncologicalPatient: meta.isOncologicalPatient,
      programEntryPoint: meta.programEntryPoint || null,
      currentlyAttendingConsultations: meta.currentlyAttendingConsultations ?? null,
      currentlyReceivingTreatment: meta.currentlyReceivingTreatment ?? null,
      surveyAccepted: meta.surveyAccepted,
      surveyRating: meta.surveyRating ?? null,
      agentId,
      affiliationType: (meta.affiliationType as "PATIENT" | "FAMILY" | undefined) || "PATIENT",
    },
  };
}
