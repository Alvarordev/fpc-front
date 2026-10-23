import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DashboardPopulation } from "@/api/dashboard"
import { cn } from "@/lib/utils"
import { dashboardPanelClass, ScopeBadge } from "./dashboard-shell"

const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
    new Date(2026, month, 1),
  ),
)

const POPULATION_ITEMS: { value: DashboardPopulation; label: string }[] = [
  { value: "all_active", label: "Todos los activos" },
  { value: "active_in_period", label: "Con actividad en el periodo" },
  { value: "enrolled_in_period", label: "Enrolados en el periodo" },
]

export function DashboardControls({
  period,
  year,
  month,
  population,
  onPeriodChange,
  onYearChange,
  onMonthChange,
  onPopulationChange,
}: {
  period: "month" | "year"
  year: number
  month: number
  population: DashboardPopulation
  onPeriodChange: (period: "month" | "year") => void
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onPopulationChange: (population: DashboardPopulation) => void
}) {
  const yearItems = yearOptions(year).map((value) => ({
    value: String(value),
    label: String(value),
  }))
  const monthItems = months.map((name, index) => ({
    value: String(index + 1),
    label: capitalize(name),
  }))

  return (
    <Card className={dashboardPanelClass}>
      <CardContent className="grid gap-7 px-[22px] lg:grid-cols-[1fr_1.5fr]">
        <div>
          <p className="text-muted-foreground mb-2 text-[12.5px] font-medium">
            Periodo
            <ScopeBadge kind="flujo" className="ml-1.5" />
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-muted inline-flex rounded-full p-[3px]">
              {(["month", "year"] as const).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-7 rounded-full px-3.5 text-[13px] shadow-none",
                    period === value
                      ? "bg-background text-foreground hover:bg-background"
                      : "text-muted-foreground",
                  )}
                  onClick={() => onPeriodChange(value)}
                >
                  {value === "month" ? "Mes" : "Año"}
                </Button>
              ))}
            </div>
            <Select
              value={String(year)}
              onValueChange={(value) => onYearChange(Number(value))}
              items={yearItems}
            >
              <SelectTrigger className="h-8 w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {period === "month" && (
              <Select
                value={String(month)}
                onValueChange={(value) => onMonthChange(Number(value))}
                items={monthItems}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <p className="text-muted-foreground mt-2 text-[12.5px] leading-relaxed">
            Filtra los eventos con fecha: enrolamientos, sesiones, beneficios y
            abandonos.
          </p>
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-[12.5px] font-medium">
            Población
            <ScopeBadge kind="estado" className="ml-1.5" />
          </p>
          <div className="bg-muted inline-flex flex-wrap rounded-[14px] p-[3px]">
            {POPULATION_ITEMS.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant="ghost"
                className={cn(
                  "h-7 rounded-full px-3.5 text-[13px] shadow-none",
                  population === item.value
                    ? "bg-background text-foreground hover:bg-background"
                    : "text-muted-foreground",
                )}
                onClick={() => onPopulationChange(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-[12.5px] leading-relaxed">
            {populationCopy(population)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function periodTitle(
  period: "month" | "year",
  year: number,
  month: number,
) {
  return period === "month"
    ? `${capitalize(months[month - 1])} de ${year}`
    : `Año ${year}`
}

function populationCopy(population: DashboardPopulation) {
  if (population === "active_in_period") {
    return "Pacientes con alguna actualización o seguimiento en el periodo, aunque se hayan enrolado antes."
  }
  if (population === "enrolled_in_period") {
    return "Solo pacientes enrolados dentro del periodo. Sirve para comparar cohortes entre años."
  }
  return "Todos los pacientes activos al cierre del periodo, sin importar cuándo se enrolaron. Muestra el estado vigente de cada uno."
}

function yearOptions(current: number) {
  return Array.from({ length: 7 }, (_, index) => current - index)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
