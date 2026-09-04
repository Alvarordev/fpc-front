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
    patientData: {
      ...DEFAULT_DRAFT.patientData,
      primaryPhone: "999000000",
      ...overrides.patientData,
    },
    details: { ...DEFAULT_DRAFT.details, ...overrides.details },
    insurance: { ...DEFAULT_DRAFT.insurance, ...overrides.insurance },
    symptomReport: {
      ...DEFAULT_DRAFT.symptomReport,
      ...overrides.symptomReport,
    },
    diagnoses: overrides.diagnoses ?? structuredClone(DEFAULT_DRAFT.diagnoses),
    treatments:
      overrides.treatments ?? structuredClone(DEFAULT_DRAFT.treatments),
    sisAffiliation: {
      ...DEFAULT_DRAFT.sisAffiliation,
      ...overrides.sisAffiliation,
    },
    enrollmentMetadata: {
      ...DEFAULT_DRAFT.enrollmentMetadata,
      currentlyAttendingConsultations: false,
      notAttendingConsultationsNote: "No puede asistir",
      currentlyReceivingTreatment: true,
      ...overrides.enrollmentMetadata,
    },
    medicalAppointments: overrides.medicalAppointments ?? [],
    familyPreventionTalkInterests:
      overrides.familyPreventionTalkInterests ?? [],
    psychooncologySupportAssessment: {
      ...DEFAULT_DRAFT.psychooncologySupportAssessment,
      ...overrides.psychooncologySupportAssessment,
    },
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
          birthDepartment: "AREQUIPA",
          travelTimeToHospital: { valueMin: 45, unit: "MINUTE" },
          zoneType: "RURAL",
        },
        addresses: [
          {
            type: "PERMANENT",
            isPrimary: true,
            address: "Av. Test 123",
            district: "Lima",
            province: "Lima",
            department: "LIMA",
            locationUrl: "https://maps.google.com/?q=Av+Test+123",
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
        diagnoses: [
          {
            draftId: "diagnosis-1",
            diagnosis: "Cáncer de mama",
            cancerStage: "STAGE_2",
            firstSymptomsDate: "2026-01-01",
            diagnosisDate: "2026-02-15",
            isCurrent: true,
          },
        ],
        treatments: [
          {
            draftId: "treatment-1",
            diagnosisRef: "diagnosis-1",
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
        ],
        medicalAppointments: [
          {
            specialty: "Oncología",
            healthCenterId: "center-1",
            appointmentDate: null,
            nextAppointmentDate: "2026-07-15",
            nextAppointmentSpecialty: "Radioterapia",
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
        psychooncologySupportAssessment: {
          excessiveWorry: true,
          emotionalDistressScore: 7,
          preferredModality: "VIDEO_CALL",
        },
        enrollmentMetadata: {
          affiliationType: "PATIENT",
          currentlyAttendingConsultations: true,
          currentlyReceivingTreatment: true,
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
    expect(payload.diagnoses?.[0]?.diagnosis).toBe("Cáncer de mama")
    expect(payload.diagnoses?.[0]?.mode).toBe("PARALLEL")
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
      locationUrl: "https://maps.google.com/?q=Av+Test+123",
      dniMatchesAddress: false,
    })
    expect(payload.addresses?.[0]).not.toHaveProperty("reference")
    expect(payload.details).toMatchObject({
      birthDepartment: "AREQUIPA",
      zoneType: "RURAL",
    })
    expect(payload.addresses).toHaveLength(2)
    expect(payload.addresses?.[1]).toMatchObject({
      type: "TEMPORARY",
      isPrimary: false,
      address: "Jr. Temporal 456",
    })
    expect(payload.details).not.toHaveProperty("referredToSocialWorker")
    expect(payload.familyPreventionTalkInterests).toHaveLength(1)
    expect(payload.psychooncologySupportAssessment).toEqual({
      excessiveWorry: true,
      emotionalDistressScore: 7,
      preferredModality: "VIDEO_CALL",
    })
    expect(payload.medicalAppointments?.[0]).toMatchObject({
      nextAppointmentDate: "2026-07-15",
      nextAppointmentSpecialty: "Radioterapia",
    })
    expect(payload.callStartedAt).toMatch(/^2026-06-25T/)
    expect(payload.diagnoses?.[0]?.waitTimeForDiagnosis).toBeUndefined()
    expect(payload.surveyAccepted).toBe(true)
    expect("followUpQualityRating" in payload).toBe(false)
  })

  it("maps multiple diagnoses and keeps treatments attached to their diagnosis", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      draft: draft({
        diagnoses: [
          {
            draftId: "diagnosis-breast",
            diagnosis: "Cáncer de mama",
            isCurrent: true,
          },
          {
            draftId: "diagnosis-thyroid",
            diagnosis: "Cáncer de tiroides",
            isCurrent: true,
          },
        ],
        treatments: [
          {
            draftId: "treatment-chemotherapy",
            diagnosisRef: "diagnosis-breast",
            treatmentType: "Quimioterapia",
            isCurrent: true,
          },
          {
            draftId: "treatment-surgery",
            diagnosisRef: "diagnosis-thyroid",
            treatmentType: "Cirugía",
            isCurrent: true,
          },
        ],
      }),
    })

    expect(payload.diagnoses).toHaveLength(2)
    expect(payload.diagnoses?.map(({ clientRef }) => clientRef)).toEqual([
      "diagnosis-breast",
      "diagnosis-thyroid",
    ])
    expect(payload.treatments).toEqual([
      expect.objectContaining({
        diagnosisRef: "diagnosis-breast",
        treatmentType: "Quimioterapia",
      }),
      expect.objectContaining({
        diagnosisRef: "diagnosis-thyroid",
        treatmentType: "Cirugía",
      }),
    ])
  })

  it("allows a diagnosis without a treatment", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      draft: draft({
        diagnoses: [
          {
            draftId: "diagnosis-only",
            diagnosis: "Cáncer en evaluación",
            isCurrent: true,
          },
        ],
        treatments: [],
      }),
    })

    expect(payload.diagnoses).toHaveLength(1)
    expect(payload.treatments).toBeUndefined()
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
          hasRequestedMedicalConsultation: false,
          hasReceivedDiagnosis: false,
          isReceivingReportedTreatment: false,
          notReceivingTreatmentReason: "No corresponde",
          symptomDuration: { valueMin: 2, valueMax: 4, unit: "MONTH" },
          symptomFrequency: { valueMin: 1, unit: "WEEK" },
        },
        sisAffiliation: {
          canAffiliate: false,
          cantAffiliateReason: "Documento pendiente",
        },
        enrollmentMetadata: { affiliationType: "FAMILY" },
        psychooncologySupportAssessment: {
          excessiveWorry: true,
          emotionalDistressScore: 9,
          preferredModality: "CALL",
        },
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
    expect(payload.contacts).toEqual([{ role: "PRIMARY", source: "CALLER" }])
    expect(payload.insurance).toBeUndefined()
    expect(payload.sisAffiliation).toMatchObject({
      canAffiliate: false,
      cantAffiliateReason: "Documento pendiente",
    })
    expect(payload.symptomReport).toMatchObject({
      hasDiscomfort: true,
      signsAndSymptoms: "Dolor abdominal",
      symptomDuration: { valueMin: 2, valueMax: 4, unit: "MONTH" },
      symptomFrequency: { valueMin: 1, unit: "WEEK" },
    })
    expect(payload.psychooncologySupportAssessment).toBeUndefined()
  })

  it("maps the cancer treatment and consultation status metadata", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      draft: draft({
        diagnoses: [
          {
            draftId: "diagnosis-1",
            diagnosis: "Cáncer de mama",
            diagnosisSpecialty: "Oncología",
            isSepaActiveReferral: true,
            isCurrent: true,
          },
        ],
        treatments: [
          {
            draftId: "treatment-1",
            diagnosisRef: "diagnosis-1",
            treatmentType: "Cirugía",
            operationName: "Mastectomía",
            treatmentSituation: "ABANDONED",
            treatmentAbandonmentReason: "Cambio de ciudad",
            isCurrent: true,
          },
        ],
        enrollmentMetadata: {
          currentlyAttendingConsultations: false,
          notAttendingConsultationsNote: "No puede asistir",
          currentlyReceivingTreatment: true,
        },
      }),
    })

    expect(payload.diagnoses?.[0]).toMatchObject({
      diagnosisSpecialty: "Oncología",
    })
    expect(payload.diagnoses?.[0]).not.toHaveProperty("isSepaActiveReferral")
    expect(payload.treatments?.[0]).toMatchObject({
      operationName: "Mastectomía",
      treatmentSituation: "ABANDONED",
      treatmentAbandonmentReason: "Cambio de ciudad",
    })
    expect(payload.treatments?.[0]).not.toHaveProperty("careProgram")
    expect(payload.treatments?.[0]).not.toHaveProperty(
      "receivesTeleconsultation",
    )
    expect(payload.treatments?.[0]).not.toHaveProperty("teleconsultationNote")
    expect(payload.treatments?.[0]).not.toHaveProperty(
      "teleconsultationSpecialties",
    )
    expect(payload.healthBackgroundAssessment).toBeUndefined()
    expect(payload).toMatchObject({
      currentlyAttendingConsultations: false,
      notAttendingConsultationsNote: "No puede asistir",
      currentlyReceivingTreatment: true,
    })
  })

  it("serializes the explicit contacts and signs consultation branch", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "SIGNS_AND_SYMPTOMS",
      today: "2026-06-25",
      draft: draft({
        patientData: {
          fullName: "Paciente Signos",
          primaryPhone: "988555666",
          birthDate: "1980-04-10",
        },
        primaryContactSource: "CALLER",
        primaryContact: { fullName: "No usado", primaryPhone: "000" },
        secondaryContactEnabled: true,
        secondaryContactSource: "NEW",
        secondaryContact: {
          fullName: "Contacto Secundario",
          primaryPhone: "999444555",
          relationship: "SIBLING",
        },
        companion: {
          fullName: "Ana Caller",
          primaryPhone: "999000333",
          relationship: "MOTHER",
        },
        symptomReport: {
          hasDiscomfort: false,
          checkupMotivation: "Control preventivo",
          signsAndSymptoms: "Cansancio",
          symptomDuration: { valueMin: 3, unit: "MONTH" },
          symptomFrequency: { valueMin: 1, unit: "WEEK" },
          hasRequestedMedicalConsultation: true,
          consultationStatus: "ATTENDED",
          healthCenterId: "center-1",
          specialty: "Medicina general",
          indicationsReceived: "Solicitar exámenes",
          diagnosisSearchDuration: { valueMin: 2, unit: "MONTH" },
          hasReceivedDiagnosis: true,
          reportedDiagnosis: "Lesión por estudiar",
          isReceivingReportedTreatment: false,
          notReceivingTreatmentReason: "Aún no tiene diagnóstico formal",
        },
        medicalAppointments: [
          {
            healthCenterId: "center-1",
            specialty: "Medicina general",
            appointmentDate: "2026-06-20",
            nextAppointmentDate: "2026-07-20",
            nextAppointmentSpecialty: "Oncología",
            hasReferralSheet: false,
            referralNotProvidedReason: "No fue necesario referir",
          },
        ],
        enrollmentMetadata: { affiliationType: "FAMILY" },
      }),
    })

    expect(payload.contacts).toEqual([
      { role: "PRIMARY", source: "CALLER" },
      {
        role: "SECONDARY",
        source: "NEW",
        person: expect.objectContaining({
          fullName: "Contacto Secundario",
          primaryPhone: "999444555",
          relationship: "SIBLING",
        }),
      },
    ])
    expect(payload.symptomReport).toMatchObject({
      hasDiscomfort: false,
      checkupMotivation: "Control preventivo",
      consultationStatus: "ATTENDED",
      healthCenterId: "center-1",
      specialty: "Medicina general",
      hasReceivedDiagnosis: true,
      reportedDiagnosis: "Lesión por estudiar",
      isReceivingReportedTreatment: false,
      notReceivingTreatmentReason: "Aún no tiene diagnóstico formal",
    })
    expect(payload.medicalAppointments?.[0]).toMatchObject({
      appointmentDate: "2026-06-20",
      nextAppointmentSpecialty: "Oncología",
      isFirstConsultation: true,
      hasReferralSheet: false,
      referralNotProvidedReason: "No fue necesario referir",
    })
    expect(payload.diagnoses).toBeUndefined()
    expect(payload.treatments).toBeUndefined()
  })

  it("clears hidden signs branch fields when the answers change", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "SIGNS_AND_SYMPTOMS",
      draft: draft({
        patientData: {
          fullName: "Paciente Signos",
          primaryPhone: "988555666",
        },
        symptomReport: {
          hasDiscomfort: true,
          checkupMotivation: "Texto antiguo",
          hasRequestedMedicalConsultation: false,
          consultationStatus: "NOT_OBTAINED",
          consultationNotObtainedReason: "Texto antiguo",
          healthCenterId: "center-1",
          specialty: "Oncología",
          indicationsReceived: "Indicaciones antiguas",
          hasReceivedDiagnosis: false,
          reportedDiagnosis: "Diagnóstico antiguo",
          isReceivingReportedTreatment: false,
          notReceivingTreatmentReason: "No corresponde",
        },
        medicalAppointments: [
          {
            specialty: "Oncología",
            appointmentDate: "2026-06-20",
            hasReferralSheet: false,
          },
        ],
      }),
    })

    expect(payload.symptomReport).toMatchObject({
      hasDiscomfort: true,
      hasRequestedMedicalConsultation: false,
      isReceivingReportedTreatment: false,
      notReceivingTreatmentReason: "No corresponde",
    })
    expect(payload.symptomReport).not.toHaveProperty("checkupMotivation")
    expect(payload.symptomReport).not.toHaveProperty("reportedDiagnosis")
    expect(payload.symptomReport).not.toHaveProperty("indicationsReceived")
    expect(payload.symptomReport).not.toHaveProperty("healthCenterId")
    expect(payload.medicalAppointments).toBeUndefined()
  })

  it("does not use the legacy consultation answer as the new answer", () => {
    expect(() =>
      buildEnrollmentPayload({
        agentId: "agent-1",
        categoriaClinica: "SIGNS_AND_SYMPTOMS",
        draft: draft({
          patientData: {
            fullName: "Paciente Signos",
            primaryPhone: "988555666",
          },
          symptomReport: {
            hasDiscomfort: true,
            hasSoughtMedicalConsultation: false,
          },
        }),
      }),
    ).toThrow("Indica si solicitó una consulta médica")
  })

  it("omits referral fields for a scheduled consultation", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "SIGNS_AND_SYMPTOMS",
      draft: draft({
        patientData: {
          fullName: "Paciente Signos",
          primaryPhone: "988555666",
        },
        symptomReport: {
          hasDiscomfort: true,
          hasRequestedMedicalConsultation: true,
          consultationStatus: "SCHEDULED",
          healthCenterId: "center-1",
          specialty: "Medicina general",
          hasReceivedDiagnosis: false,
          isReceivingReportedTreatment: false,
          notReceivingTreatmentReason: "Aún no corresponde",
        },
        medicalAppointments: [
          {
            healthCenterId: "center-1",
            specialty: "Medicina general",
            appointmentDate: "2026-06-20",
            hasReferralSheet: false,
            referredTo: "Destino antiguo",
            referralNotProvidedReason: "Motivo antiguo",
          },
        ],
      }),
    })

    expect(payload.medicalAppointments?.[0]).not.toHaveProperty(
      "hasReferralSheet",
    )
    expect(payload.medicalAppointments?.[0]).not.toHaveProperty("referredTo")
    expect(payload.medicalAppointments?.[0]).not.toHaveProperty(
      "referralNotProvidedReason",
    )
  })

  it("serializes accumulated enrollment notes into both comment destinations", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      today: "2026-06-25",
      draft: draft({
        diagnoses: [
          {
            draftId: "diagnosis-1",
            diagnosis: "Cáncer de mama",
            isCurrent: true,
          },
        ],
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
        diagnoses: [
          {
            draftId: "diagnosis-1",
            diagnosis: "Cáncer de mama",
            firstSymptomsDate: "2026-01-01",
            diagnosisDate: "2026-03-02",
            waitTimeForDiagnosis: { valueMin: 1.5, unit: "MONTH" },
            waitTimeForDiagnosisManuallyEdited: true,
            isCurrent: true,
          },
        ],
      }),
    })

    expect(payload.diagnoses?.[0]?.waitTimeForDiagnosis).toEqual({
      valueMin: 1.5,
      unit: "MONTH",
    })
  })

  it("maps referral answers and unknown historical values without sending sentinels", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      historical: true,
      historicalEnrollmentDate: "2024-04-12",
      draft: draft({
        patientData: {
          fullName: "Paciente Histórico",
          primaryPhone: "",
          birthDate: "1980-04-10",
        },
        details: { birthDepartment: "__NO_MENCIONA__" },
        primaryContactSource: "CALLER",
        companion: {
          fullName: "Informante Histórico",
          primaryPhone: "999111222",
          relationship: "HERMANA",
        },
        diagnoses: [
          {
            draftId: "diagnosis-1",
            diagnosis: "Cáncer de mama",
            firstSymptomsDateUnknown: true,
            waitTimeForDiagnosis: { valueMin: 2, unit: "MONTH" },
            waitTimeForDiagnosisManuallyEdited: true,
            referredHealthCenterId: "center-referred",
            hasReferral: true,
            isCurrent: true,
          },
        ],
      }),
    })

    expect(payload.patient).not.toHaveProperty("primaryPhone")
    expect(payload.details?.birthDepartment).toBeUndefined()
    expect(payload.diagnoses?.[0]).toMatchObject({
      firstSymptomsDate: undefined,
      referredHealthCenterId: "center-referred",
      hasReferral: true,
      waitTimeForDiagnosis: { valueMin: 2, unit: "MONTH" },
    })
    expect(payload.enrolledOn).toBe("2024-04-12")
  })

  it("keeps psycho-oncology support answers in historical enrollments", () => {
    const payload = buildEnrollmentPayload({
      agentId: "agent-1",
      categoriaClinica: "CANCER_DIAGNOSIS",
      historical: true,
      historicalEnrollmentDate: "2024-04-12",
      draft: draft({
        diagnoses: [
          {
            draftId: "diagnosis-1",
            diagnosis: "Cáncer de mama",
            isCurrent: true,
          },
        ],
        psychooncologySupportAssessment: {
          excessiveWorry: false,
          emotionalDistressScore: 6,
          preferredModality: "CALL",
        },
        enrollmentMetadata: { affiliationType: "PATIENT" },
      }),
    })

    expect(payload.enrolledOn).toBe("2024-04-12")
    expect(payload.psychooncologySupportAssessment).toEqual({
      excessiveWorry: false,
      emotionalDistressScore: 6,
      preferredModality: "CALL",
    })
  })

  it("requires answers and conditional notes for the cancer diagnosis branch", () => {
    expect(() =>
      buildEnrollmentPayload({
        agentId: "agent-1",
        categoriaClinica: "CANCER_DIAGNOSIS",
        draft: draft({
          diagnoses: [
            { draftId: "diagnosis-1", diagnosis: "Cáncer", isCurrent: true },
          ],
          enrollmentMetadata: {
            currentlyAttendingConsultations: undefined,
            currentlyReceivingTreatment: undefined,
          },
        }),
      }),
    ).toThrow("Indica si actualmente asiste a sus consultas médicas")

    expect(() =>
      buildEnrollmentPayload({
        agentId: "agent-1",
        categoriaClinica: "CANCER_DIAGNOSIS",
        draft: draft({
          diagnoses: [
            { draftId: "diagnosis-1", diagnosis: "Cáncer", isCurrent: true },
          ],
          enrollmentMetadata: {
            currentlyAttendingConsultations: false,
            notAttendingConsultationsNote: "",
          },
        }),
      }),
    ).toThrow("Indica las notas sobre la no asistencia a consultas médicas")

    expect(() =>
      buildEnrollmentPayload({
        agentId: "agent-1",
        categoriaClinica: "CANCER_DIAGNOSIS",
        draft: draft({
          diagnoses: [
            { draftId: "diagnosis-1", diagnosis: "Cáncer", isCurrent: true },
          ],
          enrollmentMetadata: {
            currentlyReceivingTreatment: false,
            notReceivingTreatmentReason: "",
          },
        }),
      }),
    ).toThrow("Indica el motivo por el que no recibe tratamiento")
  })

  it("rejects an inverted treatment date range", () => {
    expect(() =>
      buildEnrollmentPayload({
        agentId: "agent-1",
        categoriaClinica: "CANCER_DIAGNOSIS",
        draft: draft({
          patientData: { fullName: "Paciente Test", primaryPhone: "988111222" },
          diagnoses: [
            {
              draftId: "diagnosis-1",
              diagnosis: "Cáncer de mama",
              isCurrent: true,
            },
          ],
          treatments: [
            {
              draftId: "treatment-1",
              diagnosisRef: "diagnosis-1",
              treatmentType: "Quimioterapia",
              startDate: "2026-08-20",
              endDate: "2026-02-20",
              isCurrent: true,
            },
          ],
        }),
      }),
    ).toThrow("La fecha de fin del tratamiento")
  })
})
