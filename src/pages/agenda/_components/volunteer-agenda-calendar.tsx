import { useState } from "react"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { MonthCalendar } from "@/pages/agente-agenda/_components/month-calendar"
import { appointmentStatus, sessionLabel } from "./agenda-status"

export interface VolunteerAgendaEvent {
  id: string
  patientId: string
  patientName: string
  startsAt: string
  appointment: PsychooncologyAppointment
}

interface VolunteerAgendaCalendarProps {
  events: VolunteerAgendaEvent[]
  onSelectEvent: (event: VolunteerAgendaEvent) => void
}

export function VolunteerAgendaCalendar({ events, onSelectEvent }: VolunteerAgendaCalendarProps) {
  const [month, setMonth] = useState(() => new Date())

  return (
    <MonthCalendar
      month={month}
      onMonthChange={setMonth}
      countLabel={(count) => `${count} sesi${count === 1 ? "ón" : "ones"} este mes`}
      emptyTitle="Sin sesiones este mes"
      emptyBody="Cambia de mes para ver otras sesiones. Las nuevas las programa el equipo de la fundación."
      entries={events.map((event) => {
        const status = appointmentStatus[event.appointment.status]
        return {
          id: event.id,
          startsAt: event.startsAt,
          title: <span className="truncate">{event.patientName}</span>,
          detail: `${sessionLabel(event.appointment.sessionNumber)} · ${status.label}`,
          tone: status.tone,
          urgent: event.appointment.status === "OVERDUE",
          onSelect: () => onSelectEvent(event),
        }
      })}
    />
  )
}
