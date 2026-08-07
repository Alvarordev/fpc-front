import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CreatePatientRequest,
  EnrollPatientDetailsRequest,
  AddInsuranceRequest,
  SymptomReportRequest,
  AddDiagnosisRequest,
  AddTreatmentRequest,
  AddMedicalAppointmentRequest,
  AddSisAffiliationRequest,
  FamilyPreventionTalkInterestRequest,
  EnrollmentMetadataRequest,
} from "@/types";

export const TOTAL_STEPS = 8;

export const STEP_LABELS: Record<number, string> = {
  1: "Inicio",
  2: "Datos",
  3: "Identificación",
  4: "Consentimiento",
  5: "Paciente",
  6: "Categorización",
  7: "Atención",
  8: "Cierre",
};

export type CategoriaClinica = "signos" | "diagnostico" | null;

export type RejectionReason = "q3_no" | "q8_no";

export interface CompanionDraft {
  fullName: string;
  primaryPhone: string;
  secondaryPhone?: string;
  dni?: string;
  birthDate?: string;
  gender?: string;
  email?: string;
  hasWhatsapp?: boolean;
  relationship?: string;
}

export interface EnrollmentDraft {
  patientId: string | null;
  patientData: CreatePatientRequest;
  details: EnrollPatientDetailsRequest;
  insurance: AddInsuranceRequest;
  symptomReport: SymptomReportRequest;
  diagnosis: AddDiagnosisRequest;
  treatment: AddTreatmentRequest;
  medicalAppointments: AddMedicalAppointmentRequest[];
  familyPreventionTalkInterests: FamilyPreventionTalkInterestRequest[];
  sisAffiliation: AddSisAffiliationRequest;
  companion: CompanionDraft;
  enrollmentMetadata: EnrollmentMetadataRequest & {
    startTime?: string;
    endTime?: string;
    comments?: string;
    surveyAccepted?: boolean;
    surveyRating?: number;
    affiliationType?: string;
    isOncologicalPatient?: boolean;
    assignedAgentId?: string;
  };
}

const PLACEHOLDER_DIAGNOSIS_ID = "00000000-0000-0000-0000-000000000000";

export const DEFAULT_DRAFT: EnrollmentDraft = {
  patientId: null,
  patientData: { fullName: "", primaryPhone: "" },
  details: {},
  insurance: { insuranceType: "SIS", isCurrent: true },
  symptomReport: {},
  diagnosis: { diagnosis: "", isCurrent: true },
  treatment: { diagnosisId: PLACEHOLDER_DIAGNOSIS_ID, treatmentType: "", isCurrent: true },
  medicalAppointments: [],
  familyPreventionTalkInterests: [],
  sisAffiliation: { canAffiliate: true },
  companion: { fullName: "", primaryPhone: "" },
  enrollmentMetadata: {},
};

function normalizeDraft(draft: Partial<EnrollmentDraft> | undefined): EnrollmentDraft {
  // Legacy drafts (persisted before the companion step was expanded) stored the
  // companion's name/phone as loose strings on enrollmentMetadata — migrate them
  // into `companion` so in-progress work isn't lost.
  const legacyMeta = draft?.enrollmentMetadata as
    | (EnrollmentDraft["enrollmentMetadata"] & { nombreTercero?: string; telefonoTercero?: string })
    | undefined;
  const migratedCompanion: Partial<CompanionDraft> = {};
  if (!draft?.companion && legacyMeta?.nombreTercero) migratedCompanion.fullName = legacyMeta.nombreTercero;
  if (!draft?.companion && legacyMeta?.telefonoTercero) migratedCompanion.primaryPhone = legacyMeta.telefonoTercero;
  const restMeta = { ...legacyMeta };
  delete restMeta.nombreTercero;
  delete restMeta.telefonoTercero;

  return {
    ...DEFAULT_DRAFT,
    ...draft,
    patientData: { ...DEFAULT_DRAFT.patientData, ...draft?.patientData },
    details: { ...DEFAULT_DRAFT.details, ...draft?.details },
    insurance: { ...DEFAULT_DRAFT.insurance, ...draft?.insurance },
    symptomReport: { ...DEFAULT_DRAFT.symptomReport, ...draft?.symptomReport },
    diagnosis: { ...DEFAULT_DRAFT.diagnosis, ...draft?.diagnosis },
    treatment: { ...DEFAULT_DRAFT.treatment, ...draft?.treatment },
    medicalAppointments: draft?.medicalAppointments ?? [],
    familyPreventionTalkInterests: draft?.familyPreventionTalkInterests ?? [],
    sisAffiliation: { ...DEFAULT_DRAFT.sisAffiliation, ...draft?.sisAffiliation },
    companion: { ...DEFAULT_DRAFT.companion, ...migratedCompanion, ...draft?.companion },
    enrollmentMetadata: {
      ...DEFAULT_DRAFT.enrollmentMetadata,
      ...restMeta,
    },
  };
}

interface EnrollmentState {
  currentStep: number;
  draft: EnrollmentDraft;
  rejectionReason: RejectionReason | null;
  categoriaClinica: CategoriaClinica;
  isComplete: boolean;
  isSubmitting: boolean;

  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateDraft: (partial: Partial<EnrollmentDraft>) => void;
  setRejection: (reason: RejectionReason) => void;
  clearRejection: () => void;
  setCategoria: (cat: CategoriaClinica) => void;
  completeEnrollment: () => void;
  resetEnrollment: () => void;
  setSubmitting: (v: boolean) => void;
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

      goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

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
        const persisted = persistedState as Partial<EnrollmentState> | undefined;
        return {
          ...currentState,
          ...persisted,
          draft: normalizeDraft(persisted?.draft),
        };
      },
    },
  ),
);
