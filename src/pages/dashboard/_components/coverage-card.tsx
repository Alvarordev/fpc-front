import { cn } from "@/lib/utils"
import { DashboardSection } from "./dashboard-shell"

export function CoverageCard({
  items,
}: {
  items: { label: string; coveragePct: number }[]
}) {
  return (
    <DashboardSection
      title="Datos por completar"
      hint="Pacientes con información registrada"
      scope="estado"
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="grid items-center gap-3 py-1.5 text-[13px]"
          style={{ gridTemplateColumns: "minmax(0,9.5rem) 1fr 3.25rem" }}
        >
          <span className="min-w-0 truncate text-zinc-500">{item.label}</span>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                "h-full rounded-full",
                item.coveragePct < 100 ? "bg-amber-500" : "bg-zinc-900",
              )}
              style={{ width: `${Math.min(100, item.coveragePct)}%` }}
            />
          </div>
          <span className="text-right font-medium text-zinc-900 tabular-nums">
            {item.coveragePct}%
          </span>
        </div>
      ))}
    </DashboardSection>
  )
}
