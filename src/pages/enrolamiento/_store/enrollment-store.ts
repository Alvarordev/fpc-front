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
  LinkCompanionRequest,
  EnrollmentMetadataRequest,
} from "@/types";

export const TOTAL_STEPS = 6;

export const STEP_LABELS: Record<number, string> = {
  1: "Inicio",
  2: "Paciente",
  3: "Demográficos",
  4: "Seguro",
  5: "Diagnóstico",
  6: "Cierre",
};

export interface EnrollmentDraft {
  patientId: string | null;
  patientData: CreatePatientRequest;
  details: EnrollPatientDetailsRequest;
  insurance: AddInsuranceRequest;
  symptomReport: SymptomReportRequest;
  diagnosis: AddDiagnosisRequest;
  treatment: AddTreatmentRequest;
  medicalAppointments: AddMedicalAppointmentRequest[];
  sisAffiliation: AddSisAffiliationRequest;
  companions: LinkCompanionRequest[];
  enrollmentMetadata: EnrollmentMetadataRequest;
}

export const DEFAULT_DRAFT: EnrollmentDraft = {
  patientId: null,
  patientData: { fullName: "", primaryPhone: "" },
  details: {},
  insurance: { insuranceType: "SIS", isCurrent: true },
  symptomReport: {},
  diagnosis: { diagnosis: "", isCurrent: true },
  treatment: { diagnosisId: "00000000-0000-0000-0000-000000000000", treatmentType: "", isCurrent: true },
  medicalAppointments: [],
  sisAffiliation: { canAffiliate: true },
  companions: [],
  enrollmentMetadata: {},
};

interface EnrollmentState {
  currentStep: number;
  draft: EnrollmentDraft;
  isSubmitting: boolean;

  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateDraft: (partial: Partial<EnrollmentDraft>) => void;
  setSubmitting: (v: boolean) => void;
  reset: () => void;
}

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set) => ({
      currentStep: 1,
      draft: { ...DEFAULT_DRAFT },
      isSubmitting: false,

      goToStep: (step) =>
        set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),

      nextStep: () =>
        set((s) => ({
          currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS),
        })),

      prevStep: () =>
        set((s) => ({
          currentStep: Math.max(s.currentStep - 1, 1),
        })),

      updateDraft: (partial) =>
        set((s) => ({
          draft: { ...s.draft, ...partial },
        })),

      setSubmitting: (v) => set({ isSubmitting: v }),

      reset: () =>
        set({
          currentStep: 1,
          draft: { ...DEFAULT_DRAFT },
          isSubmitting: false,
        }),
    }),
    { name: "fpc-enrollment-draft" },
  ),
);
