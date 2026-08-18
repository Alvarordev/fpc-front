import { describe, expect, it } from "vitest"
import {
  DEFAULT_DRAFT,
  type EnrollmentDraft,
} from "../../_store/enrollment-store"
import { buildEnrollmentPayload } from "./step-8-payload"

function draft(overrides: Partial<EnrollmentDraft> = {}): EnrollmentDraft {
  return {
    ...structuredClone(DEFAULT_DRAFT),
    ...overrides,
    patientData: { ...DEFAULT_DRAFT.patientData, ...overrides.patientData },
    details: { ...DEFAULT_DRAFT.details, ...overrides.details },
    insurance: { ...DEFAULT_DRAFT.insurance, ...overrides.insurance },
    symptomReport: {
      ...DEFAULT_DRAFT.symptomReport,
      ...overrides.symptomReport,
    },
    diagnosis: { ...DEFAULT_DRAFT.diagnosis, ...overrides.diagnosis },
    treatment: { ...DEFAULT_DRAFT.treatment, ...overrides.treatment },
    sisAffiliation: {
      ...DEFAULT_DRAFT.sisAffiliation,
      ...overrides.sisAffiliation,
    },
    enrollmentMetadata: {
      ...DEFAULT_DRAFT.enrollmentMetadata,
      ...overrides.enrollmentMetadata,
    },
    medicalAppointments: overrides.medicalAppointments ?? [],
    familyPreventionTalkInterests:
      overrides.familyPreventionTalkInterests ?? [],
    companion: { ...DEFAULT_DRAFT.companion, ...overrides.companion },
  }
}

describe("step 8 Nest enrollment payload", () => {
  it("maps diagnosis, address, and structured durations to CreateEnrollmentDto", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      today: "2026-06-25",
      draft: draft({
        patientData: {
          fullName: "Paciente Test",
          primaryPhone: "988111222",
          dni: "97000000",
        },
        details: {
          referredToSocialWorker: true,
          travelTimeToHospital: { valueMin: 45, unit: "MINUTE" },
        },
        addresses: [
          {
            type: "PERMANENT",
            isPrimary: true,
            address: "Av. Test 123",
            district: "Lima",
            province: "Lima",
            department: "LIMA",
            dniMatchesAddress: false,
          },
          {
            type: "TEMPORARY",
            isPrimary: false,
            address: "Jr. Temporal 456",
            district: "Miraflores",
            province: "Lima",
            department: "LIMA",
          },
        ],
        insurance: {
          insuranceType: "EPS",
          epsProvider: "RIMAC",
          isCurrent: true,
        },
        diagnosis: {
          diagnosis: "Cáncer de mama",
          cancerStage: "STAGE_2",
          firstSymptomsDate: "2026-01-01",
          diagnosisDate: "2026-02-15",
          isCurrent: true,
        },
        treatment: {
          diagnosisId: "legacy",
          treatmentType: "Quimioterapia",
          treatmentFrequency: { valueMin: 3, unit: "WEEK" },
          treatmentSituation: "EN_CURSO",
          isReferred: true,
          sourceHealthCenterId: "center-1",
          receivingHealthCenterId: "center-2",
          startDate: "2026-02-20",
          endDate: "2026-08-20",
          medications: [
            {
              name: "Tamoxifeno",
              frequency: { valueMin: 1, unit: "DAY" },
            },
          ],
          isCurrent: true,
        },
        medicalAppointments: [
          {
            specialty: "Oncología",
            healthCenterId: null,
            appointmentDate: null,
            nextAppointmentDate: null,
            difficulties: null,
            hasReferralSheet: false,
            isFirstConsultation: false,
          },
        ],
        familyPreventionTalkInterests: [
          {
            talkName: "Prevención",
            familyMemberName: "Rosa Test",
            familyMemberPhone: "999000111",
            familyMemberEmail: "rosa@example.com",
          },
        ],
        enrollmentMetadata: {
          affiliationType: "PATIENT",
          comments: "Caso diagnóstico",
          startTime: "09:00",
          endTime: "09:45",
          dataPolicyAccepted: true,
          informedConsentAccepted: true,
          surveyAccepted: true,
        },
      }),
    })

    expect(payload.followUp).toMatchObject({
      type: "CALL",
      agentId: "agent-1",
      notes: "Caso diagnóstico",
    })
    expect(payload.affiliationType).toBe("SELF")
    expect(payload.healthPhase).toBe("CANCER_DIAGNOSIS")
    expect(payload.insurance?.insuranceType).toBe("EPS")
    expect(payload.diagnosis?.diagnosis).toBe("Cáncer de mama")
    expect(payload.treatments?.[0]?.treatmentType).toBe("Quimioterapia")
    expect(payload.treatments?.[0]?.treatmentFrequency).toEqual({
      valueMin: 3,
      unit: "WEEK",
    })
    expect(payload.treatments?.[0]).toMatchObject({
      isReferred: true,
      sourceHealthCenterId: "center-1",
      receivingHealthCenterId: "center-2",
    })
    expect(payload.treatments?.[0]).toMatchObject({
      startDate: "2026-02-20",
      endDate: "2026-08-20",
    })
    expect(payload.treatments?.[0]?.medications?.[0]?.frequency).toEqual({
      valueMin: 1,
      unit: "DAY",
    })
    expect(payload.details?.travelTimeToHospital).toEqual({
      valueMin: 45,
      unit: "MINUTE",
    })
    expect(payload.addresses?.[0]).toMatchObject({
      type: "PERMANENT",
      department: "LIMA",
      dniMatchesAddress: false,
    })
    expect(payload.addresses).toHaveLength(2)
    expect(payload.addresses?.[1]).toMatchObject({
      type: "TEMPORARY",
      isPrimary: false,
      address: "Jr. Temporal 456",
    })
    expect(payload.details?.referredToSocialWorker).toBe(true)
    expect(payload.familyPreventionTalkInterests).toHaveLength(1)
    expect(payload.callStartedAt).toMatch(/^2026-06-25T/)
    expect(payload.diagnosis?.waitTimeForDiagnosis).toBeUndefined()
    expect(payload.surveyAccepted).toBe(true)
    expect("followUpQualityRating" in payload).toBe(false)
  })

  it("maps the signs branch, SIS request, and family companion", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "SIGNS_AND_SYMPTOMS",
      today: "2026-06-25",
      draft: draft({
        patientData: { fullName: "Paciente Signos", primaryPhone: "988555666" },
        insurance: { insuranceType: "NONE", isCurrent: true },
        symptomReport: {
          hasDiscomfort: true,
          signsAndSymptoms: "Dolor abdominal",
          indicationsReceived: "Control",
          hasSoughtMedicalConsultation: false,
          symptomDuration: { valueMin: 2, valueMax: 4, unit: "MONTH" },
          symptomFrequency: { valueMin: 1, unit: "WEEK" },
        },
        sisAffiliation: {
          canAffiliate: false,
          cantAffiliateReason: "Documento pendiente",
        },
        enrollmentMetadata: { affiliationType: "FAMILY" },
        companion: {
          fullName: "Ana Test",
          primaryPhone: "999000333",
          relationship: "MOTHER",
        },
      }),
    })

    expect(payload.affiliationType).toBe("FAMILY_FRIEND")
    expect(payload.healthPhase).toBe("SIGNS_AND_SYMPTOMS")
    expect(payload.companion).toMatchObject({
      fullName: "Ana Test",
      primaryPhone: "999000333",
      relationship: "MOTHER",
      isPrimaryInformant: true,
    })
    expect(payload.insurance).toBeUndefined()
    expect(payload.sisAffiliation).toMatchObject({
      canAffiliate: false,
      cantAffiliateReason: "Documento pendiente",
    })
    expect(payload.symptomReport).toMatchObject({
      hasDiscomfort: true,
      signsAndSymptoms: "Dolor abdominal",
      indicationsReceived: "Control",
      symptomDuration: { valueMin: 2, valueMax: 4, unit: "MONTH" },
      symptomFrequency: { valueMin: 1, unit: "WEEK" },
    })
  })

  it("serializes accumulated enrollment notes into both comment destinations", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      today: "2026-06-25",
      draft: draft({
        enrollmentMetadata: {
          enrollmentNotes: [
            { text: "Primera observación" },
            { text: "Pendiente validar aseguradora" },
          ],
        },
      }),
    })

    expect(payload.caseComments).toContain("Primera observación")
    expect(payload.caseComments).toContain("Pendiente validar aseguradora")
    expect(payload.caseComments).toBe(
      "Primera observación\n\nPendiente validar aseguradora",
    )
    expect(payload.followUp.notes).toBe(payload.caseComments)
  })

  it("keeps a manually adjusted diagnosis wait time when dates are present", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      draft: draft({
        patientData: { fullName: "Paciente Test", primaryPhone: "988111222" },
        diagnosis: {
          diagnosis: "Cáncer de mama",
          firstSymptomsDate: "2026-01-01",
          diagnosisDate: "2026-03-02",
          waitTimeForDiagnosis: { valueMin: 1.5, unit: "MONTH" },
          waitTimeForDiagnosisManuallyEdited: true,
          isCurrent: true,
        },
      }),
    })

    expect(payload.diagnosis?.waitTimeForDiagnosis).toEqual({
      valueMin: 1.5,
      unit: "MONTH",
    })
  })

  it("rejects an inverted treatment date range", () => {
    expect(() =>
      buildEnrollmentPayload({
        agentId: "agent-1",
        categoriaClinica: "CANCER_DIAGNOSIS",
        draft: draft({
          patientData: { fullName: "Paciente Test", primaryPhone: "988111222" },
          diagnosis: { diagnosis: "Cáncer de mama", isCurrent: true },
          treatment: {
            diagnosisId: "legacy",
            treatmentType: "Quimioterapia",
            startDate: "2026-08-20",
            endDate: "2026-02-20",
            isCurrent: true,
          },
        }),
      }),
    ).toThrow("La fecha de fin del tratamiento")
  })
})
