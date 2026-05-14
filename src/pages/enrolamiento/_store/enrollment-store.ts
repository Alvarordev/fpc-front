import { create } from "zustand";
import { persist } from "zustand/middleware";

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

export type Q27Branch =
  | "signos_seguro" | "signos_eps" | "signos_privado" | "signos_noseguro"
  | "dx_seguro" | "dx_eps" | "dx_privado" | "dx_noseguro"
  | "psico" | "fpc" | "otros";

export type RejectionReason = "q3_no" | "q8_no" | "q27_privado";

export const Q27_BRANCH_MAP: Record<string, Q27Branch> = {
  "Signos y Síntomas / Seguro": "signos_seguro",
  "Signos y Sintomas / EPS-ESSALUD": "signos_eps",
  "Signos y Sintomas / Privado": "signos_privado",
  "Signos y Síntomas / No Seguro": "signos_noseguro",
  "Diagnóstico de Cáncer / Seguro": "dx_seguro",
  "Diagnostico de Cancer / EPS-ESSALUD": "dx_eps",
  "Diagnostico de Cancer / Privado": "dx_privado",
  "Diagnóstico de Cáncer / No Seguro": "dx_noseguro",
  "Servicio Psicooncológico": "psico",
  "Servicios FPC": "fpc",
  Otros: "otros",
};

export const BRANCH_LABELS: Record<Q27Branch, string> = {
  signos_seguro: "Signos y Síntomas / Seguro",
  signos_eps: "Signos y Síntomas / EPS-EsSalud",
  signos_privado: "Signos y Síntomas / Privado",
  signos_noseguro: "Signos y Síntomas / Sin Seguro",
  dx_seguro: "Diagnóstico de Cáncer / Seguro",
  dx_eps: "Diagnóstico de Cáncer / EPS-EsSalud",
  dx_privado: "Diagnóstico de Cáncer / Privado",
  dx_noseguro: "Diagnóstico de Cáncer / Sin Seguro",
  psico: "Servicio Psicooncológico",
  fpc: "Servicios FPC",
  otros: "Otros",
};

export const PERU_DEPARTAMENTOS = [
  "AMAZONAS", "ANCASH", "APURIMAC", "AREQUIPA", "AYACUCHO", "CAJAMARCA",
  "CALLAO", "CUSCO", "HUANCAVELICA", "HUANUCO", "ICA", "JUNIN",
  "LA LIBERTAD", "LAMBAYEQUE", "LIMA", "LORETO", "MADRE DE DIOS",
  "MOQUEGUA", "PASCO", "PIURA", "PUNO", "SAN MARTIN", "TACNA", "TUMBES", "UCAYALI",
];

export interface EnrollmentFormData { [key: string]: string }

interface EnrollmentState {
  currentStep: number;
  rejectionReason: RejectionReason | null;
  formData: Partial<EnrollmentFormData>;
  isComplete: boolean;
  prospectoId: string | null;

  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  saveStepData: (data: Partial<EnrollmentFormData>) => void;
  setRejection: (reason: RejectionReason) => void;
  clearRejection: () => void;
  completeEnrollment: () => void;
  resetEnrollment: () => void;
  setProspectoId: (id: string | null) => void;
}

const initialState = {
  currentStep: 1,
  rejectionReason: null as RejectionReason | null,
  formData: {} as Partial<EnrollmentFormData>,
  isComplete: false,
  prospectoId: null as string | null,
};

export const useEnrollmentStore = create<EnrollmentState>()(
  persist(
    (set) => ({
      ...initialState,
      goToStep: (step) => set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),
      nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS) })),
      prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
      saveStepData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
      setRejection: (reason) => set({ rejectionReason: reason }),
      clearRejection: () => set({ rejectionReason: null }),
      completeEnrollment: () => set({ isComplete: true }),
      resetEnrollment: () => set(initialState),
      setProspectoId: (id) => set({ prospectoId: id }),
    }),
    { name: "fpc-enrollment-draft" },
  ),
);
