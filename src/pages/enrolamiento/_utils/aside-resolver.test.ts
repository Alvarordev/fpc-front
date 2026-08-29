import { describe, expect, it } from "vitest"
import { DEFAULT_DRAFT, type EnrollmentDraft } from "../_store/enrollment-store"
import { resolveAsideContent } from "./aside-resolver"

function draft(affiliationType: "PATIENT" | "FAMILY"): EnrollmentDraft {
  return {
    ...structuredClone(DEFAULT_DRAFT),
    enrollmentMetadata: { affiliationType },
  }
}

describe("enrollment step 7 script", () => {
  it("shows individual psycho-oncology guidance for a patient enrollment", () => {
    const content = resolveAsideContent(7, draft("PATIENT"), "CANCER_DIAGNOSIS")

    expect(content.script).toContain("PSICOONCOLOGÍA")
    expect(content.script).toContain("cuatro sesiones individuales")
    expect(content.script).toContain("30 y 45 minutos")
    expect(content.script).toContain("plazo máximo de 48 horas")
  })

  it("shows family guidance without presenting individual sessions to the caller", () => {
    const content = resolveAsideContent(7, draft("FAMILY"), "CANCER_DIAGNOSIS")

    expect(content.script).toContain("dirigido al paciente")
    expect(content.script).toContain("Grupo Fortaleza")
    expect(content.script).not.toContain("cuatro sesiones individuales")
  })

  it("does not show psycho-oncology guidance in the signs branch", () => {
    const content = resolveAsideContent(
      7,
      draft("PATIENT"),
      "SIGNS_AND_SYMPTOMS",
    )

    expect(content.script).not.toContain("PSICOONCOLOGÍA")
  })
})
