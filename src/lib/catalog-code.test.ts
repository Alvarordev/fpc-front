import { describe, expect, it } from "vitest"
import {
  isReservedCatalogCode,
  slugifyCatalogCode,
} from "./catalog-code"

describe("slugifyCatalogCode", () => {
  it("normalizes Spanish labels into uppercase codes", () => {
    expect(slugifyCatalogCode("Cáncer de mama ductal")).toBe(
      "CANCER_DE_MAMA_DUCTAL",
    )
    expect(slugifyCatalogCode("Genética oncológica")).toBe(
      "GENETICA_ONCOLOGICA",
    )
  })

  it("strips punctuation and extra spaces", () => {
    expect(slugifyCatalogCode("  mama / ductal  ")).toBe("MAMA_DUCTAL")
  })
})

describe("isReservedCatalogCode", () => {
  it("rejects OTRO regardless of casing", () => {
    expect(isReservedCatalogCode("OTRO")).toBe(true)
    expect(isReservedCatalogCode("otro")).toBe(true)
    expect(isReservedCatalogCode("MAMA_DUCTAL")).toBe(false)
  })
})
