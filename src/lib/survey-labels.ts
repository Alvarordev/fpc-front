import type { SurveyChannel, SurveyType } from "@/api/surveys"

export const SURVEY_TYPE_LABELS: Record<SurveyType, string> = {
  ENROLLMENT: "Enrolamiento",
  THREE_MONTHS: "A los 3 meses",
  PSYCHOONCOLOGY: "Psicooncología",
  TALK: "Charla",
}

export const SURVEY_TYPE_ITEMS = (
  Object.entries(SURVEY_TYPE_LABELS) as [SurveyType, string][]
).map(([value, label]) => ({ value, label }))

export const SURVEY_CHANNEL_LABELS: Record<SurveyChannel, string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Correo",
  IN_PERSON: "Presencial",
  FORM: "Formulario",
}

export const SURVEY_CHANNEL_ITEMS = (
  Object.entries(SURVEY_CHANNEL_LABELS) as [SurveyChannel, string][]
).map(([value, label]) => ({ value, label }))

export const SURVEY_RATING_ITEMS = [
  { value: "1", label: "1 — Muy mala" },
  { value: "2", label: "2 — Mala" },
  { value: "3", label: "3 — Regular" },
  { value: "4", label: "4 — Buena" },
  { value: "5", label: "5 — Muy buena" },
]
