import {
  getDaysInMonth,
  groupSlotsByDay,
  WEEKDAY_LABELS,
} from "@/lib/calendar-helpers";
import { DisponibilidadDayCell } from "./disponibilidad-day-cell";
import type { AvailabilitySlot } from "@/types";

const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function isPastDate(date: Date): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < TODAY;
}

interface DisponibilidadCalendarProps {
  year: number;
  month: number;
  slots: AvailabilitySlot[];
  onDayClick: (date: Date, anchor: HTMLElement) => void;
  onSlotDelete: (slotId: string) => void;
}

export function DisponibilidadCalendar({
  year,
  month,
  slots,
  onDayClick,
  onSlotDelete,
}: DisponibilidadCalendarProps) {
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
            <DisponibilidadDayCell
              key={i}
              date={date}
              currentMonth={month}
              slots={daySlots}
              isPast={isPastDate(date)}
              onDayClick={onDayClick}
              onSlotDelete={onSlotDelete}
            />
          );
        })}
      </div>
    </div>
  );
}
