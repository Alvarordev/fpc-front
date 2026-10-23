import { describe, expect, it } from "vitest"
import type { PatientTreatment } from "@/api/patients"
import { groupTreatmentSeries, isClosedTreatment } from "./treatment-series"

function treatment(overrides: Partial<PatientTreatment>): PatientTreatment {
  return {
    id: "t",
    seriesId: "s",
    isCurrent: true,
    treatmentSituation: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as PatientTreatment
}

describe("groupTreatmentSeries", () => {
  it("collapses versions of the same series into one entry", () => {
    const series = groupTreatmentSeries([
      treatment({
        id: "v1",
        isCurrent: false,
        treatmentSituation: "EN_CURSO",
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
      treatment({
        id: "v3",
        isCurrent: true,
        treatmentSituation: "INTERRUMPIDO",
        createdAt: "2026-03-01T00:00:00.000Z",
      }),
      treatment({
        id: "v2",
        isCurrent: false,
        createdAt: "2026-02-01T00:00:00.000Z",
      }),
    ])

    expect(series).toHaveLength(1)
    expect(series[0].current.id).toBe("v3")
    expect(series[0].previousVersions.map((item) => item.id)).toEqual([
      "v2",
      "v1",
    ])
  })

  it("keeps parallel treatments separate, newest first", () => {
    const series = groupTreatmentSeries([
      treatment({ id: "a", seriesId: "a", createdAt: "2026-01-01T00:00:00Z" }),
      treatment({ id: "b", seriesId: "b", createdAt: "2026-02-01T00:00:00Z" }),
    ])

    expect(series.map((item) => item.current.id)).toEqual(["b", "a"])
    expect(series.every((item) => item.previousVersions.length === 0)).toBe(
      true,
    )
  })

  it("falls back to the newest version when none is current", () => {
    const series = groupTreatmentSeries([
      treatment({ id: "old", isCurrent: false, createdAt: "2026-01-01Z" }),
      treatment({ id: "new", isCurrent: false, createdAt: "2026-02-01Z" }),
    ])

    expect(series[0].current.id).toBe("new")
  })
})

describe("isClosedTreatment", () => {
  it("treats finished situations as closed and the rest as active", () => {
    expect(
      isClosedTreatment(treatment({ treatmentSituation: "FINALIZADO" })),
    ).toBe(true)
    expect(
      isClosedTreatment(treatment({ treatmentSituation: "ABANDONED" })),
    ).toBe(true)
    expect(
      isClosedTreatment(treatment({ treatmentSituation: "INTERRUMPIDO" })),
    ).toBe(false)
    expect(isClosedTreatment(treatment({ treatmentSituation: null }))).toBe(
      false,
    )
  })
})
