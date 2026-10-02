// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { DashboardControls } from "./dashboard-controls"

afterEach(cleanup)

describe("DashboardControls", () => {
  it("switches period and population", () => {
    const onPeriodChange = vi.fn()
    const onPopulationChange = vi.fn()
    render(
      <DashboardControls
        period="year"
        year={2026}
        month={3}
        population="all_active"
        onPeriodChange={onPeriodChange}
        onYearChange={vi.fn()}
        onMonthChange={vi.fn()}
        onPopulationChange={onPopulationChange}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: "Mes" }))
    expect(onPeriodChange).toHaveBeenCalledWith("month")
    expect(screen.getByText(/sin importar cuándo se enrolaron/)).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Enrolados en el periodo" }))
    expect(onPopulationChange).toHaveBeenCalledWith("enrolled_in_period")
  })
})
