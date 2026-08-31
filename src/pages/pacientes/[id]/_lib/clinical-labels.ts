import type {
  CreatePatientDiagnosisInput,
  CreatePatientInsuranceInput,
  PatientDetailsInput,
  PatientDetailsResponse,
  PatientHealthPhase,
} from "@/api/patients"
import type {
  MedicationDoseUnit,
  MedicationRoute,
  TreatmentSituation,
} from "@/types"

export type CancerStage = NonNullable<
  CreatePatientDiagnosisInput["cancerStage"]
>
export type InsuranceType = CreatePatientInsuranceInput["insuranceType"]
export type EpsProvider = NonNullable<
  CreatePatientInsuranceInput["epsProvider"]
>
export type EducationLevel = NonNullable<PatientDetailsInput["educationLevel"]>

export const educationLabels: Record<EducationLevel, string> = {
  NONE: "Ninguno",
  INITIAL: "Inicial",
  PRIMARY_INCOMPLETE: "Primaria incompleta",
  PRIMARY: "Primaria",
  SECONDARY_INCOMPLETE: "Secundaria incompleta",
  SECONDARY: "Secundaria",
  TECHNICAL_INCOMPLETE: "Técnica incompleta",
  TECHNICAL: "Técnica",
  HIGHER_INCOMPLETE: "Superior incompleta",
  HIGHER: "Superior",
}

export const cancerStageLabels: Record<CancerStage, string> = {
  STAGE_1: "Etapa 1",
  STAGE_2: "Etapa 2",
  STAGE_3: "Etapa 3",
  STAGE_4: "Etapa 4",
  UNKNOWN: "Etapa desconocida",
}

/** Tailwind classes for a stage severity badge, from mild (1) to severe (4/unknown). */
export const cancerStageBadgeClass: Record<CancerStage, string> = {
  STAGE_1: "bg-emerald-50 text-emerald-700 border-emerald-200",
  STAGE_2: "bg-amber-50 text-amber-700 border-amber-200",
  STAGE_3: "bg-orange-50 text-orange-700 border-orange-200",
  STAGE_4: "bg-red-50 text-red-700 border-red-200",
  UNKNOWN: "bg-muted text-muted-foreground border-transparent",
}

export const insuranceLabels: Record<InsuranceType, string> = {
  SIS: "SIS",
  ESSALUD: "EsSalud",
  EPS: "EPS",
  FUERZAS_ARMADAS: "Fuerzas Armadas",
  SALUDPOL: "SaludPol",
  NONE: "Sin seguro",
}

export const epsLabels: Record<EpsProvider, string> = {
  PACIFICO: "Pacífico",
  RIMAC: "Rímac",
  MAPFRE: "Mapfre",
  LA_POSITIVA: "La Positiva",
  SANITAS: "Sanitas",
  ONCOSALUD: "Oncosalud",
  OTHER: "Otro",
}

export const genderLabels: Record<string, string> = {
  M: "Masculino",
  F: "Femenino",
  OTHER: "Otro",
}

export const zoneTypeLabels: Record<string, string> = {
  URBAN: "Urbana",
  URBANA: "Urbana",
  URBANO: "Urbana",
  RURAL: "Rural",
}

export function normalizeZoneType(
  value: string | null | undefined,
): "URBAN" | "RURAL" | undefined {
  if (!value) return undefined
  const normalized = value.toUpperCase()
  if (
    normalized === "URBAN" ||
    normalized === "URBANA" ||
    normalized === "URBANO"
  ) {
    return "URBAN"
  }
  if (normalized === "RURAL") return "RURAL"
  return undefined
}

export const roleLabels: Record<PatientDetailsResponse["role"], string> = {
  UNKNOWN: "Sin definir",
  PATIENT: "Paciente",
  COMPANION: "Acompañante",
}

export const healthPhaseLabels: Record<PatientHealthPhase, string> = {
  CANCER_DIAGNOSIS: "Diagnóstico de Cáncer",
  ANNUAL_CHECKUP: "Control Anual",
  SIGNS_AND_SYMPTOMS: "Signos y Síntomas",
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

export const treatmentSituationLabels: Record<TreatmentSituation, string> = {
  EN_CURSO: "En proceso",
  PENDIENTE_DE_INICIO: "En espera",
  INTERRUMPIDO: "Suspendido",
  FINALIZADO: "Culminado",
  SEARCHING: "En búsqueda",
  ABANDONED: "Abandonado",
  DECEASED_DURING_TREATMENT: "Culminado en situación de tratamiento",
  NOT_APPLICABLE: "N/A",
  REMISSION: "En remisión",
}

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

/** Barreras de acceso para iniciar o continuar tratamiento. */
export const accessBarrierLabels = {
  TRANSFER: "Traslado",
  LODGING: "Alojamiento",
  ALTERNATIVE_MEDICINE: "Medicina alternativa",
  EXCESSIVE_COST: "Gasto excesivo",
  DOES_NOT_WANT_TO_START: "No desea iniciar el tratamiento",
  STOCKOUT: "Desabastecimiento",
  INFUSION_ROOM_INOPERATIVE: "Inoperatividad de salas de infusiones",
  PATIENT_OVERLOAD: "Sobrecarga de pacientes",
  OTHER: "Otros motivos",
} as const

export const transportationSepaProviderLabels = {
  CRUZ_DEL_SUR: "Cruz del Sur",
  LATAM_AVION_SOLIDARIO: "LATAM – Avión Solidario",
  OTHER: "Otro",
} as const

export const shelterSepaProviderLabels = {
  FRIEDA_HELLER: "Albergue Frieda Heller – FPC",
  CASA_MAGIA: "Casa Magia",
  CASA_RONALD_MCDONALD: "Casa Ronald McDonald",
  INSPIRA: "Albergue Inspira",
  ALINEN: "ALINEN",
  OTHER: "Otro",
} as const

export const programDropoutReasonCodeLabels = {
  VOLUNTARY: "Solicita baja del programa de manera voluntaria",
  UNLOCATABLE: "Persona no ubicable",
  DECEASED: "Fallecimiento",
  OTHER: "Otros motivos",
} as const

export const diagnosticStatusLabels = {
  SEARCHING: "En búsqueda",
  CONFIRMED: "Confirmado",
  RULED_OUT: "Descartado",
} as const

export function labelMapToSelectItems<T extends Record<string, string>>(
  labels: T,
): Array<{ value: keyof T & string; label: string }> {
  return (Object.keys(labels) as Array<keyof T & string>).map((value) => ({
    value,
    label: labels[value],
  }))
}
