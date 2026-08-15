import { useState } from "react"
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatAgendaTime, toDateKey, type AgendaEvent } from "../_lib/agenda"

interface AgentAgendaCalendarProps {
  events: AgendaEvent[]
  onSelectEvent: (event: AgendaEvent) => void
}

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function AgentAgendaCalendar({
  events,
  onSelectEvent,
}: AgentAgendaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayIndex = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayKey = toDateKey(new Date())
  const eventsByDate = events.reduce<Record<string, AgendaEvent[]>>(
    (groups, event) => {
      const dateKey = toDateKey(event.startsAt)
      if (!dateKey) return groups
      groups[dateKey] = [...(groups[dateKey] ?? []), event]
      return groups
    },
    {},
  )

  const days = [
    ...Array.from({ length: firstDayIndex }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  function localDateKey(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  function goToMonth(offset: number) {
    setCurrentDate(new Date(year, month + offset, 1))
  }

  return (
    <div className="space-y-4">
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
            <CalendarDays className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">
              {monthNames[month]} {year}
            </h2>
            <p className="text-muted-foreground text-xs">
              {events.length} tarea{events.length === 1 ? "" : "s"} en tu agenda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoy
          </Button>
          <div className="bg-background flex overflow-hidden rounded-xl border">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none border-r"
              onClick={() => goToMonth(-1)}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-none"
              onClick={() => goToMonth(1)}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs">
        <Legend color="bg-amber-500" icon={Phone} label="Seguimientos" />
        <Legend color="bg-violet-500" icon={Bell} label="Recordatorios" />
        <span className="ml-auto hidden items-center gap-1.5 sm:flex">
          <span className="bg-primary size-2 rounded-full" /> Hoy
        </span>
      </div>

      <div className="bg-card overflow-x-auto rounded-2xl border shadow-sm">
        <div className="min-w-[760px]">
          <div className="bg-muted/40 text-muted-foreground grid grid-cols-7 border-b py-2.5 text-center text-xs font-semibold">
            {dayNames.map((day, index) => (
              <div
                key={day}
                className={cn(
                  (index === 0 || index === 6) && "text-primary/70",
                )}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y">
            {days.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="bg-muted/10 min-h-[132px]"
                  />
                )
              }

              const dateKey = localDateKey(day)
              const dayEvents = eventsByDate[dateKey] ?? []
              const isToday = dateKey === todayKey

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "hover:bg-muted/20 flex min-h-[132px] flex-col p-1.5 transition-colors",
                    isToday && "bg-primary/[0.04]",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span
                      className={cn(
                        "inline-flex size-6 items-center justify-center rounded-full text-xs",
                        isToday &&
                          "bg-primary text-primary-foreground font-bold",
                      )}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="flex max-h-[98px] flex-1 flex-col gap-1 overflow-y-auto pr-0.5">
                    {dayEvents.map((event) => (
                      <AgendaEventButton
                        key={`${event.kind}-${event.id}`}
                        event={event}
                        onClick={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function Legend({
  color,
  icon: Icon,
  label,
}: {
  color: string
  icon: typeof Phone
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", color)} />
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

function AgendaEventButton({
  event,
  onClick,
}: {
  event: AgendaEvent
  onClick: () => void
}) {
  const isFollowUp = event.kind === "follow-up"
  const Icon = isFollowUp ? Phone : Bell

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group focus-visible:ring-ring w-full rounded-lg border p-1.5 text-left text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none",
        isFollowUp
          ? "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100"
          : "border-violet-200 bg-violet-50 text-violet-950 hover:bg-violet-100",
      )}
      title={`${event.patientName} · ${event.title}`}
    >
      <div className="flex items-center gap-1">
        <Icon
          className={cn(
            "size-3 shrink-0",
            isFollowUp ? "text-amber-600" : "text-violet-600",
          )}
        />
        <span className="truncate font-semibold">{event.patientName}</span>
      </div>
      <div className="text-muted-foreground mt-0.5 flex items-center gap-1 truncate text-[10px]">
        <Clock3 className="size-2.5 shrink-0" />
        {formatAgendaTime(event.startsAt)}
        <span className="truncate">· {event.title}</span>
      </div>
    </button>
  )
}
