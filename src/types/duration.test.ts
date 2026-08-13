import { describe, expect, it } from "vitest"
import {
  calculateDurationBetweenDates,
  convertDurationValue,
  isInvalidDuration,
  normalizeDuration,
  toDurationInput,
} from "./duration"

describe("duration helpers", () => {
  it("normalizes an exact duration without a label", () => {
    expect(toDurationInput({ valueMin: 3, unit: "MONTH" })).toEqual({
      valueMin: 3,
      unit: "MONTH",
    })
  })

  it("keeps a valid range", () => {
    expect(toDurationInput({ valueMin: 2, valueMax: 4, unit: "YEAR" })).toEqual(
      {
        valueMin: 2,
        valueMax: 4,
        unit: "YEAR",
      },
    )
  })

  it("rejects incomplete and inverted ranges", () => {
    expect(toDurationInput({ valueMin: 2 })).toBeUndefined()
    expect(
      toDurationInput({ valueMin: 4, valueMax: 2, unit: "DAY" }),
    ).toBeUndefined()
    expect(isInvalidDuration({ valueMin: 4, valueMax: 2, unit: "DAY" })).toBe(
      true,
    )
  })

  it("migrates the old free-text format", () => {
    expect(normalizeDuration("Cada 3 semanas")).toEqual({
      valueMin: 3,
      unit: "WEEK",
    })
    expect(normalizeDuration("2 a 4 meses")).toEqual({
      valueMin: 2,
      valueMax: 4,
      unit: "MONTH",
    })
  })

  it("keeps a partial draft while the user fills it", () => {
    expect(normalizeDuration({ unit: "MONTH" })).toEqual({ unit: "MONTH" })
    expect(normalizeDuration({ valueMin: 2 })).toEqual({ valueMin: 2 })
  })

  it("converts a duration when its unit changes", () => {
    expect(convertDurationValue(45, "DAY", "MONTH")).toBe(1.5)
    expect(convertDurationValue(1.5, "MONTH", "DAY")).toBe(45)
  })

  it("uses days for short date intervals and larger units for long ones", () => {
    expect(calculateDurationBetweenDates("2026-01-01", "2026-01-31")).toEqual({
      valueMin: 30,
      unit: "DAY",
    })
    expect(calculateDurationBetweenDates("2026-01-01", "2026-03-02")).toEqual({
      valueMin: 2,
      unit: "MONTH",
    })
    expect(calculateDurationBetweenDates("2026-01-01", "2028-01-01")).toEqual({
      valueMin: 2,
      unit: "YEAR",
    })
  })
})
