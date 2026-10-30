import { cn } from "@/lib/utils"
import type { AvailabilitySlot, Volunteer } from "@/types"
import { formatTimeRange } from "@/lib/calendar-helpers"

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

function isToday(date: Date) {
  const day = new Date(date)
  day.setHours(0, 0, 0, 0)
  return day.getTime() === TODAY.getTime()
}

export function CalendarDayCell({
  date,
  currentMonth,
  slots,
  volunteers,
  highlightedIds,
  patientNameByAvailabilityId,
}: {
  date: Date
  currentMonth: number
  slots: AvailabilitySlot[]
  volunteers: Volunteer[]
  highlightedIds: string[]
  patientNameByAvailabilityId: Map<string, string>
}) {
  const inMonth = date.getMonth() === currentMonth
  const today = isToday(date)

  return (
    <div
      className={cn(
        "flex min-h-24 flex-col gap-1 rounded-[14px] bg-white p-2 ring-1 ring-zinc-200",
        !inMonth && "opacity-40",
        today && "ring-2 ring-zinc-900",
      )}
    >
      <span className={cn("text-xs font-medium", today ? "text-zinc-900" : "text-zinc-500")}>{date.getDate()}</span>
      {slots.map((slot) => {
        const volunteer = volunteers.find((item) => item.id === slot.volunteerId)
        if (!volunteer) return null
        const highlighted = highlightedIds.length === 0 || highlightedIds.includes(slot.volunteerId)
        if (!highlighted) return null
        const free = slot.status === "AVAILABLE"
        const patientName = patientNameByAvailabilityId.get(slot.id)
        return (
          <span
            key={slot.id}
            title={`${volunteer.firstName} ${volunteer.lastName} · ${formatTimeRange(slot.startTime, slot.endTime)}${patientName ? ` · ${patientName}` : ""}`}
            className={cn(
              "truncate rounded-full px-2 py-0.5 text-[11px] font-medium",
              free ? "bg-sky-50 text-sky-700" : "bg-zinc-100 text-zinc-600",
            )}
          >
            {volunteer.firstName[0]}
            {volunteer.lastName[0]} {formatTimeRange(slot.startTime, slot.endTime)}
            {patientName ? ` · ${patientName}` : ""}
          </span>
        )
      })}
    </div>
  )
}
