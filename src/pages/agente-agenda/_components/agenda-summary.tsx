import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { PatientHealthSubcategoryDot } from "@/components/patient-health-subcategory-badge"
import { Chip } from "@/components/ds/badge"
import { Card, Item } from "@/components/ds/card"
import { DateTile } from "@/components/ds/date-tile"
import { EmptyState } from "@/components/ds/empty-state"
import {
  formatAgendaDateTime,
  formatAgendaTime,
  isOverdue,
  isToday,
  toDateKey,
  type AgendaEvent,
  type AgendaPatientInfo,
} from "../_lib/agenda"

const VISIBLE = 8

export function AgendaSummary({
  followUpEvents,
  reminderEvents,
  sessions,
  patientInfo,
  volunteers,
  onSelectEvent,
  onOpenPatient,
}: {
  followUpEvents: AgendaEvent[]
  reminderEvents: AgendaEvent[]
  sessions: PsychooncologyAppointment[]
  patientInfo: Map<string, AgendaPatientInfo>
  volunteers: Map<string, { firstName: string; lastName: string }>
  onSelectEvent: (event: AgendaEvent) => void
  onOpenPatient: (patientId: string) => void
}) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <EventCard
        title="Seguimientos"
        description="Contactos que tienes agendados"
        events={followUpEvents}
        emptyTitle="Sin seguimientos agendados"
        emptyBody="Agenda el próximo contacto desde la ficha de cada paciente."
        onSelectEvent={onSelectEvent}
      />
      <div className="space-y-5">
        <EventCard
          title="Recordatorios"
          description="Tareas pendientes para tus pacientes"
          events={reminderEvents}
          emptyTitle="Sin recordatorios pendientes"
          emptyBody="Los recordatorios que crees en la ficha del paciente aparecerán aquí."
          onSelectEvent={onSelectEvent}
        />
        <Card title="Psicooncología" description="Citas próximas del programa">
          {sessions.length === 0 ? (
            <EmptyState
              title="Sin citas próximas"
              body="Cuando se programe una sesión de psicooncología para tus pacientes, la verás aquí."
            />
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 6).map((session) => {
                const volunteer = volunteers.get(session.volunteerId)
                const patient = patientInfo.get(session.patientId)
                return (
                  <Item
                    key={session.id}
                    leading={session.scheduledAt ? <DateTile date={toDateKey(session.scheduledAt)} urgent={isToday(session.scheduledAt)} /> : undefined}
                    title={
                      <span className="inline-flex items-center gap-1.5">
                        <PatientHealthSubcategoryDot subcategory={patient?.healthSubcategory} />
                        {patient?.name ?? "Paciente desconocido"}
                      </span>
                    }
                    meta={[
                      `Sesión ${session.sessionNumber}`,
                      session.modality === "VIDEO_CALL" ? "Videollamada" : "Llamada",
                      volunteer ? `${volunteer.firstName} ${volunteer.lastName}` : null,
                      formatAgendaDateTime(session.scheduledAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    onOpen={() => onOpenPatient(session.patientId)}
                    openLabel="Abrir psicooncología del paciente"
                  />
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function EventCard({
  title,
  description,
  events,
  emptyTitle,
  emptyBody,
  onSelectEvent,
}: {
  title: string
  description: string
  events: AgendaEvent[]
  emptyTitle: string
  emptyBody: string
  onSelectEvent: (event: AgendaEvent) => void
}) {
  const visible = events.slice(0, VISIBLE)
  return (
    <Card
      title={title}
      description={description}
      action={events.length > 0 ? <span className="text-[13px] text-zinc-500 tabular-nums">{events.length}</span> : undefined}
    >
      {visible.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} />
      ) : (
        <div className="space-y-2">
          {visible.map((event) => {
            const overdue = isOverdue(event.startsAt)
            const today = isToday(event.startsAt)
            return (
              <Item
                key={`${event.kind}-${event.id}`}
                highlight={overdue}
                leading={<DateTile date={toDateKey(event.startsAt)} urgent={today || overdue} />}
                title={
                  <span className="inline-flex items-center gap-1.5">
                    <PatientHealthSubcategoryDot subcategory={event.healthSubcategory} />
                    {event.patientName}
                  </span>
                }
                tags={overdue ? <Chip tone="red">Vencida</Chip> : today ? <Chip tone="red">Hoy</Chip> : undefined}
                meta={`${formatAgendaTime(event.startsAt)} · ${event.title}${event.kind === "follow-up" ? ` · ${event.detail}` : ""}`}
                onOpen={() => onSelectEvent(event)}
                openLabel={`Abrir ${event.kind === "follow-up" ? "seguimiento" : "recordatorio"} de ${event.patientName}`}
              />
            )
          })}
          {events.length > visible.length && (
            <p className="px-1 pt-1 text-[13px] text-zinc-500">
              {events.length - visible.length} más en el calendario.
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
