import type { HealthCenter } from "@/api/health-centers"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"

export const CARE_CATEGORIES = [
  "I-1",
  "I-2",
  "I-3",
  "I-4",
  "II-1",
  "II-2",
  "II-E",
  "III-1",
  "III-2",
  "III-E",
] as const

export type CareCategory = (typeof CARE_CATEGORIES)[number]

export const CARE_LEVELS = ["I", "II", "III"] as const

export type CareLevel = (typeof CARE_LEVELS)[number]

export function isCareLevel(value: string): value is CareLevel {
  return (CARE_LEVELS as readonly string[]).includes(value)
}

export const CARE_LEVEL_LABELS: Record<CareLevel, string> = {
  I: "Nivel I",
  II: "Nivel II",
  III: "Nivel III",
}

export const HEALTH_CENTER_INSTITUTIONS = [
  "MINSA",
  "ESSALUD",
  "FFAA_PNP",
  "PRIVADO",
  "GOBIERNO_REGIONAL",
  "OTRO",
] as const

export type HealthCenterInstitution = (typeof HEALTH_CENTER_INSTITUTIONS)[number]

export const HEALTH_CENTER_INSTITUTION_LABELS: Record<
  HealthCenterInstitution,
  string
> = {
  MINSA: "MINSA",
  ESSALUD: "EsSalud",
  FFAA_PNP: "FFAA / PNP",
  PRIVADO: "Privado",
  GOBIERNO_REGIONAL: "Gobierno regional",
  OTRO: "Otro",
}

export function careLevelLabel(level: string | null | undefined) {
  if (!level) return null
  return CARE_LEVEL_LABELS[level as CareLevel] ?? level
}

export function institutionLabel(institution: string | null | undefined) {
  if (!institution) return null
  return (
    HEALTH_CENTER_INSTITUTION_LABELS[institution as HealthCenterInstitution] ??
    institution
  )
}

export function healthCenterOptionLabel(center: Pick<
  HealthCenter,
  "name" | "department" | "careLevel"
>) {
  const department = DEPARTMENT_LABELS[center.department] ?? center.department
  const level = careLevelLabel(center.careLevel)
  return [center.name, department, level].filter(Boolean).join(" · ")
}
