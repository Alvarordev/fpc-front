import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock3, MessageSquareText, PhoneOff, XCircle } from "lucide-react"
import { toast } from "sonner"
import { psychooncologyAppointmentsApi, type PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { volunteersApi } from "@/api/volunteers"
import { Chip } from "@/components/ds/badge"
import { AddButton, Button } from "@/components/ds/button"
import { Card, Item, Panel } from "@/components/ds/card"
import { DateTile } from "@/components/ds/date-tile"
import { EmptyState } from "@/components/ds/empty-state"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { Field, TextArea } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import type { Tone } from "@/components/ds/tone"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store/auth-store"
import { daysFromToday, formatTime, capitalize } from "../_lib/ficha-format"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"
import { PsychooncologySessionDetailDialog } from "./psychooncology-session-detail-dialog"
import { PsychoCyclePanel } from "./psycho-cycle-panel"
import { PsychoSessionResultModal } from "./psycho-session-result-modal"
import { PsychoSessionActions } from "./psycho-session-actions"
import { SchedulePsychooncologyDialog, type SchedulePsychooncologySubmitInput } from "./schedule-psychooncology-dialog"
import { UnmanagedNoShowsBanner } from "./unmanaged-no-shows-banner"

interface PsicoTabProps {
  pacienteId: string
  patientName: string
}

const statusLabels: Record<PsychooncologyAppointment["status"], string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  NO_SHOW: "No se presentó",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reprogramada",
  OVERDUE: "Vencida",
}

const statusTones: Record<PsychooncologyAppointment["status"], Tone> = {
  SCHEDULED: "blue",
  NO_SHOW: "red",
  COMPLETED: "green",
  CANCELLED: "gray",
  RESCHEDULED: "amber",
  OVERDUE: "red",
}

type SessionBeneficiaryTab = "PATIENT" | "COMPANION"

function ratingLabel(rating: unknown) {
  if (typeof rating !== "number" && typeof rating !== "string") return undefined
  return ENROLLMENT_RATING_OPTIONS.find(
    (option) => option.value === String(rating),
  )?.label
}

function sessionDate(appointment: PsychooncologyAppointment) {
  return appointment.scheduledAt ?? (appointment.scheduledOn ? `${appointment.scheduledOn}T12:00:00` : null)
}

function PsychoSessionCard({
  appointment,
  patientId,
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
  patientId: string
  volunteerName: string
  canManage: boolean
  canRecordResult: boolean
  onView: () => void
  onEdit: () => void
  onRegister: () => void
  onNoAnswer: () => void
  onCancel: () => void
}) {
  const when = sessionDate(appointment)
  const isScheduled = appointment.status === "SCHEDULED" || appointment.status === "OVERDUE"
  const today = isScheduled && when !== null && daysFromToday(when) === 0
  const companionName = textValue(appointment.companionFullName)
  const notes = [
    textValue(appointment.schedulingNotes) && `Derivación: ${textValue(appointment.schedulingNotes)}`,
    textValue(appointment.noAnswerNote) && `No se presentó: ${textValue(appointment.noAnswerNote)}`,
    appointment.status === "COMPLETED" && appointment.satisfactionRating && `Encuesta: ${ratingLabel(appointment.satisfactionRating)}`,
    appointment.status === "COMPLETED" && textValue(appointment.satisfactionComment),
  ].filter(Boolean) as string[]
  const actions = (
    <>
      {canRecordResult && (isScheduled || appointment.status === "NO_SHOW") && (
        <Button variant="brand" onClick={onRegister}>
          Registrar resultado
        </Button>
      )}
      {canRecordResult && isScheduled && (
        <Button icon={PhoneOff} onClick={onNoAnswer}>
          No se presentó
        </Button>
      )}
      {canManage && isScheduled && (
        <Button icon={Clock3} onClick={onEdit}>
          Reprogramar
        </Button>
      )}
      {canManage && isScheduled && (
        <Button icon={XCircle} onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </>
  )
  return (
    <Item
      highlight={today || appointment.status === "OVERDUE"}
      leading={when ? <DateTile date={when} urgent={today || appointment.status === "OVERDUE"} /> : undefined}
      title={`Sesión ${appointment.sessionNumber}`}
      tags={
        <>
          <Chip tone={statusTones[appointment.status]}>{statusLabels[appointment.status]}</Chip>
          {today && <Chip tone="red">Hoy</Chip>}
        </>
      }
      meta={[when && `${capitalize(new Date(when).toLocaleDateString("es-PE", { weekday: "long" }))} a las ${formatTime(when)}`, appointment.modality === "VIDEO_CALL" ? "videollamada" : "llamada", volunteerName, appointment.beneficiaryType === "COMPANION" ? `para ${companionName ?? "un acompañante"}` : null, appointment.followUpId ? "desde un seguimiento" : null].filter(Boolean).join(", ")}
      body={
        notes.length ? (
          <span className="flex gap-2">
            <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-zinc-400" />
            <span>{notes.join(". ")}</span>
          </span>
        ) : undefined
      }
      footer={
        <>
          {actions}
          {canManage && <PsychoSessionActions appointment={appointment} patientId={patientId} />}
        </>
      }
      onOpen={onView}
      openLabel={`Ver detalle de la sesión ${appointment.sessionNumber}`}
    />
  )
}

export function PsicoTab({ pacienteId, patientName }: PsicoTabProps) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [detailAppointment, setDetailAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [resultAppointment, setResultAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [noAnswerTarget, setNoAnswerTarget] =
    useState<PsychooncologyAppointment | null>(null)
  const [noAnswerNote, setNoAnswerNote] = useState("")
  const [beneficiaryTab, setBeneficiaryTab] =
    useState<SessionBeneficiaryTab>("PATIENT")
  const [additionalSession, setAdditionalSession] = useState(false)

  const canSchedule =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const canManage = canSchedule

  const appointmentsQuery = useQuery({
    queryKey: ["psychooncology-appointments", pacienteId],
    queryFn: () =>
      psychooncologyAppointmentsApi.list({ patientId: pacienteId }),
  })
  const volunteersQuery = useQuery({
    queryKey: ["volunteers"],
    queryFn: volunteersApi.list,
    enabled: user?.role !== "VOLUNTEER",
    staleTime: 300_000,
  })
  const meQuery = useQuery({
    queryKey: ["volunteers", "me"],
    queryFn: volunteersApi.me,
    enabled: user?.role === "VOLUNTEER",
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
      // El panel del ciclo cuenta las sesiones agendadas y realizadas.
      queryClient.invalidateQueries({
        queryKey: ["psychooncology-cycles", pacienteId],
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
      successMessage?: string
    }) => psychooncologyAppointmentsApi.update(id, input),
    onSuccess: async (_data, { successMessage }) => {
      await invalidate()
      toast.success(successMessage ?? "Cita actualizada")
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

  const appointments = [...(appointmentsQuery.data ?? [])]
    .filter((appointment) =>
      user?.role === "VOLUNTEER"
        ? meQuery.data != null && appointment.volunteerId === meQuery.data.id
        : true,
    )
    .sort((a, b) => {
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
  const ownVolunteerId = meQuery.data?.id
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
    if (payload.mode === "reschedule") {
      const created = await psychooncologyAppointmentsApi.reschedule(
        payload.id,
        payload.input,
      )
      if (payload.update) {
        await updateMutation.mutateAsync({
          id: created.id,
          input: payload.update,
          successMessage: "Sesión reprogramada",
        })
        return
      }
      await invalidate()
      toast.success("Sesión reprogramada")
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
        status: "NO_SHOW",
        noAnswerNote: noAnswerNote.trim(),
      },
    })
    setNoAnswerTarget(null)
    setNoAnswerNote("")
  }

  function openSchedule(extra: boolean) {
    setAdditionalSession(extra)
    setEditingAppointment(null)
    setScheduleOpen(true)
  }

  const volunteerNameOf = (appointment: PsychooncologyAppointment) => {
    const volunteer = volunteersQuery.data?.find((item) => item.id === appointment.volunteerId)
    const own = meQuery.data?.id === appointment.volunteerId ? meQuery.data : undefined
    return volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : own ? `${own.firstName} ${own.lastName}` : appointment.volunteerFullName || "Psicooncólogo"
  }

  return (
    <div className="space-y-4">
      <UnmanagedNoShowsBanner patientId={pacienteId} canManage={canManage} />
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="lg:self-start">
          <PsychoCyclePanel patientId={pacienteId} canManage={canManage} onScheduleAdditional={() => openSchedule(true)} />
        </div>
        <Card
          title="Sesiones"
          description={`${appointments.length} ${appointments.length === 1 ? "sesión registrada" : "sesiones registradas"}`}
          action={canSchedule ? <AddButton onClick={() => openSchedule(false)}>Agendar sesión</AddButton> : undefined}
        >
          {appointmentsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-[14px] bg-zinc-100" />
              ))}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <FilterToggles
                  value={beneficiaryTab}
                  onChange={setBeneficiaryTab}
                  options={[
                    { id: "PATIENT", label: "Paciente", count: patientAppointments.length },
                    { id: "COMPANION", label: "Acompañantes", count: companionAppointments.length },
                  ]}
                />
              </div>
              {visibleAppointments.length === 0 ? (
                <EmptyState
                  title={beneficiaryTab === "PATIENT" ? "Sin sesiones para el paciente" : "Sin sesiones para acompañantes"}
                  body="Agenda una sesión aquí o derívala desde un seguimiento."
                  action={canSchedule ? "Agendar sesión" : undefined}
                  onAction={() => openSchedule(false)}
                />
              ) : (
                <div key={beneficiaryTab} className="space-y-2 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
                  {visibleAppointments.map((appointment) => (
                    <PsychoSessionCard
                      key={appointment.id}
                      appointment={appointment}
                      patientId={pacienteId}
                      volunteerName={volunteerNameOf(appointment)}
                      canManage={canManage}
                      canRecordResult={user?.role === "VOLUNTEER" && ownVolunteerId != null && appointment.volunteerId === ownVolunteerId}
                      onView={() => setDetailAppointment(appointment)}
                      onEdit={() => openEdit(appointment)}
                      onRegister={() => openResult(appointment)}
                      onNoAnswer={() => {
                        setNoAnswerTarget(appointment)
                        setNoAnswerNote(textValue(appointment.noAnswerNote) ?? "")
                      }}
                      onCancel={() => cancelMutation.mutate(appointment.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <SchedulePsychooncologyDialog
        key={editingAppointment?.id ?? "new"}
        open={scheduleOpen}
        onOpenChange={(open) => (open ? setScheduleOpen(true) : closeDialog())}
        patientId={pacienteId}
        ownVolunteerId={ownVolunteerId}
        appointment={editingAppointment}
        additionalSession={additionalSession}
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
          user?.role === "VOLUNTEER" && (detailAppointment?.status === "SCHEDULED" || detailAppointment?.status === "OVERDUE" || detailAppointment?.status === "NO_SHOW")
            ? () => openResult(detailAppointment)
            : undefined
        }
      />

      {resultAppointment && <PsychoSessionResultModal appointment={resultAppointment} patientName={patientName} onClose={() => setResultAppointment(null)} />}

      {noAnswerTarget && (
        <Modal
          open
          onClose={() => {
            setNoAnswerTarget(null)
            setNoAnswerNote("")
          }}
          icon={PhoneOff}
          title="Marcar como no se presentó"
          description="Deja una nota del intento de contacto. Luego alguien debe gestionar la inasistencia."
          footer={
            <>
              <Button
                onClick={() => {
                  setNoAnswerTarget(null)
                  setNoAnswerNote("")
                }}
              >
                Volver
              </Button>
              <Button variant="dark" onClick={submitNoAnswer} disabled={updateMutation.isPending || !noAnswerNote.trim()}>
                {updateMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </>
          }
        >
          <Panel>
            <Field label="Nota *">{(id) => <TextArea id={id} value={noAnswerNote} onChange={(e) => setNoAnswerNote(e.target.value)} placeholder="Ej.: llamé dos veces y dejé mensaje en el buzón" />}</Field>
          </Panel>
        </Modal>
      )}
    </div>
  )
}

function textValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null
  const result = String(value).trim()
  return result || null
}
