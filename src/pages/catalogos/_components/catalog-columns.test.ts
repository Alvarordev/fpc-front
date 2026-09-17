import { describe, expect, it } from "vitest"
import { catalogColumns } from "./catalog-columns"
import type { CatalogItem } from "@/api/catalogs"

const systemItem: CatalogItem = {
  id: "sys",
  kind: "cancer_diagnosis",
  code: "OTRO",
  label: "Otro diagnóstico oncológico",
  parentCode: null,
  sortOrder: 900,
  isActive: true,
  isSystem: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const customItem: CatalogItem = {
  ...systemItem,
  id: "custom",
  code: "GENETICA",
  label: "Genética",
  isSystem: false,
}

describe("catalogColumns", () => {
  it("defines archive and edit actions", () => {
    const columns = catalogColumns({
      onEdit: () => undefined,
      onArchive: () => undefined,
      onReactivate: () => undefined,
    })
    expect(columns.some((column) => column.id === "actions")).toBe(true)
    expect(columns.some((column) => "accessorKey" in column && column.accessorKey === "code")).toBe(
      true,
    )
    expect(systemItem.isSystem).toBe(true)
    expect(customItem.isSystem).toBe(false)
  })
})
