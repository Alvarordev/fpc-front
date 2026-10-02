import { useState } from "react"
import type { DashboardEpidemiology } from "@/api/dashboard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { number } from "./dashboard-labels"
import { DistributionBars } from "./distribution-bars"
import {
  dashboardPanelClass,
  DashboardSectionTitle,
  ScopeBadge,
} from "./dashboard-shell"

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
  const [tab, setTab] = useState(TABS[0].value)
  const active = TABS.find((item) => item.value === tab) ?? TABS[0]
  const hint = territoryLabel
    ? `${territoryLabel} · ${number.format(data.meta.populationCount)} pacientes`
    : `Cobertura ${active ? data[active.key].coveragePct : 0}% · ${number.format(data[active.key].known)} conocidos · ${number.format(data[active.key].unknown)} sin información`

  return (
    <Card className={dashboardPanelClass}>
      <CardHeader className="px-[22px]">
        <DashboardSectionTitle hint={hint} badge={<ScopeBadge kind="estado" />}>
          Perfil clínico
        </DashboardSectionTitle>
      </CardHeader>
      <CardContent className="px-[22px] pt-3">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(String(value))}
          className="gap-3"
        >
          <TabsList
            variant="line"
            className="h-9 w-full max-w-full flex-nowrap justify-start gap-0 overflow-x-auto overflow-y-hidden rounded-none border-b bg-transparent p-0"
          >
            {TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="text-muted-foreground data-active:text-foreground h-9 shrink-0 px-3 text-[13px] after:bg-destructive group-data-horizontal/tabs:after:bottom-0"
              >
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((item) => (
            <TabsContent key={item.value} value={item.value}>
              <DistributionBars
                distribution={data[item.key]}
                catalogKind={item.catalogKind}
                shareOfTotal
                foldAfter={item.foldAfter}
                foldLabel={item.foldLabel}
                columns="minmax(9rem,12.5rem) 1fr 5.75rem"
              />
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-muted-foreground mt-4 text-[12.5px]">
          Fallecimientos {number.format(data.events.deaths)} · Cáncer confirmado{" "}
          {number.format(data.events.diagnosticConfirmed)} · Cáncer descartado{" "}
          {number.format(data.events.diagnosticRuledOut)}
        </p>
      </CardContent>
    </Card>
  )
}
