import { DURATION_UNIT_LABELS } from "@/types/duration"

// Formatos de la ficha del paciente: fechas cortas en español, duraciones y
// respuestas Sí/No. Un solo lugar para que todas las tarjetas digan lo mismo.

export function formatDate(value: string | null | undefined, withYear = true) {
  if (!value) return null
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.valueOf())) return null
  return date.toLocaleDateString("es-PE", { day: "numeric", month: "short", ...(withYear ? { year: "numeric" } : {}) })
}

export function formatTime(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? null : date.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
}

type Duration = { valueMin: number | null; valueMax: number | null; unit: keyof typeof DURATION_UNIT_LABELS; label: string | null }

export function formatDuration(value: Duration | null | undefined) {
  if (!value) return null
  if (value.label) return value.label
  if (value.valueMin === null) return null
  const range = value.valueMax !== null && value.valueMax !== value.valueMin ? `${value.valueMin} a ${value.valueMax}` : String(value.valueMin)
  return `${range} ${DURATION_UNIT_LABELS[value.unit].toLowerCase()}`
}

export function yesNo(value: boolean | null | undefined) {
  return value === null || value === undefined ? null : value ? "Sí" : "No"
}

/** Días entre hoy y la fecha: 0 hoy, positivo en el futuro. */
export function daysFromToday(value: string) {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return Math.round((date.getTime() - today.getTime()) / 86_400_000)
}

export function relativeDay(value: string) {
  const diff = daysFromToday(value)
  if (diff === 0) return "hoy"
  if (diff === 1) return "mañana"
  if (diff === -1) return "ayer"
  return diff > 0 ? `en ${diff} días` : `hace ${-diff} días`
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
