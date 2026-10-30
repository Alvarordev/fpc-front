export const TREATMENT_SITUATIONS = [
  "EN_ESPERA",
  "EN_BUSQUEDA",
  "EN_PROCESO",
  "CULMINADO",
  "SUSPENDIDO",
  "REMISION",
  "ABANDONADO",
  "FALLECIDO",
  "NO_APLICA",
] as const

export type TreatmentSituation = (typeof TREATMENT_SITUATIONS)[number]

export const treatmentSituationLabels: Record<TreatmentSituation, string> = {
  EN_ESPERA: "En espera",
  EN_BUSQUEDA: "En búsqueda",
  EN_PROCESO: "En proceso",
  CULMINADO: "Culminado",
  SUSPENDIDO: "Suspendido",
  REMISION: "En remisión",
  ABANDONADO: "Abandonado",
  FALLECIDO: "Fallecido",
  NO_APLICA: "No aplica",
}

export const CLOSED_TREATMENT_SITUATIONS = new Set<string>([
  "CULMINADO",
  "ABANDONADO",
  "FALLECIDO",
  "NO_APLICA",
  "REMISION",
])

export function treatmentSituationLabel(code: string | null | undefined) {
  if (!code) return "Sin situación"
  return treatmentSituationLabels[code as TreatmentSituation] ?? code
}
