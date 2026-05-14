import { cn } from "@/lib/utils";
import type { AvailabilitySlot, Volunteer } from "@/types";
import { formatTimeRange } from "../_utils/calendar-helpers";

interface CalendarDayCellProps {
  date: Date;
  currentMonth: number;
  slots: AvailabilitySlot[];
  volunteers: Volunteer[];
  highlightedIds: string[];
}

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function isToday(date: Date): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === TODAY.getTime();
}

export function CalendarDayCell({
  date,
  currentMonth,
  slots,
  volunteers,
  highlightedIds,
}: CalendarDayCellProps) {
  const isCurrentMonth = date.getMonth() === currentMonth;
  const today = isToday(date);

  return (
    <div
      className={cn(
        "min-h-24 border border-border/40 p-1.5 flex flex-col gap-0.5",
        !isCurrentMonth && "bg-muted/20",
        today && "ring-2 ring-inset ring-primary/50",
      )}
    >
      <span
        className={cn(
          "text-xs font-medium leading-none mb-1 self-start px-1 py-0.5 rounded",
          !isCurrentMonth && "text-muted-foreground/40",
          today && "bg-primary text-primary-foreground px-1.5",
        )}
      >
        {date.getDate()}
      </span>

      {slots.map((slot) => {
        const volunteer = volunteers.find((v) => v.id === slot.volunteerId);
        if (!volunteer) return null;

        const isHighlighted =
          highlightedIds.length === 0 ||
          highlightedIds.includes(slot.volunteerId);
        const isAvailable = slot.status === "AVAILABLE";
        const initials = `${volunteer.firstName[0]}${volunteer.lastName[0]}`;

        return (
          <div
            key={slot.id}
            title={`${volunteer.firstName} ${volunteer.lastName} · ${formatTimeRange(slot.startTime, slot.endTime)}`}
            className={cn(
              "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight border truncate cursor-default transition-opacity",
              isAvailable
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-amber-100 text-amber-700 border-amber-200 opacity-70",
              !isHighlighted && "opacity-15",
            )}
          >
            <span className="font-semibold shrink-0">{initials}</span>
            <span className="truncate">
              {formatTimeRange(slot.startTime, slot.endTime)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
