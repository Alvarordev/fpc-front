import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
  CreatePatientRequest,
  EnrollPatientDetailsRequest,
  AddInsuranceRequest,
  SymptomReportRequest,
  AddDiagnosisRequest,
  AddTreatmentRequest,
  AddMedicalAppointmentRequest,
  AddSisAffiliationRequest,
  EnrollmentAddressRequest,
  FamilyPreventionTalkInterestRequest,
  EnrollmentMetadataRequest,
  PatientHealthPhase,
} from "@/types"
import { normalizeDuration } from "@/types/duration"

export const TOTAL_STEPS = 8

export const STEP_LABELS: Record<number, string> = {
  1: "Inicio",
  2: "Datos",
  3: "Identificación",
  4: "Consentimiento",
  5: "Paciente",
  6: "Categorización",
  7: "Atención",
  8: "Cierre",
}

export type CategoriaClinica = Exclude<
  PatientHealthPhase,
  "ANNUAL_CHECKUP"
> | null

export type RejectionReason = "q3_no" | "q8_no"

export interface CompanionDraft {
  fullName: string
  primaryPhone: string
  secondaryPhone?: string
  dni?: string
  birthDate?: string
  gender?: string
  email?: string
  hasWhatsapp?: boolean
  relationship?: string
}

export interface EnrollmentNoteDraft {
  text: string
}

export type EnrollmentMetadataDraft = EnrollmentMetadataRequest & {
  startTime?: string
  endTime?: string
  comments?: string
  enrollmentNotes?: EnrollmentNoteDraft[]
  surveyAccepted?: boolean
  affiliationType?: string
  isOncologicalPatient?: boolean
  assignedAgentId?: string
}

export interface EnrollmentDraft {
  patientId: string | null
  patientData: CreatePatientRequest
  details: EnrollPatientDetailsRequest
  insurance: AddInsuranceRequest
  symptomReport: SymptomReportRequest
  diagnosis: EnrollmentDiagnosisDraft
  treatment: AddTreatmentRequest
  addresses: EnrollmentAddressRequest[]
  medicalAppointments: AddMedicalAppointmentRequest[]
  familyPreventionTalkInterests: FamilyPreventionTalkInterestRequest[]
  sisAffiliation: AddSisAffiliationRequest
  companion: CompanionDraft
  enrollmentMetadata: EnrollmentMetadataDraft
}

export function serializeEnrollmentNotes(notes: EnrollmentNoteDraft[]) {
  return notes
    .map((note) => note.text.trim())
    .filter(Boolean)
    .join("\n\n")
}

export function getEnrollmentNotes(metadata: EnrollmentMetadataDraft) {
  if (metadata.enrollmentNotes?.length) return metadata.enrollmentNotes

  const legacyComment = metadata.comments?.trim()
  return legacyComment ? [{ text: legacyComment }] : []
}

export function getEnrollmentComments(metadata: EnrollmentMetadataDraft) {
  const serializedNotes = metadata.enrollmentNotes?.length
    ? serializeEnrollmentNotes(metadata.enrollmentNotes)
    : ""
  return serializedNotes || metadata.comments?.trim() || undefined
}

export type EnrollmentDiagnosisDraft = AddDiagnosisRequest & {
  waitTimeForDiagnosisManuallyEdited?: boolean
}

const PLACEHOLDER_DIAGNOSIS_ID = "00000000-0000-0000-0000-000000000000"

export const DEFAULT_DRAFT: EnrollmentDraft = {
  patientId: null,
  patientData: { fullName: "", primaryPhone: "" },
  details: {},
  insurance: { insuranceType: "SIS", isCurrent: true },
  symptomReport: {},
  diagnosis: { diagnosis: "", isCurrent: true },
  treatment: {
    diagnosisId: PLACEHOLDER_DIAGNOSIS_ID,
    treatmentType: "",
    isCurrent: true,
  },
  addresses: [],
  medicalAppointments: [],
  familyPreventionTalkInterests: [],
  sisAffiliation: { canAffiliate: true },
  companion: { fullName: "", primaryPhone: "" },
  enrollmentMetadata: {},
}

function normalizeDraft(
  draft: Partial<EnrollmentDraft> | undefined,
): EnrollmentDraft {
  // Legacy drafts (persisted before the companion step was expanded) stored the
  // companion's name/phone as loose strings on enrollmentMetadata — migrate them
  // into `companion` so in-progress work isn't lost.
  const legacyMeta = draft?.enrollmentMetadata as
    | (EnrollmentDraft["enrollmentMetadata"] & {
        nombreTercero?: string
        telefonoTercero?: string
        surveyRating?: number
      })
    | undefined
  const migratedCompanion: Partial<CompanionDraft> = {}
  if (!draft?.companion && legacyMeta?.nombreTercero)
    migratedCompanion.fullName = legacyMeta.nombreTercero
  if (!draft?.companion && legacyMeta?.telefonoTercero)
    migratedCompanion.primaryPhone = legacyMeta.telefonoTercero
  const restMeta = { ...legacyMeta }
  delete restMeta.nombreTercero
  delete restMeta.telefonoTercero
  delete restMeta.surveyRating
  const enrollmentNotes = normalizeEnrollmentNotes(
    legacyMeta?.enrollmentNotes,
    legacyMeta?.comments,
  )

  const legacyDetails = draft?.details as
    | (EnrollmentDraft["details"] & {
        currentAddress?: string | null
        currentDistrict?: string | null
        currentDepartment?: string | null
        dniMatchesAddress?: boolean | null
        travelTimeToHospital?: unknown
      })
    | undefined
  const migratedAddresses =
    draft?.addresses ??
    (legacyDetails?.currentAddress ||
    legacyDetails?.currentDistrict ||
    legacyDetails?.currentDepartment
      ? [
          {
            type: "PERMANENT" as const,
            isPrimary: true,
            address: legacyDetails.currentAddress ?? undefined,
            district: legacyDetails.currentDistrict ?? undefined,
            department: undefined,
            dniMatchesAddress: legacyDetails.dniMatchesAddress ?? undefined,
          },
        ]
      : [])
  const legacyDiagnosis = draft?.diagnosis as
    | (EnrollmentDraft["diagnosis"] & {
        waitTimeForDiagnosis?: unknown
      })
    | undefined
  const legacyTreatment = draft?.treatment as
    | (EnrollmentDraft["treatment"] & {
        healthCenterId?: unknown
        treatmentFrequency?: unknown
        treatmentSituation?: unknown
        medications?: Array<{
          name?: unknown
          doseAmount?: unknown
          doseUnit?: unknown
          doseDescription?: unknown
          route?: unknown
          frequency?: unknown
          startDate?: unknown
          endDate?: unknown
          isActive?: unknown
          notes?: unknown
        }>
      })
    | undefined
  const legacySymptoms = draft?.symptomReport as
    | (EnrollmentDraft["symptomReport"] & {
        symptomDuration?: unknown
        symptomFrequency?: unknown
      })
    | undefined
  const oldTreatmentSituation: Record<
    string,
    EnrollmentDraft["treatment"]["treatmentSituation"]
  > = {
    "En curso": "EN_CURSO",
    "Por iniciar": "PENDIENTE_DE_INICIO",
    "Suspendido temporalmente": "INTERRUMPIDO",
    Finalizado: "FINALIZADO",
    "En evaluación": "PENDIENTE_DE_INICIO",
  }
  type MedicationDraft = NonNullable<
    EnrollmentDraft["treatment"]["medications"]
  >[number]
  const migratedMedications: MedicationDraft[] | undefined =
    legacyTreatment?.medications?.map((medication) => ({
      name: typeof medication.name === "string" ? medication.name : "",
      doseAmount:
        typeof medication.doseAmount === "number"
          ? medication.doseAmount
          : undefined,
      doseUnit: medication.doseUnit as MedicationDraft["doseUnit"],
      doseDescription:
        typeof medication.doseDescription === "string"
          ? medication.doseDescription
          : undefined,
      route: medication.route as MedicationDraft["route"],
      frequency: normalizeDuration(medication.frequency),
      startDate:
        typeof medication.startDate === "string"
          ? medication.startDate
          : undefined,
      endDate:
        typeof medication.endDate === "string" ? medication.endDate : undefined,
      isActive:
        typeof medication.isActive === "boolean"
          ? medication.isActive
          : undefined,
      notes:
        typeof medication.notes === "string" ? medication.notes : undefined,
    }))

  return {
    ...DEFAULT_DRAFT,
    ...draft,
    patientData: { ...DEFAULT_DRAFT.patientData, ...draft?.patientData },
    details: {
      ...DEFAULT_DRAFT.details,
      ...draft?.details,
      travelTimeToHospital: normalizeDuration(
        legacyDetails?.travelTimeToHospital,
      ),
    },
    insurance: { ...DEFAULT_DRAFT.insurance, ...draft?.insurance },
    symptomReport: {
      ...DEFAULT_DRAFT.symptomReport,
      ...draft?.symptomReport,
      symptomDuration: normalizeDuration(legacySymptoms?.symptomDuration),
      symptomFrequency: normalizeDuration(legacySymptoms?.symptomFrequency),
    },
    diagnosis: {
      ...DEFAULT_DRAFT.diagnosis,
      ...draft?.diagnosis,
      waitTimeForDiagnosis: normalizeDuration(
        legacyDiagnosis?.waitTimeForDiagnosis,
      ),
    },
    treatment: {
      ...DEFAULT_DRAFT.treatment,
      ...draft?.treatment,
      ...(typeof legacyTreatment?.healthCenterId === "string" &&
      legacyTreatment.receivingHealthCenterId === undefined
        ? { receivingHealthCenterId: legacyTreatment.healthCenterId }
        : {}),
      treatmentFrequency: normalizeDuration(
        legacyTreatment?.treatmentFrequency,
      ),
      treatmentSituation:
        oldTreatmentSituation[String(legacyTreatment?.treatmentSituation)] ??
        (legacyTreatment?.treatmentSituation as
          | EnrollmentDraft["treatment"]["treatmentSituation"]
          | undefined),
      medications: migratedMedications,
    },
    addresses: migratedAddresses,
    medicalAppointments: draft?.medicalAppointments ?? [],
    familyPreventionTalkInterests: draft?.familyPreventionTalkInterests ?? [],
    sisAffiliation: {
      ...DEFAULT_DRAFT.sisAffiliation,
      ...draft?.sisAffiliation,
    },
    companion: {
      ...DEFAULT_DRAFT.companion,
      ...migratedCompanion,
      ...draft?.companion,
    },
    enrollmentMetadata: {
      ...DEFAULT_DRAFT.enrollmentMetadata,
      ...restMeta,
      comments: enrollmentNotes.length
        ? serializeEnrollmentNotes(enrollmentNotes)
        : restMeta.comments,
      enrollmentNotes,
    },
  }
}

function normalizeEnrollmentNotes(
  notes: unknown,
  legacyComments: unknown,
): EnrollmentNoteDraft[] {
  const normalizedNotes = Array.isArray(notes)
    ? notes.flatMap((note) => {
        if (!note || typeof note !== "object") return []
        const record = note as Record<string, unknown>
        if (typeof record.text !== "string" || !record.text.trim()) return []
        return [{ text: record.text.trim() }]
      })
    : []

  if (normalizedNotes.length) return normalizedNotes
  if (typeof legacyComments === "string" && legacyComments.trim()) {
    return legacyComments
      .trim()
      .split(/\n\n+/)
      .map((comment) => comment.replace(/^\[[^\]\n]+\]\n/, "").trim())
      .filter(Boolean)
      .map((text) => ({ text }))
  }
  return []
}

function normalizeCategoriaClinica(value: unknown): CategoriaClinica {
  if (value === "signos") return "SIGNS_AND_SYMPTOMS"
  if (value === "diagnostico") return "CANCER_DIAGNOSIS"
  if (value === "SIGNS_AND_SYMPTOMS" || value === "CANCER_DIAGNOSIS") {
    return value
  }
  return null
}

interface EnrollmentState {
  currentStep: number
  draft: EnrollmentDraft
  rejectionReason: RejectionReason | null
  categoriaClinica: CategoriaClinica
  isComplete: boolean
  isSubmitting: boolean

  goToStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  updateDraft: (partial: Partial<EnrollmentDraft>) => void
  setRejection: (reason: RejectionReason) => void
  clearRejection: () => void
  setCategoria: (cat: CategoriaClinica) => void
  completeEnrollment: () => void
  resetEnrollment: () => void
  setSubmitting: (v: boolean) => void
}

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set) => ({
      currentStep: 1,
      draft: { ...DEFAULT_DRAFT },
      rejectionReason: null,
      categoriaClinica: null,
      isComplete: false,
      isSubmitting: false,

      goToStep: (step) =>
        set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),
      nextStep: () =>
        set((s) => ({ currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS) })),
      prevStep: () =>
        set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

      updateDraft: (partial) =>
        set((s) => ({ draft: normalizeDraft({ ...s.draft, ...partial }) })),

      setRejection: (reason) => set({ rejectionReason: reason }),
      clearRejection: () => set({ rejectionReason: null }),
      setCategoria: (cat) => set({ categoriaClinica: cat }),

      completeEnrollment: () => set({ isComplete: true }),
      resetEnrollment: () =>
        set({
          currentStep: 1,
          draft: normalizeDraft(DEFAULT_DRAFT),
          rejectionReason: null,
          categoriaClinica: null,
          isComplete: false,
          isSubmitting: false,
        }),
      setSubmitting: (v) => set({ isSubmitting: v }),
    }),
    {
      name: "fpc-enrollment-draft",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<EnrollmentState> | undefined
        return {
          ...currentState,
          ...persisted,
          draft: normalizeDraft(persisted?.draft),
          categoriaClinica: normalizeCategoriaClinica(
            persisted?.categoriaClinica,
          ),
        }
      },
    },
  ),
)
