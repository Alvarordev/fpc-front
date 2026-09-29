import type {
  CreatePatientDiagnosisInput,
  CreatePatientInsuranceInput,
  PatientDetailsInput,
  PatientDetailsResponse,
} from "@/api/patients"
import type {
  MedicationDoseUnit,
  MedicationRoute,
} from "@/types"

export type CancerStage = NonNullable<
  CreatePatientDiagnosisInput["cancerStage"]
>
export type InsuranceType = CreatePatientInsuranceInput["insuranceType"]
export type EpsProvider = NonNullable<
  CreatePatientInsuranceInput["epsProvider"]
>
export type EducationLevel = NonNullable<PatientDetailsInput["educationLevel"]>

/** Tailwind classes for a stage severity badge, from mild (1) to severe (4/unknown). */
export const cancerStageBadgeClass: Record<CancerStage, string> = {
  STAGE_1: "bg-emerald-50 text-emerald-700 border-emerald-200",
  STAGE_2: "bg-amber-50 text-amber-700 border-amber-200",
  STAGE_3: "bg-orange-50 text-orange-700 border-orange-200",
  STAGE_4: "bg-red-50 text-red-700 border-red-200",
  UNKNOWN: "bg-muted text-muted-foreground border-transparent",
}

export const genderLabels: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  OTHER: "Otro",
}

export const roleLabels: Record<PatientDetailsResponse["role"], string> = {
  UNKNOWN: "Sin definir",
  PATIENT: "Paciente",
  COMPANION: "Acompañante",
}

/** Catálogo alineado al PDF de observaciones CRM (parentesco de contactos). */
export const relationshipLabels: Record<string, string> = {
  FATHER: "Papá",
  MOTHER: "Mamá",
  SIBLING: "Hermano(a)",
  SON_DAUGHTER: "Hijo(a)",
  COUSIN: "Primo(a)",
  UNCLE_AUNT: "Tío(a)",
  NEPHEW_NIECE: "Sobrino(a)",
  OTHER: "Otro",
  // Valores históricos conservados para lectura de registros existentes
  SPOUSE: "Cónyuge",
  GRANDPARENT: "Abuelo/a",
  LEGAL_GUARDIAN: "Tutor legal",
  FRIEND: "Amigo/a",
}

/** Opciones que se ofrecen al crear/editar un contacto (sin valores solo históricos). */
export const relationshipSelectOptions = [
  { value: "FATHER", label: relationshipLabels.FATHER },
  { value: "MOTHER", label: relationshipLabels.MOTHER },
  { value: "SIBLING", label: relationshipLabels.SIBLING },
  { value: "SON_DAUGHTER", label: relationshipLabels.SON_DAUGHTER },
  { value: "COUSIN", label: relationshipLabels.COUSIN },
  { value: "UNCLE_AUNT", label: relationshipLabels.UNCLE_AUNT },
  { value: "NEPHEW_NIECE", label: relationshipLabels.NEPHEW_NIECE },
  { value: "OTHER", label: relationshipLabels.OTHER },
] as const

export const medicationDoseUnitLabels: Record<MedicationDoseUnit, string> = {
  MG: "mg",
  G: "g",
  ML: "ml",
  UI: "UI",
  TABLET: "Tableta",
  DROP: "Gota",
  OTHER: "Otra unidad",
}

export const medicationRouteLabels: Record<MedicationRoute, string> = {
  ORAL: "Oral",
  IV: "Intravenosa",
  IM: "Intramuscular",
  SUBCUTANEOUS: "Subcutánea",
  TOPICAL: "Tópica",
  OTHER: "Otra vía",
}

/** Motivo de interrupción cuando la situación del tratamiento es Suspendido. */
export const interruptionReasonLabels = {
  ADVERSE_REACTION:
    "Por reacción / efectos adversos / toxicidad del tratamiento",
  THERAPEUTIC_OPTION_EVAL: "Evaluación de opción terapéutica",
  OTHER: "Otros",
} as const

export const diagnosticStatusLabels = {
  SEARCHING: "En búsqueda",
  CONFIRMED: "En búsqueda - Encontrado",
  RULED_OUT: "En búsqueda - Descartado",
} as const

export function labelMapToSelectItems<T extends Record<string, string>>(
  labels: T,
): Array<{ value: keyof T & string; label: string }> {
  return (Object.keys(labels) as Array<keyof T & string>).map((value) => ({
    value,
    label: labels[value],
  }))
}
