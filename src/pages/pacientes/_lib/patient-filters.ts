import type {
  PatientActivityStatus,
  PatientHealthPhase,
  PatientListItem,
} from "@/api/patients"
import { daysFromToday } from "@/pages/pacientes/[id]/_lib/ficha-format"
import { patientHealthSubcategoryPhase } from "@/lib/patient-health-subcategory"
import { followUpInstant } from "./follow-up-moment"

/**
 * Filtros de la tabla de pacientes.
 *
 * La API recibe búsqueda, estado, fase y subcategoría. El resto se aplica aquí,
 * sobre la lista ya descargada.
 *
 * "Último seguimiento" es el que devuelve la lista (`latestFollowUp`): el más
 * reciente por fecha de completado, si no la programada, si no la de creación.
 * - Vencido: ese seguimiento tiene estado OVERDUE.
 * - Agendado: estado SCHEDULED.
 * - Sin seguimientos: no hay último seguimiento.
 * - Sin contacto en 30 días o más: hay seguimiento, no está agendado, y su
 *   instante (programado si está vencido; si no, completado u ocurrido) es de
 *   hace 30 días o más.
 */

export type FollowUpFilter = "overdue" | "stale" | "none" | "scheduled"
export type AgeFilter = "under18" | "18-39" | "40-59" | "60plus"
export type CompanionFilter = "with" | "without"

export type PatientFilterState = {
  search: string
  activityStatus: PatientActivityStatus | null
  healthPhase: PatientHealthPhase | null
  healthSubcategory: string | null
  diagnosis: string | null
  hospital: string | null
  department: string | null
  followUp: FollowUpFilter | null
  age: AgeFilter | null
  companion: CompanionFilter | null
}

export const EMPTY_PATIENT_FILTERS: PatientFilterState = {
  search: "",
  activityStatus: null,
  healthPhase: null,
  healthSubcategory: null,
  diagnosis: null,
  hospital: null,
  department: null,
  followUp: null,
  age: null,
  companion: null,
}

const ACTIVITY = ["ACTIVE", "INACTIVE", "REACTIVE"] as const
const PHASES = ["CANCER_DIAGNOSIS", "ANNUAL_CHECKUP", "SIGNS_AND_SYMPTOMS"] as const
const FOLLOW_UPS = ["overdue", "stale", "none", "scheduled"] as const
const AGES = ["under18", "18-39", "40-59", "60plus"] as const
const COMPANIONS = ["with", "without"] as const

function oneOf<T extends string>(value: string | null, allowed: readonly T[]): T | null {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

export function readPatientFilters(params: URLSearchParams): PatientFilterState {
  return {
    search: params.get("q")?.trim() ?? "",
    activityStatus: oneOf(params.get("estado"), ACTIVITY),
    healthPhase: oneOf(params.get("fase"), PHASES),
    healthSubcategory: params.get("subcategoria"),
    diagnosis: params.get("diagnostico"),
    hospital: params.get("hospital"),
    department: params.get("departamento"),
    followUp: oneOf(params.get("seguimiento"), FOLLOW_UPS),
    age: oneOf(params.get("edad"), AGES),
    companion: oneOf(params.get("acompanante"), COMPANIONS),
  }
}

function put(params: URLSearchParams, key: string, value: string | null) {
  const trimmed = value?.trim() ?? ""
  if (trimmed) params.set(key, trimmed)
  else params.delete(key)
}

export function writePatientFilters(current: URLSearchParams, filters: PatientFilterState) {
  const next = new URLSearchParams(current)
  put(next, "q", filters.search)
  put(next, "estado", filters.activityStatus)
  put(next, "fase", filters.healthPhase)
  put(next, "subcategoria", filters.healthSubcategory)
  put(next, "diagnostico", filters.diagnosis)
  put(next, "hospital", filters.hospital)
  put(next, "departamento", filters.department)
  put(next, "seguimiento", filters.followUp)
  put(next, "edad", filters.age)
  put(next, "acompanante", filters.companion)
  return next
}

export function subcategoryFitsPhase(subcategory: string | null, phase: string | null) {
  if (!subcategory || !phase || subcategory === "UNASSIGNED") return true
  const mapped = patientHealthSubcategoryPhase[subcategory as keyof typeof patientHealthSubcategoryPhase]
  return !mapped || mapped === phase
}

export function panelFilterCount(filters: PatientFilterState) {
  return [
    filters.healthPhase,
    filters.healthSubcategory,
    filters.diagnosis,
    filters.hospital,
    filters.department,
    filters.followUp,
    filters.age,
    filters.companion,
  ].filter(Boolean).length
}

export function hasPatientFilters(filters: PatientFilterState) {
  return Boolean(filters.search) || Boolean(filters.activityStatus) || panelFilterCount(filters) > 0
}

type ClientFilters = Pick<
  PatientFilterState,
  "activityStatus" | "diagnosis" | "hospital" | "department" | "followUp" | "age" | "companion"
>

export function filterPatients(
  patients: PatientListItem[],
  filters: ClientFilters,
  today = new Date(),
) {
  return patients.filter((patient) => matchesPatient(patient, filters, today))
}

export function countActivity(patients: PatientListItem[]) {
  const counts = { ALL: patients.length, ACTIVE: 0, INACTIVE: 0, REACTIVE: 0 }
  for (const patient of patients) counts[patient.activityStatus] += 1
  return counts
}

function matchesPatient(patient: PatientListItem, filters: ClientFilters, today: Date) {
  if (filters.activityStatus && patient.activityStatus !== filters.activityStatus) return false
  if (filters.diagnosis && patient.currentDiagnosis?.diagnosis !== filters.diagnosis) return false
  if (filters.hospital && patient.currentDiagnosis?.healthCenterName !== filters.hospital) return false
  if (filters.department && patient.currentDepartment !== filters.department) return false
  if (filters.followUp && !matchesFollowUp(patient, filters.followUp)) return false
  if (filters.age && !matchesAge(patient.birthDate, filters.age, today)) return false
  if (filters.companion && hasCompanion(patient) !== (filters.companion === "with")) return false
  return true
}

function hasCompanion(patient: PatientListItem) {
  return Boolean(patient.primaryCompanionName?.trim())
}

function matchesFollowUp(patient: PatientListItem, filter: FollowUpFilter) {
  const followUp = patient.latestFollowUp
  if (filter === "none") return !followUp
  if (!followUp) return false
  if (filter === "overdue") return followUp.status === "OVERDUE"
  if (filter === "scheduled") return followUp.status === "SCHEDULED"
  if (followUp.status === "SCHEDULED") return false
  const instant = followUpInstant(followUp)
  return instant ? daysFromToday(instant) <= -30 : false
}

export function ageYears(birthDate: string, today: Date) {
  const [year, month, day] = birthDate.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return null
  let age = today.getFullYear() - year
  const nowMonth = today.getMonth() + 1
  if (nowMonth < month || (nowMonth === month && today.getDate() < day)) age -= 1
  return age
}

function matchesAge(birthDate: string | null, filter: AgeFilter, today: Date) {
  if (!birthDate) return false
  const age = ageYears(birthDate, today)
  if (age === null || age < 0) return false
  if (filter === "under18") return age < 18
  if (filter === "18-39") return age >= 18 && age <= 39
  if (filter === "40-59") return age >= 40 && age <= 59
  return age >= 60
}
