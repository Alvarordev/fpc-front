import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { EmptyState } from "@/components/ds/empty-state"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile"
import { isToday } from "@/pages/agente-agenda/_lib/agenda"
import { PsychooncologySessionDetailDialog } from "@/pages/pacientes/[id]/_components/psychooncology-session-detail-dialog"
import { useAgenda } from "../_hooks/use-agenda"
import { AgendaSessionResultDialog } from "./agenda-session-result-dialog"
import { AgendaSessionResultSheet } from "./agenda-session-result-sheet"
import {
  VolunteerAgendaCalendar,
  type VolunteerAgendaEvent,
} from "./volunteer-agenda-calendar"
import { VolunteerAgendaTable } from "./volunteer-agenda-table"

type ViewMode = "calendar" | "table"

export function AgendaContent() {
  const {
    volunteer,
    volunteerId,
    isLoading: loadingProfile,
  } = useVolunteerProfile()
  const isMobile = useIsMobile()
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [detailAppointment, setDetailAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [resultAppointment, setResultAppointment] =
    useState<PsychooncologyAppointment | null>(null)
  const [resultOpen, setResultOpen] = useState(false)

  const {
    appointments,
    patients,
    isLoading: loadingAgenda,
  } = useAgenda(volunteerId)

  type ScheduledAppointment = PsychooncologyAppointment & {
    scheduledAt: string
  }
  const scheduledAppointments = appointments.filter(
    (appointment): appointment is ScheduledAppointment =>
      appointment.scheduledAt !== null,
  )

  const sortedAppointments = useMemo(
    () =>
      [...scheduledAppointments].sort((a, b) =>
        a.scheduledAt.localeCompare(b.scheduledAt),
      ),
    [scheduledAppointments],
  )
  const events = useMemo<VolunteerAgendaEvent[]>(
    () =>
      sortedAppointments.map((appointment) => ({
        id: appointment.id,
        patientId: appointment.patientId,
        patientName:
          patients.get(appointment.patientId)?.fullName ??
          "Paciente desconocido",
        startsAt: appointment.scheduledAt,
        appointment,
      })),
    [patients, sortedAppointments],
  )
  const pendingCount = appointments.filter(
    (appointment) =>
      appointment.status === "SCHEDULED" || appointment.status === "OVERDUE",
  ).length
  const todayCount = appointments.filter(
    (appointment) =>
      (appointment.status === "SCHEDULED" ||
        appointment.status === "OVERDUE") &&
      appointment.scheduledAt !== null &&
      isToday(appointment.scheduledAt),
  ).length
  const overdueCount = appointments.filter(
    (appointment) => appointment.status === "OVERDUE",
  ).length

  const activePatientName = resultAppointment
    ? (patients.get(resultAppointment.patientId)?.fullName ??
      "Paciente desconocido")
    : ""
  const activePatientId = resultAppointment?.patientId ?? ""
  const volunteerName = volunteer
    ? `${volunteer.firstName} ${volunteer.lastName}`
    : "Voluntario"

  function openResult(appointment: PsychooncologyAppointment) {
    setDetailAppointment(null)
    setResultAppointment(appointment)
    setResultOpen(true)
  }

  function closeResult(nextOpen: boolean) {
    setResultOpen(nextOpen)
    if (!nextOpen) setResultAppointment(null)
  }

  if (loadingProfile || loadingAgenda) {
    return (
      <div className="font-ds flex h-48 items-center justify-center gap-2 text-[13px] text-zinc-500">
        <Loader2 className="size-4 animate-spin" />
        Cargando agenda…
      </div>
    )
  }

  if (!volunteerId) {
    return (
      <div className="font-ds space-y-5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Mi agenda</h1>
        <EmptyState
          title="Tu cuenta no tiene perfil de voluntario"
          body="Pide a un administrador que vincule tu usuario a tu perfil de voluntario para ver tus sesiones."
        />
      </div>
    )
  }

  return (
    <div className="font-ds space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Mi agenda</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {pendingCount === 0 ? (
              "No tienes sesiones pendientes."
            ) : (
              <>
                {pendingCount} pendiente{pendingCount === 1 ? "" : "s"} ·{" "}
                {todayCount} para hoy
                {overdueCount > 0 && (
                  <>
                    {" · "}
                    <span className="font-medium text-red-700">
                      {overdueCount} vencida{overdueCount === 1 ? "" : "s"} por registrar
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>
        <SlidingTabs
          label="Vista de la agenda"
          value={viewMode}
          onChange={setViewMode}
          options={[
            { id: "calendar", label: "Calendario" },
            { id: "table", label: "Tabla" },
          ]}
        />
      </header>

      {viewMode === "calendar" ? (
        <VolunteerAgendaCalendar
          events={events}
          onSelectEvent={(event) => setDetailAppointment(event.appointment)}
        />
      ) : (
        <VolunteerAgendaTable
          appointments={sortedAppointments}
          patients={patients}
          onSelectAppointment={setDetailAppointment}
          onRegister={openResult}
        />
      )}

      <PsychooncologySessionDetailDialog
        open={Boolean(detailAppointment)}
        onOpenChange={(open) => !open && setDetailAppointment(null)}
        appointment={detailAppointment}
        patientName={
          detailAppointment
            ? (patients.get(detailAppointment.patientId)?.fullName ??
              "Paciente desconocido")
            : ""
        }
        volunteerName={volunteerName}
        onRegister={
          (detailAppointment?.status === "SCHEDULED" ||
            detailAppointment?.status === "OVERDUE" ||
            detailAppointment?.status === "NO_SHOW")
            ? () => openResult(detailAppointment)
            : undefined
        }
      />

      {isMobile ? (
        <AgendaSessionResultSheet
          open={resultOpen}
          onOpenChange={closeResult}
          appointment={resultAppointment}
          patientName={activePatientName}
          patientId={activePatientId}
          volunteerId={volunteerId}
        />
      ) : (
        <AgendaSessionResultDialog
          open={resultOpen}
          onOpenChange={closeResult}
          appointment={resultAppointment}
          patientName={activePatientName}
          patientId={activePatientId}
          volunteerId={volunteerId}
        />
      )}
    </div>
  )
}
