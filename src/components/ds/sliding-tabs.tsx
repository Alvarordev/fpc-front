import { useLayoutEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Pestañas con un indicador que se desliza a la pestaña activa. El indicador se
// mide en el DOM, así que sigue funcionando si cambian las etiquetas o contadores.

export function SlidingTabs<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { id: T; label: string; count?: number | null }[]
  onChange: (id: T) => void
  label: string
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>())
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current.get(value)
      if (el) setThumb({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [value, options])

  return (
    <nav aria-label={label} className="font-ds max-w-full overflow-x-auto">
      <div role="tablist" className="relative inline-flex rounded-[14px] bg-white p-1 ring-1 ring-zinc-200">
        {thumb && (
          <span
            aria-hidden
            className="absolute top-1 bottom-1 rounded-[10px] bg-zinc-900 transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={{ width: thumb.width, transform: `translateX(${thumb.left}px)`, left: 0 }}
          />
        )}
        {options.map((o) => {
          const active = o.id === value
          return (
            <button
              key={o.id}
              ref={(el) => {
                if (el) refs.current.set(o.id, el)
                else refs.current.delete(o.id)
              }}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.id)}
              className={cn(
                "relative z-10 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-sm font-medium transition-colors duration-200",
                active ? "text-white" : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              {o.label}
              {o.count ? <span className="text-xs text-zinc-400 tabular-nums">{o.count}</span> : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
