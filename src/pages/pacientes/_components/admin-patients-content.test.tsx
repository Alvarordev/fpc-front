// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { AdminPatientsContent } from "./admin-patients-content"

const mocks = vi.hoisted(() => ({
  usePatients: vi.fn(),
  navigate: vi.fn(),
}))

vi.mock("../_hooks/use-patients", () => ({
  usePatients: mocks.usePatients,
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
}))

vi.mock("./patients-table", () => ({
  PatientsTable: () => <div data-testid="patients-table" />,
}))

describe("AdminPatientsContent", () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.usePatients.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
    })
  })

  it("requests only patients and does not expose the companion filter", () => {
    render(<AdminPatientsContent />)

    expect(mocks.usePatients).toHaveBeenCalledWith({
      filters: {
        segment: "CARE",
        search: undefined,
        activityStatus: undefined,
        healthPhase: undefined,
        healthSubcategory: undefined,
        role: "PATIENT",
      },
    })
    expect(screen.queryByText("Acompañante")).toBeNull()
  })

  it("uses selects for activity, phase, and subcategory filters", async () => {
    const user = userEvent.setup()
    render(<AdminPatientsContent />)

    expect(
      screen.getByRole("combobox", { name: "Filtrar por estado" }),
    ).toBeTruthy()
    expect(
      screen.getByRole("combobox", { name: "Filtrar por fase de salud" }),
    ).toBeTruthy()
    expect(
      screen.getByRole("combobox", { name: "Filtrar por subcategoría" }),
    ).toBeTruthy()

    await user.click(
      screen.getByRole("combobox", { name: "Filtrar por subcategoría" }),
    )
    await user.click(
      await screen.findByRole("option", {
        name: "Pacientes en Tratamiento Activo",
      }),
    )

    await waitFor(() => {
      expect(mocks.usePatients).toHaveBeenLastCalledWith({
        filters: {
          segment: "CARE",
          search: undefined,
          activityStatus: undefined,
          healthPhase: undefined,
          healthSubcategory: "ACTIVE_TREATMENT",
          role: "PATIENT",
        },
      })
    })
  })
})
