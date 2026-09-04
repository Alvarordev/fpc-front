import { Calendar, Clock, Pill, Stethoscope } from "lucide-react"
import type {
  PatientDiagnosis,
  PatientTreatment,
  TreatmentMedication,
} from "@/api/patients"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { DURATION_UNIT_LABELS } from "@/types/duration"
import { useTreatmentMedications } from "../../_hooks/use-patient-records"
import {
  cancerStageLabels,
  medicationDoseUnitLabels,
  medicationRouteLabels,
  treatmentSituationLabels,
} from "../../_lib/clinical-labels"

interface ClinicalRecordDetailSheetProps {
  patientId: string
  diagnosis: PatientDiagnosis | null
  treatment: PatientTreatment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClinicalRecordDetailSheet({
  patientId,
  diagnosis,
  treatment,
  open,
  onOpenChange,
}: ClinicalRecordDetailSheetProps) {
  const medicationsQuery = useTreatmentMedications(
    patientId,
    treatment?.id ?? "",
    open && Boolean(treatment),
  )
  const title = diagnosis
    ? "Detalle del diagnóstico"
    : treatment
      ? "Detalle del tratamiento"
      : "Detalle clínico"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-xl sm:max-w-2xl"
        showCloseButton
      >
        <SheetHeader className="border-b px-6 pb-4">
          <SheetTitle className="flex items-center gap-2 pr-8">
            {diagnosis ? (
              <Stethoscope className="text-primary size-4 shrink-0" />
            ) : (
              <Pill className="text-primary size-4 shrink-0" />
            )}
            {title}
          </SheetTitle>
          <SheetDescription>
            {diagnosis?.diagnosis ??
              treatment?.treatmentType ??
              "Registro clínico"}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          {diagnosis && <DiagnosisDetails diagnosis={diagnosis} />}
          {treatment && (
            <TreatmentDetails
              treatment={treatment}
              medications={medicationsQuery.data ?? []}
              isLoadingMedications={medicationsQuery.isLoading}
              hasMedicationError={medicationsQuery.isError}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function DiagnosisDetails({ diagnosis }: { diagnosis: PatientDiagnosis }) {
  return (
    <div className="space-y-6 pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={diagnosis.isCurrent ? "default" : "outline"}>
          {diagnosis.isCurrent ? "Activo" : "Histórico"}
        </Badge>
        <Badge variant="outline">
          {diagnosis.cancerStage
            ? cancerStageLabels[diagnosis.cancerStage]
            : "Etapa sin dato"}
        </Badge>
      </div>

      <DetailSection title="Información principal">
        <DetailGrid>
          <Detail label="Diagnóstico" value={diagnosis.diagnosis} />
          <Detail label="Especialidad" value={diagnosis.diagnosisSpecialty} />
          <Detail
            label="Etapa"
            value={
              diagnosis.cancerStage
                ? cancerStageLabels[diagnosis.cancerStage]
                : null
            }
          />
          <Detail
            label="Centro de salud"
            value={diagnosis.healthCenterName ?? diagnosis.healthCenterId}
          />
          <Detail
            label="Centro de salud derivado"
            value={
              diagnosis.referredHealthCenterName ??
              diagnosis.referredHealthCenterId
            }
          />
          <Detail
            label="Fecha de diagnóstico"
            value={formatDate(diagnosis.diagnosisDate)}
            icon={Calendar}
          />
          <Detail
            label="Creado"
            value={formatDateTime(diagnosis.createdAt)}
            icon={Calendar}
          />
          <Detail
            label="Primeros síntomas"
            value={formatDate(diagnosis.firstSymptomsDate)}
            icon={Calendar}
          />
          <Detail
            label="Tiempo de espera"
            value={formatDuration(diagnosis.waitTimeForDiagnosis)}
            icon={Clock}
          />
          <Detail
            label="Origen del tiempo de espera"
            value={waitSourceLabel(diagnosis.waitTimeSource)}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Información clínica">
        <DetailGrid>
          <Detail
            label="Síntoma que llevó a consulta"
            value={diagnosis.symptomLeadingToCheckup}
          />
          <Detail
            label="Tiene informe médico"
            value={diagnosis.hasMedicalReport ? "Sí" : "No"}
          />
          <Detail
            label="Derivación activa de SEPA"
            value={booleanLabel(diagnosis.isSepaActiveReferral)}
          />
          <Detail
            label="Cuenta con referencia"
            value={booleanLabel(diagnosis.hasReferral)}
          />
          <Detail label="ID del seguimiento" value={diagnosis.followUpId} />
          <Detail label="ID del registro" value={diagnosis.id} />
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function TreatmentDetails({
  treatment,
  medications,
  isLoadingMedications,
  hasMedicationError,
}: {
  treatment: PatientTreatment
  medications: TreatmentMedication[]
  isLoadingMedications: boolean
  hasMedicationError: boolean
}) {
  const situation =
    treatment.treatmentSituation ??
    (treatment.isCurrent ? "EN_CURSO" : "FINALIZADO")

  return (
    <div className="space-y-6 pt-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={treatment.isCurrent ? "default" : "outline"}>
          {treatment.isCurrent ? "Activo" : "Histórico"}
        </Badge>
        <Badge variant="outline">{treatmentSituationLabels[situation]}</Badge>
      </div>

      <DetailSection title="Información principal">
        <DetailGrid>
          <Detail label="Tipo de tratamiento" value={treatment.treatmentType} />
          <Detail
            label="Diagnóstico asociado"
            value={treatment.diagnosisSummary?.diagnosis}
          />
          <Detail
            label="Situación"
            value={treatmentSituationLabels[situation]}
          />
          <Detail
            label="Frecuencia"
            value={formatDuration(treatment.treatmentFrequency)}
            icon={Clock}
          />
          <Detail
            label="Periodo"
            value={periodLabel(treatment)}
            icon={Calendar}
          />
          <Detail label="Programa de atención" value={treatment.careProgram} />
          <Detail label="Operación" value={treatment.operationName} />
          <Detail
            label="Centro de origen"
            value={
              treatment.sourceHealthCenterName ?? treatment.sourceHealthCenterId
            }
          />
          <Detail
            label="Centro receptor"
            value={
              treatment.receivingHealthCenterName ??
              treatment.receivingHealthCenterId
            }
          />
          <Detail
            label="Es derivado"
            value={treatment.isReferred ? "Sí" : "No"}
          />
          <Detail
            label="Creado"
            value={formatDateTime(treatment.createdAt)}
            icon={Calendar}
          />
          <Detail label="ID de serie" value={treatment.seriesId} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Seguimiento y prescripción">
        <DetailGrid>
          <Detail
            label="Recibe teleconsulta"
            value={booleanLabel(treatment.receivesTeleconsultation)}
          />
          <Detail
            label="Especialidades de teleconsulta"
            value={treatment.teleconsultationSpecialties?.join(", ")}
          />
          <Detail
            label="Motivo de no recibir tratamiento"
            value={treatment.notReceivingReason}
            fullWidth
          />
          <Detail
            label="Motivo de abandono"
            value={treatment.treatmentAbandonmentReason}
            fullWidth
          />
          <Detail
            label="Motivo del cambio"
            value={treatment.changeReason}
            fullWidth
          />
          <Detail
            label="Nota de teleconsulta"
            value={treatment.teleconsultationNote}
            fullWidth
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title={`Medicamentos (${medications.length})`}>
        {isLoadingMedications ? (
          <p className="text-muted-foreground text-sm">
            Cargando medicamentos...
          </p>
        ) : hasMedicationError ? (
          <p className="text-muted-foreground text-sm">
            No se pudieron cargar los medicamentos.
          </p>
        ) : medications.length ? (
          <div className="space-y-3">
            {medications.map((medication) => (
              <MedicationDetails key={medication.id} medication={medication} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No hay medicamentos registrados.
          </p>
        )}
      </DetailSection>

      <DetailSection title="Identificadores">
        <DetailGrid>
          <Detail label="ID del tratamiento" value={treatment.id} />
          <Detail label="ID del diagnóstico" value={treatment.diagnosisId} />
          <Detail label="ID del seguimiento" value={treatment.followUpId} />
        </DetailGrid>
      </DetailSection>
    </div>
  )
}

function MedicationDetails({
  medication,
}: {
  medication: TreatmentMedication
}) {
  return (
    <div className="bg-muted/30 space-y-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold">{medication.name}</p>
        <Badge variant={medication.isActive ? "secondary" : "outline"}>
          {medication.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>
      <DetailGrid>
        <Detail
          label="Dosis"
          value={
            [
              medication.doseAmount !== null
                ? String(medication.doseAmount)
                : null,
              medication.doseUnit
                ? medicationDoseUnitLabels[medication.doseUnit]
                : null,
              medication.doseDescription,
            ]
              .filter(Boolean)
              .join(" ") || null
          }
        />
        <Detail
          label="Vía"
          value={
            medication.route ? medicationRouteLabels[medication.route] : null
          }
        />
        <Detail
          label="Frecuencia"
          value={formatDuration(medication.frequency)}
          icon={Clock}
        />
        <Detail
          label="Periodo"
          value={periodLabel(medication)}
          icon={Calendar}
        />
        <Detail label="Creado" value={formatDateTime(medication.createdAt)} />
        <Detail label="Notas" value={medication.notes} fullWidth />
      </DetailGrid>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
}

function Detail({
  label,
  value,
  icon: Icon,
  fullWidth = false,
}: {
  label: string
  value: React.ReactNode
  icon?: typeof Calendar
  fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? "sm:col-span-2" : undefined}>
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        {Icon && <Icon className="size-3 shrink-0" />}
        {label}
      </p>
      <p className="mt-1 text-sm font-medium break-words">
        {value || "Sin dato"}
      </p>
    </div>
  )
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin dato"
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-")
    return `${day}/${month}/${year}`
  }
  return formatDateTime(value)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Sin dato"
  return new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatDuration(
  value:
    | {
        valueMin: number | string
        valueMax: number | string | null
        unit: keyof typeof DURATION_UNIT_LABELS
        label?: string | null
      }
    | null
    | undefined,
) {
  if (!value) return "Sin dato"
  if (value.label) return value.label
  const range =
    value.valueMax !== null && value.valueMax !== value.valueMin
      ? `${value.valueMin} a ${value.valueMax}`
      : String(value.valueMin)
  return `${range} ${(DURATION_UNIT_LABELS[value.unit] ?? value.unit).toLowerCase()}`
}

function periodLabel(record: {
  startDate: string | null | undefined
  endDate: string | null | undefined
}) {
  if (!record.startDate && !record.endDate) return "Sin fechas"
  if (!record.startDate) return `Hasta ${formatDate(record.endDate)}`
  return `Desde ${formatDate(record.startDate)}${record.endDate ? ` hasta ${formatDate(record.endDate)}` : " (en curso)"}`
}

function booleanLabel(value: boolean | null | undefined) {
  return value === null || value === undefined
    ? "Sin dato"
    : value
      ? "Sí"
      : "No"
}

function waitSourceLabel(value: PatientDiagnosis["waitTimeSource"]) {
  if (value === "COMPUTED") return "Calculado por fechas"
  if (value === "REPORTED") return "Reportado"
  return "Sin dato"
}
