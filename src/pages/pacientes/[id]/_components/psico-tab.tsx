import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  BrainCircuit,
  CalendarDays,
  CalendarPlus,
  Clock3,
  Edit,
  PhoneCall,
  Video,
} from "lucide-react"
import { toast } from "sonner"
import {
  psychooncologyAppointmentsApi,
  type PsychooncologyAppointment,
} from "@/api/psychooncology-appointments"
import { volunteersApi } from "@/api/volunteers"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/store/auth-store"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"
import { AgendaSessionResultDialog } from "@/pages/agenda/_components/agenda-session-result-dialog"
import { AgendaSessionResultSheet } from "@/pages/agenda/_components/agenda-session-result-sheet"
import { PsychooncologySessionDetailDialog } from "./psychooncology-session-detail-dialog"
import {
  SchedulePsychooncologyDialog,
  type SchedulePsychooncologySubmitInput,
} from "./schedule-psychooncology-dialog"

interface PsicoTabProps {
  pacienteId: string
  patientName: string
}

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
}

const statusStyles: Record<string, string> = {
  SCHEDULED: "border-violet-200 bg-violet-50/70 hover:border-violet-300",
  NO_ANSWER: "border-amber-200 bg-amber-50/70 hover:border-amber-300",
  COMPLETED: "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300",
  CANCELLED: "border-border bg-muted/40 hover:border-muted-foreground/30",
}

type SessionBeneficiaryTab = "PATIENT" | "COMPANION"

function formatScheduledParts(date: string | null, dateOnly: string | null) {
  const value = new Date(date ?? (dateOnly ? `${dateOnly}T12:00:00` : ""))
  if (Number.isNaN(value.getTime())) {
    return {
      day: "—",
      month: "",
      year: "",
      date: "Sin fecha",
      time: "Sin hora",
    }
  }
  return {
    day: value.toLocaleDateString("es-PE", { day: "numeric" }),
    month: value
      .toLocaleDateString("es-PE", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
    year: value.toLocaleDateString("es-PE", { year: "numeric" }),
    date: value.toLocaleDateString("es-PE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    time: value.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }
}

function ratingLabel(rating: unknown) {
  if (typeof rating !== "number" && typeof rating !== "string") return undefined
  return ENROLLMENT_RATING_OPTIONS.find(
    (option) => option.value === String(rating),
  )?.label
}

function PsychoSessionCard({
  appointment,
  volunteerName,
  canManage,
  canRecordResult,
  onView,
  onEdit,
  onRegister,
  onNoAnswer,
  onCancel,
}: {
  appointment: PsychooncologyAppointment
  volunteerName: string
  canManage: boolean
  canRecordResult: boolean
  onView: () => void
  onEdit: () => void
  onRegister: () => void
  onNoAnswer: () => void
  onCancel: () => void
}) {
  const date = formatScheduledParts(
    appointment.scheduledAt,
    appointment.scheduledOn,
  )
  const companionName = textValue(appointment.companionFullName)
  const schedulingNotes = textValue(appointment.schedulingNotes)
  const noAnswerNote = textValue(appointment.noAnswerNote)
  const satisfactionComment = textValue(appointment.satisfactionComment)
  const isScheduled = appointment.status === "SCHEDULED"
  const isNoAnswer = appointment.status === "NO_ANSWER"
  const isActionable = isScheduled || isNoAnswer
  const ModalityIcon = appointment.modality === "CALL" ? PhoneCall : Video

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle de la sesión ${appointment.sessionNumber}`}
      onClick={onView}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onView()
        }
      }}
      className={`rounded-2xl border p-3 transition-[border-color,box-shadow] duration-200 hover:shadow-sm sm:p-4 ${statusStyles[appointment.status] ?? statusStyles.SCHEDULED}`}
    >
      <div className="flex items-stretch gap-3 sm:gap-5">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-white/70 py-2 text-violet-900 sm:w-16">
          <span className="text-2xl leading-none font-semibold tracking-tight">
            {date.day}
          </span>
          <span className="text-muted-foreground mt-1 text-[10px] font-semibold tracking-wider">
            {date.month}
          </span>
          <span className="text-muted-foreground text-[10px]">{date.year}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <ModalityIcon className="size-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold sm:text-base">
                  Sesión {appointment.sessionNumber}
                </p>
                <p className="text-muted-foreground text-xs">{volunteerName}</p>
                {appointment.beneficiaryType === "COMPANION" && (
                  <p className="text-muted-foreground text-xs">
                    Para: {companionName ?? "Acompañante"}
                  </p>
                )}
              </div>
              <Badge variant="outline">
                {statusLabels[appointment.status]}
              </Badge>
            </div>
            {(canManage || canRecordResult) && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onEdit()
                }}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600 shadow-2xs transition-colors hover:bg-red-600 hover:text-white"
                title="Editar sesión"
              >
                <Edit className="size-3.5" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              <span className="capitalize">{date.date}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {date.time}
            </span>
          </div>

          {schedulingNotes && (
            <p className="text-muted-foreground mt-3 line-clamp-2 text-sm leading-relaxed">
              <span className="text-foreground/80 font-medium">
                Derivación:{" "}
              </span>
              {schedulingNotes}
            </p>
          )}

          {noAnswerNote && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-amber-900/80">
              <span className="font-medium">Nota (no contestó): </span>
              {noAnswerNote}
            </p>
          )}

          {appointment.status === "COMPLETED" &&
            (textValue(appointment.satisfactionRating) ||
              satisfactionComment) && (
              <div className="mt-3 rounded-xl border border-emerald-200/80 bg-white/60 p-3 text-sm">
                {appointment.satisfactionRating && (
                  <p className="font-medium text-emerald-900">
                    Encuesta: {ratingLabel(appointment.satisfactionRating)}
                  </p>
                )}
                {satisfactionComment && (
                  <p className="text-muted-foreground mt-1 leading-relaxed">
                    {satisfactionComment}
                  </p>
                )}
              </div>
            )}

          {appointment.followUpId && (
            <p className="text-muted-foreground mt-2 text-xs">
              Vinculada a un seguimiento
            </p>
          )}

          {isActionable && (
            <div className="mt-3 flex flex-wrap gap-2">
              {canRecordResult && (
                <Button
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    onRegister()
                  }}
                >
                  Registrar
                </Button>
              )}
              {canRecordResult && isScheduled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation()
                    onNoAnswer()
                  }}
                >
                  No contestó
                </Button>
              )}
              {canRecordResult && isScheduled && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation()
                    onCancel()
                  }}
                >
                  Cancelar
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export function PsicoTab({ pacienteId, patientName }: PsicoTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [detailAppointment, setDetailAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [resultAppointment, setResultAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [resultOpen, setResultOpen] = useState(false)
  const [noAnswerTarget, setNoAnswerTarget] =
    useState<PsychooncologyAppointment | null>(null)
  const [noAnswerNote, setNoAnswerNote] = useState("")
  const [beneficiaryTab, setBeneficiaryTab] =
    useState<SessionBeneficiaryTab>("PATIENT")

  const canSchedule =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT" ||
    user?.role === "VOLUNTEER"
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"

  const appointmentsQuery = useQuery({
    queryKey: ["psychooncology-appointments", pacienteId],
    queryFn: () =>
      psychooncologyAppointmentsApi.list({ patientId: pacienteId }),
  })
  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    staleTime: 300_000,
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["psychooncology-appointments", pacienteId],
      }),
      queryClient.invalidateQueries({
        queryKey: ["patient-timeline", pacienteId],
      }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: psychooncologyAppointmentsApi.create,
    onSuccess: async () => {
      await invalidate()
      toast.success("Cita de psicooncología agendada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo agendar la cita", { description: error.message }),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: Parameters<typeof psychooncologyAppointmentsApi.update>[1]
    }) => psychooncologyAppointmentsApi.update(id, input),
    onSuccess: async () => {
      await invalidate()
      toast.success("Cita actualizada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo actualizar la cita", {
        description: error.message,
      }),
  })

  const cancelMutation = useMutation({
    mutationFn: psychooncologyAppointmentsApi.cancel,
    onSuccess: async () => {
      await invalidate()
      toast.success("Cita cancelada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo cancelar la cita", {
        description: error.message,
      }),
  })

  const appointments = [...(appointmentsQuery.data ?? [])].sort((a, b) => {
    const scheduledDifference = (b.scheduledOn ?? b.scheduledAt ?? "").localeCompare(
      a.scheduledOn ?? a.scheduledAt ?? "",
    )
    return scheduledDifference || b.id.localeCompare(a.id)
  })
  const patientAppointments = appointments.filter(
    (appointment) => (appointment.beneficiaryType ?? "PATIENT") === "PATIENT",
  )
  const companionAppointments = appointments.filter(
    (appointment) => (appointment.beneficiaryType ?? "PATIENT") === "COMPANION",
  )
  const visibleAppointments =
    beneficiaryTab === "PATIENT" ? patientAppointments : companionAppointments
  const ownVolunteerId =
    user?.role === "VOLUNTEER"
      ? volunteersQuery.data?.find((volunteer) => volunteer.userId === user.id)
          ?.id
      : undefined
  const detailVolunteer = detailAppointment
    ? volunteersQuery.data?.find(
        (volunteer) => volunteer.id === detailAppointment.volunteerId,
      )
    : undefined
  const detailVolunteerName = detailVolunteer
    ? `${detailVolunteer.firstName} ${detailVolunteer.lastName}`
    : "Psicooncólogo"

  async function handleDialogSubmit(
    payload: SchedulePsychooncologySubmitInput,
  ) {
    if (payload.mode === "create") {
      await createMutation.mutateAsync(payload.input)
      return
    }
    await updateMutation.mutateAsync({
      id: payload.id,
      input: payload.input,
    })
  }

  function openEdit(appointment: PsychooncologyAppointment) {
    setEditingAppointment(appointment)
    setScheduleOpen(true)
  }

  function closeDialog() {
    setScheduleOpen(false)
    setEditingAppointment(null)
  }

  function openResult(appointment: PsychooncologyAppointment) {
    setDetailAppointment(null)
    setResultAppointment(appointment)
    setResultOpen(true)
  }

  function closeResult(nextOpen: boolean) {
    setResultOpen(nextOpen)
    if (!nextOpen) setResultAppointment(null)
  }

  async function submitNoAnswer() {
    if (!noAnswerTarget) return
    if (!noAnswerNote.trim()) {
      toast.error("Agrega una nota sobre el intento de contacto")
      return
    }
    await updateMutation.mutateAsync({
      id: noAnswerTarget.id,
      input: {
        status: "NO_ANSWER",
        noAnswerNote: noAnswerNote.trim(),
      },
    })
    setNoAnswerTarget(null)
    setNoAnswerNote("")
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Sesiones de psicooncología</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {appointments.length} cita{appointments.length === 1 ? "" : "s"}{" "}
            registradas
          </p>
        </div>
        {canSchedule && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setEditingAppointment(null)
              setScheduleOpen(true)
            }}
          >
            <CalendarPlus className="size-4" />
            Agendar cita
          </Button>
        )}
      </div>

      {appointmentsQuery.isLoading ? (
        <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
          Cargando citas...
        </div>
      ) : (
        <Tabs
          value={beneficiaryTab}
          onValueChange={(value) =>
            setBeneficiaryTab(value as SessionBeneficiaryTab)
          }
        >
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="PATIENT" className="flex-1 sm:flex-none">
              Paciente
              <Badge variant="secondary" className="ml-1 px-1.5 text-[10px]">
                {patientAppointments.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="COMPANION" className="flex-1 sm:flex-none">
              Acompañantes
              <Badge variant="secondary" className="ml-1 px-1.5 text-[10px]">
                {companionAppointments.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={beneficiaryTab} className="mt-3">
            {visibleAppointments.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <BrainCircuit className="text-muted-foreground/40 size-8" />
                <p className="text-sm font-medium">
                  Sin sesiones para{" "}
                  {beneficiaryTab === "PATIENT"
                    ? "el paciente"
                    : "acompañantes"}
                </p>
                <p className="text-muted-foreground text-xs">
                  Podés crear una cita independiente o vincularla desde un
                  seguimiento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleAppointments.map((appointment) => {
                  const volunteer = volunteersQuery.data?.find(
                    (item) => item.id === appointment.volunteerId,
                  )
                  const volunteerName = volunteer
                    ? `${volunteer.firstName} ${volunteer.lastName}`
                    : "Psicooncólogo"
                  const canRecordResult = user?.role === "VOLUNTEER"

                  return (
                    <PsychoSessionCard
                      key={appointment.id}
                      appointment={appointment}
                      volunteerName={volunteerName}
                      canManage={canManage}
                      canRecordResult={canRecordResult}
                      onView={() => setDetailAppointment(appointment)}
                      onEdit={() => openEdit(appointment)}
                      onRegister={() => openResult(appointment)}
                      onNoAnswer={() => {
                        setNoAnswerTarget(appointment)
                        setNoAnswerNote(
                          textValue(appointment.noAnswerNote) ?? "",
                        )
                      }}
                      onCancel={() => cancelMutation.mutate(appointment.id)}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      <SchedulePsychooncologyDialog
        key={editingAppointment?.id ?? "new"}
        open={scheduleOpen}
        onOpenChange={(open) => (open ? setScheduleOpen(true) : closeDialog())}
        patientId={pacienteId}
        ownVolunteerId={ownVolunteerId}
        appointment={editingAppointment}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleDialogSubmit}
      />

      <PsychooncologySessionDetailDialog
        open={Boolean(detailAppointment)}
        onOpenChange={(open) => !open && setDetailAppointment(null)}
        appointment={detailAppointment}
        patientName={patientName}
        volunteerName={detailAppointment ? detailVolunteerName : ""}
        onRegister={
          user?.role === "VOLUNTEER" && detailAppointment?.status === "SCHEDULED"
            ? () => openResult(detailAppointment)
            : undefined
        }
      />

      {isMobile ? (
        <AgendaSessionResultSheet
          open={resultOpen}
          onOpenChange={closeResult}
          appointment={resultAppointment}
          patientName={patientName}
          patientId={pacienteId}
          volunteerId={ownVolunteerId}
        />
      ) : (
        <AgendaSessionResultDialog
          open={resultOpen}
          onOpenChange={closeResult}
          appointment={resultAppointment}
          patientName={patientName}
          patientId={pacienteId}
          volunteerId={ownVolunteerId}
        />
      )}

      <Dialog
        open={Boolean(noAnswerTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setNoAnswerTarget(null)
            setNoAnswerNote("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como no contestó</DialogTitle>
            <DialogDescription>
              Registra una nota del intento de contacto. Podrás reprogramar o
              completar la sesión después.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="no-answer-note">Nota</Label>
            <Textarea
              id="no-answer-note"
              value={noAnswerNote}
              onChange={(event) => setNoAnswerNote(event.target.value)}
              placeholder="Ej.: llamé dos veces, dejó mensaje en buzón..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setNoAnswerTarget(null)
                setNoAnswerNote("")
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={submitNoAnswer}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const result = String(value).trim()
  return result || null
}
