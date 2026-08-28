// @vitest-environment jsdom

import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
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
        role: "PATIENT",
      },
    })
    expect(screen.queryByText("Acompañante")).toBeNull()
  })
})
