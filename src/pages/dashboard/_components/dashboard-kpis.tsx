import { CalendarPlus, CalendarRange, History, Users } from "lucide-react"
import { StatTile } from "@/components/ds/stat-tile"
import { number } from "./dashboard-labels"

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
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        icon={CalendarPlus}
        label="Enrolamientos"
        value={number.format(enrollmentEvents)}
        hint="Registrados en el periodo"
      />
      <StatTile
        icon={Users}
        label="Pacientes en vista"
        value={number.format(populationCount)}
        hint="Según la población elegida"
      />
      <StatTile
        icon={History}
        label="Enrolados antes"
        value={number.format(enrolledBeforePeriod)}
        hint="Siguen en la vista desde antes"
      />
      <StatTile
        icon={CalendarRange}
        label="Sesiones"
        value={number.format(sessions)}
        hint="Con fecha en el periodo"
      />
    </section>
  )
}
