import type { AvailabilitySlot, Volunteer } from "@/types";
import { getDaysInMonth, groupSlotsByDay, WEEKDAY_LABELS } from "@/lib/calendar-helpers";
import { CalendarDayCell } from "./calendar-day-cell";

interface AvailabilityCalendarProps {
  year: number;
  month: number;
  slots: AvailabilitySlot[];
  volunteers: Volunteer[];
  highlightedIds: string[];
}

export function AvailabilityCalendar({
  year,
  month,
  slots,
  volunteers,
  highlightedIds,
}: AvailabilityCalendarProps) {
  const days = getDaysInMonth(year, month);
  const slotsByDay = groupSlotsByDay(slots, year, month);

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border/60">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide bg-muted/30"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((date, i) => {
          const isoKey = date.toISOString().slice(0, 10);
          const daySlots = slotsByDay.get(isoKey) ?? [];
          return (
            <CalendarDayCell
              key={i}
              date={date}
              currentMonth={month}
              slots={daySlots}
              volunteers={volunteers}
              highlightedIds={highlightedIds}
            />
          );
        })}
      </div>
    </div>
  );
}
