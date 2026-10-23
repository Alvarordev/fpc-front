import { describe, expect, it } from "vitest"
import {
  documentNumberError,
  sanitizeDocumentNumber,
} from "./identity-document"

describe("identity document", () => {
  it("keeps only the digits each document type allows", () => {
    expect(sanitizeDocumentNumber("DNI", "41 06-1472x99")).toBe("41061472")
    expect(sanitizeDocumentNumber("CE", "0012345678")).toBe("001234567")
  })

  it("requires the exact number of digits once a number is typed", () => {
    expect(documentNumberError("DNI", "")).toBeNull()
    expect(documentNumberError("DNI", "41061472")).toBeNull()
    expect(documentNumberError("DNI", "4106147")).toBe(
      "El DNI debe tener 8 dígitos",
    )
    expect(documentNumberError("CPP", "12345678")).toBe(
      "El CPP debe tener 9 dígitos",
    )
  })
})
