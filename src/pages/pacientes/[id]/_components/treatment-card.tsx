import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Archive,
  ArrowRight,
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  Loader2,
  Pencil,
  Pill,
  Plus,
  RotateCcw,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  patientsApi,
  type PatientTreatment,
  type TreatmentMedication,
} from "@/api/patients"
import { DURATION_UNIT_LABELS } from "@/types/duration"
import {
  medicationDoseUnitLabels,
  medicationRouteLabels,
  treatmentSituationLabels,
} from "../_lib/clinical-labels"
import { useTreatmentMedications } from "../_hooks/use-patient-records"
import {
  TreatmentMedicationDialog,
  type TreatmentMedicationInput,
} from "./treatment-medication-dialog"
import { useAuthStore } from "@/store/auth-store"
import { cn } from "@/lib/utils"

type DurationValue = NonNullable<PatientTreatment["treatmentFrequency"]>

function date(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-"
}

function durationLabel(value: DurationValue | null | undefined) {
  if (!value) return null
  if (value.label) return value.label
  const range =
    value.valueMax !== null && value.valueMax !== value.valueMin
      ? `${value.valueMin} a ${value.valueMax}`
      : String(value.valueMin)
  return `${range} ${DURATION_UNIT_LABELS[value.unit].toLowerCase()}`
}

function treatmentStatus(treatment: PatientTreatment) {
  if (treatment.treatmentSituation) {
    return treatment.treatmentSituation
  }
  return treatment.isCurrent ? "EN_CURSO" : "FINALIZADO"
}

function statusClass(status: ReturnType<typeof treatmentStatus>) {
  switch (status) {
    case "EN_CURSO":
      return "border-emerald-200 bg-emerald-50 text-emerald-700"
    case "PENDIENTE_DE_INICIO":
      return "border-amber-200 bg-amber-50 text-amber-700"
    case "INTERRUMPIDO":
      return "border-orange-200 bg-orange-50 text-orange-700"
    case "FINALIZADO":
      return "border-border bg-muted text-muted-foreground"
    case "SEARCHING":
      return "border-sky-200 bg-sky-50 text-sky-700"
    case "ABANDONED":
      return "border-red-200 bg-red-50 text-red-700"
    case "DECEASED_DURING_TREATMENT":
      return "border-slate-200 bg-slate-50 text-slate-700"
    case "NOT_APPLICABLE":
      return "border-border bg-muted text-muted-foreground"
    case "REMISSION":
      return "border-violet-200 bg-violet-50 text-violet-700"
  }
}

export function TreatmentCard({
  patientId,
  treatment,
  allowMedicationManagement,
}: {
  patientId: string
  treatment: PatientTreatment
  allowMedicationManagement: boolean
}) {
  const [open, setOpen] = useState(false)
  const status = treatmentStatus(treatment)
  const statusLabel = treatmentSituationLabels[status]

  return (
    <article
      className={cn(
        "bg-card overflow-hidden rounded-xl border transition-shadow",
        open && "shadow-sm",
      )}
    >
      <button
        type="button"
        className="hover:bg-muted/30 flex w-full items-start gap-3 p-4 text-left transition-colors"
        aria-expanded={open}
        aria-controls={`treatment-details-${treatment.id}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="bg-primary/10 text-primary mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Pill className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {treatment.treatmentType}
            </span>
            <Badge
              variant="outline"
              className={cn("text-[10px]", statusClass(status))}
            >
              {statusLabel}
            </Badge>
            {treatment.isReferred && (
              <Badge variant="outline" className="gap-1 text-[10px]">
                <ArrowRight className="size-3" />
                Derivado
              </Badge>
            )}
          </span>
          <span className="text-muted-foreground mt-1 block truncate text-xs">
            {treatment.diagnosisSummary?.diagnosis ??
              "Sin diagnóstico asociado"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "text-muted-foreground mt-1 size-4 shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <div className="grid grid-cols-2 gap-3 border-t px-4 py-3 sm:grid-cols-4">
        <Detail
          label="Período"
          value={periodLabel(treatment)}
          icon={Calendar}
        />
        <Detail
          label="Frecuencia"
          value={durationLabel(treatment.treatmentFrequency)}
          icon={Clock}
        />
        <Detail
          label="Centro de atención"
          value={
            treatment.isReferred
              ? treatment.receivingHealthCenterName
              : (treatment.receivingHealthCenterName ??
                treatment.sourceHealthCenterName)
          }
          icon={Building2}
        />
      </div>

      {open && (
        <div
          id={`treatment-details-${treatment.id}`}
          className="bg-muted/10 space-y-5 border-t px-4 pt-4 pb-4"
        >
          <div>
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Detalle del tratamiento
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              <Detail
                label="Diagnóstico"
                value={treatment.diagnosisSummary?.diagnosis}
              />
              <Detail
                label="Período"
                value={periodLabel(treatment)}
                icon={Calendar}
              />
              <Detail
                label="Frecuencia"
                value={durationLabel(treatment.treatmentFrequency)}
                icon={Clock}
              />
              <Detail
                label={
                  treatment.isReferred
                    ? "Centro de origen"
                    : "Centro de atención"
                }
                value={
                  (treatment.isReferred
                    ? treatment.sourceHealthCenterName
                    : treatment.receivingHealthCenterName) ?? null
                }
                icon={Building2}
              />
              {treatment.isReferred && (
                <Detail
                  label="Centro receptor"
                  value={treatment.receivingHealthCenterName}
                  icon={Building2}
                />
              )}
              {treatment.operationName && (
                <Detail label="Operación" value={treatment.operationName} />
              )}
              {treatment.careProgram && (
                <Detail
                  label="Programa de atención"
                  value={treatment.careProgram}
                />
              )}
              {treatment.receivesTeleconsultation !== null && (
                <Detail
                  label="Teleconsulta"
                  value={treatment.receivesTeleconsultation ? "Sí" : "No"}
                />
              )}
              {treatment.teleconsultationNote && (
                <Detail
                  label="Nota de teleconsulta"
                  value={treatment.teleconsultationNote}
                />
              )}
              {treatment.treatmentAbandonmentReason && (
                <Detail
                  label="Motivo de abandono"
                  value={treatment.treatmentAbandonmentReason}
                />
              )}
              {treatment.notReceivingReason && (
                <Detail
                  label="Motivo de no recibir"
                  value={treatment.notReceivingReason}
                />
              )}
              {treatment.changeReason && (
                <Detail
                  label="Motivo de cambio"
                  value={treatment.changeReason}
                />
              )}
            </div>
          </div>

          <TreatmentMedications
            patientId={patientId}
            treatment={treatment}
            canManage={allowMedicationManagement}
            expanded={open}
          />
        </div>
      )}
    </article>
  )
}

function periodLabel(treatment: PatientTreatment) {
  if (!treatment.startDate && !treatment.endDate) return "Sin fechas"
  if (!treatment.startDate) return `Hasta ${date(treatment.endDate)}`
  return `Desde ${date(treatment.startDate)}${treatment.endDate ? ` hasta ${date(treatment.endDate)}` : " (en curso)"}`
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <div className="min-w-0">
      <p className="text-muted-foreground flex items-center gap-1 text-xs">
        {Icon && <Icon className="size-3 shrink-0" />}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium break-words">{value || "-"}</p>
    </div>
  )
}

function TreatmentMedications({
  patientId,
  treatment,
  canManage,
  expanded,
}: {
  patientId: string
  treatment: PatientTreatment
  canManage: boolean
  expanded: boolean
}) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const hasPermission =
    canManage &&
    (user?.role === "ADMIN" ||
      user?.role === "FOUNDATION" ||
      user?.role === "AGENT")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMedication, setEditingMedication] =
    useState<TreatmentMedication | null>(null)
  const {
    data: medications = [],
    isLoading,
    isError,
  } = useTreatmentMedications(patientId, treatment.id, expanded)

  const medicationMutation = useMutation({
    mutationFn: ({
      medication,
      values,
    }: {
      medication: TreatmentMedication | null
      values: TreatmentMedicationInput
    }) =>
      medication
        ? patientsApi.updateTreatmentMedication(
            patientId,
            treatment.id,
            medication.id,
            values,
          )
        : patientsApi.createTreatmentMedication(
            patientId,
            treatment.id,
            values,
          ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["treatment-medications", patientId, treatment.id],
      })
      setDialogOpen(false)
      setEditingMedication(null)
    },
  })

  const medicationStatusMutation = useMutation({
    mutationFn: async (medication: TreatmentMedication) => {
      if (medication.isActive) {
        await patientsApi.deactivateTreatmentMedication(
          patientId,
          treatment.id,
          medication.id,
        )
      } else {
        await patientsApi.updateTreatmentMedication(
          patientId,
          treatment.id,
          medication.id,
          { isActive: true },
        )
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["treatment-medications", patientId, treatment.id],
      }),
  })

  function openNewMedication() {
    setEditingMedication(null)
    setDialogOpen(true)
  }

  function openEditMedication(medication: TreatmentMedication) {
    setEditingMedication(medication)
    setDialogOpen(true)
  }

  return (
    <section className="border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Pill className="text-primary size-3.5" />
            Medicamentos
            {medications.length > 0 && (
              <span className="text-muted-foreground">
                ({medications.length})
              </span>
            )}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Indicaciones asociadas a este tratamiento
          </p>
        </div>
        {hasPermission && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 shrink-0 gap-1 text-xs"
            onClick={openNewMedication}
          >
            <Plus className="size-3" />
            Agregar
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
          <Loader2 className="size-3.5 animate-spin" />
          Cargando medicamentos...
        </p>
      ) : isError ? (
        <p className="text-muted-foreground mt-3 text-sm">
          No se pudieron cargar los medicamentos.
        </p>
      ) : medications.length ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {medications.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              canManage={hasPermission}
              isPending={medicationStatusMutation.isPending}
              onEdit={() => openEditMedication(medication)}
              onToggle={() => medicationStatusMutation.mutate(medication)}
            />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground mt-3 rounded-lg border border-dashed px-3 py-4 text-center text-sm">
          Sin medicamentos registrados.
        </p>
      )}

      <TreatmentMedicationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingMedication(null)
        }}
        treatment={treatment}
        medication={editingMedication}
        isPending={medicationMutation.isPending}
        onSubmit={(values) =>
          medicationMutation.mutate({ medication: editingMedication, values })
        }
      />
    </section>
  )
}

function MedicationCard({
  medication,
  canManage,
  isPending,
  onEdit,
  onToggle,
}: {
  medication: TreatmentMedication
  canManage: boolean
  isPending: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  const dose =
    [
      medication.doseAmount !== null ? String(medication.doseAmount) : null,
      medication.doseUnit
        ? medicationDoseUnitLabels[medication.doseUnit]
        : null,
      medication.doseDescription,
    ]
      .filter(Boolean)
      .join(" ") || "Dosis no registrada"
  const schedule = [
    medication.frequency ? durationLabel(medication.frequency) : null,
    medication.route ? medicationRouteLabels[medication.route] : null,
  ]
    .filter(Boolean)
    .join(" · ")
  const period =
    medication.startDate || medication.endDate
      ? `${medication.startDate ? `Desde ${date(medication.startDate)}` : "Sin fecha de inicio"}${medication.endDate ? ` hasta ${date(medication.endDate)}` : ""}`
      : null

  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{medication.name}</p>
            <Badge
              variant={medication.isActive ? "secondary" : "outline"}
              className="text-[10px]"
            >
              {medication.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p className="mt-1 text-sm">{dose}</p>
          {schedule && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <Clock className="size-3" />
              {schedule}
            </p>
          )}
          {period && (
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
              <Calendar className="size-3" />
              {period}
            </p>
          )}
          {medication.notes && (
            <p className="text-muted-foreground mt-2 text-xs">
              {medication.notes}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Editar medicamento"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={
                medication.isActive
                  ? "Desactivar medicamento"
                  : "Reactivar medicamento"
              }
              onClick={onToggle}
              disabled={isPending}
            >
              {medication.isActive ? (
                <Archive className="size-3.5" />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
