import type { Page, Route } from "@playwright/test"

function catalogItem(
  kind: string,
  code: string,
  label: string,
  parentCode: string | null = null,
) {
  return {
    id: `${kind}-${code}`,
    kind,
    code,
    label,
    parentCode,
    sortOrder: 10,
    isActive: true,
    isSystem: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

const ADMIN = {
  id: "admin-id",
  email: "admin@example.com",
  role: "ADMIN" as const,
  isActive: true,
}

const CATALOGS: Record<string, ReturnType<typeof catalogItem>[]> = {
  entry_source: [
    catalogItem("entry_source", "REDES_SOCIALES", "Redes sociales"),
    catalogItem("entry_source", "LINEA_TELEFONICA", "Línea telefónica"),
  ],
  entry_sub_source: [
    catalogItem(
      "entry_sub_source",
      "LLAMADA_ENTRANTE",
      "Llamada entrante",
      "LINEA_TELEFONICA",
    ),
    catalogItem("entry_sub_source", "WHATSAPP", "WhatsApp", "LINEA_TELEFONICA"),
  ],
  patient_health_phase: [
    catalogItem(
      "patient_health_phase",
      "CANCER_DIAGNOSIS",
      "Diagnóstico de cáncer",
    ),
    catalogItem(
      "patient_health_phase",
      "SIGNS_AND_SYMPTOMS",
      "Signos y síntomas",
    ),
    catalogItem("patient_health_phase", "ANNUAL_CHECKUP", "Control anual"),
  ],
  insurance_type: [catalogItem("insurance_type", "SIS", "SIS")],
}

function fakeAccessToken() {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  ).toString("base64url")
  return `eyJhbGciOiJub25lIn0.${payload}.e2e`
}

const CORS = {
  "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "authorization,content-type,x-auth-retry",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
}

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: CORS,
    body: JSON.stringify(body),
  })
}

function isApiUrl(url: URL) {
  return url.port === "3000"
}

export async function mockApi(page: Page) {
  const token = fakeAccessToken()

  await page.route(
    (url) => isApiUrl(url),
    async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname
      const method = request.method()

      if (method === "OPTIONS") {
        await route.fulfill({ status: 204, headers: CORS })
        return
      }

      if (path === "/auth/login" && method === "POST") {
        await json(route, 201, { accessToken: token, user: ADMIN })
        return
      }
      if (path === "/auth/refresh" && method === "POST") {
        await json(route, 201, { accessToken: token })
        return
      }
      if (path === "/users/me" && method === "GET") {
        await json(route, 200, ADMIN)
        return
      }
      if (path === "/catalogs" && method === "GET") {
        const kind = url.searchParams.get("kind") ?? ""
        await json(route, 200, CATALOGS[kind] ?? [])
        return
      }
      if (path === "/agents" && method === "GET") {
        await json(route, 200, [
          { id: "agent-1", fullName: "Tania Salcedo", userId: "agent-user" },
        ])
        return
      }
      if (path === "/historical-records/enrollments" && method === "POST") {
        await json(route, 400, {
          statusCode: 400,
          message: "Unknown entry_source catalog value: Call center",
        })
        return
      }

      await json(route, 200, method === "GET" ? [] : {})
    },
  )
}

export async function openAuthenticated(
  page: Page,
  path: string,
  draft?: {
    currentStep?: number
    enrollmentMode?: "OPERATIONAL" | "HISTORICAL"
    programEntryPoint?: string
    categoriaClinica?: string | null
  },
) {
  await page.addInitScript(
    ({ token, persist }) => {
      localStorage.setItem("fpc-access-token", token)
      if (persist) localStorage.setItem("fpc-enrollment-draft", persist)
    },
    {
      token: fakeAccessToken(),
      persist: draft
        ? JSON.stringify({
            state: {
              enrollmentMode: draft.enrollmentMode ?? "OPERATIONAL",
              currentStep: draft.currentStep ?? 5,
              categoriaClinica: draft.categoriaClinica ?? "SIGNS_AND_SYMPTOMS",
              draft: {
                historicalEnrollmentDate: "2024-06-01",
                patientData: {
                  fullName: "Paciente E2E",
                  primaryPhone: "999111222",
                },
                symptomReport: {
                  hasDiscomfort: true,
                  signsAndSymptoms: "Dolor persistente",
                  hasMedicalConsultation: false,
                  noMedicalConsultationReason: "No pudo asistir",
                },
                enrollmentMetadata: {
                  programEntryPoint: draft.programEntryPoint,
                  assignedAgentId: "agent-1",
                  surveyAccepted: true,
                  currentlyAttendingConsultations: false,
                  notAttendingConsultationsNote: "Sin consultas",
                },
              },
            },
            version: 6,
          })
        : null,
    },
  )
  await page.goto(path)
  await page.getByText("admin@example.com").waitFor({ timeout: 15_000 })
}

export const HISTORICAL_PATIENT_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"
export const HISTORICAL_AGENT_ID = "11111111-2222-4333-8444-555555555555"
export const HISTORICAL_AGENT_NAME = "Tania Salcedo"

const HISTORICAL_CATALOGS: Record<string, ReturnType<typeof catalogItem>[]> = {
  ...CATALOGS,
  cancer_diagnosis: [
    catalogItem("cancer_diagnosis", "CANCER_MAMA", "Cáncer de mama"),
  ],
  cancer_stage: [
    catalogItem("cancer_stage", "UNKNOWN", "Sin dato"),
    catalogItem("cancer_stage", "STAGE_1", "Etapa 1"),
  ],
  treatment_type: [
    catalogItem("treatment_type", "QUIMIOTERAPIA", "Quimioterapia"),
  ],
  medical_specialty: [
    catalogItem("medical_specialty", "ONCOLOGIA", "Oncología"),
  ],
  education_level: [
    catalogItem("education_level", "SECONDARY", "Secundaria"),
  ],
  zone_type: [catalogItem("zone_type", "URBAN", "Urbana")],
  native_language: [catalogItem("native_language", "CASTELLANO", "Castellano")],
  care_program: [catalogItem("care_program", "ESSALUD", "EsSalud")],
  access_barrier: [
    catalogItem("access_barrier", "DISTANCE", "Distancia"),
  ],
  treatment_situation: [
    catalogItem("treatment_situation", "IN_TREATMENT", "En tratamiento"),
  ],
  chemotherapy_route: [
    catalogItem("chemotherapy_route", "INTRAVENOUS", "Intravenosa"),
  ],
  surgical_procedure: [
    catalogItem("surgical_procedure", "MASTECTOMIA", "Mastectomía"),
  ],
  program_dropout_reason: [
    catalogItem("program_dropout_reason", "OTHER", "Otro"),
  ],
  sepa_shelter: [catalogItem("sepa_shelter", "NONE", "Ninguno")],
  sepa_transport: [catalogItem("sepa_transport", "NONE", "Ninguno")],
  eps_provider: [catalogItem("eps_provider", "RIMAC", "Rimac")],
}

function historicalPatient() {
  return {
    id: HISTORICAL_PATIENT_ID,
    fullName: "Paciente Histórico E2E",
    email: null,
    dni: "12345678",
    birthDate: "1970-01-15",
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
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    details: null,
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

function followUpResponse(id: string, body: Record<string, unknown>) {
  return {
    id,
    subjectPatientId: HISTORICAL_PATIENT_ID,
    subjectPatientName: "Paciente Histórico E2E",
    interlocutorId: body.interlocutorId ?? HISTORICAL_PATIENT_ID,
    agentId: body.agentId ?? HISTORICAL_AGENT_ID,
    type: body.type ?? "CALL",
    status: body.status ?? "COMPLETED",
    purpose: body.purpose ?? "FOLLOW_UP",
    scheduledAt: null,
    scheduledOn: body.scheduledOn ?? "2024-06-15",
    completedAt: null,
    completedOn: body.completedOn ?? null,
    notes: body.notes ?? null,
    nextFollowUpId: null,
    createdAt: "2024-06-15T12:00:00.000Z",
    updatedAt: "2024-06-15T12:00:00.000Z",
    isHistorical: true,
  }
}

function timelineEvent(followUp: ReturnType<typeof followUpResponse>) {
  return {
    id: followUp.id,
    kind: "FOLLOW_UP",
    occurredAt: `${followUp.scheduledOn}T00:00:00.000Z`,
    occurredAtIsApproximate: false,
    createdAt: followUp.createdAt,
    updatedAt: followUp.updatedAt,
    historicalLoadedById: ADMIN.id,
    historicalLoadedByEmail: ADMIN.email,
    status: followUp.status,
    followUpId: followUp.id,
    type: followUp.type,
    purpose: followUp.purpose,
    notes: followUp.notes,
    outcomes: [],
  }
}

export type HistoricalApiCapture = {
  followUps: Record<string, unknown>[]
  patientPatches: Record<string, unknown>[]
}

export type HistoricalApiOptions = {
  followUpError?: { status: number; message: string }
  diagnosticStatus?: Record<string, unknown> | null
}

export async function mockHistoricalApi(
  page: Page,
  options: HistoricalApiOptions = {},
): Promise<HistoricalApiCapture> {
  const token = fakeAccessToken()
  const capture: HistoricalApiCapture = { followUps: [], patientPatches: [] }
  const created: ReturnType<typeof followUpResponse>[] = []
  const patient = historicalPatient()

  await page.route(
    (url) => isApiUrl(url),
    async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname
      const method = request.method()

      if (method === "OPTIONS") {
        await route.fulfill({ status: 204, headers: CORS })
        return
      }

      if (path === "/auth/login" && method === "POST") {
        await json(route, 201, { accessToken: token, user: ADMIN })
        return
      }
      if (path === "/auth/refresh" && method === "POST") {
        await json(route, 201, { accessToken: token })
        return
      }
      if (path === "/users/me" && method === "GET") {
        await json(route, 200, ADMIN)
        return
      }
      if (path === "/catalogs" && method === "GET") {
        const kind = url.searchParams.get("kind") ?? ""
        await json(route, 200, HISTORICAL_CATALOGS[kind] ?? [])
        return
      }
      if (path === "/agents" && method === "GET") {
        await json(route, 200, [
          {
            id: HISTORICAL_AGENT_ID,
            fullName: HISTORICAL_AGENT_NAME,
            userId: "agent-user",
          },
        ])
        return
      }
      if (path === "/health-centers" && method === "GET") {
        await json(route, 200, [])
        return
      }
      if (path === `/patients/${HISTORICAL_PATIENT_ID}` && method === "GET") {
        await json(route, 200, patient)
        return
      }
      if (path === `/patients/${HISTORICAL_PATIENT_ID}` && method === "PATCH") {
        const body = JSON.parse(request.postData() ?? "{}") as Record<
          string,
          unknown
        >
        capture.patientPatches.push(body)
        Object.assign(patient, body)
        await json(route, 200, patient)
        return
      }
      if (
        path === `/patients/${HISTORICAL_PATIENT_ID}/timeline` &&
        method === "GET"
      ) {
        await json(route, 200, {
          data: created.map(timelineEvent),
          total: created.length,
        })
        return
      }
      if (
        path === `/enrollments/patient/${HISTORICAL_PATIENT_ID}` &&
        method === "GET"
      ) {
        await json(route, 200, [])
        return
      }
      if (
        path ===
          `/patients/${HISTORICAL_PATIENT_ID}/diagnostic-status/current` &&
        method === "GET"
      ) {
        await json(route, 200, options.diagnosticStatus ?? null)
        return
      }
      if (
        (path === `/patients/${HISTORICAL_PATIENT_ID}/companions` ||
          path === `/patients/${HISTORICAL_PATIENT_ID}/addresses` ||
          path === `/patients/${HISTORICAL_PATIENT_ID}/social-notes`) &&
        method === "GET"
      ) {
        await json(route, 200, [])
        return
      }
      if (path === "/historical-records/follow-ups" && method === "POST") {
        if (options.followUpError) {
          await json(route, options.followUpError.status, {
            statusCode: options.followUpError.status,
            message: options.followUpError.message,
          })
          return
        }
        const body = JSON.parse(request.postData() ?? "{}") as Record<
          string,
          unknown
        >
        capture.followUps.push(body)
        const createdFollowUp = followUpResponse(
          `follow-up-${capture.followUps.length}`,
          body,
        )
        created.push(createdFollowUp)
        await json(route, 201, createdFollowUp)
        return
      }

      await json(route, 200, method === "GET" ? [] : {})
    },
  )

  return capture
}

export async function openHistoricalPatient(page: Page) {
  await openAuthenticated(
    page,
    `/carga-historica/pacientes/${HISTORICAL_PATIENT_ID}`,
  )
  await page.getByRole("heading", { name: "Perfil histórico" }).waitFor({
    timeout: 15_000,
  })
  await page.getByText("Paciente Histórico E2E").waitFor()
}
