import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ds/empty-state"
import { number } from "./dashboard-labels"
import { DashboardSection } from "./dashboard-shell"

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
    <DashboardSection
      title={`Enrolamientos por ${period === "year" ? "mes" : "día"}`}
      hint={hint}
      scope="flujo"
    >
        {data.length === 0 ? (
          <EmptyState
            title="Sin enrolamientos en este periodo"
            body="Elige otro mes o año para ver la tendencia."
          />
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
                  <b className="text-[13px] font-medium text-zinc-900 tabular-nums">
                    {item.enrollmentEvents}
                  </b>
                  <i
                    className={cn(
                      "block w-full rounded-t-md",
                      isPeak ? "bg-zinc-900" : "bg-zinc-300",
                    )}
                    style={{ height: `${Math.max(height, item.enrollmentEvents > 0 ? 6 : 0)}%` }}
                  />
                  <span className="text-xs text-zinc-500">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
    </DashboardSection>
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
