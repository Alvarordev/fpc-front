import { useMemo, useState } from "react"
import { CalendarClock, CalendarDays, List, Loader2 } from "lucide-react"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { Card, CardContent } from "@/components/ui/card"
import { useIsMobile } from "@/hooks/use-mobile"
import { useVolunteerProfile } from "@/hooks/use-volunteer-profile"
import { isOverdue, isToday } from "@/pages/agente-agenda/_lib/agenda"
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

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort((a, b) =>
        a.scheduledAt.localeCompare(b.scheduledAt),
      ),
    [appointments],
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
    (appointment) => appointment.status === "SCHEDULED",
  ).length
  const todayCount = appointments.filter(
    (appointment) =>
      appointment.status === "SCHEDULED" && isToday(appointment.scheduledAt),
  ).length
  const overdueCount = appointments.filter(
    (appointment) =>
      appointment.status === "SCHEDULED" && isOverdue(appointment.scheduledAt),
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
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground mr-2 size-4 animate-spin" />
        <p className="text-muted-foreground text-sm">Cargando agenda...</p>
      </div>
    )
  }

  if (!volunteerId) {
    return (
      <div className="flex h-48 items-center justify-center">
        <p className="text-muted-foreground text-sm">
          Tu cuenta no está vinculada a un perfil de voluntario.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-primary mb-2 text-xs font-semibold tracking-[0.18em] uppercase">
            Tu espacio de trabajo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Mi agenda</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Organiza tus sesiones de psicooncología y consulta el detalle de
            cada atención.
          </p>
        </div>
        <div className="bg-muted/40 flex w-fit items-center rounded-xl border p-1 text-xs">
          <ViewButton
            active={viewMode === "calendar"}
            icon={CalendarDays}
            onClick={() => setViewMode("calendar")}
          >
            Calendario
          </ViewButton>
          <ViewButton
            active={viewMode === "table"}
            icon={List}
            onClick={() => setViewMode("table")}
          >
            Tabla
          </ViewButton>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <AgendaMetric
          icon={CalendarClock}
          label="Sesiones pendientes"
          value={pendingCount}
          tone="violet"
        />
        <AgendaMetric
          icon={CalendarDays}
          label="Para hoy"
          value={todayCount}
          tone="primary"
        />
        <AgendaMetric
          icon={CalendarClock}
          label="Vencidas"
          value={overdueCount}
          tone="amber"
        />
      </section>

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
          detailAppointment?.status === "SCHEDULED"
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

function ViewButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean
  icon: typeof CalendarDays
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  )
}

function AgendaMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CalendarClock
  label: string
  value: number
  tone: "amber" | "primary" | "violet"
}) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-600",
    primary: "bg-primary/10 text-primary",
    violet: "bg-violet-50 text-violet-600",
  }

  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-2xl leading-none font-semibold">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
