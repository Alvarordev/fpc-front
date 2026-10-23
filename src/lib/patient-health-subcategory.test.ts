import { describe, expect, it } from "vitest"
import {
  patientHealthSubcategoryColors,
  patientHealthSubcategoryOptions,
  patientHealthSubcategoryPhase,
  requiresActiveDiagnosis,
} from "./patient-health-subcategory"

describe("patient health subcategories", () => {
  it("defines every protocol subcategory with its phase and color", () => {
    expect(patientHealthSubcategoryOptions).toHaveLength(6)

    for (const option of patientHealthSubcategoryOptions) {
      expect(patientHealthSubcategoryPhase[option.value]).toBe(option.phase)
      expect(option.frequency).not.toBe("")
      expect(option.standard.length).toBeGreaterThan(0)
      expect(patientHealthSubcategoryColors[option.value].dot).toMatch(/^bg-/)
    }
  })

  it("requires an active diagnosis only for oncological subcategories", () => {
    expect(requiresActiveDiagnosis("SIGNS_AND_SYMPTOMS_PATIENT")).toBe(false)
    expect(requiresActiveDiagnosis("CANCER_RULED_OUT")).toBe(false)
    expect(requiresActiveDiagnosis("ACTIVE_TREATMENT")).toBe(true)
    expect(requiresActiveDiagnosis("UNDER_CONTROLS")).toBe(true)
    expect(requiresActiveDiagnosis("TREATMENT_ABANDONED")).toBe(true)
    expect(requiresActiveDiagnosis("PALLIATIVE_NO_ACTIVE_TREATMENT")).toBe(
      true,
    )
  })
})
