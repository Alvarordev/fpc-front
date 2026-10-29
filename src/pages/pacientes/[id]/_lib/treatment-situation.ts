import type { Tone } from "@/components/ds/tone"

/** Situación de una línea de tratamiento, con su etiqueta y tono. */
export const SITUATION: Record<string, { label: string; tone: Tone }> = {
  EN_PROCESO: { label: "En curso", tone: "blue" },
  EN_ESPERA: { label: "En espera", tone: "amber" },
  SUSPENDIDO: { label: "Suspendido", tone: "amber" },
  CULMINADO: { label: "Terminado", tone: "gray" },
  EN_BUSQUEDA: { label: "En búsqueda", tone: "blue" },
  ABANDONADO: { label: "Abandonado", tone: "red" },
  FALLECIDO: { label: "Fallecido", tone: "gray" },
  NO_APLICA: { label: "No aplica", tone: "gray" },
  REMISION: { label: "Remisión", tone: "violet" },
}
