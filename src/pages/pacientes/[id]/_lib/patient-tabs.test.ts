import { describe, expect, it } from "vitest"
import {
  getPatientTab,
  isPatientTab,
  patientTabUrl,
  withPatientTab,
} from "./patient-tabs"

describe("patient tabs", () => {
  it("uses resumen for missing or invalid values", () => {
    expect(getPatientTab(null)).toBe("resumen")
    expect(getPatientTab("unknown")).toBe("resumen")
    expect(isPatientTab("recordatorios")).toBe(true)
    expect(isPatientTab("unknown")).toBe(false)
  })

  it("builds a direct URL for a patient tab", () => {
    expect(patientTabUrl("patient-1", "recordatorios")).toBe(
      "/pacientes/patient-1?tab=recordatorios",
    )
    expect(patientTabUrl("patient-1")).toBe("/pacientes/patient-1")
  })

  it("preserves other query parameters when changing tabs", () => {
    const next = withPatientTab(
      new URLSearchParams("from=agenda&tab=resumen"),
      "recordatorios",
    )

    expect(next.toString()).toBe("from=agenda&tab=recordatorios")
  })
})
