// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { CompanionPatient } from "@/api/patients"
import { PatientCompanionsSection } from "./patient-companions-section"

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  update: vi.fn(),
  updateCompanionLink: vi.fn(),
}))

vi.mock("@/api/patients", () => ({
  patientsApi: {
    getById: mocks.getById,
    update: mocks.update,
    updateCompanionLink: mocks.updateCompanionLink,
  },
}))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const companion = {
  id: "link-1",
  companionId: "companion-1",
  patientId: "patient-1",
  isPrimaryInformant: true,
  isPrimaryContact: true,
  contactRole: "PRIMARY",
  isCaregiver: true,
  relationship: "MOTHER",
  companionDisplayName: "María López",
  createdAt: "2026-01-01T00:00:00.000Z",
  companion: {
    id: "companion-1",
    fullName: "María López",
    email: "maria@example.com",
    dni: "87654321",
    birthDate: "1980-05-10",
    gender: "F",
    primaryPhone: "999888777",
    secondaryPhone: "999666555",
    hasWhatsapp: true,
    role: "COMPANION",
    status: "UNENROLLED",
    activityStatus: "ACTIVE",
    deactivationReason: null,
    deactivationReasonDetail: null,
    deactivatedAt: null,
    deceasedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
} as CompanionPatient

function renderSection(
  canEdit = true,
  companions: CompanionPatient[] = [companion],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <PatientCompanionsSection
        patientId="patient-1"
        companions={companions}
        canEdit={canEdit}
      />
    </QueryClientProvider>,
  )
}

describe("PatientCompanionsSection", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.update.mockResolvedValue(companion.companion)
    mocks.updateCompanionLink.mockResolvedValue(companion)
  })

  it("opens a complete companion detail view", async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(
      screen.getByRole("button", { name: "Ver datos de María López" }),
    )

    expect(
      await screen.findByRole("heading", { name: "María López" }),
    ).toBeTruthy()
    expect(screen.getByText("87654321")).toBeTruthy()
    expect(screen.getByText("maria@example.com")).toBeTruthy()
    expect(screen.getAllByText("Mamá").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Informante principal").length).toBeGreaterThan(
      0,
    )
    expect(
      screen.getByRole("button", { name: "Editar acompañante" }),
    ).toBeTruthy()
  })

  it("updates personal data and the companion relationship from the modal", async () => {
    const user = userEvent.setup()
    renderSection()

    await user.click(
      screen.getByRole("button", { name: "Ver datos de María López" }),
    )
    await user.click(
      await screen.findByRole("button", { name: "Editar acompañante" }),
    )

    const fullName = screen.getByLabelText("Nombre completo")
    await user.clear(fullName)
    await user.type(fullName, "María López García")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith("companion-1", {
        fullName: "María López García",
        primaryPhone: "999888777",
        secondaryPhone: "999666555",
        dni: "87654321",
        birthDate: "1980-05-10",
        gender: "F",
        hasWhatsapp: true,
        email: "maria@example.com",
      })
      expect(mocks.updateCompanionLink).toHaveBeenCalledWith(
        "patient-1",
        "link-1",
        {
          relationship: "MOTHER",
          contactRole: "PRIMARY",
          isPrimaryContact: true,
          isPrimaryInformant: true,
          isCaregiver: true,
        },
      )
    })
  })

  it("does not show edit controls to users without permission", async () => {
    const user = userEvent.setup()
    renderSection(false)

    await user.click(
      screen.getByRole("button", { name: "Ver datos de María López" }),
    )

    expect(
      await screen.findByRole("heading", { name: "María López" }),
    ).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: "Editar acompañante" }),
    ).toBeNull()
  })

  it("uses the relation display name when the companion data is not embedded", () => {
    const linkWithoutPerson = {
      ...companion,
      companion: undefined,
      companionDisplayName: "Carlos Pérez",
    }

    renderSection(true, [linkWithoutPerson])

    expect(
      screen.getByRole("button", { name: "Ver datos de Carlos Pérez" }),
    ).toBeTruthy()
    expect(screen.getByText("Sin teléfono registrado")).toBeTruthy()
  })
})
