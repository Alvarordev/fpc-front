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
