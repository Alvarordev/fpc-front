import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button, IconButton } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { toneDot, toneSoft, type Tone } from "@/components/ds/tone"
import { cn } from "@/lib/utils"
import { formatAgendaTime, toDateKey } from "../_lib/agenda"

// Calendario mensual compartido por la agenda del agente y la del voluntario.
// En escritorio es una cuadrícula de 7 columnas; en móvil, la lista de días del
// mes que tienen algo, para no obligar a desplazar una tabla de 760px.

export interface CalendarEntry {
  id: string
  startsAt: string
  title: ReactNode
  detail: string
  tone: Tone
  /** Lo vencido o urgente: se resalta en rojo sin reordenar. */
  urgent?: boolean
  onSelect: () => void
}

const MONTHS = [
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
const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function MonthCalendar({
  month,
  onMonthChange,
  entries,
  countLabel,
  filters,
  emptyTitle,
  emptyBody,
}: {
  month: Date
  onMonthChange: (next: Date) => void
  entries: CalendarEntry[]
  countLabel: (count: number) => string
  filters?: ReactNode
  emptyTitle: string
  emptyBody: string
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDay = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const todayKey = toDateKey(new Date())
  const monthPrefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}-`
  const byDate = new Map<string, CalendarEntry[]>()
  for (const entry of [...entries].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
    const key = toDateKey(entry.startsAt)
    if (!key) continue
    byDate.set(key, [...(byDate.get(key) ?? []), entry])
  }
  const monthCount = [...byDate.entries()]
    .filter(([key]) => key.startsWith(monthPrefix))
    .reduce((sum, [, items]) => sum + items.length, 0)
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  const keyOf = (day: number) => `${monthPrefix}${String(day).padStart(2, "0")}`
  const daysWithEntries = Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
    (day) => byDate.has(keyOf(day)),
  )

  function go(offset: number) {
    onMonthChange(new Date(year, monthIndex + offset, 1))
  }

  return (
    <Card
      title={`${MONTHS[monthIndex]} ${year}`}
      description={countLabel(monthCount)}
      action={
        <div className="flex items-center gap-1">
          <Button onClick={() => onMonthChange(new Date())}>Hoy</Button>
          <IconButton icon={ChevronLeft} label="Mes anterior" onClick={() => go(-1)} />
          <IconButton icon={ChevronRight} label="Mes siguiente" onClick={() => go(1)} />
        </div>
      }
    >
      {filters && <div className="mb-4">{filters}</div>}

      <div className="hidden overflow-hidden rounded-[14px] ring-1 ring-zinc-200 md:block">
        <div className="grid grid-cols-7 border-b border-zinc-200 py-2 text-center text-[13px] text-zinc-500">
          {DAYS.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 [&>*]:border-zinc-100 [&>*:not(:nth-child(7n))]:border-r [&>*:nth-child(n+8)]:border-t">
          {cells.map((day, index) => {
            if (day === null) return <div key={`empty-${index}`} className="min-h-[120px] bg-zinc-50/60" />
            const key = keyOf(day)
            const items = byDate.get(key) ?? []
            const isToday = key === todayKey
            return (
              <div key={key} className="flex min-h-[120px] min-w-0 flex-col p-1.5">
                <span
                  className={cn(
                    "mb-1 inline-flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    isToday ? "bg-red-700 font-semibold text-white" : "text-zinc-600",
                  )}
                >
                  {day}
                </span>
                <div className="flex max-h-[96px] flex-col gap-1 overflow-y-auto">
                  {items.map((entry) => (
                    <EntryChip key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {daysWithEntries.length === 0 ? (
          <EmptyState title={emptyTitle} body={emptyBody} />
        ) : (
          daysWithEntries.map((day) => {
            const key = keyOf(day)
            return (
              <div key={key}>
                <p className={cn("mb-1.5 px-1 text-[13px]", key === todayKey ? "font-medium text-red-700" : "text-zinc-500")}>
                  {key === todayKey ? "Hoy · " : ""}
                  {new Date(year, monthIndex, day).toLocaleDateString("es-PE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <div className="space-y-1.5">
                  {(byDate.get(key) ?? []).map((entry) => (
                    <EntryChip key={entry.id} entry={entry} large />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </Card>
  )
}

function EntryChip({ entry, large }: { entry: CalendarEntry; large?: boolean }) {
  return (
    <button
      type="button"
      onClick={entry.onSelect}
      className={cn(
        "w-full min-w-0 cursor-pointer rounded-[8px] text-left transition-transform outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 active:scale-[0.98]",
        large ? "rounded-[12px] bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200/60" : cn("px-1.5 py-1", toneSoft[entry.tone]),
        entry.urgent && (large ? "bg-red-50/60 ring-red-200/70" : "ring-1 ring-red-300"),
      )}
    >
      <span className={cn("flex min-w-0 items-center gap-1.5 font-medium", large ? "text-sm text-zinc-900" : "text-[11px]")}>
        {large && <span className={cn("size-1.5 shrink-0 rounded-full", toneDot[entry.tone])} />}
        <span className="flex min-w-0 items-center gap-1 truncate">{entry.title}</span>
      </span>
      <span className={cn("block truncate tabular-nums", large ? "mt-0.5 text-[13px] text-zinc-500" : "text-[10px] opacity-80")}>
        {formatAgendaTime(entry.startsAt)} · {entry.detail}
      </span>
    </button>
  )
}
