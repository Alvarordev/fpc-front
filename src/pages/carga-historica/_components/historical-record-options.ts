export interface SelectOption {
  value: string
  label: string
}

export const FOLLOW_UP_TYPE_OPTIONS: SelectOption[] = [
  { value: "CALL", label: "Llamada" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "VIDEO_CALL", label: "Videollamada" },
  { value: "EMAIL", label: "Correo electrónico" },
  { value: "IN_PERSON", label: "Presencial" },
  { value: "FACEBOOK", label: "Facebook" },
]

export const FOLLOW_UP_PURPOSE_OPTIONS: SelectOption[] = [
  { value: "FOLLOW_UP", label: "Seguimiento" },
  { value: "FIRST_CONTACT", label: "Primer contacto" },
  { value: "ENROLLMENT", label: "Enrolamiento" },
  { value: "PSYCHOONCOLOGY_REFERRAL", label: "Derivación a psicooncología" },
  { value: "OTHER", label: "Otro" },
]

export const FOLLOW_UP_STATUS_OPTIONS: SelectOption[] = [
  { value: "COMPLETED", label: "Completado" },
  { value: "SCHEDULED", label: "Programado" },
  { value: "NO_ANSWER", label: "Sin respuesta" },
  { value: "CANCELLED", label: "Cancelado" },
]

export const REMINDER_STATUS_OPTIONS: SelectOption[] = [
  { value: "DONE", label: "Realizado" },
  { value: "PENDING", label: "Pendiente" },
  { value: "DISMISSED", label: "Descartado" },
]

export const APPOINTMENT_STATUS_OPTIONS: SelectOption[] = [
  { value: "COMPLETED", label: "Atendida" },
  { value: "SCHEDULED", label: "Programada" },
  { value: "NO_ANSWER", label: "No asistió" },
  { value: "CANCELLED", label: "Cancelada" },
]

export const MODALITY_OPTIONS: SelectOption[] = [
  { value: "CALL", label: "Llamada" },
  { value: "VIDEO_CALL", label: "Videollamada" },
]

export const REFERRAL_OPTIONS: SelectOption[] = [
  { value: "PSYCHIATRY", label: "Psiquiatría" },
  { value: "NEUROLOGY", label: "Neurología" },
  { value: "CONTINUE_PSYCHOLOGY", label: "Continuar psicología" },
  { value: "PSYCHOONCOLOGIST", label: "Derivar a psicooncólogo" },
  { value: "NONE", label: "Ninguna" },
]

export function optionLabel(options: SelectOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function formatHistoricalDate(value: string) {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.test(value)
  const date = new Date(dateOnly ? `${value}T00:00:00.000Z` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("es-PE", {
    timeZone: dateOnly ? "UTC" : "America/Lima",
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatHistoricalDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "medium",
    timeStyle: "short",
  })
}

/** `2026-01-30T00:00:00.000Z` and `2026-01-30` both render as `2026-01-30`. */
export function toDateInputValue(value: string | null | undefined) {
  if (!value) return ""
  return value.slice(0, 10)
}
