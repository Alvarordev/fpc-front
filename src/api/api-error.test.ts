import { describe, expect, it } from "vitest"
import { apiErrorFromBody } from "./api-error"

describe("apiErrorFromBody", () => {
  it("reads a string body", () => {
    const error = apiErrorFromBody("No autorizado", 401, "fallback")
    expect(error.message).toBe("No autorizado")
    expect(error.status).toBe(401)
  })

  it("reads a coded envelope", () => {
    const error = apiErrorFromBody(
      {
        statusCode: 409,
        code: "PATIENT_DNI_EXISTS",
        message: "Ya existe un paciente con este DNI.",
      },
      409,
      "fallback",
    )
    expect(error.message).toBe("Ya existe un paciente con este DNI.")
    expect(error.code).toBe("PATIENT_DNI_EXISTS")
  })

  it("joins validation messages", () => {
    const error = apiErrorFromBody(
      { message: ["dni must be a string", "agentId is required"] },
      400,
      "fallback",
    )
    expect(error.message).toBe("dni must be a string. agentId is required")
  })

  it("unwraps the previous nested message object", () => {
    const error = apiErrorFromBody(
      {
        message: {
          code: "PATIENT_ALREADY_ENROLLED",
          message: "El paciente ya está enrolado.",
        },
      },
      409,
      "fallback",
    )
    expect(error.message).toBe("El paciente ya está enrolado.")
    expect(error.code).toBe("PATIENT_ALREADY_ENROLLED")
  })

  it("falls back when the body is empty", () => {
    const error = apiErrorFromBody(undefined, 500, "No se pudo completar el enrolamiento")
    expect(error.message).toBe("No se pudo completar el enrolamiento")
    expect(error.code).toBeUndefined()
  })
})
