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
  EnrollmentContactSource,
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
  isCaregiver?: boolean
  isPrimaryContact?: boolean
}

export type EnrollmentContactDraft = CompanionDraft

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
  hasCaregiver?: boolean
}

export interface EnrollmentDraft {
  patientId: string | null
  patientData: CreatePatientRequest
  details: EnrollPatientDetailsRequest
  insurance: AddInsuranceRequest
  symptomReport: SymptomReportRequest
  diagnoses: EnrollmentDiagnosisDraft[]
  treatments: EnrollmentTreatmentDraft[]
  addresses: EnrollmentAddressRequest[]
  medicalAppointments: AddMedicalAppointmentRequest[]
  familyPreventionTalkInterests: FamilyPreventionTalkInterestRequest[]
  sisAffiliation: AddSisAffiliationRequest
  companion: CompanionDraft
  primaryContactSource?: EnrollmentContactSource
  primaryContact: EnrollmentContactDraft
  secondaryContactEnabled?: boolean
  secondaryContactSource?: EnrollmentContactSource
  secondaryContact: EnrollmentContactDraft
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
  draftId: string
  waitTimeForDiagnosisManuallyEdited?: boolean
}

export type EnrollmentTreatmentDraft = Omit<
  AddTreatmentRequest,
  "diagnosisId"
> & {
  draftId: string
  diagnosisRef: string
}

function newDraftId(prefix: string) {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  return `${prefix}-${id}`
}

export function createEnrollmentDiagnosisDraft(): EnrollmentDiagnosisDraft {
  return { draftId: newDraftId("diagnosis"), diagnosis: "", isCurrent: true }
}

export function createEnrollmentTreatmentDraft(
  diagnosisRef: string,
): EnrollmentTreatmentDraft {
  return {
    draftId: newDraftId("treatment"),
    diagnosisRef,
    treatmentType: "",
    isCurrent: true,
    isReferred: false,
  }
}

export const DEFAULT_DRAFT: EnrollmentDraft = {
  patientId: null,
  patientData: { fullName: "", primaryPhone: "" },
  details: {},
  insurance: { insuranceType: "SIS", isCurrent: true },
  symptomReport: {},
  diagnoses: [createEnrollmentDiagnosisDraft()],
  treatments: [],
  addresses: [],
  medicalAppointments: [],
  familyPreventionTalkInterests: [],
  sisAffiliation: { canAffiliate: true },
  companion: { fullName: "", primaryPhone: "" },
  primaryContactSource: undefined,
  primaryContact: { fullName: "", primaryPhone: "" },
  secondaryContactEnabled: false,
  secondaryContactSource: undefined,
  secondaryContact: { fullName: "", primaryPhone: "" },
  enrollmentMetadata: {},
}

function normalizeDraft(
  draft: Partial<EnrollmentDraft> | undefined,
): EnrollmentDraft {
  type LegacyDiagnosisDraft = Partial<EnrollmentDiagnosisDraft> & {
    waitTimeForDiagnosis?: unknown
  }
  type LegacyTreatmentDraft = Partial<EnrollmentTreatmentDraft> & {
    diagnosisId?: string
    healthCenterId?: unknown
    treatmentFrequency?: unknown
    treatmentSituation?: unknown
    medications?: unknown
  }
  type RawEnrollmentDraft = Partial<EnrollmentDraft> & {
    diagnosis?: LegacyDiagnosisDraft
    treatment?: LegacyTreatmentDraft
  }
  const raw = draft as RawEnrollmentDraft | undefined
  // Legacy drafts (persisted before the companion step was expanded) stored the
  // companion's name/phone as loose strings on enrollmentMetadata — migrate them
  // into `companion` so in-progress work isn't lost.
  const legacyMeta = raw?.enrollmentMetadata as
    | (EnrollmentDraft["enrollmentMetadata"] & {
        nombreTercero?: string
        telefonoTercero?: string
        surveyRating?: number
      })
    | undefined
  const migratedCompanion: Partial<CompanionDraft> = {}
  if (!raw?.companion && legacyMeta?.nombreTercero)
    migratedCompanion.fullName = legacyMeta.nombreTercero
  if (!raw?.companion && legacyMeta?.telefonoTercero)
    migratedCompanion.primaryPhone = legacyMeta.telefonoTercero
  const restMeta = { ...legacyMeta }
  delete restMeta.nombreTercero
  delete restMeta.telefonoTercero
  delete restMeta.surveyRating
  const enrollmentNotes = normalizeEnrollmentNotes(
    legacyMeta?.enrollmentNotes,
    legacyMeta?.comments,
  )

  const legacyCompanion = {
    ...DEFAULT_DRAFT.companion,
    ...migratedCompanion,
    ...raw?.companion,
  }
  const rawPrimarySource = raw?.primaryContactSource
  const inferredPrimarySource =
    rawPrimarySource ??
    (legacyCompanion.fullName.trim()
      ? legacyMeta?.affiliationType === "FAMILY"
        ? "CALLER"
        : legacyMeta?.hasCaregiver === true
          ? "NEW"
          : undefined
      : undefined)
  const inferredPrimaryContact =
    raw?.primaryContact ??
    (inferredPrimarySource === "NEW"
      ? legacyCompanion
      : DEFAULT_DRAFT.primaryContact)

  const legacyDetails = raw?.details as
    | (EnrollmentDraft["details"] & {
        currentAddress?: string | null
        currentDistrict?: string | null
        currentDepartment?: string | null
        dniMatchesAddress?: boolean | null
        travelTimeToHospital?: unknown
      })
    | undefined
  const migratedAddresses =
    raw?.addresses ??
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
  const legacyDiagnosis = raw?.diagnosis
  const legacyTreatment = raw?.treatment
  const legacySymptoms = draft?.symptomReport as
    | (EnrollmentDraft["symptomReport"] & {
        symptomDuration?: unknown
        symptomFrequency?: unknown
        diagnosisSearchDuration?: unknown
        reportedTreatmentFrequency?: unknown
      })
    | undefined
  const oldTreatmentSituation: Record<
    string,
    EnrollmentTreatmentDraft["treatmentSituation"]
  > = {
    "En curso": "EN_CURSO",
    "Por iniciar": "PENDIENTE_DE_INICIO",
    "Suspendido temporalmente": "INTERRUMPIDO",
    Finalizado: "FINALIZADO",
    "En evaluación": "PENDIENTE_DE_INICIO",
  }
  const normalizeMedications = (
    medications: unknown,
  ): EnrollmentTreatmentDraft["medications"] =>
    Array.isArray(medications)
      ? medications.map((medication) => {
          const item = medication as Record<string, unknown>
          return {
            name: typeof item.name === "string" ? item.name : "",
            doseAmount:
              typeof item.doseAmount === "number" ? item.doseAmount : undefined,
            doseUnit: item.doseUnit as NonNullable<
              EnrollmentTreatmentDraft["medications"]
            >[number]["doseUnit"],
            doseDescription:
              typeof item.doseDescription === "string"
                ? item.doseDescription
                : undefined,
            route: item.route as NonNullable<
              EnrollmentTreatmentDraft["medications"]
            >[number]["route"],
            frequency: normalizeDuration(item.frequency),
            startDate:
              typeof item.startDate === "string" ? item.startDate : undefined,
            endDate:
              typeof item.endDate === "string" ? item.endDate : undefined,
            isActive:
              typeof item.isActive === "boolean" ? item.isActive : undefined,
            notes: typeof item.notes === "string" ? item.notes : undefined,
          }
        })
      : undefined

  const diagnosisInputs = Array.isArray(raw?.diagnoses)
    ? raw.diagnoses.length
      ? raw.diagnoses
      : DEFAULT_DRAFT.diagnoses
    : legacyDiagnosis
      ? [legacyDiagnosis]
      : DEFAULT_DRAFT.diagnoses
  const diagnoses = diagnosisInputs.map((diagnosis, index) => ({
    ...createEnrollmentDiagnosisDraft(),
    ...diagnosis,
    draftId: diagnosis.draftId ?? `diagnosis-${index + 1}`,
    waitTimeForDiagnosis: normalizeDuration(diagnosis.waitTimeForDiagnosis),
  }))

  const hasLegacyTreatmentData = Boolean(
    legacyTreatment &&
      Object.entries(legacyTreatment).some(([key, value]) => {
        if (key === "diagnosisId" || key === "isCurrent") return false
        if (value == null) return false
        if (typeof value === "string") return value.trim().length > 0
        if (Array.isArray(value)) return value.length > 0
        return true
      }),
  )
  const treatmentInputs = Array.isArray(raw?.treatments)
    ? raw.treatments
    : hasLegacyTreatmentData
      ? [legacyTreatment!]
      : []
  const treatments = treatmentInputs.map((treatment, index) => {
    const legacy = treatment as LegacyTreatmentDraft
    const healthCenterId = legacy.healthCenterId
    const treatmentValues = { ...legacy }
    delete treatmentValues.diagnosisId
    delete treatmentValues.healthCenterId
    return {
      ...treatmentValues,
      draftId: legacy.draftId ?? `treatment-${index + 1}`,
      diagnosisRef: legacy.diagnosisRef ?? diagnoses[0]?.draftId ?? "",
      ...(typeof healthCenterId === "string" &&
      legacy.receivingHealthCenterId === undefined
        ? { receivingHealthCenterId: healthCenterId }
        : {}),
      treatmentFrequency: normalizeDuration(legacy.treatmentFrequency),
      treatmentSituation:
        oldTreatmentSituation[String(legacy.treatmentSituation)] ??
        (legacy.treatmentSituation as EnrollmentTreatmentDraft["treatmentSituation"]),
      medications: normalizeMedications(legacy.medications),
    }
  }) as EnrollmentTreatmentDraft[]

  const draftWithoutLegacyClinicalRecords = { ...(raw ?? {}) }
  delete (draftWithoutLegacyClinicalRecords as Record<string, unknown>)
    .diagnosis
  delete (draftWithoutLegacyClinicalRecords as Record<string, unknown>)
    .treatment

  return {
    ...DEFAULT_DRAFT,
    ...draftWithoutLegacyClinicalRecords,
    patientData: { ...DEFAULT_DRAFT.patientData, ...raw?.patientData },
    details: {
      ...DEFAULT_DRAFT.details,
      ...raw?.details,
      travelTimeToHospital: normalizeDuration(
        legacyDetails?.travelTimeToHospital,
      ),
    },
    insurance: { ...DEFAULT_DRAFT.insurance, ...draft?.insurance },
    symptomReport: {
      ...DEFAULT_DRAFT.symptomReport,
      ...raw?.symptomReport,
      symptomDuration: normalizeDuration(legacySymptoms?.symptomDuration),
      symptomFrequency: normalizeDuration(legacySymptoms?.symptomFrequency),
      diagnosisSearchDuration: normalizeDuration(
        legacySymptoms?.diagnosisSearchDuration,
      ),
      reportedTreatmentFrequency: normalizeDuration(
        legacySymptoms?.reportedTreatmentFrequency,
      ),
    },
    diagnoses,
    treatments,
    addresses: migratedAddresses,
    medicalAppointments: raw?.medicalAppointments ?? [],
    familyPreventionTalkInterests: raw?.familyPreventionTalkInterests ?? [],
    sisAffiliation: {
      ...DEFAULT_DRAFT.sisAffiliation,
      ...raw?.sisAffiliation,
    },
    companion: legacyCompanion,
    primaryContactSource: inferredPrimarySource,
    primaryContact: {
      ...DEFAULT_DRAFT.primaryContact,
      ...inferredPrimaryContact,
      ...(raw?.primaryContact ?? {}),
    },
    secondaryContactEnabled: raw?.secondaryContactEnabled ?? false,
    secondaryContactSource: raw?.secondaryContactSource,
    secondaryContact: {
      ...DEFAULT_DRAFT.secondaryContact,
      ...raw?.secondaryContact,
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
      version: 4,
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<EnrollmentState> | undefined
        return {
          ...persisted,
          draft: normalizeDraft(persisted?.draft),
          categoriaClinica: normalizeCategoriaClinica(
            persisted?.categoriaClinica,
          ),
        }
      },
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
