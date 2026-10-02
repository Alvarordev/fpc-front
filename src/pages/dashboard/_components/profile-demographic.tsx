import { useState } from "react"
import type { DashboardDemographics } from "@/api/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { number } from "./dashboard-labels"
import { DistributionBars } from "./distribution-bars"
import {
  dashboardPanelClass,
  DashboardSectionTitle,
  ScopeBadge,
} from "./dashboard-shell"

export function ProfileDemographic({
  data,
  territoryLabel,
}: {
  data: DashboardDemographics
  territoryLabel?: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const female = data.gender.items.find((item) => item.label === "FEMALE")?.count ?? 0
  const male = data.gender.items.find((item) => item.label === "MALE")?.count ?? 0

  return (
    <Card className={dashboardPanelClass}>
      <CardHeader className="px-[22px]">
        <DashboardSectionTitle
          hint={
            territoryLabel
              ? `${territoryLabel} · ${number.format(data.meta.populationCount)} pacientes`
              : "Atributos del paciente: no dependen del año en que se enroló."
          }
          badge={<ScopeBadge kind="estado" />}
        >
          Perfil demográfico
        </DashboardSectionTitle>
      </CardHeader>
      <CardContent className="px-[22px] pt-3">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <div className="mb-3 flex gap-5 text-[13px]">
              <span>
                <i className="bg-foreground mr-1.5 inline-block size-2.5 rounded-[2px]" />
                Femenino {number.format(female)}
              </span>
              <span>
                <i className="bg-foreground/40 mr-1.5 inline-block size-2.5 rounded-[2px]" />
                Masculino {number.format(male)}
              </span>
            </div>
            <DistributionBars
              distribution={data.age}
              shareOfTotal
              columns="4.5rem 1fr 4.5rem"
            />
          </div>
          <div>
            <p className="text-muted-foreground mb-2 text-[12.5px]">
              Seguro de salud
            </p>
            <DistributionBars
              distribution={data.insuranceType}
              catalogKind="insurance_type"
              shareOfTotal
              columns="7rem 1fr 5.25rem"
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-4 h-auto px-0 text-[13px]"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Ocultar otros datos" : "Ver otros datos demográficos"}
        </Button>
        {expanded && (
          <div className="mt-4 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
            <CompactBlock title="Provincia" distribution={data.province} />
            <CompactBlock title="Distrito" distribution={data.district} />
            <CompactBlock
              title="Zonificación"
              distribution={data.zoneType}
              catalogKind="zone_type"
            />
            <CompactBlock
              title="Grado instructivo"
              distribution={data.educationLevel}
              catalogKind="education_level"
            />
            <CompactBlock
              title="Lengua originaria"
              distribution={data.nativeLanguage}
              catalogKind="native_language"
            />
            <CompactBlock
              title="Requiere traducción"
              distribution={data.requiresTranslation}
            />
            <CompactBlock title="Estatus laboral" distribution={data.isWorking} />
            <CompactBlock
              title="Proveedor EPS"
              distribution={data.epsProvider}
              catalogKind="eps_provider"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CompactBlock({
  title,
  distribution,
  catalogKind,
}: {
  title: string
  distribution: DashboardDemographics["age"]
  catalogKind?: Parameters<typeof DistributionBars>[0]["catalogKind"]
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold">{title}</p>
      <DistributionBars
        distribution={distribution}
        compact
        maxItems={5}
        catalogKind={catalogKind}
        columns="1fr 1fr 3.5rem"
      />
    </div>
  )
}
