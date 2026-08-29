// ============================================================
// Enums — exact matches to backend Java enums
// ============================================================

import type { DurationDraft } from "./duration"

export type { DurationDraft, DurationInput, DurationUnit } from "./duration"

export type PatientRole = "UNKNOWN" | "PATIENT" | "COMPANION"

export type PatientStatus = "UNENROLLED" | "ENROLLED"

export type PatientActivityStatus = "ACTIVE" | "INACTIVE" | "REACTIVE"

export type PatientHealthPhase =
  | "CANCER_DIAGNOSIS"
  | "ANNUAL_CHECKUP"
  | "SIGNS_AND_SYMPTOMS"

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
  | "HIGHER"

export type InsuranceType =
  | "SIS"
  | "ESSALUD"
  | "EPS"
  | "FUERZAS_ARMADAS"
  | "SALUDPOL"
  | "NONE"

export type EpsProvider =
  | "PACIFICO"
  | "RIMAC"
  | "MAPFRE"
  | "LA_POSITIVA"
  | "SANITAS"
  | "ONCOSALUD"
  | "OTHER"

export type CancerStage =
  | "STAGE_1"
  | "STAGE_2"
  | "STAGE_3"
  | "STAGE_4"
  | "UNKNOWN"

export type AvailabilityStatus = "AVAILABLE" | "RESERVED"

export type ReferralType =
  | "PSYCHIATRY"
  | "NEUROLOGY"
  | "CONTINUE_PSYCHOLOGY"
  | "PSYCHOONCOLOGIST"
  | "NONE"

export type UserRole = "ADMIN" | "FOUNDATION" | "AGENT" | "VOLUNTEER"

export type AffiliationType = "PATIENT" | "FAMILY"

export type CompanionContactRole = "PRIMARY" | "SECONDARY"

export type EnrollmentContactSource = "PATIENT" | "CALLER" | "NEW"

export type MedicalConsultationStatus =
  | "NOT_OBTAINED"
  | "SCHEDULED"
  | "ATTENDED"

export type PsychooncologySupportModality = "CALL" | "VIDEO_CALL"

export type AddressType = "PERMANENT" | "TEMPORARY"

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
  | "UCAYALI"

// ============================================================
// Auth
// ============================================================

export interface User {
  id: string
  email: string
  role: UserRole
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

// ============================================================
// Patients — requests
// ============================================================

export interface CreatePatientRequest {
  fullName: string
  dni?: string | null
  birthDate?: string | null
  gender?: string | null
  primaryPhone: string
  secondaryPhone?: string | null
  hasWhatsapp?: boolean
  role?: PatientRole
  status?: PatientStatus | null
  email?: string | null
}

export interface EnrollPatientDetailsRequest {
  birthDepartment?: string | null
  primaryHealthCenterId?: string | null
  travelTimeToHospital?: DurationDraft
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  zoneType?: string | null
  emergencyContactGender?: string | null
  educationLevel?: EducationLevel | null
  nativeLanguage?: string | null
  requiresTranslation?: boolean
  evidenceOfDomesticViolence?: boolean | null
  usesWoodStove?: boolean | null
  isWorking?: boolean | null
  receivesFinancialSupport?: boolean | null
  programDropoutReason?: string | null
  programDropoutDate?: string | null
  referredToSocialWorker?: boolean | null
  hasConadisCard?: boolean | null
  knowsAboutFissal?: boolean | null
  isDeceased?: boolean | null
}

export interface PsychooncologySupportAssessmentRequest {
  excessiveWorry?: boolean
  emotionalDistressScore?: number
  preferredModality?: PsychooncologySupportModality
}

export interface AddInsuranceRequest {
  insuranceType: InsuranceType
  epsProvider?: EpsProvider | null
  isCurrent: boolean
  changeReason?: string | null
  startDate?: string | null
  endDate?: string | null
}

export interface AddDiagnosisRequest {
  diagnosis: string
  cancerStage?: CancerStage | null
  diagnosisDate?: string | null
  firstSymptomsDate?: string | null
  healthCenterId?: string | null
  diagnosisSpecialty?: string | null
  symptomLeadingToCheckup?: string | null
  waitTimeForDiagnosis?: DurationDraft
  hasMedicalReport?: boolean
  isSepaActiveReferral?: boolean | null
  isCurrent: boolean
  changeReason?: string | null
}

export type TreatmentSituation =
  | "EN_CURSO"
  | "PENDIENTE_DE_INICIO"
  | "INTERRUMPIDO"
  | "FINALIZADO"
  | "SEARCHING"
  | "ABANDONED"
  | "DECEASED_DURING_TREATMENT"
  | "NOT_APPLICABLE"
  | "REMISSION"

export type CareProgram = "COPHOES" | "PADOMI"

export type MedicationDoseUnit =
  | "MG"
  | "G"
  | "ML"
  | "UI"
  | "TABLET"
  | "DROP"
  | "OTHER"
export type MedicationRoute =
  | "ORAL"
  | "IV"
  | "IM"
  | "SUBCUTANEOUS"
  | "TOPICAL"
  | "OTHER"

export interface AddTreatmentMedicationRequest {
  name: string
  doseAmount?: number
  doseUnit?: MedicationDoseUnit
  doseDescription?: string
  route?: MedicationRoute
  frequency?: DurationDraft
  startDate?: string
  endDate?: string
  isActive?: boolean
  notes?: string
}

export interface AddTreatmentRequest {
  diagnosisId: string
  treatmentType: string
  treatmentFrequency?: DurationDraft
  isReferred?: boolean
  sourceHealthCenterId?: string
  receivingHealthCenterId?: string
  startDate?: string | null
  endDate?: string | null
  isCurrent: boolean
  changeReason?: string | null
  notReceivingReason?: string | null
  /** UI-only flag; the API stores the operation name when present. */
  isOperation?: boolean
  treatmentSituation?: TreatmentSituation | null
  operationName?: string | null
  careProgram?: CareProgram | null
  receivesTeleconsultation?: boolean | null
  teleconsultationNote?: string | null
  teleconsultationSpecialties?: string[] | null
  treatmentAbandonmentReason?: string | null
  hasLatestPrescription?: boolean
  latestPrescriptionDate?: string | null
  medications?: AddTreatmentMedicationRequest[]
}

export interface AddMedicalAppointmentRequest {
  healthCenterId?: string | null
  specialty?: string | null
  appointmentDate?: string | null
  nextAppointmentDate?: string | null
  nextAppointmentSpecialty?: string | null
  hasReferralSheet?: boolean
  referredTo?: string | null
  referralNotProvidedReason?: string | null
  difficulties?: string | null
  isFirstConsultation?: boolean
}

export interface AddSisAffiliationRequest {
  canAffiliate: boolean
  affiliatedViaSepa?: boolean | null
  expectedDate?: string | null
  cantAffiliateReason?: string | null
  comments?: string | null
}

export type HealthBackgroundCause =
  | "DIAGNOSIS"
  | "TREATMENT"
  | "NATURAL_CONDITION"

export interface ActiveComorbidityRequest {
  conditionName: string
  treatmentDescription?: string
  followUpSpecialty?: string
}

export interface LimitationRequest {
  description: string
  cause: HealthBackgroundCause
}

export interface FamilyCancerHistoryRequest {
  relationship: string
  cancerType?: string
}

export interface HealthBackgroundAssessmentRequest {
  hasPsychiatry?: boolean | null
  activeComorbidities?: ActiveComorbidityRequest[]
  limitations?: LimitationRequest[]
  familyCancerHistory?: FamilyCancerHistoryRequest[]
}

export interface EnrollmentMetadataRequest {
  caseComments?: string | null
  startTime?: string | null
  endTime?: string | null
  dataPolicyAccepted?: boolean
  informedConsentAccepted?: boolean
  affiliationType?: AffiliationType
  isOncologicalPatient?: boolean
  programEntryPoint?: string | null
  currentlyAttendingConsultations?: boolean | null
  currentlyReceivingTreatment?: boolean | null
  surveyAccepted?: boolean
  agentId?: string | null
}

export interface SymptomReportRequest {
  hasDiscomfort?: boolean | null
  checkupMotivation?: string | null
  signsAndSymptoms?: string | null
  symptomDuration?: DurationDraft
  symptomFrequency?: DurationDraft
  hasSoughtMedicalConsultation?: boolean
  hasRequestedMedicalConsultation?: boolean | null
  consultationStatus?: MedicalConsultationStatus | null
  consultationNotObtainedReason?: string | null
  healthCenterId?: string | null
  specialty?: string | null
  indicationsReceived?: string | null
  diagnosisSearchDuration?: DurationDraft
  hasReceivedDiagnosis?: boolean | null
  reportedDiagnosis?: string | null
  isReceivingReportedTreatment?: boolean | null
  reportedTreatment?: string | null
  reportedTreatmentFrequency?: DurationDraft
  notReceivingTreatmentReason?: string | null
}

export interface EnrollmentAddressRequest {
  type: AddressType
  department?: PeruDepartment
  isPrimary?: boolean
  address?: string
  district?: string
  province?: string
  reference?: string
  locationUrl?: string
  dniMatchesAddress?: boolean
  validFrom?: string
  validTo?: string
}

export interface FamilyPreventionTalkInterestRequest {
  talkName: string
  familyMemberName: string
  familyMemberPhone: string
  familyMemberEmail: string
}

// ============================================================
// Volunteers
// ============================================================

export interface Volunteer {
  id: string
  userId: string
  firstName: string
  lastName: string
  specialty: string
  email: string
  phone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================
// Volunteer Availability
// ============================================================

export interface AvailabilitySlot {
  id: string
  volunteerId: string
  date: string
  startTime: string
  endTime: string
  status: AvailabilityStatus
}
