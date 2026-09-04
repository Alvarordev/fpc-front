import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  CalendarHeart,
  ClipboardList,
  History,
  Loader2,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react"
import { enrollmentsApi } from "@/api/enrollments"
import { patientsApi } from "@/api/patients"
import { useEnrollmentStore } from "@/pages/enrolamiento/_store/enrollment-store"
import {
  patientTimelineApi,
  type PatientTimelineEvent,
} from "@/api/patient-timeline"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { HistoricalFollowUpDialog } from "./historical-follow-up-dialog"
import { HistoricalPsychooncologyDialog } from "./historical-psychooncology-dialog"
import { HistoricalReminderDialog } from "./historical-reminder-dialog"
import {
  FOLLOW_UP_PURPOSE_OPTIONS,
  FOLLOW_UP_TYPE_OPTIONS,
  formatHistoricalDate,
  formatHistoricalDateTime,
  optionLabel,
  type SelectOption,
} from "./historical-record-options"

type DialogTarget =
  | { kind: "FOLLOW_UP"; followUpId?: string }
  | { kind: "REMINDER"; reminderId?: string }
  | { kind: "PSYCHOONCOLOGY"; appointmentId?: string }

function eventTitle(event: PatientTimelineEvent) {
  if (event.kind === "FOLLOW_UP")
    return `Seguimiento · ${optionLabel(FOLLOW_UP_TYPE_OPTIONS, event.type)}`
  if (event.kind === "REMINDER") return "Recordatorio"
  if (event.kind === "PSYCHOONCOLOGY_APPOINTMENT")
    return `Sesión psicooncológica · #${event.sessionNumber}`
  return "Nota social"
}

function eventDescription(event: PatientTimelineEvent) {
  if (event.kind === "FOLLOW_UP") return event.notes || "Sin notas"
  if (event.kind === "REMINDER") return event.description
  if (event.kind === "PSYCHOONCOLOGY_APPOINTMENT")
    return event.modality === "VIDEO_CALL" ? "Videollamada" : "Llamada"
  return event.note
}

function eventStatus(event: PatientTimelineEvent) {
  return event.kind === "SOCIAL_NOTE" ? "NOTA" : event.status
}

function editTargetForEvent(event: PatientTimelineEvent): DialogTarget | null {
  if (event.kind === "FOLLOW_UP")
    return { kind: "FOLLOW_UP", followUpId: event.followUpId }
  if (event.kind === "REMINDER")
    return { kind: "REMINDER", reminderId: event.id }
  if (event.kind === "PSYCHOONCOLOGY_APPOINTMENT")
    return { kind: "PSYCHOONCOLOGY", appointmentId: event.id }
  return null
}

export function HistoricalRecordsPanel({
  patientId,
  enrollmentFollowUpId,
}: {
  patientId: string
  enrollmentFollowUpId?: string | null
}) {
  const navigate = useNavigate()
  const resetEnrollment = useEnrollmentStore((state) => state.resetEnrollment)
  /*
   * The target is kept while the dialog animates out, and `token` changes on
   * every open so the next one remounts with fresh state.
   */
  const [dialog, setDialog] = useState<{
    target: DialogTarget
    open: boolean
    token: number
  } | null>(null)

  function openDialog(target: DialogTarget) {
    setDialog((current) => ({
      target,
      open: true,
      token: (current?.token ?? 0) + 1,
    }))
  }

  function closeDialog() {
    setDialog((current) => (current ? { ...current, open: false } : null))
  }

  const followUpTarget =
    dialog?.target.kind === "FOLLOW_UP" ? dialog.target : null
  const reminderTarget =
    dialog?.target.kind === "REMINDER" ? dialog.target : null
  const psychooncologyTarget =
    dialog?.target.kind === "PSYCHOONCOLOGY" ? dialog.target : null

  const patientQuery = useQuery({
    queryKey: ["patient-profile", patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
  const enrollmentsQuery = useQuery({
    queryKey: ["patient-enrollments", patientId],
    queryFn: () => enrollmentsApi.listByPatient(patientId),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  })
  const timelineQuery = useQuery({
    queryKey: ["patient-timeline", patientId],
    queryFn: () => patientTimelineApi.list(patientId),
    enabled: Boolean(patientId),
  })

  const enrollmentFollowUpIds = new Set(
    (enrollmentsQuery.data ?? []).map((enrollment) => enrollment.followUpId),
  )
  const followUpEvents =
    timelineQuery.data?.data.filter((event) => event.kind === "FOLLOW_UP") ?? []
  const followUpItems: SelectOption[] = [
    ...(enrollmentsQuery.data ?? []).map((enrollment) => ({
      value: enrollment.followUpId,
      label: `Enrolamiento · ${formatHistoricalDate(enrollment.enrolledOn)}`,
    })),
    ...followUpEvents
      .filter((event) => !enrollmentFollowUpIds.has(event.followUpId))
      .map((event) => ({
        value: event.followUpId,
        label: `${optionLabel(FOLLOW_UP_PURPOSE_OPTIONS, event.purpose)} · ${formatHistoricalDate(event.occurredAt)}`,
      })),
  ]
  const defaultFollowUpId =
    enrollmentFollowUpId ?? followUpItems[0]?.value ?? undefined

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2 gap-1.5 text-xs"
            onClick={() => navigate("/carga-historica")}
          >
            <ArrowLeft className="size-3.5" />
            Buscar otro paciente
          </Button>
          <p className="text-primary mb-1 text-[10px] font-bold tracking-[0.18em] uppercase">
            Carga histórica
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Perfil histórico
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Revise la historia registrada y agregue hechos anteriores sin crear
            actividad operativa futura.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            resetEnrollment()
            navigate("/carga-historica/nuevo")
          }}
        >
          <Plus className="size-4" />
          Nuevo paciente histórico
        </Button>
      </div>

      {patientQuery.isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" /> Cargando perfil...
        </div>
      )}
      {patientQuery.isError && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="text-destructive p-4 text-sm">
            No se pudo cargar el paciente. Regrese a la búsqueda e inténtelo de
            nuevo.
          </CardContent>
        </Card>
      )}
      {patientQuery.data && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">
                {patientQuery.data.fullName}
              </p>
              <p className="text-muted-foreground text-xs">
                {patientQuery.data.dni
                  ? `DNI ${patientQuery.data.dni}`
                  : "Sin DNI registrado"}
                {patientQuery.data.primaryPhone
                  ? ` · ${patientQuery.data.primaryPhone}`
                  : ""}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarHeart className="text-primary size-4" />
            Agregar registro histórico
          </CardTitle>
          <CardDescription>
            Cada registro se guarda al confirmarlo en su formulario. Las fechas
            corresponden al hecho original.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="gap-1.5"
            onClick={() => openDialog({ kind: "FOLLOW_UP" })}
          >
            <Plus className="size-4" />
            Agregar seguimiento
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => openDialog({ kind: "REMINDER" })}
          >
            <Plus className="size-4" />
            Agregar recordatorio
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-1.5"
            onClick={() => openDialog({ kind: "PSYCHOONCOLOGY" })}
          >
            <Plus className="size-4" />
            Agregar sesión
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="text-primary size-4" />
            Línea de tiempo
          </CardTitle>
          <CardDescription>
            Los registros aparecen ordenados por la fecha efectiva del hecho
            cuando está disponible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timelineQuery.isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" /> Cargando historial...
            </div>
          )}
          {timelineQuery.isError && (
            <p className="text-destructive text-sm">
              No se pudo cargar la línea de tiempo.
            </p>
          )}
          {!timelineQuery.isLoading &&
            !timelineQuery.isError &&
            timelineQuery.data?.data.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center gap-2 py-8 text-center text-sm">
                <ClipboardList className="size-8 opacity-50" />
                Todavía no hay registros visibles para este paciente.
              </div>
            )}
          {timelineQuery.data?.data.length ? (
            <div className="before:bg-border relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px">
              {timelineQuery.data.data.map((event) => {
                const editTarget = editTargetForEvent(event)
                return (
                  <div
                    key={`${event.kind}-${event.id}`}
                    className="relative flex gap-3 pl-1"
                  >
                    <div className="border-background bg-primary ring-primary/30 z-10 mt-1 flex size-3 shrink-0 rounded-full border-2 ring-1" />
                    <div className="bg-card min-w-0 flex-1 rounded-xl border p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {eventTitle(event)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{eventStatus(event)}</Badge>
                          <span className="text-muted-foreground text-xs">
                            {event.occurredAtIsApproximate &&
                              "Fecha aproximada · "}
                            {formatHistoricalDate(event.occurredAt)}
                          </span>
                          {editTarget && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs"
                              onClick={() => openDialog(editTarget)}
                            >
                              <Pencil className="size-3.5" />
                              Editar
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {eventDescription(event)}
                      </p>
                      {event.kind === "FOLLOW_UP" &&
                        event.outcomes.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {event.outcomes.map((outcome) => (
                              <Badge
                                key={`${outcome.type}-${outcome.recordId}`}
                                variant="secondary"
                              >
                                {outcome.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      <div className="text-muted-foreground/80 mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-[11px]">
                        <span>
                          Creado en CRM:{" "}
                          {formatHistoricalDateTime(event.createdAt)}
                        </span>
                        <span>
                          Actualizado:{" "}
                          {formatHistoricalDateTime(event.updatedAt)}
                        </span>
                        {event.historicalLoadedByEmail && (
                          <span>
                            Usuario de carga: {event.historicalLoadedByEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {followUpTarget && (
        <HistoricalFollowUpDialog
          key={`follow-up-${dialog?.token}`}
          open={Boolean(dialog?.open)}
          onOpenChange={(open) => !open && closeDialog()}
          patientId={patientId}
          followUpId={followUpTarget.followUpId ?? null}
        />
      )}
      {reminderTarget && (
        <HistoricalReminderDialog
          key={`reminder-${dialog?.token}`}
          open={Boolean(dialog?.open)}
          onOpenChange={(open) => !open && closeDialog()}
          patientId={patientId}
          reminderId={reminderTarget.reminderId ?? null}
          followUpItems={followUpItems}
          defaultFollowUpId={defaultFollowUpId}
        />
      )}
      {psychooncologyTarget && (
        <HistoricalPsychooncologyDialog
          key={`psico-${dialog?.token}`}
          open={Boolean(dialog?.open)}
          onOpenChange={(open) => !open && closeDialog()}
          patientId={patientId}
          appointmentId={psychooncologyTarget.appointmentId ?? null}
          followUpItems={followUpItems}
          defaultFollowUpId={defaultFollowUpId}
        />
      )}
    </div>
  )
}
