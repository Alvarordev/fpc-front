import { describe, expect, it } from "vitest"
import { DEFAULT_DRAFT, type EnrollmentDraft } from "../../_store/enrollment-store"
import { buildEnrollmentPayload } from "./step-8-payload"

function draft(overrides: Partial<EnrollmentDraft> = {}): EnrollmentDraft {
  return {
    ...structuredClone(DEFAULT_DRAFT),
    ...overrides,
    patientData: { ...DEFAULT_DRAFT.patientData, ...overrides.patientData },
    details: { ...DEFAULT_DRAFT.details, ...overrides.details },
    insurance: { ...DEFAULT_DRAFT.insurance, ...overrides.insurance },
    symptomReport: { ...DEFAULT_DRAFT.symptomReport, ...overrides.symptomReport },
    diagnosis: { ...DEFAULT_DRAFT.diagnosis, ...overrides.diagnosis },
    treatment: { ...DEFAULT_DRAFT.treatment, ...overrides.treatment },
    sisAffiliation: { ...DEFAULT_DRAFT.sisAffiliation, ...overrides.sisAffiliation },
    enrollmentMetadata: { ...DEFAULT_DRAFT.enrollmentMetadata, ...overrides.enrollmentMetadata },
    medicalAppointments: overrides.medicalAppointments ?? [],
    familyPreventionTalkInterests: overrides.familyPreventionTalkInterests ?? [],
    companion: { ...DEFAULT_DRAFT.companion, ...overrides.companion },
  }
}

describe("step 8 Nest enrollment payload", () => {
  it("maps the diagnosis branch and legacy metadata to CreateEnrollmentDto", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      today: "2026-06-25",
      draft: draft({
        patientData: { fullName: "Paciente Test", primaryPhone: "988111222", dni: "97000000" },
        details: { referredToSocialWorker: true },
        insurance: { insuranceType: "EPS", epsProvider: "RIMAC", isCurrent: true },
        diagnosis: { diagnosis: "Cáncer de mama", cancerStage: "STAGE_2", isCurrent: true },
        treatment: { diagnosisId: "legacy", treatmentType: "Quimioterapia", isCurrent: true },
        medicalAppointments: [{ specialty: "Oncología", healthCenterId: null, appointmentDate: null, nextAppointmentDate: null, difficulties: null, hasReferralSheet: false, isFirstConsultation: false }],
        familyPreventionTalkInterests: [{ talkName: "Prevención", familyMemberName: "Rosa Test", familyMemberPhone: "999000111", familyMemberEmail: "rosa@example.com" }],
        enrollmentMetadata: { affiliationType: "PATIENT", comments: "Caso diagnóstico", startTime: "09:00", endTime: "09:45", dataPolicyAccepted: true, informedConsentAccepted: true, surveyAccepted: true },
      }),
    })

    expect(payload.followUp).toMatchObject({ type: "CALL", agentId: "agent-1", notes: "Caso diagnóstico" })
    expect(payload.affiliationType).toBe("SELF")
    expect(payload.insurance?.insuranceType).toBe("EPS")
    expect(payload.diagnosis?.diagnosis).toBe("Cáncer de mama")
    expect(payload.treatment?.treatmentType).toBe("Quimioterapia")
    expect(payload.details?.referredToSocialWorker).toBe(true)
    expect(payload.familyPreventionTalkInterests).toHaveLength(1)
    expect(payload.callStartedAt).toMatch(/^2026-06-25T/)
    expect(payload.surveyAccepted).toBe(true)
    expect("followUpQualityRating" in payload).toBe(false)
  })

  it("maps the signs branch, SIS request, and family companion", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      today: "2026-06-25",
      draft: draft({
        patientData: { fullName: "Paciente Signos", primaryPhone: "988555666" },
        insurance: { insuranceType: "NONE", isCurrent: true },
        symptomReport: { hasDiscomfort: true, signsAndSymptoms: "Dolor abdominal", indicationsReceived: "Control", hasSoughtMedicalConsultation: false },
        sisAffiliation: { canAffiliate: false, cantAffiliateReason: "Documento pendiente" },
        enrollmentMetadata: { affiliationType: "FAMILY" },
        companion: { fullName: "Ana Test", primaryPhone: "999000333", relationship: "MOTHER" },
      }),
    })

    expect(payload.affiliationType).toBe("FAMILY_FRIEND")
    expect(payload.companion).toMatchObject({ fullName: "Ana Test", primaryPhone: "999000333", relationship: "MOTHER", isPrimaryInformant: true })
    expect(payload.insurance).toBeUndefined()
    expect(payload.sisAffiliation).toMatchObject({ canAffiliate: false, cantAffiliateReason: "Documento pendiente" })
    expect(payload.symptomReport).toMatchObject({ hasDiscomfort: true, signsAndSymptoms: "Dolor abdominal", indicationsReceived: "Control" })
  })
})
