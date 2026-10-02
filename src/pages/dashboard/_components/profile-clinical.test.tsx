// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProfileClinical } from "./profile-clinical"
import type { DashboardEpidemiology } from "@/api/dashboard"

afterEach(cleanup)

const emptyDistribution = {
  items: [] as { label: string; count: number }[],
  known: 0,
  unknown: 0,
  coveragePct: 0,
  population: 0,
}

function epidemiology(): DashboardEpidemiology {
  return {
    meta: {
      from: "2026-01-01",
      to: "2027-01-01",
      timezone: "America/Lima",
      definition: "Estado",
      population: "Todos",
      populationCount: 12,
      enrolledBeforePeriod: 4,
    },
    currentDiagnoses: {
      items: [{ label: "Mama", count: 7 }],
      known: 7,
      unknown: 5,
      coveragePct: 58.33,
      population: 12,
    },
    currentCancerStages: {
      items: [{ label: "STAGE_2", count: 3 }],
      known: 3,
      unknown: 9,
      coveragePct: 25,
      population: 12,
    },
    currentTreatmentTypes: emptyDistribution,
    currentTreatmentSituations: emptyDistribution,
    currentDiagnosticStatuses: {
      items: [{ label: "SEARCHING", count: 2 }],
      known: 2,
      unknown: 10,
      coveragePct: 16.67,
      population: 12,
    },
    events: { deaths: 1, diagnosticConfirmed: 4, diagnosticRuledOut: 2 },
  }
}

describe("ProfileClinical", () => {
  it("switches clinical tabs and keeps period events visible", () => {
    render(<ProfileClinical data={epidemiology()} territoryLabel="Lima" />)

    expect(screen.getByText("Lima · 12 pacientes")).toBeTruthy()
    expect(screen.getByText("Mama")).toBeTruthy()
    expect(screen.getByText(/Fallecimientos 1/)).toBeTruthy()

    fireEvent.click(screen.getByRole("tab", { name: "Búsqueda diagnóstica" }))
    expect(screen.getByText("En búsqueda")).toBeTruthy()
  })
})
