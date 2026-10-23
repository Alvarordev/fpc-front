// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { ProfileProgram } from "./profile-program"
import type {
  DashboardAbandonment,
  DashboardAdherence,
  DashboardManagement,
  DashboardProductivity,
} from "@/api/dashboard"

afterEach(cleanup)

const meta = {
  from: "2026-01-01",
  to: "2027-01-01",
  timezone: "America/Lima" as const,
  definition: "Programa",
  population: "Todos",
  populationCount: 10,
  enrolledBeforePeriod: 2,
}

const emptyDistribution = {
  items: [] as { label: string; count: number }[],
  known: 0,
  unknown: 0,
  coveragePct: 0,
  population: 0,
}

const productivity: DashboardProductivity = {
  meta,
  avgDaysEnrollmentToSis: 3,
  avgDaysPrimaryCareToDiagnosis: null,
  avgDaysDiagnosisToTreatment: 0,
  avgDaysSymptomsToDiagnosis: 12,
  activePatients: 8,
  benefitSupport: 4,
  benefitPsychooncology: 0,
  benefitEducationalTalks: 1,
  allThreeBenefits: 0,
}

const adherence: DashboardAdherence = {
  meta,
  chemoRadioCompliancePct: 0,
  hormonalCompleted: 0,
  hormonalPatients: 2,
  withAccessBarriers: 0,
  orientedRegardingBarriers: 0,
  abandonedWithBarriers: 0,
  interruptedAdverseReaction: 0,
  palliativeNoActiveTreatment: 0,
}

const abandonment: DashboardAbandonment = {
  meta,
  dropoutReasons: emptyDistribution,
  voluntary: 0,
  unlocatable: 1,
  deceased: 0,
  other: 0,
}

const management: DashboardManagement = {
  meta,
  sisAffiliatedViaSepa: 0,
  essaludAffiliatedViaSepa: 0,
  primaryCareViaSepa: 2,
  referredViaSepa: 0,
  specialtyForDiagnosis: emptyDistribution,
  diagnosticRuledOutViaSepa: 0,
  diagnosticConfirmedViaSepa: 0,
  treatmentViaSepa: 0,
  transportationViaSepa: 0,
  transportationSepaProviders: emptyDistribution,
  shelterViaSepa: 0,
  shelterSepaProviders: emptyDistribution,
}

describe("ProfileProgram", () => {
  it("hides zero-value indicators when the toggle is on", () => {
    render(
      <ProfileProgram
        productivity={productivity}
        adherence={adherence}
        abandonment={abandonment}
        management={management}
      />,
    )

    expect(screen.getByText("Consultas de psicooncología")).toBeTruthy()
    fireEvent.click(screen.getByRole("button", { name: "Ocultar indicadores en cero" }))
    expect(screen.queryByText("Consultas de psicooncología")).toBeNull()
    expect(screen.getByText("Soporte y acompañamiento")).toBeTruthy()
    expect(screen.getByText("No localizable")).toBeTruthy()
  })
})
