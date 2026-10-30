import { PatientHealthSubcategoryBadge } from "@/components/patient-health-subcategory-badge"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import type {
  PatientHealthPhase,
  PatientHealthSubcategory,
  PatientListItem,
} from "@/api/patients"
import { relativeDay } from "@/pages/pacientes/[id]/_lib/ficha-format"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoryLabels,
} from "@/lib/patient-health-subcategory"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import { formatIdentityDocument } from "@/types/identity-document"
import { followUpInstant } from "../_lib/follow-up-moment"

const followUpStatusLabels: Record<string, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
  OVERDUE: "Vencido",
}

function departmentLabel(code: string | null) {
  if (!code) return ""
  return DEPARTMENT_LABELS[code] ?? code
}

function knownPhase(code: string | null): PatientHealthPhase | null {
  if (code === "CANCER_DIAGNOSIS" || code === "ANNUAL_CHECKUP" || code === "SIGNS_AND_SYMPTOMS") {
    return code
  }
  return null
}

function knownSubcategory(code: string | null): PatientHealthSubcategory | null {
  if (!code || !(code in patientHealthSubcategoryLabels)) return null
  return code as PatientHealthSubcategory
}

export function PatientCell({ patient }: { patient: PatientListItem }) {
  const document = patient.dni
    ? formatIdentityDocument(patient.documentType, patient.dni)
    : "Sin documento"
  const secondary = patient.primaryPhone ? `${document} · ${patient.primaryPhone}` : document

  return (
    <div className="min-w-40">
      <p className="text-sm font-medium text-zinc-900">{patient.fullName}</p>
      <p className="text-[13px] text-zinc-500">{secondary}</p>
    </div>
  )
}

export function DiagnosisCell({ patient }: { patient: PatientListItem }) {
  const diagnosis = patient.currentDiagnosis
  if (!diagnosis?.diagnosis) {
    return <span className="text-[13px] text-zinc-500">Sin diagnóstico</span>
  }

  const stage = diagnosis.cancerStage
  const hospital = diagnosis.healthCenterName

  return (
    <div className="max-w-64">
      <p className="text-sm font-medium text-zinc-900">
        <CatalogValue kind="cancer_diagnosis" code={diagnosis.diagnosis} />
      </p>
      {(stage || hospital) && (
        <p className="text-[13px] text-zinc-500">
          {stage && <CatalogValue kind="cancer_stage" code={stage} />}
          {stage && hospital ? " · " : ""}
          {hospital}
        </p>
      )}
    </div>
  )
}

export function HealthCell({ patient }: { patient: PatientListItem }) {
  const subcategory = knownSubcategory(patient.healthSubcategory)
  if (subcategory) {
    return <PatientHealthSubcategoryBadge subcategory={subcategory} />
  }

  const phase = knownPhase(patient.healthPhase)
  if (phase) return <Chip tone="gray">{patientHealthPhaseLabels[phase]}</Chip>
  if (patient.healthPhase) {
    return (
      <Chip tone="gray">
        <CatalogValue kind="patient_health_phase" code={patient.healthPhase} />
      </Chip>
    )
  }

  return <span className="text-[13px] text-zinc-500">Sin clasificar</span>
}

export function FollowUpCell({ patient }: { patient: PatientListItem }) {
  const followUp = patient.latestFollowUp
  if (!followUp) {
    return <span className="text-[13px] text-zinc-500">Sin seguimientos</span>
  }

  const instant = followUpInstant(followUp)
  const when = instant ? relativeDay(instant) : null
  const status = followUpStatusLabels[followUp.status] ?? followUp.status

  return (
    <div>
      <p className="text-sm text-zinc-900">{when ?? "Sin fecha"}</p>
      {followUp.status === "OVERDUE" ? (
        <Chip tone="red">Vencido</Chip>
      ) : (
        <p className="text-[13px] text-zinc-500">{status}</p>
      )}
    </div>
  )
}

export function ActivityCell({ patient }: { patient: PatientListItem }) {
  if (patient.activityStatus === "ACTIVE") return <Chip tone="blue">Activo</Chip>
  if (patient.activityStatus === "REACTIVE") return <Chip tone="amber">Reenrolado</Chip>
  return <Chip tone="gray">Inactivo</Chip>
}

export function DepartmentCell({ patient }: { patient: PatientListItem }) {
  const label = departmentLabel(patient.currentDepartment)
  return label ? (
    <span className="text-sm text-zinc-900">{label}</span>
  ) : (
    <span className="text-[13px] text-zinc-500">—</span>
  )
}
