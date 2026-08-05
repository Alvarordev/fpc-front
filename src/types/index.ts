// ============================================================
// Enums — exact matches to backend Java enums
// ============================================================

export type PatientRole = "UNKNOWN" | "PATIENT" | "COMPANION"

export type PatientStatus = "PROSPECT" | "ENROLLED" | "ACTIVE" | "INACTIVE"

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
  primaryPhone: string
  secondaryPhone?: string | null
  hasWhatsapp?: boolean
  role?: PatientRole
  status?: PatientStatus | null
}

export interface EnrollPatientDetailsRequest {
  birthDepartment?: string | null
  currentAddress?: string | null
  currentDistrict?: string | null
  currentDepartment?: string | null
  dniMatchesAddress?: boolean | null
  travelTimeToHospital?: string | null
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
  healthCenterId?: string | null
  diagnosisSpecialty?: string | null
  symptomLeadingToCheckup?: string | null
  waitTimeForDiagnosis?: string | null
  hasMedicalReport?: boolean
  isCurrent: boolean
  changeReason?: string | null
}

export interface AddTreatmentRequest {
  diagnosisId: string
  treatmentType: string
  treatmentFrequency?: string | null
  healthCenterId?: string | null
  startDate?: string | null
  endDate?: string | null
  isCurrent: boolean
  changeReason?: string | null
  notReceivingReason?: string | null
  treatmentSituation?: string | null
}

export interface AddMedicalAppointmentRequest {
  healthCenterId?: string | null
  specialty?: string | null
  appointmentDate?: string | null
  nextAppointmentDate?: string | null
  hasReferralSheet?: boolean
  referredTo?: string | null
  difficulties?: string | null
  isFirstConsultation?: boolean
}

export interface AddSisAffiliationRequest {
  canAffiliate: boolean
  expectedDate?: string | null
  cantAffiliateReason?: string | null
  comments?: string | null
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
  surveyRating?: number | null
  agentId?: string | null
}

export interface SymptomReportRequest {
  hasDiscomfort?: boolean
  signsAndSymptoms?: string | null
  hasSoughtMedicalConsultation?: boolean
  healthCenterId?: string | null
  specialty?: string | null
  firstConsultationDetails?: string | null
  indicationsReceived?: string | null
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
