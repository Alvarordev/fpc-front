export const PATIENT_TABS = [
  "resumen",
  "seguimiento",
  "psicooncologia",
  "recordatorios",
  "documentos",
] as const

export type PatientTab = (typeof PATIENT_TABS)[number]

export const DEFAULT_PATIENT_TAB: PatientTab = "resumen"

export function isPatientTab(
  value: string | null | undefined,
): value is PatientTab {
  return Boolean(value && PATIENT_TABS.includes(value as PatientTab))
}

export function getPatientTab(value: string | null | undefined): PatientTab {
  return isPatientTab(value) ? value : DEFAULT_PATIENT_TAB
}

export function withPatientTab(searchParams: URLSearchParams, tab: PatientTab) {
  const nextSearchParams = new URLSearchParams(searchParams)
  nextSearchParams.set("tab", tab)
  return nextSearchParams
}

export function patientTabUrl(patientId: string, tab?: PatientTab) {
  if (!tab) return `/pacientes/${patientId}`
  return `/pacientes/${patientId}?tab=${encodeURIComponent(tab)}`
}
