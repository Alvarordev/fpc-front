import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import {
  patientsApi as patientsHttpApi,
  type PatientDetailsResponse as ApiPatientDetailsResponse,
  type PatientResponse as ApiPatientResponse,
  type PatientSummaryResponse as ApiPatientSummaryResponse,
} from "@/api/patients";
import type {
  Patient,
  CreatePatientRequest,
  UpdatePatientRequest,
  FullEnrollmentRequest,
  EnrollPatientDetailsRequest,
  AddInsuranceRequest,
  AddDiagnosisRequest,
  AddTreatmentRequest,
  AddMedicalAppointmentRequest,
  AddSisAffiliationRequest,
  LinkCompanionRequest,
  InsuranceRecordResponse,
  DiagnosisRecordResponse,
  TreatmentRecordResponse,
  MedicalAppointmentResponse,
  SisAffiliationResponse,
  CompanionResponse,
  Contact,
  PatientSummaryResponse,
} from "@/types";

function toLegacyDetails(
  details: ApiPatientDetailsResponse["details"],
): Patient["details"] {
  if (!details) {
    return null;
  }

  return {
    ...details,
    evidenceOfDomesticViolence: null,
    usesWoodStove: null,
    isWorking: null,
    receivesFinancialSupport: null,
    programDropoutReason: null,
    programDropoutDate: null,
    referredToSocialWorker: null,
    hasConadisCard: null,
    knowsAboutFissal: null,
    isDeceased: null,
  };
}

function toLegacySummary(summary: ApiPatientSummaryResponse): PatientSummaryResponse {
  return {
    status: summary.status,
    stale: false,
    updatedAt: null,
    content: summary.summary ? { resumenEjecutivo: summary.summary } : null,
    lastErrorCode: summary.status === "FAILED" ? "SUMMARY_FAILED" : null,
  };
}

function toLegacyPatient(
  patient: ApiPatientResponse | ApiPatientDetailsResponse,
): Patient {
  const details = "details" in patient ? toLegacyDetails(patient.details) : null;
  const summary = "summary" in patient && patient.summary
    ? {
        status: "READY" as const,
        stale: false,
        updatedAt: patient.updatedAt,
        content: { resumenEjecutivo: patient.summary },
        lastErrorCode: null,
      }
    : undefined;

  return {
    ...patient,
    status: patient.status === "ENROLLED" ? "ENROLLED" : "PROSPECT",
    details,
    insurance: [],
    diagnoses: [],
    treatments: [],
    medicalAppointments: [],
    sisAffiliations: [],
    companions: [],
    familyPreventionTalkInterests: [],
    symptomReports: [],
    contacts: [],
    summary,
  };
}

export const patientsApi = {
  // --- List / Get ---

  async list(): Promise<Patient[]> {
    const response = await patientsHttpApi.list({ limit: 100 });
    return response.data.map(toLegacyPatient);
  },

  async getById(id: string): Promise<Patient> {
    return toLegacyPatient(await patientsHttpApi.getById(id));
  },

  async getSummary(id: string): Promise<PatientSummaryResponse> {
    return toLegacySummary(await patientsHttpApi.getSummary(id));
  },

  // --- Basic CRUD ---

  async create(data: CreatePatientRequest): Promise<Patient> {
    const { fullName, primaryPhone, secondaryPhone, dni, birthDate, hasWhatsapp } = data;
    return toLegacyPatient(
      await patientsHttpApi.create({
        fullName,
        primaryPhone,
        secondaryPhone: secondaryPhone ?? undefined,
        dni: dni ?? undefined,
        birthDate: birthDate ?? undefined,
        hasWhatsapp,
      }),
    );
  },

  async update(id: string, data: UpdatePatientRequest): Promise<Patient> {
    const { fullName, primaryPhone, secondaryPhone, dni, birthDate, hasWhatsapp } = data;
    return toLegacyPatient(
      await patientsHttpApi.update(id, {
        fullName,
        primaryPhone,
        secondaryPhone: secondaryPhone ?? undefined,
        dni: dni ?? undefined,
        birthDate: birthDate ?? undefined,
        hasWhatsapp,
      }),
    );
  },

  // --- Enrollment ---

  /** Full enrollment — creates patient + all sub-entities in one transaction */
  enroll(data: FullEnrollmentRequest): Promise<Patient> {
    return apiPost<Patient>("/api/patients/enroll", data);
  },

  /** Legacy enrollment — enroll existing patient by creating details */
  enrollExisting(id: string, data: EnrollPatientDetailsRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/enroll`, data);
  },

  updateDetails(id: string, data: EnrollPatientDetailsRequest) {
    const {
      birthDepartment,
      currentAddress,
      currentDistrict,
      currentDepartment,
      dniMatchesAddress,
      travelTimeToHospital,
      emergencyContactName,
      emergencyContactPhone,
      zoneType,
      emergencyContactGender,
      educationLevel,
      nativeLanguage,
      requiresTranslation,
    } = data;

    return patientsHttpApi.updateDetails(id, {
      birthDepartment: birthDepartment ?? undefined,
      currentAddress: currentAddress ?? undefined,
      currentDistrict: currentDistrict ?? undefined,
      currentDepartment: currentDepartment ?? undefined,
      dniMatchesAddress: dniMatchesAddress ?? undefined,
      travelTimeToHospital: travelTimeToHospital ?? undefined,
      emergencyContactName: emergencyContactName ?? undefined,
      emergencyContactPhone: emergencyContactPhone ?? undefined,
      zoneType: zoneType ?? undefined,
      emergencyContactGender: emergencyContactGender ?? undefined,
      educationLevel: educationLevel ?? undefined,
      nativeLanguage: nativeLanguage ?? undefined,
      requiresTranslation: requiresTranslation ?? undefined,
    });
  },

  // --- Insurance ---

  getInsurance(id: string): Promise<InsuranceRecordResponse[]> {
    return apiGet<InsuranceRecordResponse[]>(`/api/patients/${id}/insurance`);
  },

  addInsurance(id: string, data: AddInsuranceRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/insurance`, data);
  },

  // --- Diagnoses ---

  getDiagnoses(id: string): Promise<DiagnosisRecordResponse[]> {
    return apiGet<DiagnosisRecordResponse[]>(`/api/patients/${id}/diagnoses`);
  },

  addDiagnosis(id: string, data: AddDiagnosisRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/diagnoses`, data);
  },

  // --- Treatments ---

  getTreatments(id: string): Promise<TreatmentRecordResponse[]> {
    return apiGet<TreatmentRecordResponse[]>(`/api/patients/${id}/treatments`);
  },

  addTreatment(id: string, data: AddTreatmentRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/treatments`, data);
  },

  // --- Medical Appointments ---

  getAppointments(id: string): Promise<MedicalAppointmentResponse[]> {
    return apiGet<MedicalAppointmentResponse[]>(`/api/patients/${id}/appointments`);
  },

  addAppointment(id: string, data: AddMedicalAppointmentRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/appointments`, data);
  },

  // --- SIS ---

  getSis(id: string): Promise<SisAffiliationResponse[]> {
    return apiGet<SisAffiliationResponse[]>(`/api/patients/${id}/sis`);
  },

  addSis(id: string, data: AddSisAffiliationRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/sis`, data);
  },

  affiliateSis(id: string, sisId: string): Promise<Patient> {
    return apiPatch<Patient>(`/api/patients/${id}/sis/${sisId}/affiliate`);
  },

  // --- Companions ---

  getPatientsByCompanion(companionId: string): Promise<Patient[]> {
    return apiGet<Patient[]>(`/api/patients/companion/${companionId}/patients`);
  },

  getCompanions(id: string): Promise<CompanionResponse[]> {
    return apiGet<CompanionResponse[]>(`/api/patients/${id}/companions`);
  },

  linkCompanion(id: string, data: LinkCompanionRequest): Promise<Patient> {
    return apiPost<Patient>(`/api/patients/${id}/companions`, data);
  },

  unlinkCompanion(id: string, companionId: string): Promise<void> {
    return apiDelete(`/api/patients/${id}/companions/${companionId}`);
  },

  // --- Contacts ---

  getContacts(id: string): Promise<Contact[]> {
    return apiGet<Contact[]>(`/api/patients/${id}/contacts`);
  },
};
