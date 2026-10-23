import type { HealthCenter } from "@/api/health-centers"
import type {
  PatientDetailsResponse,
  PatientDiagnosis,
  PatientMedicalAppointment,
  PatientTreatment,
} from "@/api/patients"
import {
  departmentCodeFromValue,
  departmentLabelFromValue,
} from "@/lib/peru-departments"

export type PatientCareJourneyKind = "diagnosis" | "treatment" | "appointment"

export type PatientCareJourneyDateKind = "clinical" | "registered"

export type PatientCareTreatmentRole = "source" | "receiving"

export type PatientCareJourneyEvent = {
  id: string
  kind: PatientCareJourneyKind
  treatmentRole?: PatientCareTreatmentRole
  hospitalId: string
  hospitalName: string
  department: string | null
  departmentCode: string | null
  departmentLabel: string | null
  category: string | null
  specialty: string | null
  treatmentType: string | null
  appointmentStatus: PatientMedicalAppointment["status"] | null
  date: string
  dateKind: PatientCareJourneyDateKind
  createdAt: string
}

export type PatientCareJourneyHop = {
  fromCode: string
  toCode: string
}

export type PatientCareJourneyStop = {
  code: string
  label: string
  order: number
}

export type PatientCareJourney = {
  events: PatientCareJourneyEvent[]
  hops: PatientCareJourneyHop[]
  departmentCodes: string[]
  stops: PatientCareJourneyStop[]
  hospitalCount: number
}

type JourneyPatient = Pick<
  PatientDetailsResponse,
  "diagnoses" | "treatments" | "medicalAppointments"
>

export function buildPatientCareJourney(
  patient: JourneyPatient,
  healthCenters: HealthCenter[],
): PatientCareJourney {
  const centersById = new Map(
    healthCenters.map((center) => [center.id, center]),
  )
  const events: PatientCareJourneyEvent[] = []

  for (const diagnosis of patient.diagnoses) {
    const event = diagnosisEvent(diagnosis, centersById)
    if (event) events.push(event)
  }

  for (const treatment of patient.treatments) {
    events.push(...treatmentEvents(treatment, centersById))
  }

  for (const appointment of patient.medicalAppointments) {
    const event = appointmentEvent(appointment, centersById)
    if (event) events.push(event)
  }

  events.sort(compareJourneyEvents)

  const hops: PatientCareJourneyHop[] = []
  const departmentCodes: string[] = []
  const seenDepartments = new Set<string>()
  const hospitalIds = new Set<string>()
  let previousDepartment: string | null = null

  for (const event of events) {
    hospitalIds.add(event.hospitalId)
    if (!event.departmentCode) continue

    if (!seenDepartments.has(event.departmentCode)) {
      seenDepartments.add(event.departmentCode)
      departmentCodes.push(event.departmentCode)
    }

    if (previousDepartment && previousDepartment !== event.departmentCode) {
      hops.push({ fromCode: previousDepartment, toCode: event.departmentCode })
    }
    previousDepartment = event.departmentCode
  }

  const stops = departmentCodes.map((code, index) => ({
    code,
    label:
      events.find((event) => event.departmentCode === code)?.departmentLabel ??
      code,
    order: index + 1,
  }))

  return {
    events,
    hops,
    departmentCodes,
    stops,
    hospitalCount: hospitalIds.size,
  }
}

function diagnosisEvent(
  diagnosis: PatientDiagnosis,
  centersById: Map<string, HealthCenter>,
): PatientCareJourneyEvent | null {
  if (!diagnosis.healthCenterId) return null
  return toEvent({
    id: `diagnosis:${diagnosis.id}`,
    kind: "diagnosis",
    hospitalId: diagnosis.healthCenterId,
    hospitalName: diagnosis.healthCenterName ?? null,
    specialty: diagnosis.diagnosisSpecialty,
    clinicalDate: diagnosis.diagnosisDate,
    createdAt: diagnosis.createdAt,
    centersById,
  })
}

function treatmentEvents(
  treatment: PatientTreatment,
  centersById: Map<string, HealthCenter>,
): PatientCareJourneyEvent[] {
  const events: PatientCareJourneyEvent[] = []
  const sourceId = treatment.sourceHealthCenterId
  const receivingId = treatment.receivingHealthCenterId

  if (sourceId) {
    events.push(
      toEvent({
        id: `treatment:${treatment.id}:source`,
        kind: "treatment",
        treatmentRole:
          receivingId && receivingId !== sourceId ? "source" : undefined,
        hospitalId: sourceId,
        hospitalName: treatment.sourceHealthCenterName ?? null,
        treatmentType: treatment.treatmentType,
        clinicalDate: treatment.startDate,
        createdAt: treatment.createdAt,
        centersById,
      }),
    )
  }

  if (receivingId && receivingId !== sourceId) {
    events.push(
      toEvent({
        id: `treatment:${treatment.id}:receiving`,
        kind: "treatment",
        treatmentRole: sourceId ? "receiving" : undefined,
        hospitalId: receivingId,
        hospitalName: treatment.receivingHealthCenterName ?? null,
        treatmentType: treatment.treatmentType,
        clinicalDate: treatment.startDate,
        createdAt: treatment.createdAt,
        centersById,
      }),
    )
  }

  return events
}

function appointmentEvent(
  appointment: PatientMedicalAppointment,
  centersById: Map<string, HealthCenter>,
): PatientCareJourneyEvent | null {
  if (!appointment.healthCenterId) return null
  return toEvent({
    id: `appointment:${appointment.id}`,
    kind: "appointment",
    hospitalId: appointment.healthCenterId,
    hospitalName: appointment.healthCenterName ?? null,
    specialty: appointment.specialty,
    appointmentStatus: appointment.status,
    clinicalDate: appointment.appointmentDate,
    createdAt: appointment.createdAt,
    centersById,
  })
}

function toEvent({
  id,
  kind,
  treatmentRole,
  hospitalId,
  hospitalName,
  specialty,
  treatmentType,
  appointmentStatus,
  clinicalDate,
  createdAt,
  centersById,
}: {
  id: string
  kind: PatientCareJourneyKind
  treatmentRole?: PatientCareTreatmentRole
  hospitalId: string
  hospitalName: string | null
  specialty?: string | null
  treatmentType?: string | null
  appointmentStatus?: PatientMedicalAppointment["status"] | null
  clinicalDate: string | null
  createdAt: string
  centersById: Map<string, HealthCenter>
}): PatientCareJourneyEvent {
  const center = centersById.get(hospitalId)
  const department = center?.department ?? null
  const date = clinicalDate ?? createdAt

  return {
    id,
    kind,
    treatmentRole,
    hospitalId,
    hospitalName: center?.name ?? hospitalName ?? "Centro no registrado",
    department,
    departmentCode: departmentCodeFromValue(department),
    departmentLabel: departmentLabelFromValue(department),
    category: center?.category ?? null,
    specialty: specialty ?? null,
    treatmentType: treatmentType ?? null,
    appointmentStatus: appointmentStatus ?? null,
    date,
    dateKind: clinicalDate ? "clinical" : "registered",
    createdAt,
  }
}

function compareJourneyEvents(
  left: PatientCareJourneyEvent,
  right: PatientCareJourneyEvent,
) {
  const dateCompare = left.date.localeCompare(right.date)
  if (dateCompare !== 0) return dateCompare
  const createdCompare = left.createdAt.localeCompare(right.createdAt)
  if (createdCompare !== 0) return createdCompare
  const roleCompare = treatmentRoleRank(left) - treatmentRoleRank(right)
  if (roleCompare !== 0) return roleCompare
  return left.id.localeCompare(right.id)
}

function treatmentRoleRank(event: PatientCareJourneyEvent) {
  if (event.treatmentRole === "source") return 0
  if (event.treatmentRole === "receiving") return 1
  return 2
}
