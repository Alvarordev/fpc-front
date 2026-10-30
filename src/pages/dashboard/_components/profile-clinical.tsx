import { useState } from "react"
import type { DashboardEpidemiology } from "@/api/dashboard"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { number } from "./dashboard-labels"
import { IndicatorDefinition } from "./indicator-definition"
import { DistributionBars } from "./distribution-bars"
import { DashboardSection } from "./dashboard-shell"

const TABS = [
  {
    value: "diagnoses",
    label: "Diagnóstico",
    key: "currentDiagnoses" as const,
    catalogKind: "cancer_diagnosis" as const,
    foldAfter: 6,
    foldLabel: "Otros diagnósticos",
  },
  {
    value: "stages",
    label: "Estadio",
    key: "currentCancerStages" as const,
    catalogKind: "cancer_stage" as const,
  },
  {
    value: "treatments",
    label: "Tratamiento",
    key: "currentTreatmentTypes" as const,
    catalogKind: "treatment_type" as const,
    foldAfter: 5,
    foldLabel: "Otros tratamientos",
  },
  {
    value: "situations",
    label: "Situación",
    key: "currentTreatmentSituations" as const,
    catalogKind: "treatment_situation" as const,
  },
  {
    value: "search",
    label: "Búsqueda diagnóstica",
    key: "currentDiagnosticStatuses" as const,
  },
]

export function ProfileClinical({
  data,
  territoryLabel,
}: {
  data: DashboardEpidemiology
  territoryLabel?: string | null
}) {
  const [tab, setTab] = useState<string>(TABS[0].value)
  const active = TABS.find((item) => item.value === tab) ?? TABS[0]
  const hint = territoryLabel
    ? `${territoryLabel} · ${number.format(data.meta.populationCount)} pacientes`
    : `Cobertura ${active ? data[active.key].coveragePct : 0}% · ${number.format(data[active.key].known)} conocidos · ${number.format(data[active.key].unknown)} sin información`

  return (
    <DashboardSection title="Perfil clínico" hint={hint} scope="estado">
      <SlidingTabs
        label="Indicadores clínicos"
        value={active.value}
        options={TABS.map((item) => ({ id: item.value, label: item.label }))}
        onChange={setTab}
      />
      <div className="mt-4">
        <p className="mb-2 text-[13px] font-medium text-zinc-700">
          <IndicatorDefinition definition={data.meta.definitions[active.key]}>
            {active.label}
          </IndicatorDefinition>
        </p>
        <DistributionBars
          key={active.value}
          distribution={data[active.key]}
          catalogKind={active.catalogKind}
          shareOfTotal
          foldAfter={active.foldAfter}
          foldLabel={active.foldLabel}
          columns="minmax(7rem,12.5rem) 1fr 5.75rem"
        />
      </div>
        <p className="text-zinc-500 mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px]">
          <IndicatorDefinition definition={data.meta.definitions["events.deaths"]}>
            <span>Fallecimientos {number.format(data.events.deaths)}</span>
          </IndicatorDefinition>
          <IndicatorDefinition
            definition={data.meta.definitions["events.diagnosticConfirmed"]}
          >
            <span>Cáncer confirmado {number.format(data.events.diagnosticConfirmed)}</span>
          </IndicatorDefinition>
          <IndicatorDefinition
            definition={data.meta.definitions["events.diagnosticRuledOut"]}
          >
            <span>Cáncer descartado {number.format(data.events.diagnosticRuledOut)}</span>
          </IndicatorDefinition>
        </p>
    </DashboardSection>
  )
}
