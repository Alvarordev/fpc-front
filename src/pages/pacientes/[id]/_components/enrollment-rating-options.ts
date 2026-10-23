export const ENROLLMENT_RATING_OPTIONS = [
  { value: "1", label: "1 — Muy mala" },
  { value: "2", label: "2 — Mala" },
  { value: "3", label: "3 — Regular" },
  { value: "4", label: "4 — Buena" },
  { value: "5", label: "5 — Muy buena" },
] as const

// Sólo la encuesta de enrolamiento admite "No indica" (0 en el backend).
export const ENROLLMENT_SURVEY_RATING_OPTIONS = [
  ...ENROLLMENT_RATING_OPTIONS,
  { value: "0", label: "No indica" },
] as const
