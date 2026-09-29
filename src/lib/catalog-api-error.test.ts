import { describe, expect, it } from "vitest"
import {
  humanizeCatalogApiMessage,
  unknownCatalogValueMessage,
} from "./catalog-api-error"

describe("unknownCatalogValueMessage", () => {
  it("names the form field and tells the user to verify or add the option", () => {
    const message = unknownCatalogValueMessage("entry_source", "Call center")
    expect(message).toBe(
      "«Call center» no está en el catálogo de Punto de ingreso. Verificá esa selección. Si falta, agregala con + en esa misma selección o desde Catálogos.",
    )
  })

  it("points closed kinds to Catálogos instead of +", () => {
    const message = unknownCatalogValueMessage("access_barrier", "OTHER")
    expect(message).toContain("Barrera de acceso")
    expect(message).toContain("un administrador debe agregarla en Catálogos")
    expect(message).not.toContain("agregala con +")
  })
})

describe("humanizeCatalogApiMessage", () => {
  it("rewrites the backend English unknown-catalog error", () => {
    expect(
      humanizeCatalogApiMessage(
        "Unknown entry_source catalog value: Call center",
      ),
    ).toContain("Punto de ingreso")
  })

  it("rewrites OTRO extra-text errors with the field name", () => {
    expect(
      humanizeCatalogApiMessage(
        "cancer_diagnosis requires additional text when the value is OTRO",
      ),
    ).toBe(
      "El catálogo de Diagnóstico oncológico pide un detalle adicional cuando la opción es OTRO.",
    )
  })

  it("leaves unrelated messages untouched", () => {
    expect(
      humanizeCatalogApiMessage("Ya existe un paciente con este DNI."),
    ).toBe("Ya existe un paciente con este DNI.")
  })
})
