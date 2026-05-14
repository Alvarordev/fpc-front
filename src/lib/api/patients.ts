import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "@/lib/api-client";
import type {
  Patient,
  PatientStatus,
  PatientRole,
  CreatePatientRequest,
  UpdatePatientRequest,
  ChangeStatusRequest,
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
} from "@/types";

export const patientsApi = {
  // --- List / Get ---

  list(): Promise<Patient[]> {
    return apiGet<Patient[]>("/api/patients");
  },

  listByStatus(status: PatientStatus): Promise<Patient[]> {
    return apiGet<Patient[]>(`/api/patients/status/${status}`);
  },

  listByRole(role: PatientRole): Promise<Patient[]> {
    return apiGet<Patient[]>(`/api/patients/role/${role}`);
  },

  getById(id: string): Promise<Patient> {
    return apiGet<Patient>(`/api/patients/${id}`);
  },

  // --- Basic CRUD ---

  create(data: CreatePatientRequest): Promise<Patient> {
    return apiPost<Patient>("/api/patients", data);
  },

  update(id: string, data: UpdatePatientRequest): Promise<Patient> {
    return apiPut<Patient>(`/api/patients/${id}`, data);
  },

  changeStatus(id: string, data: ChangeStatusRequest): Promise<Patient> {
    return apiPatch<Patient>(`/api/patients/${id}/status`, data);
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

  updateDetails(id: string, data: EnrollPatientDetailsRequest): Promise<Patient> {
    return apiPut<Patient>(`/api/patients/${id}/details`, data);
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
