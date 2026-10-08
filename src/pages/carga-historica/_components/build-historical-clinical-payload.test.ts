import { describe, expect, it } from "vitest"
import { buildHistoricalClinicalPayload } from "./build-historical-clinical-payload"

describe("buildHistoricalClinicalPayload", () => {
  it("omits empty symptom-report dates instead of sending invalid ISO strings", () => {
    const payload = buildHistoricalClinicalPayload({
      patientId: "patient-1",
      drafts: {
        symptomReport: {
          hasDiscomfort: true,
          firstConsultationDate: "",
          nextConsultationDate: "",
          firstPrimaryCareViaSepaAt: "",
        },
      },
    })

    expect(payload.symptomReport).toMatchObject({ hasDiscomfort: true })
    expect(payload.symptomReport).not.toHaveProperty("firstConsultationDate")
    expect(payload.symptomReport).not.toHaveProperty("nextConsultationDate")
    expect(payload.symptomReport).not.toHaveProperty(
      "firstPrimaryCareViaSepaAt",
    )
  })

  it("normalizes datetime consultation dates to YYYY-MM-DD", () => {
    const payload = buildHistoricalClinicalPayload({
      patientId: "patient-1",
      drafts: {
        symptomReport: {
          hasMedicalConsultation: true,
          firstConsultationDate: "2026-09-10T00:00:00.000Z",
          nextConsultationDate: "2026-09-19T12:00:00.000Z",
        },
      },
    })

    expect(payload.symptomReport).toMatchObject({
      firstConsultationDate: "2026-09-10",
      nextConsultationDate: "2026-09-19",
    })
  })
})
