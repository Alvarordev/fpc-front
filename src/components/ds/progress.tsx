import { cn } from "@/lib/utils"

/** Avance por tramos (ciclos, sesiones). Muestra el conteo a la derecha. */
export function SegmentedProgress({ done, total, showCount = true }: { done: number; total: number; showCount?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex flex-1 gap-1">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < done ? "bg-zinc-900" : "bg-zinc-200")} />
        ))}
      </span>
      {showCount && (
        <span className="text-[13px] text-zinc-500 tabular-nums">
          {done}/{total}
        </span>
      )}
    </span>
  )
}

/** Barra proporcional simple (atenciones por centro, etc.). */
export function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-1.5 rounded-full bg-zinc-100">
      <div className="h-full rounded-full bg-zinc-900" style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  )
}
