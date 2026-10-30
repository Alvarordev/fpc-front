export function CalendarLegend() {
  return (
    <p className="flex flex-wrap items-center gap-4 text-[13px] text-zinc-500">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-sky-500" />
        Libre
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-zinc-400" />
        Ocupado
      </span>
    </p>
  )
}
