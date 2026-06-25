import { describe, expect, it } from "vitest";
import type { Agent, User } from "@/types";
import { DEFAULT_DRAFT, type EnrollmentDraft } from "../../_store/enrollment-store";
import { buildEnrollmentPayload, resolveEnrollmentAgentId } from "./step-8-payload";

function cloneDraft(overrides: Partial<EnrollmentDraft> = {}): EnrollmentDraft {
  return {
    ...structuredClone(DEFAULT_DRAFT),
    ...overrides,
    patientData: {
      ...DEFAULT_DRAFT.patientData,
      ...overrides.patientData,
    },
    details: {
      ...DEFAULT_DRAFT.details,
      ...overrides.details,
    },
    insurance: {
      ...DEFAULT_DRAFT.insurance,
      ...overrides.insurance,
    },
    symptomReport: {
      ...DEFAULT_DRAFT.symptomReport,
      ...overrides.symptomReport,
    },
    diagnosis: {
      ...DEFAULT_DRAFT.diagnosis,
      ...overrides.diagnosis,
    },
    treatment: {
      ...DEFAULT_DRAFT.treatment,
      ...overrides.treatment,
    },
    sisAffiliation: {
      ...DEFAULT_DRAFT.sisAffiliation,
      ...overrides.sisAffiliation,
    },
    enrollmentMetadata: {
      ...DEFAULT_DRAFT.enrollmentMetadata,
      ...overrides.enrollmentMetadata,
    },
    medicalAppointments: overrides.medicalAppointments ?? [],
    familyPreventionTalkInterests: overrides.familyPreventionTalkInterests ?? [],
    companions: [],
  };
}

describe("step 8 enrollment payload builder", () => {
  it("resolves the enrollment agent for admins and agents", () => {
    const agents: Agent[] = [
      {
        id: "agent-1",
        userId: "user-agent",
        fullName: "Agent One",
        phone: "999000111",
        createdAt: "2026-06-25T00:00:00Z",
      },
    ];

    const admin: User = {
      id: "admin-user",
      email: "admin@example.com",
      role: "ADMIN",
      isActive: true,
      createdAt: "2026-06-25T00:00:00Z",
      updatedAt: "2026-06-25T00:00:00Z",
    };

    const agentUser: User = {
      ...admin,
      id: "user-agent",
      role: "AGENT",
    };

    expect(resolveEnrollmentAgentId(admin, agents)).toBe("agent-1");
    expect(resolveEnrollmentAgentId(agentUser, agents)).toBe("agent-1");
    expect(resolveEnrollmentAgentId({ ...admin, role: "VOLUNTEER" }, agents)).toBeUndefined();
  });

  it("builds a complete diagnosis enrollment payload from step 8 draft state", () => {
    const draft = cloneDraft({
      patientData: {
        fullName: "Paciente Diagnóstico Test",
        dni: "97000000",
        birthDate: "1980-03-15",
        primaryPhone: "988111222",
        secondaryPhone: "977333444",
        hasWhatsapp: true,
        role: "PATIENT",
      },
      details: {
        currentAddress: "Av. Test 123",
        currentDistrict: "Miraflores",
        currentDepartment: "Lima",
        referredToSocialWorker: true,
      },
      insurance: {
        insuranceType: "EPS",
        epsProvider: "RIMAC",
        isCurrent: true,
        startDate: "2025-01-10",
      },
      diagnosis: {
        diagnosis: "Cáncer de mama",
        cancerStage: "STAGE_2",
        diagnosisDate: "2025-08-20",
        healthCenterId: "health-center-1",
        diagnosisSpecialty: "Oncología médica",
        symptomLeadingToCheckup: "Masa palpable",
        waitTimeForDiagnosis: "6 semanas",
        hasMedicalReport: true,
        isCurrent: true,
      },
      treatment: {
        diagnosisId: "00000000-0000-0000-0000-000000000000",
        treatmentType: "Quimioterapia",
        treatmentFrequency: "Cada 21 días",
        healthCenterId: "health-center-1",
        isCurrent: true,
        treatmentSituation: "En curso",
      },
      medicalAppointments: [
        {
          healthCenterId: "health-center-1",
          specialty: "Oncología",
          appointmentDate: "2026-06-01",
          nextAppointmentDate: "2026-07-01",
          hasReferralSheet: true,
          isFirstConsultation: false,
          difficulties: "Demora en citas",
        },
      ],
      familyPreventionTalkInterests: [
        {
          talkName: "Prevención del cáncer de mama",
          familyMemberName: "Rosa Test",
          familyMemberPhone: "999000111",
          familyMemberEmail: "rosa.test@example.com",
        },
        {
          talkName: "",
          familyMemberName: "",
          familyMemberPhone: "",
          familyMemberEmail: "",
        },
      ],
      enrollmentMetadata: {
        comments: "Caso diagnóstico",
        startTime: "09:00",
        endTime: "09:45",
        dataPolicyAccepted: true,
        informedConsentAccepted: true,
        isOncologicalPatient: true,
        programEntryPoint: "Campaña prevención",
        currentlyAttendingConsultations: true,
        currentlyReceivingTreatment: true,
        surveyAccepted: true,
        surveyRating: 5,
        affiliationType: "PATIENT",
      },
    });

    const payload = buildEnrollmentPayload({ draft, agentId: "agent-1", today: "2026-06-25" });

    expect(payload.patientData?.dni).toBe("97000000");
    expect(payload.insurance?.insuranceType).toBe("EPS");
    expect(payload.symptomReport).toBeNull();
    expect(payload.diagnosis?.diagnosis).toBe("Cáncer de mama");
    expect(payload.treatment?.treatmentType).toBe("Quimioterapia");
    expect(payload.sisAffiliation).toBeNull();
    expect(payload.medicalAppointments).toHaveLength(1);
    expect(payload.familyPreventionTalkInterests).toHaveLength(1);
    expect(payload.enrollmentMetadata).toMatchObject({
      caseComments: "Caso diagnóstico",
      startTime: "2026-06-25T09:00:00Z",
      endTime: "2026-06-25T09:45:00Z",
      agentId: "agent-1",
      affiliationType: "PATIENT",
    });
  });

  it("builds a signs enrollment payload with SIS affiliation and preserves frontend symptom field names", () => {
    const draft = cloneDraft({
      patientData: {
        fullName: "Paciente Signos Test",
        dni: "98000000",
        birthDate: "1975-11-02",
        primaryPhone: "988555666",
        hasWhatsapp: false,
        role: "PATIENT",
      },
      insurance: {
        insuranceType: "NONE",
        isCurrent: true,
      },
      symptomReport: {
        hasDiscomfort: true,
        signsAndSymptoms: "Sangrado persistente, pérdida de peso y dolor abdominal",
        hasSoughtMedicalConsultation: false,
        specialty: "Medicina",
        indicationsReceived: "Control",
      },
      diagnosis: {
        diagnosis: "",
        isCurrent: true,
      },
      treatment: {
        diagnosisId: "00000000-0000-0000-0000-000000000000",
        treatmentType: "",
        isCurrent: true,
      },
      sisAffiliation: {
        canAffiliate: false,
        cantAffiliateReason: "Documento pendiente",
        comments: "Pendiente",
      },
      familyPreventionTalkInterests: [
        {
          talkName: "Prevención general del cáncer",
          familyMemberName: "Ana Test",
          familyMemberPhone: "988000333",
          familyMemberEmail: "ana.test@example.com",
        },
      ],
      enrollmentMetadata: {
        comments: "Caso signos",
        startTime: "10:00",
        endTime: "10:30",
        dataPolicyAccepted: true,
        informedConsentAccepted: true,
        isOncologicalPatient: false,
        programEntryPoint: "Redes FPC",
        surveyAccepted: true,
        surveyRating: 4,
      },
    });

    const payload = buildEnrollmentPayload({ draft, agentId: "agent-1", today: "2026-06-25" });

    expect(payload.insurance).toBeUndefined();
    expect(payload.diagnosis).toBeUndefined();
    expect(payload.treatment).toBeUndefined();
    expect(payload.sisAffiliation).toMatchObject({
      canAffiliate: false,
      cantAffiliateReason: "Documento pendiente",
      comments: "Pendiente",
    });
    expect(payload.symptomReport).toMatchObject({
      hasDiscomfort: true,
      signsAndSymptoms: "Sangrado persistente, pérdida de peso y dolor abdominal",
      hasSoughtMedicalConsultation: false,
      specialty: "Medicina",
      indicationsReceived: "Control",
    });
    expect(payload.familyPreventionTalkInterests).toHaveLength(1);
    expect(payload.enrollmentMetadata?.startTime).toBe("2026-06-25T10:00:00Z");
  });

  it("sends a fallback treatment when patient explicitly does not receive treatment", () => {
    const draft = cloneDraft({
      enrollmentMetadata: {
        currentlyReceivingTreatment: false,
      },
      treatment: {
        diagnosisId: "00000000-0000-0000-0000-000000000000",
        treatmentType: "",
        isCurrent: false,
        notReceivingReason: "Está en evaluación",
      },
    });

    const payload = buildEnrollmentPayload({ draft, today: "2026-06-25" });

    expect(payload.treatment).toMatchObject({
      treatmentType: "No recibe tratamiento",
      notReceivingReason: "Está en evaluación",
    });
  });
});
