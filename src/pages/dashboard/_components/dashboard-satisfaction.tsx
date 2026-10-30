import type { DashboardSatisfaction } from "@/api/dashboard"
import { DistributionBars } from "./distribution-bars"
import { DashboardSection } from "./dashboard-shell"
import { IndicatorDefinition } from "./indicator-definition"
import { number } from "./dashboard-labels"

const GROUPS = [
  { key: "enrollment", label: "Enrolamiento" },
  { key: "threeMonths", label: "A los 3 meses" },
  { key: "talk", label: "Charlas" },
  { key: "psychooncology", label: "Psicooncología" },
] as const

export function DashboardSatisfaction({ data }: { data: DashboardSatisfaction }) {
  return (
    <DashboardSection title="Satisfacción" hint="Promedio y distribución de 1 a 5.">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {GROUPS.map((group) => {
          const summary = data[group.key]
          return (
            <div key={group.key}>
              <p className="text-[13px] font-semibold">
                <IndicatorDefinition definition={data.meta.definitions[group.key]}>
                  {group.label}
                </IndicatorDefinition>
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {summary.average == null ? "—" : summary.average.toFixed(1)}
              </p>
              <p className="text-zinc-500 mb-3 text-xs">
                {number.format(summary.responses)} respuestas
              </p>
              <DistributionBars
                distribution={{
                  items: summary.distribution,
                  known: summary.responses,
                  unknown: 0,
                  coveragePct: summary.responses > 0 ? 100 : 0,
                }}
                compact
                columns="2rem 1fr 3rem"
              />
            </div>
          )
        })}
      </div>
    </DashboardSection>
  )
}
