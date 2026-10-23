import { number } from "./dashboard-labels"
import { ScopeBadge } from "./dashboard-shell"

export function DashboardKpis({
  enrollmentEvents,
  populationCount,
  enrolledBeforePeriod,
  sessions,
}: {
  enrollmentEvents: number
  populationCount: number
  enrolledBeforePeriod: number
  sessions: number
}) {
  return (
    <section className="border-border grid border-y sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Enrolamientos en el periodo"
        value={enrollmentEvents}
        kind="flujo"
      />
      <Kpi label="Pacientes en vista" value={populationCount} kind="estado" />
      <Kpi
        label="Enrolados antes del periodo"
        value={enrolledBeforePeriod}
      />
      <Kpi label="Sesiones" value={sessions} kind="flujo" />
    </section>
  )
}

function Kpi({
  label,
  value,
  kind,
}: {
  label: string
  value: number
  kind?: "flujo" | "estado"
}) {
  return (
    <div className="border-border px-5 py-4 sm:border-l sm:first:border-l-0">
      <p className="text-[30px] leading-none font-medium tracking-tight tabular-nums">
        {number.format(value)}
      </p>
      <p className="text-muted-foreground mt-1.5 text-[13px]">
        {label}
        {kind ? <ScopeBadge kind={kind} className="ml-1.5" /> : null}
      </p>
    </div>
  )
}
