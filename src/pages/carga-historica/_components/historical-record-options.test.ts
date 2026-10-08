import { describe, expect, it } from "vitest"
import { toDateInputValue, toIsoDateOnly } from "./historical-record-options"

describe("toIsoDateOnly", () => {
  it("omits empty values that fail ISO date validation", () => {
    expect(toIsoDateOnly("")).toBeUndefined()
    expect(toIsoDateOnly("   ")).toBeUndefined()
    expect(toIsoDateOnly(null)).toBeUndefined()
    expect(toIsoDateOnly(undefined)).toBeUndefined()
  })

  it("keeps calendar dates and collapses datetimes", () => {
    expect(toIsoDateOnly("2026-09-10")).toBe("2026-09-10")
    expect(toIsoDateOnly("2026-09-10T00:00:00.000Z")).toBe("2026-09-10")
  })

  it("drops values that are not calendar dates", () => {
    expect(toIsoDateOnly("10/09/2026")).toBeUndefined()
    expect(toIsoDateOnly("not-a-date")).toBeUndefined()
  })
})

describe("toDateInputValue", () => {
  it("feeds date inputs with the first ten characters", () => {
    expect(toDateInputValue("2026-09-10T00:00:00.000Z")).toBe("2026-09-10")
    expect(toDateInputValue(null)).toBe("")
  })
})
