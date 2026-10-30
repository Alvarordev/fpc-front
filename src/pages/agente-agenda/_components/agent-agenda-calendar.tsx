import { useState } from "react"
import { PatientHealthSubcategoryDot } from "@/components/patient-health-subcategory-badge"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { isOverdue, type AgendaEvent } from "../_lib/agenda"
import { MonthCalendar } from "./month-calendar"

type KindFilter = "all" | AgendaEvent["kind"]

interface AgentAgendaCalendarProps {
  events: AgendaEvent[]
  onSelectEvent: (event: AgendaEvent) => void
}

export function AgentAgendaCalendar({ events, onSelectEvent }: AgentAgendaCalendarProps) {
  const [month, setMonth] = useState(() => new Date())
  const [kind, setKind] = useState<KindFilter>("all")
  const visible = kind === "all" ? events : events.filter((event) => event.kind === kind)
  const followUps = events.filter((event) => event.kind === "follow-up").length

  return (
    <MonthCalendar
      month={month}
      onMonthChange={setMonth}
      countLabel={(count) => `${count} tarea${count === 1 ? "" : "s"} este mes`}
      emptyTitle="Nada agendado este mes"
      emptyBody="Cambia de mes o agenda un seguimiento desde la ficha del paciente."
      filters={
        <FilterToggles
          value={kind}
          onChange={setKind}
          options={[
            { id: "all", label: "Todo", count: events.length },
            { id: "follow-up", label: "Seguimientos", count: followUps },
            { id: "reminder", label: "Recordatorios", count: events.length - followUps },
          ]}
        />
      }
      entries={visible.map((event) => ({
        id: `${event.kind}-${event.id}`,
        startsAt: event.startsAt,
        title: (
          <>
            <PatientHealthSubcategoryDot subcategory={event.healthSubcategory} />
            <span className="truncate">{event.patientName}</span>
          </>
        ),
        detail: event.title,
        tone: event.kind === "follow-up" ? "blue" : "violet",
        urgent: isOverdue(event.startsAt),
        onSelect: () => onSelectEvent(event),
      }))}
    />
  )
}
