import { describe, expect, it } from "vitest"
import { catalogSelectItems, formatCatalogValue } from "./use-catalog"
import type { CatalogItem } from "@/api/catalogs"

function item(
  partial: Partial<CatalogItem> & Pick<CatalogItem, "code" | "label">,
): CatalogItem {
  return {
    id: partial.id ?? partial.code,
    kind: "cancer_diagnosis",
    parentCode: null,
    sortOrder: partial.sortOrder ?? 10,
    isActive: partial.isActive ?? true,
    isSystem: partial.isSystem ?? false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  }
}

describe("catalogSelectItems", () => {
  it("hides OTRO and inactive items, then sorts by sortOrder", () => {
    const items = catalogSelectItems([
      item({ code: "OTRO", label: "Otro", sortOrder: 900, isSystem: true }),
      item({ code: "GASTRICO", label: "Cáncer gástrico", sortOrder: 30 }),
      item({
        code: "MAMA_DUCTAL",
        label: "Cáncer de mama ductal infiltrante",
        sortOrder: 10,
      }),
      item({
        code: "ARCHIVADO",
        label: "Archivado",
        sortOrder: 1,
        isActive: false,
      }),
    ])

    expect(items.map((entry) => entry.value)).toEqual([
      "MAMA_DUCTAL",
      "GASTRICO",
    ])
  })
})

describe("formatCatalogValue", () => {
  const items = [
    item({ code: "MAMA_DUCTAL", label: "Cáncer de mama ductal infiltrante" }),
    item({ code: "OTRO", label: "Otro diagnóstico oncológico" }),
  ]

  it("resolves a catalog label", () => {
    expect(formatCatalogValue(items, "MAMA_DUCTAL")).toBe(
      "Cáncer de mama ductal infiltrante",
    )
  })

  it("shows extra text for historical OTRO rows", () => {
    expect(formatCatalogValue(items, "OTRO", "Sarcoma raro")).toBe(
      "Otro: Sarcoma raro",
    )
  })

  it("falls back to the code when unknown", () => {
    expect(formatCatalogValue(items, "DESCONOCIDO")).toBe("DESCONOCIDO")
  })
})
