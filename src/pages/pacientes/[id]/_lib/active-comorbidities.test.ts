import { describe, expect, it } from "vitest"
import type { PatientHealthBackgroundAssessment } from "@/api/patients"
import { collectActiveComorbidities } from "./active-comorbidities"

function assessment(
  createdAt: string,
  activeComorbidities: PatientHealthBackgroundAssessment["activeComorbidities"],
): PatientHealthBackgroundAssessment {
  return {
    id: createdAt,
    patientId: "patient-1",
    followUpId: `follow-up-${createdAt}`,
    hasPsychiatry: null,
    activeComorbidities,
    limitations: [],
    familyCancerHistory: [],
    createdAt,
  }
}

describe("collectActiveComorbidities", () => {
  it("merges every follow-up and keeps the latest details per condition", () => {
    const result = collectActiveComorbidities([
      assessment("2026-01-01T00:00:00.000Z", [
        {
          id: "old",
          conditionName: "Hipotiroidismo",
          treatmentDescription: "Levotiroxina 50",
          followUpSpecialty: null,
        },
        {
          id: "diabetes",
          conditionName: "Diabetes",
          treatmentDescription: null,
          followUpSpecialty: null,
        },
      ]),
      assessment("2026-03-01T00:00:00.000Z", [
        {
          id: "new",
          conditionName: "hipotiroidismo ",
          treatmentDescription: "Levotiroxina 100",
          followUpSpecialty: "ENDOCRINOLOGIA",
        },
      ]),
    ])

    expect(result.map((item) => item.id)).toEqual(["new", "diabetes"])
  })

  it("returns nothing without assessments", () => {
    expect(collectActiveComorbidities([])).toEqual([])
  })
})
