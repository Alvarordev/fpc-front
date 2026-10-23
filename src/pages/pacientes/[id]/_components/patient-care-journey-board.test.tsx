// @vitest-environment jsdom

import type { ReactNode } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { HealthCenter } from "@/api/health-centers"
import type { PatientDetailsResponse } from "@/api/patients"
import { PatientCareJourneyBoard } from "./patient-care-journey-board"

const limaHospital: HealthCenter = {
  id: "hospital-lima",
  name: "INEN",
  slug: "inen",
  department: "LIMA",
  category: "III-1",
  isActive: true,
  patientCount: 12,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const arequipaHospital: HealthCenter = {
  id: "hospital-arequipa",
  name: "Honorio Delgado",
  slug: "honorio-delgado",
  department: "AREQUIPA",
  category: "II-1",
  isActive: true,
  patientCount: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const mocks = vi.hoisted(() => ({
  listHealthCenters: vi.fn(),
}))

vi.mock("@/api/health-centers", () => ({
  healthCentersApi: {
    list: mocks.listHealthCenters,
  },
}))

vi.mock("@/api/catalogs", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalogs")>("@/api/catalogs")
  return {
    ...actual,
    catalogsApi: {
      ...actual.catalogsApi,
      list: async (filters: { kind?: string }) => {
        const item = (code: string, label: string, kind: string) => ({
          id: code,
          kind,
          code,
          label,
          parentCode: null,
          sortOrder: 0,
          isActive: true,
          isSystem: true,
          metadata: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        })
        if (filters.kind === "health_center_category") {
          return [
            item("III-1", "III-1", "health_center_category"),
            item("II-1", "II-1", "health_center_category"),
          ]
        }
        if (filters.kind === "medical_specialty") {
          return [item("ONCOLOGY", "Oncología", "medical_specialty")]
        }
        if (filters.kind === "treatment_type") {
          return [item("CHEMOTHERAPY", "Quimioterapia", "treatment_type")]
        }
        return []
      },
    },
  }
})

vi.mock("../_lib/use-peru-departments-geojson", () => ({
  usePeruDepartmentsGeojson: () => ({
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { FIRST_IDDP: "15", NOMBDEP: "LIMA" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-77.2, -12.3],
                [-76.7, -12.3],
                [-76.7, -11.8],
                [-77.2, -11.8],
                [-77.2, -12.3],
              ],
            ],
          },
        },
        {
          type: "Feature",
          properties: { FIRST_IDDP: "04", NOMBDEP: "AREQUIPA" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [-72.5, -16.6],
                [-71.4, -16.6],
                [-71.4, -15.6],
                [-72.5, -15.6],
                [-72.5, -16.6],
              ],
            ],
          },
        },
      ],
    },
    isLoading: false,
  }),
}))

vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children }: { children: ReactNode }) => (
    <div data-testid="peru-map">{children}</div>
  ),
  Geographies: ({
    children,
  }: {
    children: (value: {
      geographies: Array<{
        rsmKey: string
        properties: { FIRST_IDDP: string; NOMBDEP: string }
      }>
    }) => ReactNode
  }) =>
    children({
      geographies: [
        {
          rsmKey: "lima",
          properties: { FIRST_IDDP: "15", NOMBDEP: "LIMA" },
        },
        {
          rsmKey: "arequipa",
          properties: { FIRST_IDDP: "04", NOMBDEP: "AREQUIPA" },
        },
      ],
    }),
  Geography: ({
    geography,
    "aria-label": ariaLabel,
    "aria-pressed": ariaPressed,
    onMouseEnter,
    onMouseLeave,
  }: {
    geography: { properties: { FIRST_IDDP: string } }
    "aria-label"?: string
    "aria-pressed"?: boolean
    onMouseEnter?: () => void
    onMouseLeave?: () => void
  }) => (
    <button
      type="button"
      data-testid={`geography-${geography.properties.FIRST_IDDP}`}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  ),
  Line: () => <div data-testid="journey-line" />,
  Marker: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

afterEach(cleanup)

function emptyPatient(): PatientDetailsResponse {
  return {
    id: "patient-1",
    fullName: "Ana Torres",
    email: null,
    dni: "12345678",
    birthDate: "2010-01-01",
    gender: "F",
    primaryPhone: "999111222",
    secondaryPhone: null,
    hasWhatsapp: true,
    role: "PATIENT",
    status: "ENROLLED",
    activityStatus: "ACTIVE",
    deactivationReason: null,
    deactivationReasonDetail: null,
    deactivatedAt: null,
    deceasedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    details: {
      id: "details-1",
      patientId: "patient-1",
      healthPhase: null,
      healthSubcategory: null,
      birthDepartment: "AREQUIPA",
      birthCountry: null,
      primaryHealthCenterId: limaHospital.id,
      primaryHealthCenterName: limaHospital.name,
      travelTimeToHospital: null,
      emergencyContactName: null,
      emergencyContactPhone: null,
      zoneType: null,
      emergencyContactGender: null,
      educationLevel: null,
      nativeLanguage: null,
      childrenCount: null,
      requiresTranslation: false,
      referredToSocialWorker: null,
      evidenceOfDomesticViolence: null,
      usesWoodStove: null,
      isWorking: null,
      receivesFinancialSupport: null,
      hasConadisCard: null,
      knowsAboutFissal: null,
      programDropoutReason: null,
      programDropoutDate: null,
      transportationViaSepa: null,
      transportationSepaProvider: null,
      transportationSepaProviderOther: null,
      shelterViaSepa: null,
      shelterSepaProvider: null,
      shelterSepaProviderOther: null,
      attendedEducationalTalk: null,
      attendedEducationalTalkAt: null,
      programDropoutReasonCode: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      healthPhaseHistory: [],
    },
    summary: null,
    diagnoses: [],
    treatments: [],
    insurance: [],
    medicalAppointments: [],
    sisAffiliations: [],
    symptomReports: [],
    healthBackgroundAssessments: [],
    psychooncologySupportAssessments: [],
    nonOncologicalFollowUps: [],
    companions: [],
  }
}

function renderBoard(patient: PatientDetailsResponse) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientCareJourneyBoard patient={patient} />
    </QueryClientProvider>,
  )
}

describe("PatientCareJourneyBoard", () => {
  afterEach(() => {
    mocks.listHealthCenters.mockReset()
  })

  it("renders hospital, care level, and visit type for each event", async () => {
    mocks.listHealthCenters.mockResolvedValue([limaHospital, arequipaHospital])
    const patient = emptyPatient()
    patient.diagnoses = [
      {
        id: "dx-1",
        patientId: patient.id,
        followUpId: "follow-up-1",
        diagnosis: "C50",
        cancerStage: "STAGE_2",
        diagnosisDate: "2026-03-12",
        firstSymptomsDate: null,
        healthCenterId: limaHospital.id,
        healthCenterName: limaHospital.name,
        referredHealthCenterId: arequipaHospital.id,
        referredHealthCenterName: arequipaHospital.name,
        hasReferral: true,
        diagnosisSpecialty: "ONCOLOGY",
        symptomLeadingToCheckup: null,
        waitTimeSource: null,
        waitTimeForDiagnosis: null,
        hasMedicalReport: true,
        isSepaActiveReferral: null,
        isCurrent: true,
        changeReason: null,
        createdAt: "2026-03-13T00:00:00.000Z",
      },
    ]
    patient.medicalAppointments = [
      {
        id: "appt-1",
        patientId: patient.id,
        followUpId: "follow-up-1",
        healthCenterId: arequipaHospital.id,
        healthCenterName: arequipaHospital.name,
        specialty: "ONCOLOGY",
        appointmentDate: "2026-04-02",
        appointmentTime: "09:00",
        nextAppointmentDate: null,
        nextAppointmentSpecialty: null,
        hasReferralSheet: null,
        referredTo: null,
        referralNotProvidedReason: null,
        difficulties: null,
        isFirstConsultation: false,
        attendedViaSepa: null,
        referredViaSepa: null,
        status: "COMPLETED",
        reminderId: null,
        isCurrent: true,
        isHistorical: false,
        changeReason: null,
        createdAt: "2026-04-03T00:00:00.000Z",
      },
    ]

    renderBoard(patient)

    expect(await screen.findByText("INEN")).toBeTruthy()
    expect(screen.getByText("Honorio Delgado")).toBeTruthy()
    expect(screen.getByText("Diagnóstico")).toBeTruthy()
    expect(screen.getByText("Cita")).toBeTruthy()
    expect(screen.getByText("Asistió")).toBeTruthy()
    expect(screen.getAllByText(/Nivel/).length).toBeGreaterThan(0)
    expect(screen.getByText("2 hospitales · 2 regiones")).toBeTruthy()
  })

  it("highlights the matching department when hovering a list row", async () => {
    mocks.listHealthCenters.mockResolvedValue([limaHospital])
    const patient = emptyPatient()
    patient.diagnoses = [
      {
        id: "dx-1",
        patientId: patient.id,
        followUpId: "follow-up-1",
        diagnosis: "C50",
        cancerStage: null,
        diagnosisDate: "2026-03-12",
        firstSymptomsDate: null,
        healthCenterId: limaHospital.id,
        healthCenterName: limaHospital.name,
        referredHealthCenterId: null,
        referredHealthCenterName: null,
        hasReferral: false,
        diagnosisSpecialty: "ONCOLOGY",
        symptomLeadingToCheckup: null,
        waitTimeSource: null,
        waitTimeForDiagnosis: null,
        hasMedicalReport: false,
        isSepaActiveReferral: null,
        isCurrent: true,
        changeReason: null,
        createdAt: "2026-03-13T00:00:00.000Z",
      },
    ]

    renderBoard(patient)

    const row = await screen.findByLabelText(/Diagnóstico, INEN, Lima/)
    fireEvent.mouseEnter(row)

    expect(
      screen.getByTestId("geography-15").getAttribute("aria-pressed"),
    ).toBe("true")
  })

  it("shows an empty state when there are no hospital events", async () => {
    mocks.listHealthCenters.mockResolvedValue([limaHospital])
    renderBoard(emptyPatient())

    expect(
      await screen.findByText(
        "Todavía no hay atenciones con hospital registrado.",
      ),
    ).toBeTruthy()
    expect(screen.queryByText("INEN")).toBeNull()
  })
})
