import type { ChangeLogEntry } from "@/api/change-log"

export const changeLogContextLabels: Record<ChangeLogEntry["context"], string> = {
  FOLLOW_UP: "Seguimiento",
  ADMIN_ADJUSTMENT: "Ajuste administrativo",
  HISTORICAL_LOAD: "Carga histórica",
  SYSTEM: "Sistema",
}

const fieldLabels: Record<string, string> = {
  primary_phone: "Teléfono principal",
  secondary_phone: "Teléfono secundario",
  full_name: "Nombre",
  email: "Correo",
  dni: "Documento",
  birth_date: "Fecha de nacimiento",
  gender: "Sexo",
  activity_status: "Estado de actividad",
  deactivation_reason: "Motivo de baja",
  deactivation_reason_detail: "Detalle de baja",
  deceased_at: "Fecha de fallecimiento",
  health_phase: "Fase de salud",
  health_subcategory: "Subcategoría",
  primary_health_center_id: "Establecimiento principal",
  notes: "Notas",
  status: "Estado",
  scheduled_at: "Fecha programada",
  address: "Dirección",
  district: "Distrito",
  province: "Provincia",
  department: "Departamento",
  diagnosis_date: "Fecha de diagnóstico",
  change_reason: "Motivo del cambio",
  diagnosis_code: "Diagnóstico",
  stage: "Estadio",
  treatment_type: "Tipo de tratamiento",
  situation: "Situación del tratamiento",
  start_date: "Fecha de inicio",
  end_date: "Fecha de fin",
  scheduled_sessions: "Sesiones programadas",
  completed_sessions: "Sesiones completadas",
  deactivated_at: "Fecha de baja",
  insurance_type: "Tipo de seguro",
  outcome: "Resultado",
  channel: "Canal",
  reason: "Motivo",
  type: "Tipo",
  specialty: "Especialidad",
  issued_on: "Fecha de emisión",
  attended_on: "Fecha de atención",
  role: "Rol",
}

// Columnas técnicas que no aportan al historial (versionado, claves, marcas de tiempo).
const hiddenFields = new Set([
  "id",
  "is_current",
  "created_at",
  "updated_at",
  "patient_id",
  "follow_up_id",
  "previous_version_id",
])

export function isVisibleChangeLogEntry(entry: ChangeLogEntry) {
  return !entry.field || !hiddenFields.has(entry.field)
}

const valueLabels: Record<string, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  REACTIVE: "Reactivo",
  VOLUNTARY: "Retiro voluntario",
  UNLOCATABLE: "No ubicable",
  DECEASED: "Fallecido",
  TRANSFERRED_OUT: "Transferido",
  OTHER: "Otro",
  EN_ESPERA: "En espera",
  EN_BUSQUEDA: "En búsqueda",
  EN_PROCESO: "En proceso",
  CULMINADO: "Culminado",
  SUSPENDIDO: "Suspendido",
  REMISION: "En remisión",
  ABANDONADO: "Abandonado",
  FALLECIDO: "Fallecido",
  NO_APLICA: "No aplica",
  SCHEDULED: "Programado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
  OVERDUE: "Vencido",
  true: "Sí",
  false: "No",
}

const entityLabels: Record<string, string> = {
  patients: "paciente",
  patient_details: "datos clínicos",
  follow_ups: "seguimiento",
  follow_up_attempts: "intento de contacto",
  referrals: "derivación",
  patient_diagnoses: "diagnóstico",
  patient_treatments: "tratamiento",
  enrollments: "enrolamiento",
  patient_insurances: "seguro",
  patient_addresses: "dirección",
  patient_companions: "acompañante",
  reminders: "recordatorio",
  psychooncology_appointments: "cita de psicooncología",
  medical_appointments: "cita médica",
  surveys: "encuesta",
}

export function changeLogFieldLabel(field: string | null | undefined) {
  if (!field) return "Registro"
  return fieldLabels[field] ?? field.replaceAll("_", " ")
}

export function changeLogEntityLabel(entityType: string) {
  return entityLabels[entityType] ?? entityType.replaceAll("_", " ")
}

export function describeChangeLogEntry(entry: ChangeLogEntry) {
  const entity = changeLogEntityLabel(entry.entityType)
  if (entry.operation === "INSERT" && !entry.field) return `Se registró ${entity}`
  if (entry.operation === "DELETE" && !entry.field) return `Se eliminó ${entity}`
  const field = changeLogFieldLabel(entry.field)
  if (entry.operation === "INSERT") {
    return `Se registró ${field}: ${changeLogValueLabel(entry.newValue)}`
  }
  if (entry.operation === "DELETE") {
    return `Se eliminó ${field} (antes ${changeLogValueLabel(entry.oldValue)})`
  }
  return `${field}: ${changeLogValueLabel(entry.oldValue)} → ${changeLogValueLabel(entry.newValue)}`
}

export function changeLogValueLabel(value: unknown) {
  if (value == null || value === "") return "—"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return valueLabels[String(value)] ?? String(value)
  }
  if (typeof value === "object" && value && "value" in value) {
    return changeLogValueLabel((value as { value: unknown }).value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return "—"
  }
}

export function isActivityStatusChange(entry: ChangeLogEntry) {
  return entry.field === "activity_status" || entry.field === "activityStatus"
}
