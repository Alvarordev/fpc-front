import { describe, expect, it } from "vitest"
import { hasCustomRange } from "./dashboard-filters"
import { yearOptions } from "./dashboard-period"

const today = new Date(2026, 9, 29)

describe("yearOptions", () => {
  it("mantiene los años posteriores al elegido", () => {
    expect(yearOptions(2023, today).slice(0, 4)).toEqual([2026, 2025, 2024, 2023])
  })

  it("llega hasta los años de la carga histórica", () => {
    expect(yearOptions(2026, today)).toContain(2019)
    expect(yearOptions(2026, today).at(-1)).toBe(2015)
  })

  it("agrega un año fuera de la ventana para que tenga etiqueta", () => {
    expect(yearOptions(2010, today)).toContain(2010)
    expect(yearOptions(2010, today)[0]).toBe(2026)
  })
})

describe("hasCustomRange", () => {
  it("solo aplica rangos completos y en orden", () => {
    expect(hasCustomRange({ from: "2026-01-01", to: "" })).toBe(false)
    expect(hasCustomRange({ from: "2026-05-01", to: "2026-01-01" })).toBe(false)
    expect(hasCustomRange({ from: "2026-01-01", to: "2026-01-01" })).toBe(true)
  })
})
