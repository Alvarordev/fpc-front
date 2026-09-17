// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { CatalogItem } from "@/api/catalogs"

const listMock = vi.fn()

vi.mock("@/api/catalogs", async () => {
  const actual = await vi.importActual<typeof import("@/api/catalogs")>(
    "@/api/catalogs",
  )
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

function renderSelect(value: string | null = "MAMA_DUCTAL") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  listMock.mockResolvedValue([mama, otro])
  return render(
    <QueryClientProvider client={client}>
      <CatalogSelect
        kind="cancer_diagnosis"
        value={value}
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
})
