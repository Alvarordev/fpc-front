import { describe, expect, it } from "vitest"
import { hasAnyClinicalDraft } from "./clinical-drafts"

describe("clinical follow-up drafts", () => {
  it("marks a symptom report as a pending clinical change", () => {
    expect(hasAnyClinicalDraft({
      symptomReport: {
        hasDiscomfort: true,
        symptomDuration: { valueMin: 30, unit: "DAY" },
        symptomFrequency: { valueMin: 1, unit: "WEEK" },
      },
    })).toBe(true)
  })
})
