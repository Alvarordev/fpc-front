// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { CatalogItem } from "@/api/catalogs"

const listMock = vi.fn()

vi.mock("@/api/catalogs", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalogs")>("@/api/catalogs")
  return {
    ...actual,
    catalogsApi: {
      ...actual.catalogsApi,
      list: (...args: unknown[]) => listMock(...args),
    },
  }
})

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: "ADMIN" } }),
}))

import { CatalogSelect } from "./catalog-select"

afterEach(() => {
  cleanup()
  listMock.mockReset()
})

const mama: CatalogItem = {
  id: "1",
  kind: "cancer_diagnosis",
  code: "MAMA_DUCTAL",
  label: "Cáncer de mama ductal infiltrante",
  parentCode: null,
  sortOrder: 10,
  isActive: true,
  isSystem: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const otro: CatalogItem = {
  ...mama,
  id: "2",
  code: "OTRO",
  label: "Otro diagnóstico oncológico",
  sortOrder: 900,
  isSystem: true,
}

function renderSelect(
  value: string | null = "MAMA_DUCTAL",
  props: Partial<{
    kind: "cancer_diagnosis" | "entry_source" | "entry_sub_source"
    parentCode: string | null
  }> = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  listMock.mockResolvedValue([mama, otro])
  return render(
    <QueryClientProvider client={client}>
      <CatalogSelect
        kind={props.kind ?? "cancer_diagnosis"}
        value={value}
        parentCode={props.parentCode}
        onValueChange={vi.fn()}
      />
    </QueryClientProvider>,
  )
}

describe("CatalogSelect", () => {
  it("shows the catalog label for a preselected code and hides OTRO", async () => {
    renderSelect()
    expect(
      await screen.findByText("Cáncer de mama ductal infiltrante"),
    ).toBeTruthy()
    expect(screen.queryByText("Otro diagnóstico oncológico")).toBeNull()
  })

  it("disables a hierarchical select until a parent is chosen", async () => {
    renderSelect(null, { kind: "entry_sub_source", parentCode: null })
    expect(await screen.findByText("Seleccioná primero la fuente")).toBeTruthy()
  })

  it("warns in Spanish when the saved value is not in the catalog", async () => {
    renderSelect("Call center", { kind: "entry_source" })
    const alert = await screen.findByTestId("catalog-unknown-value")
    expect(alert.textContent).toContain("Call center")
    expect(alert.textContent).toContain("Punto de ingreso")
    expect(alert.textContent).toContain("no está en el catálogo")
  })
})
