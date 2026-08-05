import type { CreatePatientDiagnosisInput, CreatePatientInsuranceInput, PatientDetailsInput } from "@/api/patients"

export type CancerStage = NonNullable<CreatePatientDiagnosisInput["cancerStage"]>
export type InsuranceType = CreatePatientInsuranceInput["insuranceType"]
export type EpsProvider = NonNullable<CreatePatientInsuranceInput["epsProvider"]>
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
