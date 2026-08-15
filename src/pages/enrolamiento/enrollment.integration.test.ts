import { describe, expect, it } from "vitest"

interface AuthResponse { accessToken: string }
interface Agent { id: string }
interface HealthCenter { id: string; isActive: boolean }
interface PatientAddress { type: string; isPrimary: boolean; address: string | null }
interface Enrollment { id: string; patientId: string; followUpId: string; caseComments: string | null }

const API_URL = process.env.FPC_E2E_API_URL?.replace(/\/+$/, "")
const EMAIL = process.env.FPC_E2E_EMAIL
const PASSWORD = process.env.FPC_E2E_PASSWORD
const runDescribe = API_URL && EMAIL && PASSWORD ? describe : describe.skip

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`)
  return text ? JSON.parse(text) as T : null as T
}

runDescribe("enrollment flow against Nest", () => {
  it("enrolls the diagnosis branch through the canonical transaction", async () => {
    const token = (await request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })).accessToken
    const [agent] = await request<Agent[]>("/agents", {}, token)
    const centers = await request<HealthCenter[]>("/health-centers", {}, token)
    const healthCenter = centers.find((center) => center.isActive)
    const dni = String(Date.now()).slice(-8)

    const enrollment = await request<Enrollment>("/enrollments", {
      method: "POST",
      body: JSON.stringify({
        patient: { fullName: "Test Enrolamiento Nest", primaryPhone: "988111222", dni },
        followUp: { type: "CALL", agentId: agent.id, completedAt: new Date().toISOString() },
        affiliationType: "SELF",
        details: {
          travelTimeToHospital: { valueMin: 45, unit: "MINUTE" },
          referredToSocialWorker: true,
        },
        addresses: [{
          type: "PERMANENT",
          isPrimary: true,
          address: "Av. Test 123",
          district: "Lima",
          province: "Lima",
          department: "LIMA",
        }, {
          type: "TEMPORARY",
          isPrimary: false,
          address: "Jr. Temporal 456",
          district: "Miraflores",
          province: "Lima",
          department: "LIMA",
        }],
        insurance: { insuranceType: "EPS", epsProvider: "RIMAC" },
        diagnosis: { diagnosis: "Cáncer de mama", healthCenterId: healthCenter?.id },
        treatments: [{
          treatmentType: "Quimioterapia",
          treatmentSituation: "EN_CURSO",
          treatmentFrequency: { valueMin: 3, unit: "WEEK" },
          isReferred: false,
          receivingHealthCenterId: healthCenter?.id,
        }],
        symptomReport: {
          hasDiscomfort: true,
          signsAndSymptoms: "Dolor persistente",
          indicationsReceived: "Control",
          symptomDuration: { valueMin: 2, unit: "MONTH" },
        },
        familyPreventionTalkInterests: [{ talkName: "Prevención", familyMemberName: "Rosa Test", familyMemberPhone: "999000111" }],
        caseComments: "Prueba del wizard Nest",
        consentToContact: true,
        consentToShareData: true,
      }),
    }, token)

    expect(enrollment.id).toBeTruthy()
    expect(enrollment.patientId).toBeTruthy()
    expect(enrollment.followUpId).toBeTruthy()
    expect(enrollment.caseComments).toBe("Prueba del wizard Nest")

    const addresses = await request<PatientAddress[]>(`/patients/${enrollment.patientId}/addresses`, {}, token)
    expect(addresses).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "PERMANENT", isPrimary: true, address: "Av. Test 123" }),
      expect.objectContaining({ type: "TEMPORARY", isPrimary: false, address: "Jr. Temporal 456" }),
    ]))
  }, 30_000)
})
