import { describe, expect, it } from "vitest"
import { humanizeValidationApiMessage } from "./validation-api-error"

describe("humanizeValidationApiMessage", () => {
  it("translates an empty interruption reason and drops the enum duplicate", () => {
    expect(
      humanizeValidationApiMessage(
        "treatments.0.interruptionReason should not be empty. treatments.0.interruptionReason must be one of the following values: ADVERSE_REACTION, THERAPEUTIC_OPTION_EVAL, OTHER",
      ),
    ).toBe("Completá el motivo de interrupción del tratamiento 1.")
  })

  it("translates an invalid interruption reason with Spanish option labels", () => {
    expect(
      humanizeValidationApiMessage(
        "treatments.0.interruptionReason must be one of the following values: ADVERSE_REACTION, THERAPEUTIC_OPTION_EVAL, OTHER",
      ),
    ).toBe(
      "El motivo de interrupción del tratamiento 1 debe ser una de estas opciones: Por reacción / efectos adversos / toxicidad del tratamiento, Evaluación de opción terapéutica, Otros.",
    )
  })

  it("translates a required nested field", () => {
    expect(
      humanizeValidationApiMessage(
        "treatments.1.treatmentAbandonmentReason should not be empty",
      ),
    ).toBe("Completá el motivo de abandono del tratamiento 2.")
  })

  it("leaves unrelated Spanish messages untouched", () => {
    expect(
      humanizeValidationApiMessage("Ya existe un paciente con este DNI."),
    ).toBe("Ya existe un paciente con este DNI.")
  })
})
