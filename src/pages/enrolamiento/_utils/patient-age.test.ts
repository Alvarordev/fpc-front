import { describe, expect, it } from "vitest"
import { getAge, isMinor } from "./patient-age"

const today = new Date(2026, 7, 18)

describe("patient age", () => {
  it("calculates the age using the birthday boundary", () => {
    expect(getAge("2008-08-18", today)).toBe(18)
    expect(getAge("2008-08-19", today)).toBe(17)
  })

  it("identifies pediatric patients only below 18", () => {
    const recentBirth = new Date()
    recentBirth.setFullYear(recentBirth.getFullYear() - 10)

    expect(isMinor(recentBirth.toISOString())).toBe(true)
    expect(getAge("2008-08-18", today)).toBe(18)
  })

  it("returns no age for missing, invalid, or future dates", () => {
    expect(getAge(null, today)).toBeNull()
    expect(getAge("not-a-date", today)).toBeNull()
    expect(getAge("2027-01-01", today)).toBeNull()
  })
})
