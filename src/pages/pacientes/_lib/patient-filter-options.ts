import {
  patientHealthPhaseLabels,
  patientHealthSubcategoryLabels,
  patientHealthSubcategoriesByPhase,
} from "@/lib/patient-health-subcategory"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import type { CompanionFilter, PatientFilterState } from "./patient-filters"

export const ALL_FILTER = "ALL"

export const followUpOptions = [
  { value: ALL_FILTER, label: "Todos" },
  { value: "overdue", label: "Con seguimiento vencido" },
  { value: "stale", label: "Sin contacto en 30 días o más" },
  { value: "none", label: "Sin seguimientos" },
  { value: "scheduled", label: "Con seguimiento agendado" },
]

export const ageOptions = [
  { value: ALL_FILTER, label: "Todas" },
  { value: "under18", label: "Menores de 18" },
  { value: "18-39", label: "18 a 39" },
  { value: "40-59", label: "40 a 59" },
  { value: "60plus", label: "60 o más" },
]

export const companionOptions: { value: CompanionFilter; label: string }[] = [
  { value: "with", label: "Con acompañante" },
  { value: "without", label: "Sin acompañante" },
]

const statusLabels: Record<string, string> = {
  ACTIVE: "Activos",
  REACTIVE: "Reenrolados",
  INACTIVE: "Inactivos",
}

export function phaseChoices() {
  return Object.entries(patientHealthPhaseLabels).map(([value, label]) => ({ value, label }))
}

export function subcategoryChoices(phase: PatientFilterState["healthPhase"]) {
  const codes = phase
    ? patientHealthSubcategoriesByPhase[phase]
    : (Object.keys(patientHealthSubcategoryLabels) as (keyof typeof patientHealthSubcategoryLabels)[])
  return [
    { value: ALL_FILTER, label: "Todas" },
    { value: "UNASSIGNED", label: "Sin subcategoría" },
    ...codes.map((code) => ({ value: code, label: patientHealthSubcategoryLabels[code] })),
  ]
}

export function filterChips(
  filters: PatientFilterState,
  diagnoses: { value: string; label: string }[],
) {
  const chips: { id: keyof PatientFilterState; text: string }[] = []
  if (filters.activityStatus) chips.push({ id: "activityStatus", text: `Estado: ${statusLabels[filters.activityStatus]}` })
  if (filters.healthPhase) chips.push({ id: "healthPhase", text: `Fase: ${patientHealthPhaseLabels[filters.healthPhase]}` })
  if (filters.healthSubcategory) {
    const label =
      filters.healthSubcategory === "UNASSIGNED"
        ? "Sin subcategoría"
        : (patientHealthSubcategoryLabels[filters.healthSubcategory as keyof typeof patientHealthSubcategoryLabels] ??
          filters.healthSubcategory)
    chips.push({ id: "healthSubcategory", text: `Subcategoría: ${label}` })
  }
  if (filters.diagnosis) {
    const label = diagnoses.find((option) => option.value === filters.diagnosis)?.label ?? filters.diagnosis
    chips.push({ id: "diagnosis", text: `Diagnóstico: ${label}` })
  }
  if (filters.hospital) chips.push({ id: "hospital", text: `Hospital: ${filters.hospital}` })
  if (filters.department) {
    chips.push({
      id: "department",
      text: `Departamento: ${DEPARTMENT_LABELS[filters.department] ?? filters.department}`,
    })
  }
  if (filters.followUp) {
    const label = followUpOptions.find((option) => option.value === filters.followUp)?.label
    chips.push({ id: "followUp", text: `Seguimiento: ${label}` })
  }
  if (filters.age) {
    const label = ageOptions.find((option) => option.value === filters.age)?.label
    chips.push({ id: "age", text: `Edad: ${label}` })
  }
  if (filters.companion) {
    const label = companionOptions.find((option) => option.value === filters.companion)?.label
    chips.push({ id: "companion", text: `Acompañante: ${label}` })
  }
  return chips
}
