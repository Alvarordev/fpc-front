import { cn } from "@/lib/utils"

/** Filtros de una lista: un botón por opción con su contador; el activo va oscuro. */
export function FilterToggles<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string; count?: number }[]; onChange: (id: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {options.map((o) => {
        const active = value === o.id
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition-[background-color,color,transform] active:scale-[0.97]",
              active ? "bg-zinc-900 text-white" : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("text-xs tabular-nums", active ? "text-zinc-300" : "text-zinc-400")}>{o.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
