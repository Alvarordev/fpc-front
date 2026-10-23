import { describe, expect, it } from "vitest"
import { isAvailabilitySlotInFuture } from "./calendar-helpers"

describe("isAvailabilitySlotInFuture", () => {
  const now = new Date("2026-08-13T15:00:00.000Z")

  it("rejects a slot on a previous date", () => {
    expect(
      isAvailabilitySlotInFuture(
        { date: "2026-08-12", startTime: "23:00:00" },
        now,
      ),
    ).toBe(false)
  })

  it("rejects a slot earlier today", () => {
    expect(
      isAvailabilitySlotInFuture(
        { date: "2026-08-13", startTime: "14:59:00" },
        now,
      ),
    ).toBe(false)
  })

  it("accepts a future slot today", () => {
    expect(
      isAvailabilitySlotInFuture(
        { date: "2026-08-13", startTime: "15:01:00" },
        now,
      ),
    ).toBe(true)
  })

  it("rejects malformed date and time values", () => {
    expect(
      isAvailabilitySlotInFuture(
        { date: "invalid", startTime: "not-a-time" },
        now,
      ),
    ).toBe(false)
  })
})
