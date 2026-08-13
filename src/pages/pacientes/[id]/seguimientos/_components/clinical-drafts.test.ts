import { describe, expect, it } from "vitest"
import { hasAnyClinicalDraft, type TreatmentDraft } from "./clinical-drafts"

describe("clinical follow-up drafts", () => {
  it("marks a symptom report as a pending clinical change", () => {
    expect(
      hasAnyClinicalDraft({
        symptomReport: {
          hasDiscomfort: true,
          symptomDuration: { valueMin: 30, unit: "DAY" },
          symptomFrequency: { valueMin: 1, unit: "WEEK" },
        },
      }),
    ).toBe(true)
  })

  it("keeps replacement and parallel treatment decisions distinguishable", () => {
    const replacement: TreatmentDraft = {
      mode: "REPLACE",
      seriesId: "series-1",
      diagnosisId: "diagnosis-1",
      treatmentType: "Quimioterapia",
      changeReason: "Nueva indicación médica",
    }
    const parallel: TreatmentDraft = {
      mode: "PARALLEL",
      diagnosisId: "diagnosis-1",
      treatmentType: "Radioterapia",
    }

    expect(hasAnyClinicalDraft({ treatments: [replacement, parallel] })).toBe(
      true,
    )
    expect(replacement.seriesId).toBe("series-1")
    expect(parallel.seriesId).toBeUndefined()
  })

  it("marks social notes as pending clinical changes", () => {
    expect(
      hasAnyClinicalDraft({
        socialNotes: [
          { type: "SOCIAL_WORKER", note: "Se logró contactar al área social." },
        ],
      }),
    ).toBe(true)
  })
})
