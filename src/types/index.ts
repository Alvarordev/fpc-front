// ============================================================
// Enums — exact matches to backend Java enums
// ============================================================

export type PatientRole = "UNKNOWN" | "PATIENT" | "COMPANION";

export type PatientStatus = "PROSPECT" | "ENROLLED" | "ACTIVE" | "INACTIVE";

export type EducationLevel =
  | "NONE"
  | "INITIAL"
  | "PRIMARY_INCOMPLETE"
  | "PRIMARY"
  | "SECONDARY_INCOMPLETE"
  | "SECONDARY"
  | "TECHNICAL_INCOMPLETE"
  | "TECHNICAL"
  | "HIGHER_INCOMPLETE"
  | "HIGHER";

export type ContactType = "WHATSAPP" | "CALL" | "VIDEO_CALL" | "EMAIL" | "IN_PERSON";

export type ContactStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_ANSWER";

export type ContactPurpose =
  | "FIRST_CONTACT"
  | "ENROLLMENT"
  | "FOLLOW_UP"
  | "PSYCHOONCOLOGY_REFERRAL"
  | "OTHER";

export type ReminderType =
  | "LABORATORIO"
  | "IMAGEN"
  | "CONSULTA"
  | "PROCEDIMIENTO"
  | "MEDICACION"
  | "OTRO";

export type ReminderStatus = "PENDIENTE" | "COMPLETADO" | "CANCELADO";

export type InsuranceType =
  | "SIS"
  | "ESSALUD"
  | "EPS"
  | "FUERZAS_ARMADAS"
  | "SALUDPOL"
  | "NONE";

export type EpsProvider =
  | "PACIFICO"
  | "RIMAC"
  | "MAPFRE"
  | "LA_POSITIVA"
  | "SANITAS"
  | "ONCOSALUD"
  | "OTHER";

export type CancerStage = "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4" | "UNKNOWN";

export type AlertStatus = "ACTIVE" | "RESOLVED";

export type AvailabilityStatus = "AVAILABLE" | "RESERVED";

export type AppointmentModality = "CALL" | "VIDEO_CALL";

export type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_ANSWER";

export type ReferralType =
  | "PSYCHIATRY"
  | "NEUROLOGY"
  | "CONTINUE_PSYCHOLOGY"
  | "PSYCHOONCOLOGIST"
  | "NONE";

export type UserRole = "ADMIN" | "AGENT" | "VOLUNTEER";

export type PeruDepartment =
  | "AMAZONAS"
  | "ANCASH"
  | "APURIMAC"
  | "AREQUIPA"
  | "AYACUCHO"
  | "CAJAMARCA"
  | "CALLAO"
  | "CUSCO"
  | "HUANCAVELICA"
  | "HUANUCO"
  | "ICA"
  | "JUNIN"
  | "LA_LIBERTAD"
  | "LAMBAYEQUE"
  | "LIMA"
  | "LORETO"
  | "MADRE_DE_DIOS"
  | "MOQUEGUA"
  | "PASCO"
  | "PIURA"
  | "PUNO"
  | "SAN_MARTIN"
  | "TACNA"
  | "TUMBES"
  | "UCAYALI";

export type AffiliationType = "PATIENT" | "FAMILY";

// ============================================================
// Auth
// ============================================================

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ============================================================
// Agents
// ============================================================

export interface Agent {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  createdAt: string;
}

export interface CreateAgentRequest {
  userId: string;
  fullName: string;
  phone: string;
}

export type UpdateAgentRequest = Partial<CreateAgentRequest>;

// ============================================================
// Contacts
// ============================================================

export interface ContactSummary {
  id: string;
  agentName: string | null;
  type: ContactType;
  status: ContactStatus;
  purpose: ContactPurpose;
}

export interface Contact {
  id: string;
  patientId: string;
  agentId: string | null;
  agentName?: string | null;
  type: ContactType;
  status: ContactStatus;
  purpose: ContactPurpose;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  scheduledNextContactId: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactServiceReferralRequest {
  referredToSocialWorker?: boolean | null;
  referredToSusalud?: boolean | null;
  susaludRegistrationNumber?: string | null;
  receivedFoodGuide?: boolean | null;
  participatesInGam?: boolean | null;
  programSatisfaction?: string | null;
  wellbeingChanges?: string | null;
  knowsAboutFissal?: boolean | null;
  referredToPaus?: boolean | null;
  referredToDae?: boolean | null;
  referredToFissal?: boolean | null;
}

export interface CreateContactRequest {
  patientId: string;
  agentId: string;
  type: ContactType;
  status: ContactStatus;
  purpose: ContactPurpose;
  scheduledAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  scheduledNextContactId?: string | null;
  serviceReferral?: ContactServiceReferralRequest | null;
}

export type UpdateContactRequest = Partial<CreateContactRequest>;

// ============================================================
// Patients — sub-entities
// ============================================================

export interface PatientDetailsResponse {
  id: string;
  patientId: string;
  birthDepartment: string | null;
  currentAddress: string | null;
  currentDistrict: string | null;
  currentDepartment: string | null;
  dniMatchesAddress: boolean | null;
  travelTimeToHospital: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  zoneType: string | null;
  emergencyContactGender: string | null;
  educationLevel: EducationLevel | null;
  nativeLanguage: string | null;
  requiresTranslation: boolean;
  evidenceOfDomesticViolence: boolean | null;
  usesWoodStove: boolean | null;
  isWorking: boolean | null;
  receivesFinancialSupport: boolean | null;
  programDropoutReason: string | null;
  programDropoutDate: string | null;
  referredToSocialWorker: boolean | null;
  hasConadisCard: boolean | null;
  knowsAboutFissal: boolean | null;
  isDeceased: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsuranceRecordResponse {
  id: string;
  patientId: string;
  insuranceType: InsuranceType;
  epsProvider: EpsProvider | null;
  isCurrent: boolean;
  changeReason: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  contact: ContactSummary;
}

export interface DiagnosisRecordResponse {
  id: string;
  patientId: string;
  diagnosis: string;
  cancerStage: CancerStage | null;
  diagnosisDate: string | null;
  healthCenterId: string | null;
  healthCenterName: string | null;
  diagnosisSpecialty: string | null;
  symptomLeadingToCheckup: string | null;
  waitTimeForDiagnosis: string | null;
  hasMedicalReport: boolean;
  isCurrent: boolean;
  changeReason: string | null;
  createdAt: string;
  contact: ContactSummary;
}

export interface DiagnosisSummary {
  id: string;
  diagnosis: string;
}

export interface TreatmentRecordResponse {
  id: string;
  patientId: string;
  diagnosis: DiagnosisSummary;
  treatmentType: string;
  treatmentFrequency: string | null;
  healthCenterId: string | null;
  healthCenterName: string | null;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  changeReason: string | null;
  notReceivingReason: string | null;
  createdAt: string;
  contact: ContactSummary;
}

export interface MedicalAppointmentResponse {
  id: string;
  patientId: string;
  healthCenterId: string | null;
  healthCenterName: string | null;
  specialty: string | null;
  appointmentDate: string | null;
  nextAppointmentDate: string | null;
  hasReferralSheet: boolean;
  referredTo: string | null;
  difficulties: string | null;
  createdAt: string;
  contact: ContactSummary;
}

export interface SisAffiliationResponse {
  id: string;
  patientId: string;
  contactId: string;
  canAffiliate: boolean;
  expectedDate: string | null;
  cantAffiliateReason: string | null;
  comments: string | null;
  affiliatedAt: string | null;
  createdAt: string;
}

export interface SymptomReportResponse {
  id: string;
  patientId: string;
  contactId: string;
  enrollmentId: string;
  isPainPresent: boolean;
  painLocation: string | null;
  painIntensity: string | null;
  painDescription: string | null;
  discomfortDescription: string | null;
  symptomDuration: string | null;
  symptomFrequency: string | null;
  hasSoughtMedicalConsultation: boolean;
  healthCenterId: string | null;
  specialty: string | null;
  discomfortSeverity: string | null;
  createdAt: string;
}

export interface CompanionResponse {
  companionId: string;
  companionFullName: string;
  isPrimaryInformant: boolean;
}

export type PatientSummaryStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface PatientSummaryContent {
  resumenEjecutivo: string | null;
  datosPersonales?: Record<string, unknown> | null;
  contactoEmergencia?: Record<string, unknown> | null;
  seguro?: Record<string, unknown> | null;
  diagnosticos?: Record<string, unknown>[] | null;
  tratamientos?: Record<string, unknown>[] | null;
  proximasCitas?: Record<string, unknown>[] | null;
  sintomas?: Record<string, unknown>[] | null;
}

export interface PatientSummaryResponse {
  status: PatientSummaryStatus;
  stale: boolean;
  updatedAt: string | null;
  content: PatientSummaryContent | null;
  lastErrorCode: string | null;
}

// ============================================================
// Patients — main
// ============================================================

export interface Patient {
  id: string;
  fullName: string;
  dni: string | null;
  birthDate: string | null;
  gender?: string | null;
  primaryPhone: string;
  secondaryPhone: string | null;
  hasWhatsapp: boolean;
  role: PatientRole;
  status: PatientStatus;
  createdAt: string;
  updatedAt: string;
  details: PatientDetailsResponse | null;
  insurance: InsuranceRecordResponse[];
  diagnoses: DiagnosisRecordResponse[];
  treatments: TreatmentRecordResponse[];
  medicalAppointments: MedicalAppointmentResponse[];
  sisAffiliations: SisAffiliationResponse[];
  companions: CompanionResponse[];
  familyPreventionTalkInterests: FamilyPreventionTalkInterestResponse[];
  symptomReports: SymptomReportResponse[];
  contacts: Contact[];
  summary?: PatientSummaryResponse | null;
}

// ============================================================
// Patients — requests
// ============================================================

export interface CreatePatientRequest {
  fullName: string;
  dni?: string | null;
  birthDate?: string | null;
  primaryPhone: string;
  secondaryPhone?: string | null;
  hasWhatsapp?: boolean;
  role?: PatientRole;
  status?: PatientStatus | null;
}

export type UpdatePatientRequest = Partial<CreatePatientRequest>;

export interface ChangeStatusRequest {
  newStatus: PatientStatus;
}

export interface EnrollPatientDetailsRequest {
  birthDepartment?: string | null;
  currentAddress?: string | null;
  currentDistrict?: string | null;
  currentDepartment?: string | null;
  dniMatchesAddress?: boolean | null;
  travelTimeToHospital?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  zoneType?: string | null;
  emergencyContactGender?: string | null;
  educationLevel?: EducationLevel | null;
  nativeLanguage?: string | null;
  requiresTranslation?: boolean;
  evidenceOfDomesticViolence?: boolean | null;
  usesWoodStove?: boolean | null;
  isWorking?: boolean | null;
  receivesFinancialSupport?: boolean | null;
  programDropoutReason?: string | null;
  programDropoutDate?: string | null;
  referredToSocialWorker?: boolean | null;
  hasConadisCard?: boolean | null;
  knowsAboutFissal?: boolean | null;
  isDeceased?: boolean | null;
}

export interface AddInsuranceRequest {
  insuranceType: InsuranceType;
  epsProvider?: EpsProvider | null;
  isCurrent: boolean;
  changeReason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AddDiagnosisRequest {
  diagnosis: string;
  cancerStage?: CancerStage | null;
  diagnosisDate?: string | null;
  healthCenterId?: string | null;
  diagnosisSpecialty?: string | null;
  symptomLeadingToCheckup?: string | null;
  waitTimeForDiagnosis?: string | null;
  hasMedicalReport?: boolean;
  isCurrent: boolean;
  changeReason?: string | null;
}

export interface AddTreatmentRequest {
  diagnosisId: string;
  treatmentType: string;
  treatmentFrequency?: string | null;
  healthCenterId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  changeReason?: string | null;
  notReceivingReason?: string | null;
  treatmentSituation?: string | null;
}

export interface AddMedicalAppointmentRequest {
  healthCenterId?: string | null;
  specialty?: string | null;
  appointmentDate?: string | null;
  nextAppointmentDate?: string | null;
  hasReferralSheet?: boolean;
  referredTo?: string | null;
  difficulties?: string | null;
  isFirstConsultation?: boolean;
}

export interface AddSisAffiliationRequest {
  canAffiliate: boolean;
  expectedDate?: string | null;
  cantAffiliateReason?: string | null;
  comments?: string | null;
}

export interface LinkCompanionRequest {
  companionId: string;
  isPrimaryInformant?: boolean;
}

export interface EnrollmentMetadataRequest {
  caseComments?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  dataPolicyAccepted?: boolean;
  informedConsentAccepted?: boolean;
  affiliationType?: AffiliationType;
  isOncologicalPatient?: boolean;
  programEntryPoint?: string | null;
  currentlyAttendingConsultations?: boolean | null;
  currentlyReceivingTreatment?: boolean | null;
  surveyAccepted?: boolean;
  surveyRating?: number | null;
  agentId?: string | null;
}

export interface SymptomReportRequest {
  hasDiscomfort?: boolean;
  signsAndSymptoms?: string | null;
  hasSoughtMedicalConsultation?: boolean;
  healthCenterId?: string | null;
  specialty?: string | null;
  firstConsultationDetails?: string | null;
  indicationsReceived?: string | null;
}

export interface FamilyPreventionTalkInterestRequest {
  talkName: string;
  familyMemberName: string;
  familyMemberPhone: string;
  familyMemberEmail: string;
}

export interface FamilyPreventionTalkInterestResponse {
  id: string;
  patientId: string;
  talkName: string;
  familyMemberName: string;
  familyMemberPhone: string;
  familyMemberEmail: string;
  createdAt: string;
}

export interface FullEnrollmentRequest {
  patientId: string | null;
  patientData?: CreatePatientRequest;
  details: EnrollPatientDetailsRequest;
  insurance?: AddInsuranceRequest | null;
  symptomReport?: SymptomReportRequest | null;
  diagnosis?: AddDiagnosisRequest | null;
  treatment?: AddTreatmentRequest | null;
  medicalAppointments?: AddMedicalAppointmentRequest[] | null;
  familyPreventionTalkInterests?: FamilyPreventionTalkInterestRequest[] | null;
  sisAffiliation?: AddSisAffiliationRequest | null;
  companions?: LinkCompanionRequest[] | null;
  enrollmentMetadata?: EnrollmentMetadataRequest | null;
}

// ============================================================
// Users (for admin)
// ============================================================

export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

// ============================================================
// Volunteers
// ============================================================

export interface Volunteer {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVolunteerRequest {
  userId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  isActive?: boolean;
}

export type UpdateVolunteerRequest = Partial<CreateVolunteerRequest>;

// ============================================================
// Volunteer Availability
// ============================================================

export interface AvailabilitySlot {
  id: string;
  volunteerId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
}

export interface CreateAvailabilitySlotRequest {
  volunteerId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface UpdateAvailabilitySlotRequest {
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: AvailabilityStatus;
}

// ============================================================
// Psychooncology Appointments
// ============================================================

export interface PsychooncologyAppointment {
  id: string;
  patientId: string;
  volunteerId: string;
  contactId: string;
  availabilityId: string;
  patientEmail: string | null;
  sessionNumber: number;
  isAdditionalSession: boolean;
  modality: AppointmentModality;
  status: AppointmentStatus;
  scheduledAt: string;
  completedAt: string | null;
  topicAddressed: string | null;
  sessionDetails: string | null;
  additionalObservations: string | null;
  recommendations: string | null;
  referral: ReferralType | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  volunteerId: string;
  contactId: string;
  availabilityId: string;
  patientEmail?: string | null;
  sessionNumber?: number;
  isAdditionalSession?: boolean;
  modality: AppointmentModality;
  scheduledAt: string;
}

export interface UpdateAppointmentRequest {
  patientEmail?: string | null;
  sessionNumber?: number;
  isAdditionalSession?: boolean;
  modality?: AppointmentModality;
  status?: AppointmentStatus;
  scheduledAt?: string;
}

export interface CompleteAppointmentRequest {
  topicAddressed?: string | null;
  sessionDetails?: string | null;
  additionalObservations?: string | null;
  recommendations?: string | null;
  referral?: ReferralType | null;
}

// ============================================================
// Recordatorios (Reminders)
// ============================================================

export interface Reminder {
  id: string;
  patientId: string;
  contactId: string;
  type: ReminderType;
  description: string;
  scheduledDate: string;
  status: ReminderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderRequest {
  patientId: string;
  contactId?: string;
  type: ReminderType;
  description: string;
  scheduledDate: string;
  notes?: string | null;
}

export interface UpdateReminderRequest {
  type?: ReminderType;
  description?: string;
  scheduledDate?: string;
  notes?: string | null;
}

// ============================================================
// Health Centers
// ============================================================

export interface HealthCenter {
  id: string;
  name: string;
  slug: string;
  department: PeruDepartment;
  isActive: boolean;
  patientCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHealthCenterRequest {
  name: string;
  department: PeruDepartment;
}

export interface UpdateHealthCenterRequest {
  name?: string;
  department?: PeruDepartment;
}

// ============================================================
// Alerts
// ============================================================

export interface Alert {
  id: string;
  healthCenterId: string;
  healthCenterName: string;
  contactId: string;
  createdByAgentId: string;
  createdByAgentName: string;
  title: string;
  description: string;
  status: AlertStatus;
  resolvedAt: string | null;
  resolvedByAgentId: string | null;
  resolvedByAgentName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRequest {
  healthCenterId: string;
  contactId: string;
  createdByAgentId: string;
  title: string;
  description: string;
}

export interface UpdateAlertRequest {
  title?: string;
  description?: string;
  healthCenterId?: string;
  contactId?: string;
}

export interface ResolveAlertRequest {
  resolvedByAgentId: string;
}

// ============================================================
// Pagination
// ============================================================

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
