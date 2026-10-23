import { describe, expect, it } from "vitest"
import {
  fixedWaitTime,
  fixedWaitTimeRecallFrom,
  resolveWaitTimeRecall,
} from "./wait-time-recall"

describe("wait time recall", () => {
  it("round-trips every fixed answer through the stored duration", () => {
    for (const recall of [
      "IMMEDIATE",
      "UNSPECIFIED_DAY",
      "UNSPECIFIED_WEEK",
      "UNSPECIFIED_MONTH",
      "UNSPECIFIED_YEAR",
    ] as const) {
      expect(fixedWaitTimeRecallFrom(fixedWaitTime(recall))).toBe(recall)
    }
  })

  it("stores 'No recuerda' as no wait time", () => {
    expect(fixedWaitTime("DOES_NOT_REMEMBER")).toBeNull()
    expect(resolveWaitTimeRecall(false, undefined)).toBe("DOES_NOT_REMEMBER")
  })

  it("treats a typed amount as remembered", () => {
    expect(
      fixedWaitTimeRecallFrom({
        valueMin: 3,
        unit: "WEEK",
        label: "3 semanas",
      }),
    ).toBeUndefined()
    expect(resolveWaitTimeRecall(true, "IMMEDIATE")).toBe("REMEMBERS")
  })
})
