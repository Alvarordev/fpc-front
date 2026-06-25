import { describe, expect, it } from "vitest";
import type { Agent, HealthCenter, Patient } from "@/types";

interface AuthResponse {
  accessToken: string;
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`HTTP ${status}: ${JSON.stringify(body)}`);
  }
}

const API_URL = process.env.FPC_E2E_API_URL?.replace(/\/+$/, "");
const EMAIL = process.env.FPC_E2E_EMAIL;
const PASSWORD = process.env.FPC_E2E_PASSWORD;

const shouldRun = Boolean(API_URL && EMAIL && PASSWORD);
const runDescribe = shouldRun ? describe : describe.skip;

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new HttpError(response.status, body);
  }

  return body as T;
}

async function login(): Promise<string> {
  const auth = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  return auth.accessToken;
}

function pickUnusedDni(usedDnis: Set<string>, startAt: number): string {
  for (let candidate = startAt; candidate < startAt + 10_000; candidate += 1) {
    const dni = String(candidate).padStart(8, "0");
    if (!usedDnis.has(dni)) {
      usedDnis.add(dni);
      return dni;
    }
  }

  throw new Error(`No unused DNI available from ${startAt}`);
}

function expectFirst<T>(items: T[] | undefined, label: string): T {
  expect(items?.length, `${label} should exist`).toBeGreaterThan(0);
  return items![0];
}

runDescribe("enrollment flow against current dev backend", () => {
  it(
    "enrolls the diagnosis branch with patient data, diagnosis, treatment, appointment and interested talks",
    async () => {
      const token = await login();
      const existingPatients = await request<Patient[]>("/api/patients", {}, token);
      const usedDnis = new Set(existingPatients.map((patient) => patient.dni).filter(Boolean) as string[]);
      const [agent] = await request<Agent[]>("/agents", {}, token);
      const [healthCenter] = (await request<HealthCenter[]>("/api/health-centers", {}, token)).filter(
        (center) => center.isActive,
      );

      expect(agent?.id).toBeTruthy();
      expect(healthCenter?.id).toBeTruthy();

      const dni = pickUnusedDni(usedDnis, 94_000_000);

      const created = await request<Patient>(
        "/api/patients/enroll",
        {
          method: "POST",
          body: JSON.stringify({
            patientId: null,
            patientData: {
              fullName: "Test Enrolamiento Diagnostico Integral",
              dni,
              birthDate: "1980-03-15",
              primaryPhone: "988111222",
              secondaryPhone: "977333444",
              hasWhatsapp: true,
              role: "PATIENT",
            },
            details: {
              currentAddress: "Av. Test Integral 123",
              currentDistrict: "Miraflores",
              currentDepartment: "Lima",
              dniMatchesAddress: false,
              travelTimeToHospital: "45 minutos",
              emergencyContactName: "Contacto Test",
              emergencyContactPhone: "999888777",
              educationLevel: "SECONDARY",
              nativeLanguage: "Shipibo",
              requiresTranslation: true,
              referredToSocialWorker: true,
            },
            insurance: {
              insuranceType: "EPS",
              epsProvider: "RIMAC",
              isCurrent: true,
              startDate: "2025-01-10",
            },
            symptomReport: null,
            diagnosis: {
              diagnosis: "Cáncer de mama",
              cancerStage: "STAGE_2",
              diagnosisDate: "2025-08-20",
              healthCenterId: healthCenter.id,
              diagnosisSpecialty: "Oncología médica",
              symptomLeadingToCheckup: "Dolor persistente y masa palpable",
              waitTimeForDiagnosis: "6 semanas",
              hasMedicalReport: true,
              isCurrent: true,
            },
            treatment: {
              diagnosisId: "00000000-0000-0000-0000-000000000000",
              treatmentType: "Quimioterapia",
              treatmentFrequency: "Cada 21 días",
              healthCenterId: healthCenter.id,
              isCurrent: true,
              treatmentSituation: "En curso",
            },
            medicalAppointments: [
              {
                healthCenterId: healthCenter.id,
                specialty: "Oncología",
                appointmentDate: "2026-06-01",
                nextAppointmentDate: "2026-07-01",
                difficulties: "Demora en citas",
                hasReferralSheet: true,
                isFirstConsultation: false,
              },
            ],
            familyPreventionTalkInterests: [
              {
                talkName: "Prevención del cáncer de mama",
                familyMemberName: "Rosa Test",
                familyMemberPhone: "999000111",
                familyMemberEmail: "rosa.test@example.com",
              },
              {
                talkName: "Charla personalizada de hábitos saludables",
                familyMemberName: "Luis Test",
                familyMemberPhone: "999000222",
                familyMemberEmail: "luis.test@example.com",
              },
            ],
            sisAffiliation: null,
            companions: null,
            enrollmentMetadata: {
              caseComments: "Test integral diagnóstico",
              startTime: "2026-06-25T09:00:00Z",
              endTime: "2026-06-25T09:45:00Z",
              dataPolicyAccepted: true,
              informedConsentAccepted: true,
              isOncologicalPatient: true,
              programEntryPoint: "Campaña prevención",
              currentlyAttendingConsultations: true,
              currentlyReceivingTreatment: true,
              surveyAccepted: true,
              surveyRating: 5,
              agentId: agent.id,
              affiliationType: "PATIENT",
            },
          }),
        },
        token,
      );

      expect(created.dni).toBe(dni);
      expect(created.status).toBe("ENROLLED");
      expect(created.details?.nativeLanguage).toBe("Shipibo");
      expect(expectFirst(created.insurance, "insurance").insuranceType).toBe("EPS");
      expect(expectFirst(created.diagnoses, "diagnosis").diagnosis).toBe("Cáncer de mama");
      expect(expectFirst(created.treatments, "treatment").treatmentType).toBe("Quimioterapia");
      expect(expectFirst(created.medicalAppointments, "medical appointment").specialty).toBe("Oncología");
      expect(created.familyPreventionTalkInterests).toHaveLength(2);
    },
    30_000,
  );

  it("enrolls the signs branch with no insurance, SIS affiliation and interested talks", async () => {
    const token = await login();
      const existingPatients = await request<Patient[]>("/api/patients", {}, token);
      const usedDnis = new Set(existingPatients.map((patient) => patient.dni).filter(Boolean) as string[]);
      const [agent] = await request<Agent[]>("/agents", {}, token);
    const dni = pickUnusedDni(usedDnis, 95_000_000);

    const created = await request<Patient>(
      "/api/patients/enroll",
      {
        method: "POST",
        body: JSON.stringify({
          patientId: null,
          patientData: {
            fullName: "Test Enrolamiento Signos Integral",
            dni,
            birthDate: "1975-11-02",
            primaryPhone: "988555666",
            secondaryPhone: null,
            hasWhatsapp: false,
            role: "PATIENT",
          },
          details: {
            currentAddress: "Av. Test Integral 123",
            currentDistrict: "Miraflores",
            currentDepartment: "Lima",
            dniMatchesAddress: false,
            travelTimeToHospital: "45 minutos",
            emergencyContactName: "Contacto Test",
            emergencyContactPhone: "999888777",
            educationLevel: "SECONDARY",
            nativeLanguage: "Quechua",
            requiresTranslation: false,
            referredToSocialWorker: false,
          },
          insurance: undefined,
          symptomReport: {
            hasDiscomfort: true,
            signsAndSymptoms: "Dolor",
            hasSoughtMedicalConsultation: false,
            specialty: "Medicina",
            indicationsReceived: "Control",
          },
          diagnosis: undefined,
          treatment: undefined,
          medicalAppointments: null,
          familyPreventionTalkInterests: [
            {
              talkName: "Prevención general del cáncer",
              familyMemberName: "Ana Test",
              familyMemberPhone: "988000333",
              familyMemberEmail: "ana.test@example.com",
            },
          ],
          sisAffiliation: {
            canAffiliate: false,
            cantAffiliateReason: "Documento pendiente",
            comments: "Pendiente",
          },
          companions: null,
          enrollmentMetadata: {
            caseComments: "Test integral signos sin seguro",
            startTime: "2026-06-25T10:00:00Z",
            endTime: "2026-06-25T10:30:00Z",
            dataPolicyAccepted: true,
            informedConsentAccepted: true,
            isOncologicalPatient: false,
            programEntryPoint: "Redes FPC",
            surveyAccepted: true,
            surveyRating: 4,
            agentId: agent.id,
            affiliationType: "PATIENT",
          },
        }),
      },
      token,
    );

    expect(created.dni).toBe(dni);
    expect(created.status).toBe("ENROLLED");
    expect(created.insurance).toHaveLength(0);
    const symptomReport = expectFirst(created.symptomReports, "symptom report");
    expect(symptomReport.isPainPresent).toBe(true);
    expect(symptomReport.discomfortDescription).toBe("Dolor");
    expect(symptomReport.discomfortSeverity).toBe("Control");
    expect(expectFirst(created.sisAffiliations, "SIS affiliation").canAffiliate).toBe(false);
    expect(created.familyPreventionTalkInterests).toHaveLength(1);
  }, 30_000);

  it("accepts realistic signs text and maps the frontend symptom fields to backend symptom report fields", async () => {
    const token = await login();
    const existingPatients = await request<Patient[]>("/api/patients", {}, token);
    const usedDnis = new Set(existingPatients.map((patient) => patient.dni).filter(Boolean) as string[]);
    const [agent] = await request<Agent[]>("/agents", {}, token);
    const dni = pickUnusedDni(usedDnis, 96_000_000);

    const created = await request<Patient>(
      "/api/patients/enroll",
      {
        method: "POST",
        body: JSON.stringify({
          patientId: null,
          patientData: {
            fullName: "Test Signos Texto Realista",
            dni,
            birthDate: "1975-11-02",
            primaryPhone: "988555667",
            hasWhatsapp: false,
            role: "PATIENT",
          },
          details: { currentDepartment: "Lima" },
          insurance: undefined,
          symptomReport: {
            hasDiscomfort: true,
            signsAndSymptoms: "Sangrado persistente, pérdida de peso y dolor abdominal",
            hasSoughtMedicalConsultation: false,
            specialty: "Medicina",
            indicationsReceived: "Control",
          },
          diagnosis: undefined,
          treatment: undefined,
          medicalAppointments: null,
          familyPreventionTalkInterests: null,
          sisAffiliation: { canAffiliate: true, expectedDate: "2026-07-15" },
          companions: null,
          enrollmentMetadata: {
            caseComments: "Test signos realista",
            startTime: "2026-06-25T11:00:00Z",
            endTime: "2026-06-25T11:30:00Z",
            dataPolicyAccepted: true,
            informedConsentAccepted: true,
            isOncologicalPatient: false,
            programEntryPoint: "Llamada directa",
            surveyAccepted: true,
            surveyRating: 4,
            agentId: agent.id,
            affiliationType: "PATIENT",
          },
        }),
      },
      token,
    );

    const symptomReport = expectFirst(created.symptomReports, "symptom report");
    expect(symptomReport.isPainPresent).toBe(true);
    expect(symptomReport.discomfortDescription).toBe(
      "Sangrado persistente, pérdida de peso y dolor abdominal",
    );
    expect(symptomReport.discomfortSeverity).toBe("Control");
    expect(expectFirst(created.sisAffiliations, "SIS affiliation").canAffiliate).toBe(true);
  }, 30_000);
});
