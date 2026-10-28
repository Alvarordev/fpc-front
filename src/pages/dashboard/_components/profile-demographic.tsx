import { useState } from "react"
import type { DashboardDemographics } from "@/api/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { number } from "./dashboard-labels"
import { IndicatorDefinition } from "./indicator-definition"
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
            <p className="mb-2 text-[13px] font-semibold">
              <IndicatorDefinition definition={data.meta.definitions.age}>
                Edad
              </IndicatorDefinition>
            </p>
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
              <IndicatorDefinition definition={data.meta.definitions.insuranceType}>
                Seguro de salud
              </IndicatorDefinition>
            </p>
            <DistributionBars
              distribution={data.insuranceType}
              catalogKind="insurance_type"
              shareOfTotal
              columns="7rem 1fr 5.25rem"
            />
            <p className="text-muted-foreground mt-4 mb-2 text-[12.5px]">
              <IndicatorDefinition
                definition={data.meta.definitions.insuranceTypeAtEnrollment}
              >
                Seguro al enrolarse
              </IndicatorDefinition>
            </p>
            <DistributionBars
              distribution={data.insuranceTypeAtEnrollment}
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
            <CompactBlock
              title="Provincia"
              distribution={data.province}
              definition={data.meta.definitions.province}
            />
            <CompactBlock
              title="Distrito"
              distribution={data.district}
              definition={data.meta.definitions.district}
            />
            <CompactBlock
              title="Zonificación"
              distribution={data.zoneType}
              catalogKind="zone_type"
              definition={data.meta.definitions.zoneType}
            />
            <CompactBlock
              title="Grado instructivo"
              distribution={data.educationLevel}
              catalogKind="education_level"
              definition={data.meta.definitions.educationLevel}
            />
            <CompactBlock
              title="Lengua originaria"
              distribution={data.nativeLanguage}
              catalogKind="native_language"
              definition={data.meta.definitions.nativeLanguage}
            />
            <CompactBlock
              title="Requiere traducción"
              distribution={data.requiresTranslation}
              definition={data.meta.definitions.requiresTranslation}
            />
            <CompactBlock
              title="Estatus laboral"
              distribution={data.isWorking}
              definition={data.meta.definitions.isWorking}
            />
            <CompactBlock
              title="Proveedor EPS"
              distribution={data.epsProvider}
              catalogKind="eps_provider"
              definition={data.meta.definitions.epsProvider}
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
  definition,
}: {
  title: string
  distribution: DashboardDemographics["age"]
  catalogKind?: Parameters<typeof DistributionBars>[0]["catalogKind"]
  definition?: string
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold">
        <IndicatorDefinition definition={definition}>{title}</IndicatorDefinition>
      </p>
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
