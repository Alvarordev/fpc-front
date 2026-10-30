import { cn } from "@/lib/utils"

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]

/** Fecha en bloque (día y mes). `urgent` la pinta en rojo, p. ej. si es hoy. */
export function DateTile({ date, urgent }: { date: string; urgent?: boolean }) {
  const [, month, day] = date.slice(0, 10).split("-").map(Number)
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 flex-col items-center justify-center rounded-[12px] bg-white leading-none ring-1",
        urgent ? "text-red-600 ring-red-200" : "text-zinc-900 ring-zinc-200",
      )}
    >
      <span className="text-[15px] font-semibold tabular-nums">{day}</span>
      <span className="mt-0.5 text-[11px] text-zinc-500">{MONTHS[month - 1]}</span>
    </span>
  )
}
