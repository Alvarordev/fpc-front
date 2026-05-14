export function CalendarLegend() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-emerald-500 shrink-0" />
        <span className="text-xs text-muted-foreground">Disponible</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-amber-500 shrink-0" />
        <span className="text-xs text-muted-foreground">Reservado</span>
      </div>
    </div>
  );
}
