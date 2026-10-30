export const DISPLAY_LABELS: Record<string, string> = {
  FEMALE: "Mujer",
  MALE: "Hombre",
  OTHER: "Otro",
  UNKNOWN: "Sin información",
  "Sin informacion": "Sin información",
  STAGE_1: "Etapa 1",
  STAGE_2: "Etapa 2",
  STAGE_3: "Etapa 3",
  STAGE_4: "Etapa 4",
  NOT_OBTAINED: "No obtuvo consulta",
  SCHEDULED: "Consulta programada",
  ATTENDED: "Consulta atendida",
  EN_PROCESO: "En proceso",
  EN_ESPERA: "En espera",
  SUSPENDIDO: "Suspendido",
  CULMINADO: "Culminado",
  EN_BUSQUEDA: "En búsqueda",
  REMISION: "En remisión",
  ABANDONADO: "Abandonado",
  FALLECIDO: "Fallecido",
  NO_APLICA: "No aplica",
  CRUZ_DEL_SUR: "Cruz del Sur",
  LATAM_AVION_SOLIDARIO: "LATAM – Avión Solidario",
  FRIEDA_HELLER: "Albergue Frieda Heller – FPC",
  CASA_MAGIA: "Casa Magia",
  CASA_RONALD_MCDONALD: "Casa Ronald McDonald",
  INSPIRA: "Albergue Inspira",
  ALINEN: "ALINEN",
  VOLUNTARY: "Retiro voluntario",
  UNLOCATABLE: "No ubicable",
  DECEASED: "Fallecido",
  TRANSFERRED_OUT: "Transferido",
}

export const number = new Intl.NumberFormat("es-PE")

export function displayLabel(value: string) {
  return DISPLAY_LABELS[value] ?? value
}

export function formatAvgDays(value: number | null) {
  if (value == null) return "—"
  return `${number.format(value)} días`
}
