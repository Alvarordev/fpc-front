import type { DashboardPopulation } from "@/api/dashboard"
import { Card } from "@/components/ds/card"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { SelectField } from "@/components/ds/form"
import { monthName, yearOptions } from "../_lib/dashboard-period"
import { ScopeBadge } from "./dashboard-shell"

const POPULATION_ITEMS: { id: DashboardPopulation; label: string }[] = [
  { id: "all_active", label: "Todos los activos" },
  { id: "active_in_period", label: "Con actividad en el periodo" },
  { id: "enrolled_in_period", label: "Enrolados en el periodo" },
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
  const monthItems = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1),
    label: monthName(index + 1),
  }))

  return (
    <Card>
      <div className="grid gap-7 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] text-zinc-500">
            Periodo
            <ScopeBadge kind="flujo" />
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <FilterToggles
              value={period}
              options={[
                { id: "month", label: "Mes" },
                { id: "year", label: "Año" },
              ]}
              onChange={onPeriodChange}
            />
            <div className="w-28">
              <SelectField
                value={String(year)}
                options={yearItems}
                onChange={(value) => onYearChange(Number(value))}
              />
            </div>
            {period === "month" && (
              <div className="w-40">
                <SelectField
                  value={String(month)}
                  options={monthItems}
                  onChange={(value) => onMonthChange(Number(value))}
                />
              </div>
            )}
          </div>
          <p className="mt-2 text-[13px] text-zinc-500">
            Filtra los eventos con fecha: enrolamientos, sesiones, beneficios y
            abandonos.
          </p>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[13px] text-zinc-500">
            Población
            <ScopeBadge kind="estado" />
          </p>
          <FilterToggles
            value={population}
            options={POPULATION_ITEMS}
            onChange={onPopulationChange}
          />
          <p className="mt-2 text-[13px] text-zinc-500">
            {populationCopy(population)}
          </p>
        </div>
      </div>
    </Card>
  )
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
