import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { number } from "./dashboard-labels"
import { dashboardPanelClass, DashboardSectionTitle, ScopeBadge } from "./dashboard-shell"

export function EnrollmentBars({
  data,
  period,
}: {
  data: { period: string; enrollmentEvents: number }[]
  period: "month" | "year"
}) {
  const peak = Math.max(0, ...data.map((item) => item.enrollmentEvents))
  const total = data.reduce((sum, item) => sum + item.enrollmentEvents, 0)
  const peakItem = data.find((item) => item.enrollmentEvents === peak)
  const chartData = data.map((item) => ({
    ...item,
    label: formatBucket(item.period, period),
  }))
  const hint =
    peakItem && peak > 0 && total > 0
      ? `${formatBucket(peakItem.period, period)} concentra el ${Math.round((peak / total) * 100)}% del periodo (${number.format(peak)} de ${number.format(total)})`
      : "Enrolamientos registrados en la ventana seleccionada."

  return (
    <Card className={dashboardPanelClass}>
      <CardHeader className="px-[22px]">
        <DashboardSectionTitle
          hint={hint}
          badge={<ScopeBadge kind="flujo" />}
        >
          Enrolamientos por {period === "year" ? "mes" : "día"}
        </DashboardSectionTitle>
      </CardHeader>
      <CardContent className="px-[22px] pt-2">
        {data.length === 0 ? (
          <p className="text-muted-foreground flex h-40 items-center justify-center text-sm">
            No hay enrolamientos en este periodo.
          </p>
        ) : (
          <div className="flex h-[170px] items-end gap-2.5 pt-5">
            {chartData.map((item) => {
              const isPeak = item.enrollmentEvents === peak && peak > 0
              const height = peak > 0 ? (item.enrollmentEvents / peak) * 100 : 0
              return (
                <div
                  key={item.period}
                  className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <b className="text-[13px] font-medium tabular-nums">
                    {item.enrollmentEvents}
                  </b>
                  <i
                    className={cn(
                      "block w-full rounded-t-md",
                      isPeak ? "bg-destructive" : "bg-foreground/25",
                    )}
                    style={{ height: `${Math.max(height, item.enrollmentEvents > 0 ? 6 : 0)}%` }}
                  />
                  <span className="text-muted-foreground text-xs">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function formatBucket(value: string, period: "month" | "year") {
  if (period === "month") {
    const day = Number(value.slice(8, 10))
    return Number.isNaN(day) ? value : String(day)
  }
  const [year, month] = value.split("-").map(Number)
  if (!year || !month) return value
  return new Intl.DateTimeFormat("es-PE", { month: "short" }).format(
    new Date(year, month - 1, 1),
  )
}
