import { describe, expect, it } from "vitest"
import { hasCustomRange } from "./dashboard-filters"
import { yearOptions } from "./dashboard-period"

const today = new Date(2026, 9, 29)

describe("yearOptions", () => {
  it("mantiene los años posteriores al elegido", () => {
    expect(yearOptions(2023, today)).toEqual([2026, 2025, 2024, 2023, 2022, 2021, 2020])
  })

  it("agrega un año fuera de la ventana para que tenga etiqueta", () => {
    expect(yearOptions(2015, today)).toContain(2015)
    expect(yearOptions(2015, today)[0]).toBe(2026)
  })
})

describe("hasCustomRange", () => {
  it("solo aplica rangos completos y en orden", () => {
    expect(hasCustomRange({ from: "2026-01-01", to: "" })).toBe(false)
    expect(hasCustomRange({ from: "2026-05-01", to: "2026-01-01" })).toBe(false)
    expect(hasCustomRange({ from: "2026-01-01", to: "2026-01-01" })).toBe(true)
  })
})
