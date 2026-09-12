// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OverviewSection } from "./overview-section"

const mocks = vi.hoisted(() => ({
  listEnrollments: vi.fn(),
  getSummary: vi.fn(),
  refreshSummary: vi.fn(),
  addresses: [
    {
      id: "address-current",
      patientId: "patient-1",
      followUpId: null,
      type: "PERMANENT",
      isPrimary: true,
      address: "Av. Principal 123",
      district: "Cercado",
      province: "Arequipa",
      department: "AREQUIPA",
      reference: null,
      dniMatchesAddress: true,
      validFrom: null,
      validTo: null,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "address-temporary",
      patientId: "patient-1",
      followUpId: "follow-up-1",
      type: "TEMPORARY",
      isPrimary: false,
      address: "Jr. Temporal 456",
      district: "Miraflores",
      province: "Lima",
      department: "LIMA",
      reference: null,
      dniMatchesAddress: null,
      validFrom: null,
      validTo: null,
      isActive: true,
      createdAt: "2026-02-01T00:00:00.000Z",
    },
  ],
}))

vi.mock("@/api/enrollments", () => ({
  enrollmentsApi: { listByPatient: mocks.listEnrollments },
}))

vi.mock("@/api/patients", () => ({
  patientsApi: {
    getSummary: mocks.getSummary,
    refreshSummary: mocks.refreshSummary,
  },
}))

vi.mock("../_hooks/use-patient-accompanies", () => ({
  usePatientAccompanies: () => ({ data: [] }),
}))

vi.mock("../_hooks/use-patient-records", () => ({
  usePatientAddresses: () => ({ data: mocks.addresses }),
  usePatientSocialNotes: () => ({ data: [] }),
}))

vi.mock("./patient-profile-dialog", () => ({
  PatientProfileDialog: () => null,
}))

vi.mock("./treatment-card", () => ({
  TreatmentCard: () => null,
}))

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: "AGENT" } }),
}))

const patient = {
  id: "patient-1",
  fullName: "Ana Torres",
  dni: "12345678",
  birthDate: "2010-01-01",
  gender: "F",
  primaryPhone: "999111222",
  secondaryPhone: "999333444",
  hasWhatsapp: true,
  role: "PATIENT",
  status: "ENROLLED",
  activityStatus: "ACTIVE",
  email: "ana@example.com",
  deactivationReason: null,
  deceasedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  summary: null,
  details: {
    birthDepartment: "AREQUIPA",
    primaryHealthCenterName: null,
    zoneType: "RURAL",
    travelTimeToHospital: null,
    educationLevel: "SECONDARY",
    nativeLanguage: "Quechua",
    childrenCount: 2,
    requiresTranslation: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    emergencyContactGender: null,
    evidenceOfDomesticViolence: false,
    usesWoodStove: true,
    isWorking: true,
    receivesFinancialSupport: false,
    referredToSocialWorker: null,
    hasConadisCard: null,
    knowsAboutFissal: null,
    programDropoutDate: null,
    programDropoutReason: null,
  },
  diagnoses: [],
  treatments: [],
  insurance: [],
  sisAffiliations: [],
  medicalAppointments: [],
  symptomReports: [],
  nonOncologicalFollowUps: [
    {
      id: "non-oncological-1",
      patientId: "patient-1",
      followUpId: "follow-up-1",
      enrollmentId: null,
      diagnosticStatusEventId: "event-1",
      diagnosis: "Hipertensión arterial",
      occurredOn: "2026-02-15",
      receivesTreatment: true,
      treatmentName: "Losartán",
      medication: "50 mg",
      treatmentFrequency: {
        valueMin: 1,
        valueMax: null,
        unit: "DAY",
        label: null,
      },
      hasControls: true,
      controlSpecialty: "Medicina interna",
      controlPeriodicity: {
        valueMin: 3,
        valueMax: null,
        unit: "MONTH",
        label: null,
      },
      status: "ACTIVE",
      dischargedOn: null,
      dischargeReason: null,
      createdAt: "2026-02-15T00:00:00.000Z",
      updatedAt: "2026-02-15T00:00:00.000Z",
    },
  ],
  companions: [],
} as never

function renderOverview() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <OverviewSection patient={patient} />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

describe("OverviewSection", () => {
  beforeEach(() => {
    mocks.listEnrollments.mockResolvedValue([
      { id: "enrollment-1", entrySource: "Campaña prevención" },
    ])
    mocks.getSummary.mockResolvedValue({ status: "READY", summary: null })
    mocks.refreshSummary.mockResolvedValue({ status: "READY", summary: null })
  })

  it("shows derived patient information and current residences", async () => {
    renderOverview()

    expect(await screen.findByText("Campaña prevención")).toBeTruthy()
    expect(screen.getByText("Edad")).toBeTruthy()
    expect(screen.getByText("Sexo")).toBeTruthy()
    expect(screen.getAllByText("Femenino").length).toBeGreaterThan(0)
    const pediatricField = screen.getByText("Cáncer infantil")
    expect(pediatricField.parentElement?.textContent).toContain("Sí")
    expect(screen.getByText("Datos de procedencia y residencia")).toBeTruthy()
    expect(screen.getByText("Perfil socioeconómico y familiar")).toBeTruthy()
    expect(screen.getByText("Grado de instrucción")).toBeTruthy()
    expect(screen.getByText("Secundaria")).toBeTruthy()
    expect(screen.getByText("Lengua materna/originaria")).toBeTruthy()
    expect(screen.getByText("Quechua")).toBeTruthy()
    expect(screen.getByText("¿Tiene hijos?")).toBeTruthy()
    expect(screen.getByText("¿Cuántos hijos tiene?")).toBeTruthy()
    expect(screen.getByText("2")).toBeTruthy()
    expect(screen.queryByText("Datos de seguimiento social")).toBeNull()
    expect(screen.queryByText("Derivado a trabajo social")).toBeNull()
    expect(screen.getByText("Residencia actual y temporal")).toBeTruthy()
    expect(screen.queryByText("Direcciones de residencia")).toBeNull()
    expect(screen.getByText("Arequipa")).toBeTruthy()
    expect(screen.getByText("Residencia actual")).toBeTruthy()
    expect(screen.getByText("Av. Principal 123")).toBeTruthy()
    expect(screen.getByText("Residencia temporal")).toBeTruthy()
    expect(screen.getByText("Jr. Temporal 456")).toBeTruthy()
    expect(screen.queryByText("Teléfono principal")).toBeNull()
    expect(screen.queryByText("Teléfono secundario")).toBeNull()
  })

  it("shows non-oncological diagnoses in the diagnostic evolution", async () => {
    renderOverview()

    expect(
      (await screen.findAllByText("Diagnósticos no oncológicos (1)")).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText("Hipertensión arterial").length).toBeGreaterThan(
      0,
    )
    expect(screen.getAllByText("Losartán").length).toBeGreaterThan(0)
    expect(screen.queryByText("Seguimiento no oncológico")).toBeNull()
  })
})
