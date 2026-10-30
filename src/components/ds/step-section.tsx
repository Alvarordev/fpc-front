import { cn } from "@/lib/utils"

/** Paso de un flujo que sí es secuencia. El número se pone verde al cumplirse. */
export function StepSection({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 pt-2 text-[15px] font-semibold">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white tabular-nums transition-colors duration-200",
            done ? "bg-emerald-600" : "bg-zinc-900",
          )}
        >
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  )
}
