import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimeRange } from "@/lib/calendar-helpers";
import type { AvailabilitySlot } from "@/types";

const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function isTodayDate(date: Date): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime() === TODAY.getTime();
}

const STATUS_CHIP_STYLES: Record<
  AvailabilitySlot["status"],
  string
> = {
  AVAILABLE:
    "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
  RESERVED:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
};

interface SlotChipProps {
  slot: AvailabilitySlot;
  onDelete: (slotId: string) => void;
}

function SlotChip({ slot, onDelete }: SlotChipProps) {
  const [confirming, setConfirming] = useState(false);

  if (slot.status === "RESERVED") {
    return (
      <div
        className={cn(
          "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight border truncate opacity-70",
          STATUS_CHIP_STYLES.RESERVED,
        )}
      >
        <span className="truncate">
          {formatTimeRange(slot.startTime, slot.endTime)}
        </span>
        <span className="shrink-0 font-medium">· Reservado</span>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-0.5 rounded border border-red-200 bg-red-50 px-1 py-0.5 text-[10px] dark:border-red-800 dark:bg-red-950">
        <span className="text-red-700 shrink-0 dark:text-red-300">
          ¿Eliminar?
        </span>
        <button
          className="ml-0.5 rounded p-0.5 text-red-700 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(slot.id);
            setConfirming(false);
          }}
        >
          <Check className="size-2.5" />
        </button>
        <button
          className="rounded p-0.5 text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(false);
          }}
        >
          <X className="size-2.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight border",
        STATUS_CHIP_STYLES.AVAILABLE,
      )}
    >
      <span className="truncate">
        {formatTimeRange(slot.startTime, slot.endTime)}
      </span>
      <button
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
        onClick={(e) => {
          e.stopPropagation();
          setConfirming(true);
        }}
      >
        <X className="size-2.5" />
      </button>
    </div>
  );
}

interface DisponibilidadDayCellProps {
  date: Date;
  currentMonth: number;
  slots: AvailabilitySlot[];
  isPast: boolean;
  onDayClick: (date: Date, anchor: HTMLElement) => void;
  onSlotDelete: (slotId: string) => void;
}

export function DisponibilidadDayCell({
  date,
  currentMonth,
  slots,
  isPast,
  onDayClick,
  onSlotDelete,
}: DisponibilidadDayCellProps) {
  const isCurrentMonth = date.getMonth() === currentMonth;
  const today = isTodayDate(date);
  const clickable = !isPast && isCurrentMonth;

  return (
    <div
      className={cn(
        "min-h-24 border border-border/40 p-1.5 flex flex-col gap-0.5 select-none",
        !isCurrentMonth && "bg-muted/20 opacity-40",
        today && "ring-2 ring-inset ring-primary/50",
        isPast && isCurrentMonth && "bg-muted/10",
        clickable &&
          slots.length === 0 &&
          "cursor-pointer hover:bg-muted/20 group",
      )}
      onClick={(e) => {
        if (!clickable) return;
        onDayClick(date, e.currentTarget);
      }}
    >
      <span
        className={cn(
          "text-xs font-medium leading-none mb-1 self-start px-1 py-0.5 rounded",
          !isCurrentMonth && "text-muted-foreground/40",
          isPast && "text-muted-foreground/50",
          today && "bg-primary text-primary-foreground px-1.5",
        )}
      >
        {date.getDate()}
      </span>

      {clickable && slots.length === 0 && (
        <span className="text-muted-foreground/30 group-hover:text-muted-foreground/60 text-lg leading-none mx-auto mt-1 transition-colors">
          +
        </span>
      )}

      {slots.map((slot) => (
        <SlotChip key={slot.id} slot={slot} onDelete={onSlotDelete} />
      ))}
    </div>
  );
}
