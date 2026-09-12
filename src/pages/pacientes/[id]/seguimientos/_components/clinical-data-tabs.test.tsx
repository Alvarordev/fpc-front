import { describe, expect, it } from "vitest"
import type { PatientSymptomReport } from "@/api/patients"
import { enrollmentSymptomDraft } from "./clinical-symptom-draft"

describe("enrollmentSymptomDraft", () => {
  it("maps enrollment answers and leaves follow-up-only fields empty", () => {
    const draft = enrollmentSymptomDraft({
      hasDiscomfort: true,
      signsAndSymptoms: "Dolor localizado",
      checkupMotivation: null,
      hasMedicalConsultation: true,
      healthCenterId: "center-1",
      specialty: "Medicina general",
      firstConsultationDate: "2026-09-10",
      isAwaitingDiagnosis: true,
      diagnosisSearchDuration: {
        valueMin: 3,
        valueMax: null,
        unit: "MONTH",
        label: null,
      },
      hasReferral: false,
      referredHealthCenterId: null,
      referralNotProvidedReason: "No le entregaron la hoja",
      hasReceivedDiagnosis: false,
      reportedDiagnosis: null,
      nextConsultationDate: "2026-09-19",
      isReceivingReportedTreatment: true,
      reportedTreatment: "Quimioterapia",
      reportedTreatmentFrequency: {
        valueMin: 1,
        valueMax: null,
        unit: "WEEK",
        label: null,
      },
      notReceivingTreatmentReason: null,
    } as PatientSymptomReport)

    expect(draft).toMatchObject({
      hasDiscomfort: true,
      signsAndSymptoms: "Dolor localizado",
      hasMedicalConsultation: true,
      healthCenterId: "center-1",
      diagnosisSearchDuration: { valueMin: 3, unit: "MONTH" },
      reportedTreatmentFrequency: { valueMin: 1, unit: "WEEK" },
    })
    expect(draft.isPainPresent).toBeUndefined()
    expect(draft.painDescription).toBeUndefined()
    expect(draft.indicationsReceived).toBeUndefined()
  })
})
