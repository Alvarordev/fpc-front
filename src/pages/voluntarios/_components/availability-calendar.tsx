import type { AvailabilitySlot, Volunteer } from "@/types"
import { getDaysInMonth, groupSlotsByDay, WEEKDAY_LABELS } from "@/lib/calendar-helpers"
import { CalendarDayCell } from "./calendar-day-cell"

export function AvailabilityCalendar({
  year,
  month,
  slots,
  volunteers,
  highlightedIds,
  patientNameByAvailabilityId,
}: {
  year: number
  month: number
  slots: AvailabilitySlot[]
  volunteers: Volunteer[]
  highlightedIds: string[]
  patientNameByAvailabilityId: Map<string, string>
}) {
  const days = getDaysInMonth(year, month)
  const slotsByDay = groupSlotsByDay(slots, year, month)

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-center text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          const isoKey = date.toISOString().slice(0, 10)
          return (
            <CalendarDayCell
              key={index}
              date={date}
              currentMonth={month}
              slots={slotsByDay.get(isoKey) ?? []}
              volunteers={volunteers}
              highlightedIds={highlightedIds}
              patientNameByAvailabilityId={patientNameByAvailabilityId}
            />
          )
        })}
      </div>
    </div>
  )
}
