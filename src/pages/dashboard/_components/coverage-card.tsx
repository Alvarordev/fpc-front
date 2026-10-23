import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { dashboardPanelClass, DashboardSectionTitle, ScopeBadge } from "./dashboard-shell"

export function CoverageCard({
  items,
}: {
  items: { label: string; coveragePct: number }[]
}) {
  return (
    <Card className={dashboardPanelClass}>
      <CardHeader className="px-[22px]">
        <DashboardSectionTitle
          hint="Pacientes con información registrada"
          badge={<ScopeBadge kind="estado" />}
        >
          Datos por completar
        </DashboardSectionTitle>
      </CardHeader>
      <CardContent className="px-[22px] pt-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="grid items-center gap-3 py-1.5 text-[13px]"
            style={{ gridTemplateColumns: "9.5rem 1fr 3.25rem" }}
          >
            <span className="min-w-0 truncate">{item.label}</span>
            <div className="bg-muted h-2.5 overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full",
                  item.coveragePct < 100 ? "bg-amber-700/80" : "bg-foreground",
                )}
                style={{ width: `${Math.min(100, item.coveragePct)}%` }}
              />
            </div>
            <em className="text-right text-[13px] not-italic">
              <b className="font-medium tabular-nums">{item.coveragePct}%</b>
            </em>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
