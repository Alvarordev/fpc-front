import type { ReactNode } from "react"
import { Calendar, Clock, Pill, Stethoscope } from "lucide-react"
import type {
  PatientDiagnosis,
  PatientTreatment,
  TreatmentMedication,
} from "@/api/patients"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DURATION_UNIT_LABELS } from "@/types/duration"
import { useTreatmentMedications } from "../../_hooks/use-patient-records"
import { CatalogValue } from "@/components/catalog-select"
import { formatCatalogCodesList, useCatalog } from "@/hooks/use-catalog"
import {
  medicationDoseUnitLabels,
  medicationRouteLabels,
} from "../../_lib/clinical-labels"

interface ClinicalRecordDetailDialogProps {
  patientId: string
  diagnosis: PatientDiagnosis | null
  treatment: PatientTreatment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClinicalRecordDetailDialog({
  patientId,
  diagnosis,
  treatment,
  open,
  onOpenChange,
}: ClinicalRecordDetailDialogProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-2 font-semibold text-red-600">
            {diagnosis ? (
              <Stethoscope className="size-5 shrink-0" />
            ) : (
              <Pill className="size-5 shrink-0" />
            )}
            <DialogTitle className="text-base">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {diagnosis?.diagnosis ? (
              <CatalogValue
                kind="cancer_diagnosis"
                code={diagnosis.diagnosis}
              />
            ) : treatment?.treatmentType ? (
              <CatalogValue
                kind="treatment_type"
                code={treatment.treatmentType}
              />
            ) : (
              "Registro clínico"
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3.5 py-2 text-xs">
          {diagnosis && <DiagnosisDetails diagnosis={diagnosis} />}
          {treatment && (
            <TreatmentDetails
              treatment={treatment}
              medications={medicationsQuery.data ?? []}
              isLoadingMedications={medicationsQuery.isLoading}
              hasMedicationError={medicationsQuery.isError}
            />
          )}
          <div className="flex items-center justify-between gap-2 border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DiagnosisDetails({ diagnosis }: { diagnosis: PatientDiagnosis }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill active={diagnosis.isCurrent} />
        <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold">
          {diagnosis.cancerStage ? (
            <CatalogValue kind="cancer_stage" code={diagnosis.cancerStage} />
          ) : (
            "Etapa sin dato"
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Fact
          label="Diagnóstico"
          value={
            <CatalogValue
              kind="cancer_diagnosis"
              code={diagnosis.diagnosis}
            />
          }
        />
        <Fact
          label="Especialidad"
          value={
            diagnosis.diagnosisSpecialty ? (
              <CatalogValue
                kind="medical_specialty"
                code={diagnosis.diagnosisSpecialty}
              />
            ) : null
          }
        />
        <Fact
          label="Etapa"
          value={
            diagnosis.cancerStage ? (
              <CatalogValue kind="cancer_stage" code={diagnosis.cancerStage} />
            ) : null
          }
        />
        <Fact
          label="Centro de salud"
          value={diagnosis.healthCenterName ?? diagnosis.healthCenterId}
        />
        <Fact
          label="Centro derivado"
          value={
            diagnosis.referredHealthCenterName ??
            diagnosis.referredHealthCenterId
          }
        />
        <Fact
          label="Fecha de diagnóstico"
          value={formatDate(diagnosis.diagnosisDate)}
          icon={Calendar}
        />
        <Fact
          label="Primeros síntomas"
          value={formatDate(diagnosis.firstSymptomsDate)}
          icon={Calendar}
        />
        <Fact
          label="Tiempo de espera"
          value={
            diagnosis.waitTimeForDiagnosis
              ? formatDuration(diagnosis.waitTimeForDiagnosis)
              : diagnosis.waitTimeSource == null &&
                  diagnosis.diagnosisDate &&
                  diagnosis.firstSymptomsDate
                ? "No recuerda"
                : formatDuration(diagnosis.waitTimeForDiagnosis)
          }
          icon={Clock}
        />
        <Fact
          label="Origen del tiempo de espera"
          value={waitSourceLabel(diagnosis.waitTimeSource)}
        />
        <Fact
          label="Síntoma que llevó a consulta"
          value={diagnosis.symptomLeadingToCheckup}
        />
        <Fact
          label="Informe médico"
          value={diagnosis.hasMedicalReport ? "Sí" : "No"}
        />
        <Fact
          label="Derivación activa de SEPA"
          value={booleanLabel(diagnosis.isSepaActiveReferral)}
        />
        <Fact
          label="Cuenta con referencia"
          value={booleanLabel(diagnosis.hasReferral)}
        />
        <Fact label="Creado" value={formatDateTime(diagnosis.createdAt)} />
      </div>
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
  const { data: specialtyItems = [] } = useCatalog("medical_specialty")
  const situation =
    treatment.treatmentSituation ??
    (treatment.isCurrent ? "EN_CURSO" : "FINALIZADO")

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusPill active={treatment.isCurrent} />
        <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold">
          <CatalogValue kind="treatment_situation" code={situation} />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Fact
          label="Tipo de tratamiento"
          value={
            <CatalogValue
              kind="treatment_type"
              code={treatment.treatmentType}
            />
          }
        />
        <Fact
          label="Diagnóstico asociado"
          value={
            treatment.diagnosisSummary?.diagnosis ? (
              <CatalogValue
                kind="cancer_diagnosis"
                code={treatment.diagnosisSummary.diagnosis}
              />
            ) : null
          }
        />
        <Fact
          label="Frecuencia"
          value={formatDuration(treatment.treatmentFrequency)}
          icon={Clock}
        />
        <Fact
          label="Periodo"
          value={periodLabel(treatment)}
          icon={Calendar}
        />
        <Fact label="Programa de atención" value={treatment.careProgram} />
        <Fact
          label="Vía de quimioterapia"
          value={
            treatment.chemotherapyRoute ? (
              <CatalogValue
                kind="chemotherapy_route"
                code={treatment.chemotherapyRoute}
              />
            ) : null
          }
        />
        <Fact
          label="Procedimiento quirúrgico"
          value={
            treatment.operationName ? (
              <CatalogValue
                kind="surgical_procedure"
                code={treatment.operationName}
              />
            ) : null
          }
        />
        <Fact
          label="Centro de origen"
          value={
            treatment.sourceHealthCenterName ?? treatment.sourceHealthCenterId
          }
        />
        <Fact
          label="Centro receptor"
          value={
            treatment.receivingHealthCenterName ??
            treatment.receivingHealthCenterId
          }
        />
        <Fact
          label="Es derivado"
          value={treatment.isReferred ? "Sí" : "No"}
        />
        <Fact
          label="Recibe teleconsulta"
          value={booleanLabel(treatment.receivesTeleconsultation)}
        />
        <Fact
          label="Especialidades de teleconsulta"
          value={formatCatalogCodesList(
            specialtyItems,
            treatment.teleconsultationSpecialties,
          )}
        />
        <Fact label="Creado" value={formatDateTime(treatment.createdAt)} />
      </div>

      {(treatment.notReceivingReason ||
        treatment.treatmentAbandonmentReason ||
        treatment.changeReason ||
        treatment.teleconsultationNote) && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-amber-950">
          {treatment.notReceivingReason ? (
            <Note
              label="Motivo de no recibir tratamiento"
              value={treatment.notReceivingReason}
            />
          ) : null}
          {treatment.treatmentAbandonmentReason ? (
            <Note
              label="Motivo de abandono"
              value={treatment.treatmentAbandonmentReason}
            />
          ) : null}
          {treatment.changeReason ? (
            <Note label="Motivo del cambio" value={treatment.changeReason} />
          ) : null}
          {treatment.teleconsultationNote ? (
            <Note
              label="Nota de teleconsulta"
              value={treatment.teleconsultationNote}
            />
          ) : null}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-muted-foreground text-[10px] font-semibold">
          Medicamentos ({medications.length})
        </p>
        {isLoadingMedications ? (
          <p className="text-muted-foreground">Cargando medicamentos...</p>
        ) : hasMedicationError ? (
          <p className="text-muted-foreground">
            No se pudieron cargar los medicamentos.
          </p>
        ) : medications.length ? (
          <div className="space-y-2">
            {medications.map((medication) => (
              <MedicationDetails key={medication.id} medication={medication} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No hay medicamentos registrados.
          </p>
        )}
      </div>
    </div>
  )
}

function MedicationDetails({
  medication,
}: {
  medication: TreatmentMedication
}) {
  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-sm font-semibold">{medication.name}</p>
        <StatusPill active={medication.isActive} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Fact
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
        <Fact
          label="Vía"
          value={
            medication.route ? medicationRouteLabels[medication.route] : null
          }
        />
        <Fact
          label="Frecuencia"
          value={formatDuration(medication.frequency)}
          icon={Clock}
        />
        <Fact
          label="Periodo"
          value={periodLabel(medication)}
          icon={Calendar}
        />
        <Fact
          className="col-span-2"
          label="Notas"
          value={medication.notes}
        />
      </div>
    </div>
  )
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
          : "rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
      }
    >
      {active ? "Activo" : "Histórico"}
    </span>
  )
}

function Fact({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: ReactNode
  icon?: typeof Calendar
  className?: string
}) {
  return (
    <div className={`rounded-lg border bg-background p-2.5 ${className ?? ""}`}>
      <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-semibold">
        {Icon ? <Icon className="size-3 shrink-0" /> : null}
        {label}
      </span>
      <div className="mt-0.5 text-xs font-medium break-words">
        {value || "Sin dato"}
      </div>
    </div>
  )
}

function Note({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-amber-800">{label}</p>
      <p className="text-xs">{value}</p>
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
