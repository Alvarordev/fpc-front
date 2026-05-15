import type { BulkSlotPayload } from "../_hooks/use-disponibilidad";

const WEEKDAY_NAMES = [
  "dom",
  "lun",
  "mar",
  "mié",
  "jue",
  "vie",
  "sáb",
];

const MONTH_NAMES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

interface SlotPreviewListProps {
  slots: BulkSlotPayload[];
}

/**
 * Renders a compact preview list of slots to be created,
 * showing date + time range for each.
 */
export function SlotPreviewList({ slots }: SlotPreviewListProps) {
  if (slots.length === 0) return null;

  return (
    <div className="max-h-36 overflow-y-auto rounded-md border border-border/60 divide-y divide-border/40">
      {slots.slice(0, 20).map((slot, i) => {
        const date = new Date(slot.date + "T00:00:00");
        const weekday = WEEKDAY_NAMES[date.getDay()];
        const day = date.getDate();
        const month = MONTH_NAMES[date.getMonth()];
        const timeStart = slot.startTime.slice(0, 5);
        const timeEnd = slot.endTime.slice(0, 5);

        return (
          <div
            key={`${slot.date}-${i}`}
            className="flex items-center justify-between px-3 py-1.5 text-xs"
          >
            <span className="text-foreground">
              {weekday} {day} {month}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {timeStart} – {timeEnd}
            </span>
          </div>
        );
      })}
      {slots.length > 20 && (
        <div className="px-3 py-1.5 text-xs text-muted-foreground text-center">
          ...y {slots.length - 20} más
        </div>
      )}
    </div>
  );
}
