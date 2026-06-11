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
  companions: never[];
  enrollmentMetadata: EnrollmentMetadataRequest & {
    startTime?: string;
    endTime?: string;
    comments?: string;
    surveyAccepted?: boolean;
    surveyRating?: number;
    affiliationType?: string;
    isOncologicalPatient?: boolean;
    nombreTercero?: string;
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
  companions: [],
  enrollmentMetadata: {},
};

function normalizeDraft(draft: Partial<EnrollmentDraft> | undefined): EnrollmentDraft {
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
    companions: [],
    enrollmentMetadata: {
      ...DEFAULT_DRAFT.enrollmentMetadata,
      ...draft?.enrollmentMetadata,
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
