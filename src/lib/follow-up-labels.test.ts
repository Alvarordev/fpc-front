import { describe, expect, it } from "vitest"
import {
  followUpPurposeLabels,
  followUpStatusLabels,
  followUpTypeLabels,
  formatFollowUpTitle,
} from "./follow-up-labels"

describe("follow-up labels", () => {
  it("translates follow-up values into user-facing labels", () => {
    expect(followUpTypeLabels.EMAIL).toBe("Correo electrónico")
    expect(followUpPurposeLabels.FOLLOW_UP).toBe("Seguimiento")
    expect(followUpStatusLabels.NO_ANSWER).toBe("No contestó")
  })

  it("builds a descriptive title for each planned contact", () => {
    expect(formatFollowUpTitle("CALL", "FOLLOW_UP")).toBe(
      "Llamada de seguimiento",
    )
    expect(formatFollowUpTitle("VIDEO_CALL", "PSYCHOONCOLOGY_REFERRAL")).toBe(
      "Videollamada · Derivación a psicooncología",
    )
  })
})
